from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIPPER = ROOT / 'extensions' / 'easel-clipper'


def test_clipper_keeps_minimal_permissions():
    manifest = (CLIPPER / 'manifest.json').read_text(encoding='utf-8')
    assert 'debugger' not in manifest
    assert '<all_urls>' not in manifest
    assert 'activeTab' in manifest


def test_clipper_vendors_turndown_and_previews():
    assert (CLIPPER / 'vendor' / 'turndown.browser.umd.js').is_file()
    assert (CLIPPER / 'vendor' / 'gfm-umd.js').is_file()
    popup = (CLIPPER / 'popup.js').read_text(encoding='utf-8')
    assert 'turndown' in popup.lower()
    assert 'preview' in popup
    assert 'grok.com' in popup or 'grok' in popup
    html = (CLIPPER / 'popup.html').read_text(encoding='utf-8')
    assert 'textarea' in html
