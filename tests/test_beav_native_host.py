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


def test_ping_reports_bridge_connected():
    result = handle('ping', {})
    assert result['ok'] is True
    assert result['appVersion'].startswith('2.7.')
    assert result['desktopBridge']['connected'] is True


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
