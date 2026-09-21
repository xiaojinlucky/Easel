"""阶段1B：素材库治理（FTS5+jieba、分页、标签、置顶、回收站）的行为钉死。"""
import time

import pytest

from easel import research
from easel.research import CollectionError


@pytest.fixture
def lib(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    return tmp_path


def test_fts_search_covers_comments_and_tags(lib):
    row = research.save_source(
        'https://www.xiaohongshu.com/explore/a1', '简历修改经历', '小红书', '求职', '正文提到实验室跳槽',
        extra={'comments_text': '评论区有人问薪资', 'tags': ['改简历']},
    )
    page = research.list_sources(query='薪资')
    assert page['engine'] == 'fts5+jieba'
    assert [item['id'] for item in page['items']] == [row['id']]
    assert page['items'][0]['tags'] == ['改简历']
    miss = research.list_sources(query='绝对搜不到的东西')
    assert miss['items'] == []


def test_pagination_kind_counts_and_filters(lib):
    for index in range(3):
        research.save_source(f'https://www.zhihu.com/question/{index}', f'知乎素材{index}', '知乎', '', '正文', kind='zhihu-answer')
    research.save_source('https://www.xiaohongshu.com/explore/b', '小红书素材', '小红书', '', '正文', kind='redbook-note')
    page = research.list_sources(limit=2, offset=1)
    assert page['total'] == 4 and len(page['items']) == 2
    assert page['kindCounts'] == {'zhihu-answer': 3, 'redbook-note': 1}
    filtered = research.list_sources(kind='redbook-note')
    assert filtered['total'] == 1
    assert filtered['kindCounts'] == {'zhihu-answer': 3, 'redbook-note': 1}


def test_trash_lifecycle_and_purge(lib):
    row = research.save_source('https://example.com/t1', '要删的', '导入摘录', '', '内容')
    assert research.delete_sources([row['id']]) == 1
    assert research.list_sources()['total'] == 0
    assert [item['id'] for item in research.list_trash()] == [row['id']]
    assert research.restore_sources([row['id']]) == 1
    assert research.list_sources()['total'] == 1
    research.delete_sources([row['id']])
    with research.connection() as db:
        db.execute('UPDATE sources SET deleted_at=? WHERE id=?', (time.time() - 40 * 86400, row['id']))
    assert research.purge_expired() == 1
    with pytest.raises(CollectionError):
        research.get_source(row['id'])
    assert not (lib / 'outputs' / '研究素材' / f"{row['id']}.md").exists()


def test_re_ingest_revives_trashed_source(lib):
    row = research.save_source('https://example.com/r1', '删后又来', '导入摘录', 't', '同一内容')
    research.delete_sources([row['id']])
    again = research.save_source('https://example.com/r1', '删后又来', '导入摘录', 't', '同一内容')
    assert again['id'] == row['id'] and again['save_status'] == 'unchanged'
    assert research.list_sources()['total'] == 1


def test_update_pinned_and_asset_rewrite(lib):
    row = research.save_source('https://example.com/u1', '旧标题', '导入摘录', '', '旧内容')
    research.update_source(row['id'], title='新标题', content='新内容带过来', tags=['重点', '待读'], pinned=True)
    item = research.get_source(row['id'])
    assert item['title'] == '新标题' and item['tags'] == ['重点', '待读'] and item['pinned'] == 1
    assert '新内容带过来' in (lib / 'outputs' / item['asset_path']).read_text(encoding='utf-8')
    assert research.list_sources(query='带过来')['total'] == 1
    research.save_source('https://example.com/u2', '更新的', '导入摘录', '', '内容2')
    assert research.list_sources()['items'][0]['id'] == row['id']  # pinned 优先
    research.remove_tag(row['id'], '待读')
    assert research.get_source(row['id'])['tags'] == ['重点']


def test_migrate_legacy_kinds_and_index_status(lib):
    row = research.save_source('https://example.com/m1', '老数据', 'Beav采集', '', '文', kind='XhsV2')
    result = research.migrate_legacy_kinds()
    assert result['rows'] == 1
    assert research.get_source(row['id'])['kind'] == 'redbook-note'
    status = research.index_status()
    assert status['total'] == 1 and status['fts_indexed'] == 1
    assert status['trash'] == 0 and isinstance(status['ocr_available'], bool)
