"""阶段2：AI 打标/摘要 + 视频转写队列。

全部离线：不碰网络、不装 whisper 也能跑（重依赖都在函数内部延迟导入）。
"""
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'web'))

import research_api  # noqa: E402
from easel import research, research_enrich  # noqa: E402


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    # 路由测试只验证排队与状态，绝不起真线程（真线程会去连工作台后端）
    monkeypatch.setattr(research_enrich, 'start_worker', lambda: False)
    app = FastAPI()
    app.include_router(research_api.router)
    return TestClient(app)


def _import(client, title='一条求职笔记', content='27 届应届，改简历、校招节奏、生物方向要不要转行'):
    return client.post('/api/research/import', json={'title': title, 'content': content}).json()


def test_enrich_route_queues_and_reports_status(client, monkeypatch):
    saved = _import(client)
    result = client.post('/api/research/enrich', json={}).json()
    assert result['queued'] == 1 and result['workerStarted'] is False

    status = client.get('/api/research/enrich/status').json()
    assert status['counts'] == {'pending': 1}
    assert status['recent'][0]['source_id'] == saved['id']
    assert status['recent'][0]['task'] == 'enrich'

    index = client.get('/api/research/index-status').json()
    assert index['enrich_pending'] == 1 and index['enrich_failed'] == 0

    # 再点一次不会重复排队（同一素材同一任务只留一行）
    client.post('/api/research/enrich', json={})
    assert client.get('/api/research/enrich/status').json()['counts'] == {'pending': 1}

    assert client.post('/api/research/enrich', json={'ids': ['不存在']}).status_code == 404


def test_enrich_task_writes_tags_and_summary_back(client, monkeypatch):
    saved = _import(client)
    prompts = []

    def fake_agent(prompt, timeout=300):
        prompts.append(prompt)
        return '```json\n{"tags": ["求职", "简历", "生物转行"], "summary": "一条讲应届生改简历与转行取舍的笔记。"}\n```'

    monkeypatch.setattr(research_enrich, 'agent_text', fake_agent)
    client.post('/api/research/enrich', json={})
    task = research_enrich._claim('enrich')
    assert task['status'] == 'running' and task['attempts'] == 1
    research_enrich.run_task(task)

    row = research.get_source(saved['id'])
    assert row['summary'].startswith('一条讲应届生')
    assert row['tags'] == ['求职', '简历', '生物转行']
    assert client.get('/api/research/enrich/status').json()['counts'] == {'done': 1}
    # 提示词把素材包成 UNTRUSTED_REFERENCE，素材里的指令不算指令
    assert 'UNTRUSTED_REFERENCE' in prompts[0] and saved['title'] in prompts[0]
    # 摘要与标签进全文索引，能搜到
    assert client.get('/api/research/sources?query=生物转行').json()['items'][0]['id'] == saved['id']


def test_enrich_failure_retries_then_fails(client, monkeypatch):
    saved = _import(client)

    def broken_agent(prompt, timeout=300):
        return '⏳ 这个会话正在另一个窗口运行，请稍候再试'

    monkeypatch.setattr(research_enrich, 'agent_text', broken_agent)
    research_enrich.enqueue(saved['id'], 'enrich')
    for attempt in range(1, research_enrich.MAX_ATTEMPTS + 1):
        task = research_enrich._claim('enrich')
        assert task is not None and task['attempts'] == attempt
        assert research_enrich.run_task(task) is False
        counts = client.get('/api/research/enrich/status').json()['counts']
        expected = 'pending' if attempt < research_enrich.MAX_ATTEMPTS else 'failed'
        assert counts == {expected: 1}
    assert client.get('/api/research/index-status').json()['enrich_failed'] == 1
    assert research.get_source(saved['id'])['summary'] == ''


def test_missing_enrich_only_targets_unsummarized(client, monkeypatch):
    first = _import(client, title='甲', content='正文甲')
    research.update_source(first['id'], summary='已经写好了')
    _import(client, title='乙', content='正文乙')
    assert research_enrich.enqueue_missing_enrich() == 1
    assert client.get('/api/research/enrich/status').json()['recent'][0]['title'] == '乙'


def test_transcribe_route_enqueues_without_running_worker(client):
    saved = _import(client)
    result = client.post(f"/api/research/sources/{saved['id']}/transcribe", json={}).json()
    assert result['queued'] is True and result['workerStarted'] is False
    assert client.get('/api/research/index-status').json()['transcribe_pending'] == 1
    assert client.post('/api/research/sources/不存在/transcribe', json={}).status_code == 404


def test_transcribe_needs_a_video_url(client):
    saved = _import(client)
    with pytest.raises(ValueError):
        research_enrich.transcribe_one({'source_id': saved['id'], 'task': 'transcribe', 'id': 1, 'attempts': 1})


def test_host_ingest_enqueues_enrich_and_transcribe(tmp_path, monkeypatch):
    import importlib.util

    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    spec = importlib.util.spec_from_file_location('beav_native_host_enrich', ROOT / 'scripts' / 'beav_native_host.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    mod.handle('knowledge.ingestEntry', {'payload': {
        'source': {'sourceUrl': 'https://www.bilibili.com/video/BV1xx'},
        'note': {'title': '一条视频', 'text': '讲转写', 'videoUrl': 'https://cdn.example/1.mp4'},
        'kind': 'video',
        'options': {'transcribe': True},
    }})
    status = research_enrich.queue_status()['counts']
    assert status == {'pending': 2}
    tasks = {row['task'] for row in research_enrich.queue_status()['recent']}
    assert tasks == {'enrich', 'transcribe'}


def test_agent_channel_reuses_loaded_backend(monkeypatch):
    import types

    calls = {}

    def fake_run(msg, timeout=300, session_id=None):
        calls.update(prompt=msg, session_id=session_id)
        return '{"tags": ["甲"], "summary": "乙"}'

    fake = types.ModuleType('app')
    fake.run_agent_sync = fake_run
    monkeypatch.setitem(sys.modules, 'app', fake)
    answer = research_enrich.agent_text('提示词')
    assert 'tags' in answer and calls['prompt'] == '提示词'
    assert calls['session_id'].startswith('easel-enrich-')

    monkeypatch.delitem(sys.modules, 'app')
    monkeypatch.setattr(sys.modules['__main__'], 'run_agent_sync', None, raising=False)
    with pytest.raises(RuntimeError, match='后端在跑'):
        research_enrich._agent_runner()
