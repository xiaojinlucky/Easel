"""采集扩展不得再全站注入或申请 debugger。"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "extensions" / "beav-capture" / "manifest.json"


def test_manifest_cannot_inject_every_site_or_attach_debugger():
    data = json.loads(MANIFEST.read_text(encoding="utf-8-sig"))
    assert "debugger" not in data.get("permissions", [])
    assert "<all_urls>" not in data.get("host_permissions", [])
    for script in data.get("content_scripts") or []:
        assert "<all_urls>" not in (script.get("matches") or [])
        joined = " ".join(script.get("matches") or [])
        assert "grok.com" not in joined
        assert "xiaohongshu.com" in joined or "rednote.com" in joined


def test_grok_guard_present_in_injected_scripts():
    observer = (ROOT / "extensions" / "beav-capture" / "pageObserver.js").read_text(encoding="utf-8")
    overlay = (ROOT / "extensions" / "beav-capture" / "browserControlContent.js").read_text(encoding="utf-8")
    assert "grok.com" in observer
    assert "grok.com" in overlay


def test_host_handshake_disables_browser_control():
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "beav_native_host", ROOT / "scripts" / "beav_native_host.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    ping = mod.handle("ping", {})
    assert ping["capabilities"]["browserControl"] is False
    assert ping["desktopBridge"]["browserControl"] is False
