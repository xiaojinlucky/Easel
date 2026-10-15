import io
import zipfile
import httpx

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.testclient import TestClient
from starlette.middleware.trustedhost import TrustedHostMiddleware

from web import phone_share


@pytest.fixture
def setup(tmp_path, monkeypatch):
    monkeypatch.setattr(phone_share, 'private_addresses', lambda: ['192.168.1.20'])
    outputs = tmp_path / 'outputs'
    (outputs / '中文 素材').mkdir(parents=True)
    source = outputs / '中文 素材' / '原图.png'
    source.write_bytes(b'original image')
    app = FastAPI()
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=['localhost'])

    @app.middleware('http')
    async def guard(request: Request, call_next):
        if request.method == 'POST' and request.headers.get('origin') == 'https://evil.example':
            return Response(status_code=403)
        return await call_next(request)

    @app.get('/private')
    def private():
        return {'private': True}

    state = phone_share.install_phone_sharing(app, outputs)
    with TestClient(app, base_url='http://localhost:7871', client=('127.0.0.1', 1000)) as client:
        yield app, client, state, outputs, source


def create(client, **extra):
    return client.post('/api/phone-shares', json={'title': '<script>evil</script>', 'body': '正文', 'tags': ['#标签'],
                                                 'media_paths': ['中文 素材/原图.png'], **extra})


def test_full_pack_snapshot_head_zip(setup):
    app, client, state, outputs, source = setup
    result = create(client)
    assert result.status_code == 200, result.text
    data = result.json()
    assert data['share_url'].startswith('http://192.168.1.20:7871/phone/')
    assert data['qr_data_url'].startswith('data:image/png;base64,')
    token = data['token']
    source.write_bytes(b'changed')
    with TestClient(app, base_url='http://192.168.1.20:7871', client=('192.168.1.8', 2000)) as remote:
        page = remote.get(f'/phone/{token}')
        assert page.status_code == 200
        assert '&lt;script&gt;evil&lt;/script&gt;' in page.text
        assert '<script>evil</script>' not in page.text
        assert page.headers['cache-control'] == 'no-store'
        media = remote.get(f'/phone/{token}/media/0')
        assert media.content == b'original image'
        assert remote.head(f'/phone/{token}/media/0').content == b''
        assert remote.head(f'/phone/{token}').content == b''
        archive = zipfile.ZipFile(io.BytesIO(remote.get(f'/phone/{token}/download.zip').content))
        assert archive.read('01_原图.png') == b'original image'
        assert '正文' in archive.read('文案.txt').decode()
        assert remote.post(f'/phone/{token}').status_code == 405
        for path in ('/private', '/api/phone-shares', '/outputs/中文 素材/原图.png'):
            assert remote.get(path, headers={'host': 'localhost', 'origin': 'http://localhost'}).status_code == 403


def test_local_guards_preserved(setup):
    app, client, *_ = setup
    assert client.get('/private').status_code == 200
    assert create(client).status_code == 200
    assert client.post('/api/phone-shares', json={}, headers={'origin': 'https://evil.example'}).status_code == 403
    assert client.get('/private', headers={'host': 'evil.example'}).status_code == 400


def test_revoke_expiry_and_capacity(setup):
    app, client, state, *_ = setup
    token = create(client).json()['token']
    directory = state['packs'][token]['directory']
    assert client.delete(f'/api/phone-shares/{token}').status_code == 200
    assert not directory.exists()
    assert client.get(f'/phone/{token}').status_code == 404
    token = create(client).json()['token']
    state['packs'][token]['expires_at'] = 0
    assert client.get(f'/phone/{token}').status_code == 410
    for _ in range(4):
        assert create(client).status_code == 200
    assert create(client).status_code == 409


def test_paths_limits_and_no_lan(setup, monkeypatch):
    app, client, state, outputs, source = setup
    for path in ('../outside.png', str(outputs.parent / 'outside.png'), '.hidden.png', '_login/a.png', 'logs/a.png', 'missing.png'):
        assert create(client, media_paths=[path]).status_code == 400
    link = outputs / 'linked.png'
    try:
        link.symlink_to(source)
    except OSError:
        pass
    else:
        assert create(client, media_paths=['linked.png']).status_code == 400
    assert create(client, title='x' * 301).status_code == 422
    assert create(client, tags=['x' * 101]).status_code == 400
    assert create(client, media_paths=['中文 素材/原图.png'] * 31).status_code == 422
    assert create(client, title='', body='', tags=[], media_paths=[]).status_code == 400
    assert create(client, media_paths=[]).status_code == 200
    monkeypatch.setattr(phone_share, 'MAX_BYTES', 3)
    assert create(client).status_code == 413
    monkeypatch.setattr(phone_share, 'private_addresses', lambda: [])
    assert create(client).status_code == 400


@pytest.mark.parametrize('resource', ['media/0', 'download.zip'])
@pytest.mark.parametrize('invalidation', ['revoke', 'expiry'])
def test_admitted_download_survives_invalidation(setup, monkeypatch, resource, invalidation):
    app, client, state, *_ = setup
    token = create(client, body='保留 {{ZIP}} 原文').json()['token']
    assert '保留 {{ZIP}} 原文' in client.get(f'/phone/{token}').text
    directory = state['packs'][token]['directory']
    original = phone_share.FileResponse.__call__

    async def invalidate_before_open(response, scope, receive, send):
        if invalidation == 'expiry':
            state['packs'][token]['expires_at'] = 0
            state['cleanup']()
        else:
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app, client=('127.0.0.1', 1)), base_url='http://localhost') as local:
                assert (await local.delete(f'/api/phone-shares/{token}')).status_code == 200
        assert token not in state['packs']
        assert directory.exists()
        await original(response, scope, receive, send)

    monkeypatch.setattr(phone_share.FileResponse, '__call__', invalidate_before_open)
    result = client.get(f'/phone/{token}/{resource}')
    assert result.status_code == 200
    if resource == 'media/0':
        assert result.content == b'original image'
    else:
        assert zipfile.ZipFile(io.BytesIO(result.content)).read('01_原图.png') == b'original image'
    assert not directory.exists()
    assert client.get(f'/phone/{token}/{resource}').status_code == 404
