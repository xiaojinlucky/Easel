"""普通网页采集路由 + 小红书笔记入库：同一套素材库，重复保存不新增一行。"""
import importlib.util
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from easel import research
from web import clipper_api

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location(
    'beav_native_host_clip_save', ROOT / 'scripts' / 'beav_native_host.py',
)
_host = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_host)


ARTICLE = {
    'title': '一篇普通文章',
    'url': 'https://example.com/articles/clip-once',
    'topic': '素材',
    'content': '这是普通网页的可读正文，用来确认采集进素材库。',
}
NOTE_URL = 'https://www.xiaohongshu.com/explore/noteclip1'
NOTE_TITLE = '一条小红书笔记'
NOTE_BODY = '笔记正文要能从素材库读回来。'


@pytest.fixture
def isolated(monkeypatch, tmp_path):
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'KNOWLEDGE', tmp_path / 'knowledge')
    monkeypatch.setattr(research, 'KNOWLEDGE_TRASH', tmp_path / 'knowledge' / '.trash')
    monkeypatch.setattr(clipper_api, 'TOKEN_FILE', tmp_path / 'pairing.json')
    monkeypatch.setattr(_host, 'LOG', tmp_path / 'beav-native-host.log')
    app = FastAPI()
    app.include_router(clipper_api.router)
    return TestClient(app)


def _saved(url: str) -> list[dict]:
    with research.connection() as db:
        rows = db.execute(
            "SELECT id FROM sources WHERE url=? AND state='saved' AND deleted_at=0",
            (url,),
        ).fetchall()
    return [research.get_source(row[0]) for row in rows]


def test_clip_route_and_xhs_note_store_title_url_body_and_dedupe(isolated):
    token = isolated.post('/api/research/clipper-pair').json()['token']
    headers = {'Authorization': 'Bearer ' + token}

    first = isolated.post('/api/clipper', json=ARTICLE, headers=headers)
    assert first.status_code == 200
    assert first.json()['title'] == ARTICLE['title']
    article_rows = _saved(ARTICLE['url'])
    assert len(article_rows) == 1
    article = article_rows[0]
    assert article['id'] == first.json()['id']
    assert article['title'] == ARTICLE['title']
    assert article['url'] == ARTICLE['url']
    assert article['content'] == ARTICLE['content']

    again = isolated.post('/api/clipper', json=ARTICLE, headers=headers)
    assert again.status_code == 200
    assert again.json()['id'] == article['id']
    assert again.json()['title'] == ARTICLE['title']
    reread = _saved(ARTICLE['url'])
    assert len(reread) == 1
    assert reread[0]['title'] == ARTICLE['title']
    assert reread[0]['url'] == ARTICLE['url']
    assert reread[0]['content'] == ARTICLE['content']

    payload = {'payload': {
        'source': {'sourceUrl': NOTE_URL, 'externalId': 'noteclip1'},
        'note': {'noteId': 'noteclip1', 'title': NOTE_TITLE, 'text': NOTE_BODY, 'author': {'nickname': '作者乙'}},
    }}
    note = _host.handle('knowledge.ingestXhsEntryV2', payload)
    assert note['success'] is True
    stored = research.get_source(note['id'])
    assert stored['title'] == NOTE_TITLE
    assert stored['url'] == NOTE_URL
    assert stored['content'] == NOTE_BODY
    assert stored['id'] != article['id']

    duplicate = _host.handle('knowledge.ingestXhsEntryV2', payload)
    assert duplicate['id'] == note['id']
    assert len(_saved(NOTE_URL)) == 1
    kept = research.get_source(note['id'])
    assert kept['title'] == NOTE_TITLE
    assert kept['url'] == NOTE_URL
    assert kept['content'] == NOTE_BODY
