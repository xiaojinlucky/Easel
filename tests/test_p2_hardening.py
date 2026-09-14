"""P2: loopback bind, Origin write guard, session-lock cleanup, bounded stdout."""
from collections import deque

from fastapi.testclient import TestClient

from easel import services
from web import app as web


LOCAL = 'http://127.0.0.1:7860'


def test_python_module_and_service_manager_bind_loopback_only():
    assert web.WEB_BIND_HOST == '127.0.0.1'
    cmd = services.command_for('web')
    assert '--host' in cmd
    host = cmd[cmd.index('--host') + 1]
    assert host == '127.0.0.1'
    assert '0.0.0.0' not in cmd


def test_write_without_origin_from_loopback_is_allowed():
    """本机非浏览器调用（脚本 / curl / 桌面壳内部）不带 Origin，属正常流量，不能 403。

    必须**显式指定对端 IP**：`TestClient` 默认对端是字面量 `'testclient'`，
    不是 IP，会被判成「非回环」而拒绝——拿默认值测放行路径会得出相反结论。
    """
    client = TestClient(web.app, base_url=LOCAL, client=('127.0.0.1', 51234))
    response = client.post('/api/publishing/postiz/media', json={'path': 'card.png'})
    assert response.status_code != 403


def test_write_without_origin_from_remote_peer_is_rejected():
    """没有 Origin 可判时，要求对端来自回环；非回环一律拒绝。"""
    client = TestClient(web.app, base_url=LOCAL, client=('192.168.1.9', 51234))
    response = client.post('/api/publishing/postiz/media', json={'path': 'card.png'})
    assert response.status_code == 403
    assert '本机工作台' in response.json()['detail']


def test_write_with_foreign_origin_is_rejected():
    client = TestClient(web.app, base_url=LOCAL)
    response = client.post(
        '/api/publishing/postiz/media',
        json={'path': 'card.png'},
        headers={'Origin': 'https://evil.example'},
    )
    assert response.status_code == 403


def test_write_with_local_origin_passes_guard():
    client = TestClient(web.app, base_url=LOCAL, headers={'Origin': LOCAL})
    response = client.post('/api/publishing/postiz/media', json={'path': ''})
    assert response.status_code != 403
    assert response.status_code in (422, 404)


def test_get_without_origin_still_allowed():
    client = TestClient(web.app, base_url=LOCAL)
    response = client.get('/')
    assert response.status_code == 200


def test_session_lock_is_dropped_when_idle():
    import asyncio

    async def scenario():
        web._session_locks.clear()
        web._session_lock_waiters.clear()
        sk = 'p2-lock-idle'
        lock = await web._acquire_session_lock(sk)
        assert sk in web._session_locks
        web._release_session_lock(sk, lock)
        assert sk not in web._session_locks
        assert sk not in web._session_lock_waiters

    asyncio.run(scenario())


def test_list_personas_reads_utf8_identity(tmp_path, monkeypatch):
    folder = tmp_path / 'profiles' / '测试号'
    folder.mkdir(parents=True)
    (folder / 'identity.md').write_text('# 身份\n中文定位一句话\n', encoding='utf-8')
    monkeypatch.setattr(web, 'PROFILES_DIR', tmp_path / 'profiles')
    items = web.list_personas()
    assert items[0]['name'] == '测试号'
    assert '中文定位' in items[0]['description']


def test_start_tolerates_vanished_child_pid(monkeypatch, tmp_path):
    class Dead:
        pid = 4242

        def poll(self):
            return 1

    monkeypatch.setattr(services, 'healthy', lambda name: False)
    monkeypatch.setattr(services, 'owned_processes', lambda name: [])
    monkeypatch.setattr(services, 'open_log', lambda name: (tmp_path / 'svc.log').open('a', encoding='utf-8'))
    monkeypatch.setattr(services.subprocess, 'Popen', lambda *a, **k: Dead())

    def boom(pid):
        raise services.psutil.NoSuchProcess(pid)

    monkeypatch.setattr(services.psutil, 'Process', boom)
    try:
        services.start('web')
        raise AssertionError('expected start failure')
    except RuntimeError as exc:
        assert '启动失败' in str(exc)
    except services.psutil.NoSuchProcess:
        raise AssertionError('vanished PID must not escape start()')


def test_auth_guide_get_without_origin_is_allowed():
    client = TestClient(web.app, base_url=LOCAL)
    response = client.get('/api/auth-guide')
    assert response.status_code == 200
    body = response.json()
    assert 'platforms' in body and 'wechat' in body and 'postiz' in body


def test_stdout_buffer_is_bounded():
    assert web._STDOUT_MAX_LINES == 4000
    buf: deque[str] = deque(maxlen=web._STDOUT_MAX_LINES)
    for i in range(web._STDOUT_MAX_LINES + 50):
        buf.append(f'line-{i}\n')
    assert len(buf) == web._STDOUT_MAX_LINES
    assert ''.join(buf).startswith('line-50\n')
