import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    'beav_native_host', ROOT / 'scripts' / 'beav_native_host.py'
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
_text_from_payload = mod._text_from_payload
handle = mod.handle


def test_project_root_ignores_utf8_bom():
    bom_path = b"\xef\xbb\xbfF:\\easel-official\r\n"
    resolved = Path(bom_path.decode("utf-8-sig").strip())
    assert resolved.name == "easel-official"
    text = (ROOT / "scripts" / "beav_native_host.py").read_text(encoding="utf-8")
    assert 'encoding="utf-8-sig"' in text


def test_ping_reports_bridge_connected():
    result = handle('ping', {})
    assert result['ok'] is True
    assert result['appVersion'].startswith('2.7.')
    assert result['desktopBridge']['connected'] is True
    assert result['desktopBridge']['browserControl'] is False
    assert result['capabilities']['browserControl'] is False


def test_extracts_knowledge_entry_fields():
    url, title, text = _text_from_payload({
        'payload': {
            'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/abc'},
            'content': {'title': '一条笔记', 'text': '正文内容'},
        }
    })
    assert url.endswith('/abc')
    assert title == '一条笔记'
    assert '正文' in text


def test_xhs_v2_uses_note_text_and_images():
    entry = mod.extract_entry('knowledge.ingestXhsEntryV2', {
        'payload': {
            'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/abc', 'externalId': 'n1'},
            'note': {
                'title': 'V2标题',
                'text': '笔记正文不该丢',
                'author': {'nickname': '作者甲'},
                'assets': {
                    'coverUrl': 'https://example.com/cover.jpg',
                    'imageUrls': ['https://example.com/1.jpg'],
                },
            },
            'comments': {'items': [{'author': '乙', 'text': '一条评论'}]},
        }
    })
    assert entry['title'] == 'V2标题'
    assert '不该丢' in entry['text']
    assert entry['author'] == '作者甲'
    assert entry['cover_url'].endswith('cover.jpg')
    assert '一条评论' in entry['extra']['comments_text']
    entry2 = mod.extract_entry('knowledge.ingestXhsEntryV2', {
        'payload': {
            'source': {'sourceUrl': 'https://www.xiaohongshu.com/explore/abc'},
            'note': {'title': '有赞', 'text': '正文', 'stats': {'likes': 12, 'collects': 3, 'comments': 4}, 'tags': ['科研']},
        }
    })
    assert entry2['extra']['likes'] == 12
    assert '科研' in entry2['extra']['tags']


def test_accounts_rpc_is_rejected():
    try:
        handle('accounts.createImportSession', {'payload': {'homepageUrl': 'https://www.xiaohongshu.com/user/profile/x'}})
        raise AssertionError('should reject')
    except ValueError as exc:
        assert '账号档案' in str(exc)


def test_zhihu_answer_uses_nested_text():
    entry = mod.extract_entry('knowledge.ingestZhihuAnswer', {
        'payload': {
            'source': {'sourceUrl': 'https://www.zhihu.com/question/1/answer/2'},
            'answer': {'text': '回答正文', 'author': '答主'},
        }
    })
    assert '回答正文' in entry['text']
    assert entry['author'] == '答主'
