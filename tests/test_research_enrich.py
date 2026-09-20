"""阶段2：AI 打标/摘要 + 视频转写队列。

全部离线：不碰网络、不装 whisper 也能跑（重依赖都在函数内部延迟导入）。
"""
import json
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
        return '这段素材写得很好，我不输出 JSON。'   # 真·模型不配合：这才是该记次的失败

    monkeypatch.setattr(research_enrich, 'agent_text', broken_agent)
    monkeypatch.setattr(research_enrich, 'RETRY_BACKOFF', 0)   # 真机会退避，测试里立刻连抽三次
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


def test_channel_outage_does_not_burn_the_retry_budget(client, monkeypatch):
    """工作台没起时跑过的队列不能把素材判死：通道恢复后还要能自动补跑。"""
    saved = _import(client)
    monkeypatch.setattr(research_enrich, 'agent_text', lambda prompt, timeout=300: '❌ 后端未启动')
    monkeypatch.setattr(research_enrich, 'RETRY_BACKOFF', 0)
    research_enrich.enqueue(saved['id'], 'enrich')
    for _ in range(research_enrich.MAX_ATTEMPTS * 2):        # 远超重试次数也一直退回 pending
        task = research_enrich._claim('enrich')
        assert task is not None
        assert research_enrich.run_task(task) is False
    assert client.get('/api/research/enrich/status').json()['counts'] == {'pending': 1}
    assert client.get('/api/research/index-status').json()['enrich_failed'] == 0
    # 退避次数封顶，不会随领取次数无限增长成一晚都醒不过来的停顿
    with research.connection() as db:
        attempts = db.execute('SELECT attempts FROM enrich_tasks').fetchone()[0]
    assert attempts == research_enrich.MAX_ATTEMPTS

    def good_agent(prompt, timeout=300):
        return '{"tags": ["求职"], "summary": "通道恢复后的摘要。"}'

    monkeypatch.setattr(research_enrich, 'agent_text', good_agent)
    assert research_enrich.run_task(research_enrich._claim('enrich')) is True
    assert research.get_source(saved['id'])['summary'].startswith('通道恢复后')


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
    row = research.get_source(research.list_sources()['items'][0]['id'])
    assert row['kind'] == 'video' and row['extra']['video_url'] == 'https://cdn.example/1.mp4'


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


def test_transient_failure_waits_out_backoff_before_retry(client, monkeypatch):
    saved = _import(client)
    monkeypatch.setattr(research_enrich, 'agent_text', lambda prompt, timeout=300: '❌ 后端没在跑')
    research_enrich.enqueue(saved['id'], 'enrich')
    assert research_enrich.run_task(research_enrich._claim('enrich')) is False
    # 通道不可用会退回 pending 而不是判死，但仍要退避：否则 worker 会空转刷 CLI
    assert research_enrich._claim('enrich') is None
    assert research_enrich.next_available() is not None
    monkeypatch.setattr(research_enrich, 'RETRY_BACKOFF', 0)
    assert research_enrich._claim('enrich') is not None


def test_reenqueue_while_running_is_not_swallowed(client):
    saved = _import(client)
    research_enrich.enqueue(saved['id'], 'enrich')
    task = research_enrich._claim('enrich')
    research_enrich.enqueue(saved['id'], 'enrich')     # 跑期间用户又点了一次
    research_enrich._finish(task['id'], True, {'tags': []}, '', task['attempts'])
    assert research_enrich.queue_status()['counts'] == {'pending': 1}


def _video_source(identifier_seed='一条视频'):
    return research.save_source('https://www.bilibili.com/video/BV1x', identifier_seed, '哔哩哔哩', '',
                                '口播正文', 'Beav 开源浏览器插件', kind='video',
                                extra={'video_url': 'https://cdn.example/1.mp4'})


