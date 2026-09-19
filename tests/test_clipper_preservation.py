import hashlib
import pytest

from easel import research


@pytest.fixture
def local_state(monkeypatch, tmp_path):
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    return tmp_path


def test_clipper_selections_preserve_full_article_and_dedupe(local_state):
    url = 'https://github.com/example/topic'
    full = research.save_source(url, '完整正文', 'GitHub 社区', '主题', '完整文章内容', method='CloakBrowser + Baoyu')
    first = research.save_source(url, '选区一', '浏览器采集', '主题', '第一段选区', method=research.CLIPPER_METHOD)
    second = research.save_source(url, '选区二', '浏览器采集', '主题', '第二段选区', method=research.CLIPPER_METHOD)
    duplicate = research.save_source(url, '选区一', '浏览器采集', '主题', '第一段选区', method=research.CLIPPER_METHOD)

    assert full['id'] != first['id'] != second['id']
    assert duplicate['id'] == first['id']
    assert research.get_source(full['id'])['content'] == '完整文章内容'
    assert research.get_source(first['id'])['content'] == '第一段选区'
    assert research.get_source(second['id'])['content'] == '第二段选区'
    with research.connection() as db:
        assert db.execute("SELECT count(*) FROM sources WHERE state='saved'").fetchone()[0] == 3


def test_clipper_keeps_legacy_url_key_without_migration(local_state):
    url = 'https://github.com/example/legacy'
    identifier = hashlib.sha256(url.encode()).hexdigest()[:24]
    content = '旧版选区'
    target = local_state / 'outputs' / '研究素材' / f'{identifier}.md'
    target.parent.mkdir(parents=True)
    target.write_text(content, encoding='utf-8')
    with research.connection() as db:
        db.execute('INSERT INTO sources VALUES (?,?,?,?,?,?,?,?,?,?,?)', (identifier, url, '旧版选区', '浏览器采集', '', content, 'saved', '', 1.0, f'研究素材/{identifier}.md', research.CLIPPER_METHOD))

    duplicate = research.save_source(url, '旧版选区', '浏览器采集', '', content, method=research.CLIPPER_METHOD)

    assert duplicate['id'] == identifier
    with research.connection() as db:
        assert db.execute('SELECT count(*) FROM sources').fetchone()[0] == 1
