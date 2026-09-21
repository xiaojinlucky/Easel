"""Regression checks for subscription limits, collection, and local browser writes."""
import json
import socket
import subprocess
import pytest
from fastapi.testclient import TestClient
from easel import runtime, research
from web import app as web
from web import clipper_api


@pytest.fixture
def local_state(monkeypatch, tmp_path):
    monkeypatch.setattr(runtime, 'STATE', tmp_path)
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'STATE', tmp_path)
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(clipper_api, 'TOKEN_FILE', tmp_path / 'pairing.json')
    # 现役树在调用采集器前先查 .runtime 里有没有可执行文件，缺了就报「采集器未安装」，
    # 不会走到被 mock 的 subprocess。这里放一个空的假文件，只为了让这道检查放行。
    bun = tmp_path / 'node_modules' / 'bun' / 'bin' / 'bun.exe'
    bun.parent.mkdir(parents=True)
    bun.write_bytes(b'')
    return tmp_path


def mock_usage(monkeypatch, used, by_id=True):
    limits = {'secondary': {'windowDurationMins': 10080, 'usedPercent': used, 'resetsAt': 123456}}
    monkeypatch.setattr(runtime, 'codex_rpc', lambda _: [{'account': {'type': 'chatgpt', 'planType': 'pro'}}, {'rateLimitsByLimitId': {'codex': limits} if by_id else None, 'rateLimits': limits}])


@pytest.mark.parametrize('used', [84,85,5,6,100,0])
def test_weekly_usage_is_informational(monkeypatch, local_state, used):
    mock_usage(monkeypatch,used)
    status = runtime.subscription_status()
    assert status['weekly_remaining'] == 100-used
    assert status['stop_reason'] is None
    assert runtime.require_subscription()['logged_in']
    assert not (local_state / 'quota-stop.json').exists()


def test_legacy_development_stop_file_is_ignored(monkeypatch, local_state):
    (local_state / 'quota-stop.json').write_text(json.dumps({'reason':'额度重置停止线'}), encoding='utf-8')
    mock_usage(monkeypatch, 5)
    assert runtime.subscription_status()['stop_reason'] is None
    mock_usage(monkeypatch, 47)
    assert runtime.require_subscription()['logged_in']


def test_null_quota_buckets_and_missing_usage(monkeypatch, local_state):
    mock_usage(monkeypatch, 47, False)
    assert runtime.subscription_status()['weekly_remaining'] == 53
    mock_usage(monkeypatch, None, False)
    assert runtime.subscription_status()['weekly_remaining'] is None
    assert runtime.require_subscription()['logged_in']


def test_request_auth_never_depends_on_usage_endpoint(monkeypatch):
    calls = []
    def rpc(methods):
        calls.extend(methods)
        assert all(method == 'account/read' for method, _ in methods)
        return [{'account': {'type':'chatgpt', 'planType':'pro'}}]
    monkeypatch.setattr(runtime, 'codex_rpc', rpc)
    assert runtime.require_subscription()['logged_in']
    assert len(calls) == 1
    monkeypatch.setattr(runtime, 'codex_rpc', lambda _: [{'account': None}])
    with pytest.raises(RuntimeError, match='登录'):
        runtime.require_subscription()


