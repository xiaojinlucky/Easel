import hashlib
import json
import shutil
import threading
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from web.creation_workspace import install_creation_workspace, search_materials


@pytest.fixture
def setup(tmp_path):
    outputs = tmp_path / '中文 空格' / 'outputs'
    outputs.mkdir(parents=True)
    source = outputs / '原文.md'
    source.write_text('我的手改稿\n\n**原样保留**', encoding='utf-8')
    items = [{'id': 'record1', 'title': '标题甲', 'summary': '摘要', 'platform': '小红书'},
             {'id': 'record2', 'title': '标题乙', 'summary': '', 'platform': 'B站'}]
    cache = {'items': items, 'full': {it['id']: dict(it) for it in items}}
    cache['full']['record1'].update(transcript='仅在转写里出现的 线粒体证据', ocr='图里是红细胞', hotComments='评论问批次效应')
    app = FastAPI()
    store = install_creation_workspace(app, outputs, Path(__file__).parents[1], lambda: cache, lambda _: {'schedule': [], 'publications': []})
    with TestClient(app) as client:
        yield client, store, outputs, source, cache


def create(client, **extra):
    r = client.post('/api/creations', json={'id': 'a' * 32, 'title': '中文 标题', 'sourceIds': ['record1', 'record2'], **extra})
    assert r.status_code == 200, r.text
    return r.json()


def save(client, work, body='保留开头\n\n修改中间\n\n保留结尾', **extra):
    return client.post(f"/api/creations/{work['id']}/versions", json={
        'revision': work['revision'], 'operationId': 'save-' + str(work['revision']), 'title': work['title'], 'body': body, **extra})


@pytest.mark.parametrize('query,field', [('线粒体', '视频转写'), ('红细胞', '图片文字'), ('批次效应', '热门评论'), ('标题甲 线粒体', '标题')])
def test_full_text_matches_real_fields(setup, query, field):
    *_, cache = setup
    result = search_materials(cache, query)
    assert len(result) == 1 and result[0]['id'] == 'record1'
    assert any(m['field'] == field for m in result[0]['matches'])
    assert '仅在转写' not in result[0].get('summary', '')


def test_empty_and_no_match_and_length(setup):
    *_, cache = setup
    assert len(search_materials(cache, '  ')) == 2
    assert search_materials(cache, '不存在') == []
    with pytest.raises(Exception) as exc:
        search_materials(cache, '字' * 201)
    assert exc.value.status_code == 400


def test_import_save_duplicate_conflict_and_restore_preserve_original(setup):
    client, store, outputs, source, _ = setup
    before = hashlib.sha256(source.read_bytes()).hexdigest()
    work = create(client, sourcePath='原文.md')
    assert work['body'] == source.read_text(encoding='utf-8')
    old_version = work['versions'][0]
    assert create(client, sourcePath='原文.md')['revision'] == 1
    saved = save(client, work).json()
    assert saved['revision'] == 2
    assert save(client, work).json()['revision'] == 2
    assert save(client, work, operationId='different').status_code == 409
    restored = client.post(f"/api/creations/{work['id']}/restore", json={
        'revision': 2, 'operationId': 'restore1', 'versionId': old_version['id']}).json()
    assert restored['revision'] == 3 and restored['body'] == work['body']
    assert (outputs / saved['versions'][-1]['bodyPath']).read_text(encoding='utf-8') == saved['body']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == before
    assert store.read(work['id'])['sourceIds'] == ['record1', 'record2']


@pytest.mark.parametrize('path', ['../secret.md', '_meta/secret.md', '03-变现交付/合同.md', 'missing.md', 'raw.doc'])
def test_import_boundaries(setup, path):
    client, _, outputs, *_ = setup
    if path not in ('../secret.md', 'missing.md'):
        target = outputs / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text('not imported', encoding='utf-8')
    r = client.post('/api/creations', json={'sourcePath': path})
    assert r.status_code in (400, 403, 404)
    assert client.get('/api/creations').json()['items'] == []


def test_docx_read_only_and_invalid_sources(setup):
    client, _, outputs, *_ = setup
    path = outputs / 'Word 手改.docx'
    with zipfile.ZipFile(path, 'w') as z:
        z.writestr('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>我亲手改的文字</w:t></w:r></w:p></w:body></w:document>')
    original = path.read_bytes()
    assert create(client, sourcePath=path.name)['body'] == '我亲手改的文字'
    assert path.read_bytes() == original
    assert client.post('/api/creations', json={'sourceIds': ['gone']}).status_code == 404
    assert client.post('/api/creations', json={'sourceIds': ['record1'] * 6}).status_code == 422
    assert client.get('/api/creations/not-an-id').status_code == 400


