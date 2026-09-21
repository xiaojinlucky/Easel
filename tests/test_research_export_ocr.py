"""阶段2（无依赖部分）：批量 OCR 回填与 Beav 式知识库导出。"""
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
from easel import research  # noqa: E402


@pytest.fixture
def lib(tmp_path, monkeypatch):
    monkeypatch.setattr(research, 'DB', tmp_path / 'research.sqlite')
    monkeypatch.setattr(research, 'ROOT', tmp_path)
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    return tmp_path


@pytest.fixture
def client(lib):
    app = FastAPI()
    app.include_router(research_api.router)
    return TestClient(app)


def test_refresh_ocr_batch_marks_attempted(lib, monkeypatch):
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '识别出的文字')
    row = research.save_source('https://example.com/o1', '图文', '导入摘录', '', '正文',
                               extra={'local_images': ['研究素材/o1/00.jpg']})
    result = research.refresh_ocr_batch()
    assert result == {'processed': 1, 'with_text': 1}
    item = research.get_source(row['id'])
    # json_set 落库的是 1（SQLite 没有独立的布尔类型），批量筛选按这个标记跳过已尝试的
    assert '识别出的文字' in item['content'] and item['extra']['ocr_attempted'] == 1
    assert research.refresh_ocr_batch()['processed'] == 0  # 已尝试过的不重跑


def test_ocr_refresh_swaps_only_its_own_section(lib, monkeypatch):
    """合并 grok 的按栏目排版与本线的原子换段之后，重跑只能动 [图片文字] 那一段。

    两边各自的旧写法都会伤人：grok 用 content.split('[图片文字]')[0] 重拼，
    会把后面那段几十分钟才跑出来的 [视频转写] 一起截掉；本线的「已有标记就跳过」
    又让新排版永远刷不掉第一次的平铺文字。
    """
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '')
    row = research.save_source('https://example.com/o2', '图文二', '导入摘录', '', '正文',
                               extra={'local_images': ['研究素材/o2/00.jpg']})
    identifier = row['id']
    with research.connection() as db:
        db.execute('UPDATE sources SET content = ? WHERE id=?',
                   ('正文\n\n[图片文字]\n第一次的平铺文字\n\n[视频转写·subtitles]\n字幕正文\n', identifier))
    monkeypatch.setattr(research, 'ocr_local_images', lambda rel: '## 个人简历\n按原图栏目排版的文字')
    assert research.refresh_ocr(identifier)['ocr_appended'] is True
    content = research.get_source(identifier)['content']
    assert '按原图栏目排版的文字' in content and '第一次的平铺文字' not in content
    assert content == '正文\n\n[图片文字]\n## 个人简历\n按原图栏目排版的文字\n\n[视频转写·subtitles]\n字幕正文'


def test_export_folder_follows_beav_layout(lib):
    row = research.save_source('https://www.xiaohongshu.com/explore/e1', '导出测试', '小红书', 't', '正文',
                               kind='redbook-note', extra={'tags': ['爆款'], 'comments_text': '一条好评'})
    result = research.export_folder(row['id'])
    folder = lib / 'knowledge' / 'xiaohongshu' / row['id']
    assert Path(result['folder']).as_posix().endswith(row['id'])
    meta = json.loads((folder / 'meta.json').read_text(encoding='utf-8'))
    assert meta['kind'] == 'redbook-note' and meta['tags'] == ['爆款'] and meta['site'] == 'xiaohongshu'
    body = (folder / 'content.md').read_text(encoding='utf-8')
    assert body.startswith('---') and '一条好评' in body and 'source: "https' in body


def test_export_batch_csv_and_json(lib):
    ids = [research.save_source(f'https://example.com/x{i}', f'素材{i}', '导入摘录', '', f'内容{i}')['id'] for i in range(2)]
    out = research.export_batch(ids, 'csv')
    text = (lib / 'outputs' / out['file']).read_text(encoding='utf-8-sig')
    assert out['count'] == 2 and '素材1' in text and text.splitlines()[0].startswith('id,title')
    js = research.export_batch(ids, 'json')
    records = json.loads((lib / 'outputs' / js['file']).read_text(encoding='utf-8'))
    assert len(records) == 2 and records[0]['content'] == '内容0'
    with pytest.raises(research.CollectionError):
        research.export_batch(ids, 'xml')


def test_export_and_ocr_routes(client):
    saved = client.post('/api/research/import', json={'title': '导出', 'url': '', 'content': '正文'}).json()
    exported = client.get(f"/api/research/sources/{saved['id']}/export-folder").json()
    assert exported['files'] == ['meta.json', 'content.md']
    batch = client.post('/api/research/export', json={'ids': [saved['id']], 'format': 'csv'}).json()
    assert batch['count'] == 1 and batch['format'] == 'csv'
    assert client.post('/api/research/export', json={'ids': [], 'format': 'csv'}).status_code == 422
    assert client.post('/api/research/export', json={'ids': [saved['id']], 'format': 'exe'}).status_code == 422
    first = client.post('/api/research/refresh-ocr', json={}).json()
    assert first['processed'] == 1 and first['with_text'] == 0
    assert client.post('/api/research/refresh-ocr', json={}).json()['processed'] == 0  # 不重跑