def test_subscription_env_does_not_bill_api_key(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY', 'test-placeholder')
    monkeypatch.setenv('CODEX_API_KEY', 'test-placeholder')
    assert 'OPENAI_API_KEY' not in runtime.runtime_env()
    assert 'CODEX_API_KEY' not in runtime.runtime_env()


def test_official_result_must_be_complete():
    assert runtime.agent_reply(json.dumps({'status':'ok','result':{'payloads':[{'text':'成稿'}]}})) == '成稿'
    for invalid in ['not-json', '{"status":"error"}', '{"payloads":[]}', '{"meta":{"aborted":true},"payloads":[{"text":"partial"}]}']:
        with pytest.raises(RuntimeError):
            runtime.agent_reply(invalid)


@pytest.mark.parametrize('url', ['https://github.com.evil.example/a','http://github.com/a','https://me:password@github.com/a','https://github.com:no/a','https://127.0.0.1/a'])
def test_collection_rejects_unsafe_source(url):
    with pytest.raises(research.CollectionError):
        research.normalize_url(url)


def test_dns_must_be_public(monkeypatch):
    monkeypatch.setattr(research.socket,'getaddrinfo',lambda *a,**kw:[(socket.AF_INET,socket.SOCK_STREAM,6,'',('127.0.0.1',443))])
    with pytest.raises(research.CollectionError, match='非公开'):
        research.normalize_url('https://github.com/a', True)


def test_collection_cache_and_rate_limit(monkeypatch, local_state):
    calls=[]
    monkeypatch.setattr(research, 'start', lambda _:None)
    monkeypatch.setattr(research, 'research_cdp_endpoint', lambda: None)
    monkeypatch.setattr(research.socket,'getaddrinfo',lambda *a,**kw:[(socket.AF_INET,socket.SOCK_STREAM,6,'',('1.1.1.1',443))])
    def extract(*args,**kwargs):
        calls.append(args)
        return subprocess.CompletedProcess([],0,json.dumps({'status':'ok','markdown':'有来源的正文','document':{'title':'社区反馈'}}),'')
    monkeypatch.setattr(research.subprocess,'run',extract)
    first=research.capture('https://github.com/example/one')
    assert first['state']=='saved'
    assert (local_state / 'outputs' / first['asset_path']).is_file()
    assert research.capture('https://github.com/example/one')['cached']
    assert len(calls)==1
    with pytest.raises(research.CollectionError) as error:
        research.capture('https://github.com/example/two')
    assert error.value.status==429 and len(calls)==1


def test_failed_refresh_preserves_previous_asset(local_state):
    old=research.save_source('https://github.com/example/one','标题','GitHub 社区','主题','珍贵原稿','CloakBrowser + Baoyu')
    result=research.save_source(old['url'],'无法访问','GitHub 社区','主题','','CloakBrowser + Baoyu','blocked','需要验证')
    assert result['refresh_failed'] and result['content']=='珍贵原稿'
    assert result['captured_at']==old['captured_at']
    assert research.get_source(old['id'])['asset_path']==old['asset_path']


def test_clipper_pairing_cors_and_persistence(local_state):
    client=TestClient(web.app,base_url='http://127.0.0.1:7860',client=('127.0.0.1',51234))
    body={'title':'选区摘录','url':'https://example.com/article','content':'保留来源的用户选区'}
    local={'Origin':'http://127.0.0.1:7860'}
    remote=TestClient(web.app,base_url='http://127.0.0.1:7860',client=('192.168.1.9',51234))
    assert client.post('/api/research/clipper-pair',headers={'Origin':'https://evil.example'}).status_code==403
    assert remote.post('/api/clipper',json=body).status_code==403        # 无 Origin 且非本机 → 守卫拦
    assert client.post('/api/clipper',json=body).status_code==401        # 无 Origin 但在本机 → 放行，缺扩展令牌故 401
    assert client.post('/api/clipper',json=body,headers=local).status_code==401
    token=client.post('/api/research/clipper-pair',headers=local).json()['token']
    origin='chrome-extension://'+'a'*32
    response=client.post('/api/clipper',json=body,headers={'Origin':origin,'Authorization':'Bearer '+token})
    assert response.status_code==200
    assert response.headers['access-control-allow-origin']==origin
    assert research.get_source(response.json()['id'])['content']==body['content']
    assert client.post('/api/research/import',json=body,headers={'Origin':origin}).status_code==403
    assert client.get('/api/research/status',headers={'Host':'evil.example'}).status_code==400


def test_rss_excerpt_does_not_overwrite_full_article(local_state):
    full = research.save_source('https://github.com/example/topic', 'Full article', 'GitHub', '', 'Full content', method='CloakBrowser + Baoyu')
    feed = research.save_source('https://github.com/example/topic', 'RSS excerpt', 'RSS', '', 'Summary', method='FreshRSS')
    assert full['id'] != feed['id']
    assert research.get_source(full['id'])['content'] == 'Full content'


def test_active_media_has_opaque_origin_sandbox(monkeypatch, local_state):
    monkeypatch.setattr(web, 'OUTPUTS_DIR', local_state)
    (local_state / 'preview.html').write_text('<script>fetch("/api/status")</script>', encoding='utf-8')
    with TestClient(web.app, base_url='http://localhost') as client:
        response = client.get('/api/media/preview.html')
        assert response.status_code == 200
        assert response.headers['x-content-type-options'] == 'nosniff'
        policy = response.headers['content-security-policy']
        assert 'sandbox' in policy and 'allow-same-origin' not in policy


def test_concurrent_atomic_json_writes(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    path = tmp_path / 'state.json'
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda value: runtime.write_json(path, {'value': value}), range(20)))
    assert json.loads(path.read_text())['value'] in range(20)
    assert not list(tmp_path.glob('*.tmp'))