def test_source_text_is_fixed_when_snapshot_changes(setup):
    client, _, _, _, cache = setup
    work = create(client)
    path = '/api/creations/' + work['id'] + '/context'
    before = client.get(path).json()['sources']
    cache['full']['record1']['transcript'] = '刷新后的另一段内容'
    cache['full'].pop('record2')
    after = client.get(path).json()['sources']
    assert before == after
    assert after[0]['content']['transcript'] == '仅在转写里出现的 线粒体证据'


def test_move_keeps_ids_versions_and_media(setup):
    client, store, outputs, *_ = setup
    work = create(client, sourcePath='原文.md')
    work = save(client, work).json()
    parent = Path(work['versions'][-1]['bodyPath']).parent
    target = outputs / '整理' / parent.name
    target.parent.mkdir()
    shutil.move(str(outputs / parent), target)
    store.relocate(parent.as_posix(), target.relative_to(outputs).as_posix())
    new = client.get('/api/creations/' + work['id']).json()
    assert new['id'] == work['id'] and new['revision'] == work['revision']
    assert new['body'] == work['body'] and new['fileError'] == ''
    assert new['versions'][-1]['id'] == work['versions'][-1]['id']


def test_corrupt_record_prevents_move_before_files_change(setup):
    client, store, outputs, source, _ = setup
    create(client, sourcePath='原文.md')
    (store.directory / ('b' * 32 + '.json')).write_text('{broken', encoding='utf-8')
    target = outputs / '移动后.md'
    with pytest.raises(Exception) as exc:
        store.move_output(source, target)
    assert exc.value.status_code == 500
    assert source.exists() and not target.exists()


def test_move_rolls_back_on_metadata_write_failure(setup, monkeypatch):
    client, store, outputs, source, _ = setup
    create(client, sourcePath='原文.md')
    def fail(_):
        raise OSError('disk write failed')
    monkeypatch.setattr(store, 'write', fail)
    target = outputs / '移动后.md'
    with pytest.raises(OSError):
        store.move_output(source, target)
    assert source.exists() and not target.exists()


def test_simultaneous_saves_do_not_overwrite(setup):
    client, *_ = setup
    work = create(client)
    barrier = threading.Barrier(2)
    def write(i):
        barrier.wait()
        return save(client, work, body=f'稿件{i}', operationId=f'parallel-{i}').status_code
    with ThreadPoolExecutor(max_workers=2) as pool:
        result = list(pool.map(write, [1, 2]))
    assert sorted(result) == [200, 409]
    assert len(client.get('/api/creations/' + work['id']).json()['versions']) == 2


def test_missing_version_is_reported_and_platforms_retained(setup):
    client, _, outputs, *_ = setup
    work = create(client)
    work = save(client, work, platforms={'xiaohongshu': '平台手改'}, tags='科研').json()
    assert work['versions'][-1]['platforms']['xiaohongshu'] == '平台手改'
    (outputs / work['versions'][-1]['bodyPath']).unlink()
    read = client.get('/api/creations/' + work['id']).json()
    assert read['fileError'] and read['revision'] == 2
    assert client.post(f"/api/creations/{work['id']}/restore", json={
        'revision': 2, 'operationId': 'restore-missing', 'versionId': work['versions'][-1]['id']}).status_code == 409


def test_real_renderer_and_single_card_only(setup):
    client, _, outputs, *_ = setup
    work = create(client)
    body = '# 验收用文字卡片\n\n' + '\n\n'.join([f'第 {i} 段：这是本机功能验收的测试文字，不是正式稿件。记录素材来源，再检查事实和原文语气。' for i in range(12)])
    work = save(client, work, body=body).json()
    r = client.post(f"/api/creations/{work['id']}/cards", json={'revision': work['revision'], 'operationId': 'cards-all'})
    assert r.status_code == 200, r.text
    work = r.json()
    cards = work['versions'][-1]['cards']
    assert len(cards) >= 2
    hashes = [hashlib.sha256((outputs / card['path']).read_bytes()).hexdigest() for card in cards]
    r = client.post(f"/api/creations/{work['id']}/cards", json={'revision': work['revision'], 'operationId': 'cards-one', 'index': 1, 'text': '只改第二张。\n\n其余卡片保持原样。'})
    assert r.status_code == 200, r.text
    changed = r.json()['versions'][-1]['cards']
    assert len(changed) == len(cards)
    for i in range(len(cards)):
        assert (changed[i]['path'] == cards[i]['path']) == (i != 1)
        assert (hashlib.sha256((outputs / changed[i]['path']).read_bytes()).hexdigest() == hashes[i]) == (i != 1)
    # A failed oversized replacement leaves every committed version and image unchanged.
    newest = r.json()
    r = client.post(f"/api/creations/{work['id']}/cards", json={'revision': newest['revision'], 'operationId': 'too-long', 'index': 1, 'text': '很长的内容。' * 300})
    assert r.status_code == 400
    assert client.get('/api/creations/' + work['id']).json()['revision'] == newest['revision']
