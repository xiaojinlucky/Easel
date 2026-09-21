"""阶段1B/1C：/api/research 治理路由的形状与生命周期冒烟（不占端口，纯内存客户端）。"""
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'web'))

import research_api  # noqa: E402
from easel import research  # noqa: E402


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    app = FastAPI()
    app.include_router(research_api.router)
    return TestClient(app)


def test_governance_routes_lifecycle(client):
    saved = client.post('/api/research/import', json={
        'title': '测试素材', 'url': '', 'content': '一段可搜的正文'}).json()
    page = client.get('/api/research/sources').json()
    assert page['total'] == 1 and page['items'][0]['id'] == saved['id']
    assert page['kindCounts'] == {'': 1}

    patched = client.patch(f"/api/research/sources/{saved['id']}", json={'pinned': True, 'tags': ['重点']}).json()
    assert patched['pinned'] == 1 and patched['tags'] == ['重点']
    tagged = client.post(f"/api/research/sources/{saved['id']}/tags", json={'tag': '待读'}).json()
    assert tagged['tags'] == ['重点', '待读']
    assert client.delete(f"/api/research/sources/{saved['id']}/tags/待读").json()['tags'] == ['重点']

    assert client.delete(f"/api/research/sources/{saved['id']}").json()['deleted'] == 1
    assert client.get('/api/research/trash').json()['items'][0]['id'] == saved['id']
    assert client.post('/api/research/trash/restore', json={'ids': [saved['id']]}).json()['restored'] == 1

    index = client.get('/api/research/index-status').json()
    assert index['fts_indexed'] >= 1 and index['trash'] == 0
    assert client.post('/api/research/reindex').json()['indexed'] == 1
    assert client.get('/api/research/sources?query=可搜').json()['items'][0]['id'] == saved['id']

    assert client.patch(f"/api/research/sources/{saved['id']}", json={}).status_code == 422
    assert client.get('/api/research/sources/不存在').status_code == 404


def test_batch_delete_and_kind_filter(client):
    ids = [client.post('/api/research/import', json={'title': f'批量{i}', 'content': f'正文{i}'}).json()['id'] for i in range(3)]
    assert client.post('/api/research/sources/batch-delete', json={'ids': ids[:2]}).json()['deleted'] == 2
    page = client.get('/api/research/sources').json()
    assert page['total'] == 1 and page['items'][0]['id'] == ids[2]