def test_postiz_rejects_nonmedia_without_upload(monkeypatch, local_state):
    from easel import postiz
    monkeypatch.setattr(web, 'OUTPUTS_DIR', local_state)
    (local_state / 'document.md').write_text('Local draft', encoding='utf-8')
    monkeypatch.setattr(postiz, 'upload', lambda _: pytest.fail('Nonmedia must not reach Postiz'))
    origin = {'Origin': 'http://localhost:7860'}
    with TestClient(web.app, base_url='http://localhost') as client:
        assert client.post('/api/publishing/postiz/media', json={'path': 'document.md'}, headers=origin).status_code == 422
        assert client.post('/api/publishing/postiz/media', json={'path': '../outside.png'}, headers=origin).status_code == 403


def test_session_files_do_not_collide(monkeypatch, tmp_path):
    monkeypatch.setattr(web, 'SESSIONS_DIR', tmp_path)
    for first, second in [('a/b', 'a?b'), ('a' * 120 + '1', 'a' * 120 + '2')]:
        assert web._session_flock_path(first) != web._session_flock_path(second)
        web._save_turn(first, 'done', 'first')
        web._save_turn(second, 'done', 'second')
        assert json.loads(web._turn_file(first).read_text())['text'] == 'first'
        assert json.loads(web._turn_file(second).read_text())['text'] == 'second'


def test_nonstream_chat_can_be_stopped(monkeypatch, tmp_path):
    import asyncio
    import threading
    monkeypatch.setattr(web, 'SESSIONS_DIR', tmp_path)
    monkeypatch.setattr(web, 'openclaw_command', lambda: ['fake'])
    monkeypatch.setattr(web, 'agent_options', lambda: [])
    aborted = []
    monkeypatch.setattr(web, 'abort_session', lambda key: aborted.append(key))
    started, ended = threading.Event(), threading.Event()
    class Process:
        returncode = None
        def poll(self): return self.returncode
        def terminate(self): self.returncode = -15; ended.set()
        def wait(self, timeout=None): assert ended.wait(timeout); return self.returncode
    def run(command, timeout, on_start):
        process = Process()
        on_start(process)
        started.set()
        assert ended.wait(5)
        return subprocess.CompletedProcess(command, -15, '', '')
    monkeypatch.setattr(web, 'run_agent_command', run)
    async def scenario():
        pending = asyncio.create_task(web.api_chat(web.ChatRequest(message='test', sessionId='cancel-sync')))
        assert await asyncio.to_thread(started.wait, 2)
        stopped = await web.api_chat_stop(web.StopRequest(sessionId='cancel-sync'))
        return stopped, await pending
    stopped, result = asyncio.run(scenario())
    assert stopped['stopped'] and result['response'] == '已停止生成。'
    assert aborted == ['agent:main:cancel-sync'] and 'cancel-sync' not in web._RUNNING_CHAT


def test_sync_cleanup_does_not_remove_the_next_turn(monkeypatch):
    successor = object()
    class Lock:
        def __init__(self, key): self.key = key
        def acquire(self, timeout): return True
        def release(self): web._RUNNING_CHAT[self.key] = successor
    monkeypatch.setattr(web, '_CrossProcLock', Lock)
    monkeypatch.setattr(web, 'openclaw_command', lambda: ['fake'])
    monkeypatch.setattr(web, 'agent_options', lambda: [])
    def run(command, timeout, on_start):
        on_start(object())
        return subprocess.CompletedProcess(command, 0, '{"status":"ok","payloads":[{"text":"ok"}]}', '')
    monkeypatch.setattr(web, 'run_agent_command', run)
    try:
        assert web.run_agent_sync('test', session_id='handoff') == 'ok'
        assert web._RUNNING_CHAT['handoff'] is successor
    finally:
        web._RUNNING_CHAT.pop('handoff', None)