def test_transcribe_appends_once_and_syncs_asset(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    saved = _video_source()
    monkeypatch.setattr(research_enrich, 'fetch_subtitles', lambda url, folder: '第一句\n第二句')
    task = {'source_id': saved['id'], 'task': 'transcribe', 'id': 1, 'attempts': 1}
    assert research_enrich.transcribe_one(task)['source'] == 'subtitles'
    first = research.get_source(saved['id'])
    assert '[视频转写·subtitles]' in first['content'] and '第一句' in first['content']
    assert research_enrich.transcribe_one(task)['already'] is True   # 再转一次不堆 4 万字
    assert research.get_source(saved['id'])['content'].count('[视频转写') == 1
    asset = tmp_path / 'outputs' / first['asset_path']
    assert '第一句' in asset.read_text(encoding='utf-8')   # md 资产跟着正文走


def test_transcribe_reports_failure_when_append_is_refused(tmp_path, monkeypatch):
    """追加没生效又确认不了正文里有转写时必须报错，不能悄悄丢掉几分钟的转写判成 done。"""
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    saved = _video_source()
    monkeypatch.setattr(research_enrich, 'fetch_subtitles', lambda url, folder: '第一句')
    monkeypatch.setattr(research, 'append_marked_section', lambda *a, **k: False)
    with pytest.raises(RuntimeError, match='未能写入素材正文'):
        research_enrich.transcribe_one({'source_id': saved['id'], 'task': 'transcribe', 'id': 1, 'attempts': 1})


def test_stale_subtitle_files_are_purged(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    folder = tmp_path / 'outputs' / '研究素材' / 'abc' / 'media'
    folder.mkdir(parents=True)
    (folder / 'subs.zh.vtt').write_text('WEBVTT\n\n00:00.000 --> 00:01.000\n上个视频的字幕\n', encoding='utf-8')
    # 这次 yt-dlp 什么都没拉到（失败或无字幕）：旧文件不能被当成本次结果
    monkeypatch.setattr(research_enrich, '_run', lambda cmd, timeout=1800: None)
    assert research_enrich.fetch_subtitles('https://www.bilibili.com/video/BV1x', folder) == ''


def test_subtitle_parser_strips_timing_and_cues():
    import types
    sample = types.SimpleNamespace(
        read_text=lambda encoding='utf-8', errors='replace': (
            'WEBVTT\nKind: captions\nLanguage: zh\n\n00:00.000 --> 00:02.000 align:center\n'
            '<c>同一句</c>\n同一句\n\n1\n\n[MUSIC]\n真正的内容\n'))
    assert research_enrich._parse_subtitle(sample) == '同一句\n真正的内容'


def test_download_audio_raises_when_ytdlp_fails(tmp_path, monkeypatch):
    import subprocess as sp

    monkeypatch.setattr(research_enrich, '_run',
                        lambda cmd, timeout=1800: sp.CompletedProcess(cmd, 1, '', 'ERROR: unable to download'))
    with pytest.raises(RuntimeError, match='yt-dlp 下载失败'):
        research_enrich.download_audio('https://x/y', tmp_path)


def test_index_status_route_nudges_worker(client, monkeypatch):
    saved = _import(client)
    nudges = []
    monkeypatch.setattr(research_enrich, 'start_worker', lambda: nudges.append(1) or False)
    client.get('/api/research/index-status')
    assert nudges == []                       # 队列空时不白起线程
    research_enrich.enqueue(saved['id'], 'enrich')
    client.get('/api/research/index-status')
    assert nudges == [1]                      # 扩展投递的任务由后端轮询接着排干


def test_worker_thread_drains_queue(tmp_path, monkeypatch):
    import threading
    import time
    import types

    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    fake = types.ModuleType('app')
    fake.run_agent_sync = lambda msg, timeout=300, session_id=None: (
        '{"tags": ["求职", "校招"], "summary": "一条关于应届求职的素材。"}')
    monkeypatch.setitem(sys.modules, 'app', fake)

    research_enrich._WORKER.acquire()
    try:
        assert research_enrich.start_worker() is False   # 忙时不并发起第二个
    finally:
        research_enrich._WORKER.release()

    saved = research.save_source('', '线程里的素材', '导入摘录', '', '正文：应届秋招')
    research_enrich.enqueue(saved['id'], 'enrich')
    assert research_enrich.start_worker() is True

    deadline = time.time() + 10
    while time.time() < deadline:
        if research.get_source(saved['id'])['summary']:
            break
        time.sleep(0.05)
    row = research.get_source(saved['id'])
    assert row['summary'].startswith('一条关于应届求职') and row['tags'] == ['求职', '校招']
    assert research_enrich.queue_status()['counts'] == {'done': 1}
    # 线程跑完自己退出并释放单例锁；这里只验锁还回来，不再起新 worker，
    # 免得留一个后台线程在 monkeypatch 撤销后摸到真实素材库。
    deadline = time.time() + 5
    while time.time() < deadline and any(t.name == 'easel-enrich' for t in threading.enumerate()):
        time.sleep(0.05)
    assert not any(t.name == 'easel-enrich' for t in threading.enumerate())
    assert research_enrich._WORKER.acquire(blocking=False) is True
    research_enrich._WORKER.release()


def test_claim_is_versioned_so_two_workers_cannot_run_one_row(client):
    saved = _import(client)
    research_enrich.enqueue(saved['id'], 'enrich')
    first = research_enrich._claim('enrich')
    assert first is not None
    # 已被领走的 running 行，在退避期内不能被第二个领取者抢走（不重复烧配额）
    assert research_enrich._claim('enrich') is None
    with research.connection() as db:
        db.execute('UPDATE enrich_tasks SET updated_at=? WHERE id=?',
                   (0.0, first['id']))          # 模拟后端崩溃后留下的陈旧 running 行
    revived = research_enrich._claim('enrich')
    assert revived is not None and revived['attempts'] == first['attempts'] + 1


def _lock_free(timeout: float = 5.0) -> bool:
    import time

    deadline = time.time() + timeout
    while time.time() < deadline:
        if research_enrich._WORKER.acquire(blocking=False):
            research_enrich._WORKER.release()
            return True
        time.sleep(0.05)
    return False


def test_start_worker_releases_lock_when_thread_cannot_start(tmp_path, monkeypatch):
    import threading

    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    assert _lock_free()     # 等上一个用例留下的 worker 自己退出

    def boom(*args, **kwargs):
        raise OSError('not enough resources to start thread')

    monkeypatch.setattr(threading, 'Thread', boom)
    assert research_enrich.start_worker() is False
    # 起线程失败时 loop 从未执行，锁必须还回去，否则加工队列到重启前永远起不来
    assert _lock_free()


def test_ocr_backfill_appends_into_null_content_and_keeps_extra(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda images: '图里写着：秋招时间线')
    saved = research.save_source('https://www.xiaohongshu.com/explore/1', '图文笔记', '小红书', '', '',
                                 '剪存', kind='note')
    with research.connection() as db:
        db.execute('UPDATE sources SET content=NULL, extra_json=? WHERE id=?',
                   (json.dumps({'local_images': ['outputs/研究素材/a/00.jpg']}, ensure_ascii=False), saved['id']))
    research.refresh_ocr(saved['id'])
    row = research.get_source(saved['id'])
    # content 为 NULL 时整列 UPDATE 会匹配 0 行：过去这里写了 ocr_attempted 又丢正文，永远不再补
    assert '图里写着：秋招时间线' in (row['content'] or '')
    assert row['extra']['ocr_attempted'] == 1
    assert row['extra']['local_images'] == ['outputs/研究素材/a/00.jpg']   # 合并不是整列覆盖


def test_merge_extra_json_preserves_untouched_keys(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    saved = research.save_source('https://www.zhihu.com/question/1', '一条回答', '知乎', '', '', '剪存',
                                 extra={'video_url': 'https://cdn.example/1.mp4'})
    research.merge_extra_json(saved['id'], {'ocr_attempted': 1})
    extra = research.get_source(saved['id'])['extra']
    assert extra['video_url'] == 'https://cdn.example/1.mp4' and extra['ocr_attempted'] == 1
    # 坏 JSON（历史脏数据）也能并入，不再整条报错
    with research.connection() as db:
        db.execute('UPDATE sources SET extra_json=? WHERE id=?', ('{坏数据', saved['id']))
    assert research.merge_extra_json(saved['id'], {'ocr_text': '文字'})['extra']['ocr_text'] == '文字'
