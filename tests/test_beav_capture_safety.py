"""采集扩展不得再全站注入或申请 debugger。

`extensions/beav-capture` 的上游是 Jamailar/Beav（MIT-NC，仅限非商业使用），
因此它不属于本仓库的对外发布形态，可以被整体摘除。目录不存在时相关用例跳过，
只对仓库自带脚本（`scripts/`）生效的用例始终执行。
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / "extensions" / "beav-capture"
MANIFEST = CAPTURE / "manifest.json"

requires_capture = pytest.mark.skipif(
    not CAPTURE.is_dir(),
    reason="发布形态不含 extensions/beav-capture（上游 MIT-NC，仅个人本机）",
)


@requires_capture
def test_manifest_cannot_inject_every_site_or_attach_debugger():
    data = json.loads(MANIFEST.read_text(encoding="utf-8-sig"))
    assert "debugger" not in data.get("permissions", [])
    assert "<all_urls>" not in data.get("host_permissions", [])
    for script in data.get("content_scripts") or []:
        assert "<all_urls>" not in (script.get("matches") or [])
        joined = " ".join(script.get("matches") or [])
        assert "grok.com" not in joined
        assert "xiaohongshu.com" in joined or "rednote.com" in joined


@requires_capture
def test_grok_guard_present_in_injected_scripts():
    observer = (CAPTURE / "pageObserver.js").read_text(encoding="utf-8")
    overlay = (CAPTURE / "browserControlContent.js").read_text(encoding="utf-8")
    assert "grok" in observer and "chatgpt" in observer
    assert "grok" in overlay and "chatgpt" in overlay


@requires_capture
def test_beav_cloud_endpoints_stay_disabled():
    """Easel 副本禁止回连 Beav 云：更新源与遥测端点必须为空常量。"""
    data = json.loads(MANIFEST.read_text(encoding="utf-8-sig"))
    assert not any("ziz.hk" in origin for origin in data.get("host_permissions", []))
    text = (CAPTURE / "background.js").read_text(encoding="utf-8")
    assert 'var PLUGIN_FEEDBACK_ENDPOINT = "";' in text
    assert 'var UPDATE_SOURCE_API_URL = "";' in text
    assert 'var UPDATE_SOURCE_DOWNLOAD_URL = "";' in text
    assert "https://redbox.ziz.hk" not in text
    assert "https://api.ziz.hk" not in text


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


@requires_capture
def test_service_worker_checks_native_connect_last_error():
    text = (CAPTURE / "background.js").read_text(encoding="utf-8")
    assert "chrome.runtime.connectNative(hostName)" in text
    assert "chrome.runtime.lastError?.message" in text
    assert "await connectNativeTransport2({ silent: true })" not in text
    assert "if (!chrome.history?.search)" in text
    assert "if (!chrome.bookmarks)" in text
    assert "chrome.webNavigation?.getAllFrames" in text
    assert 'pluginWarn("healthcheck-failed"' in text
    assert 'pluginError("healthcheck-failed"' not in text
    assert "easelShortError" in text
    assert 'console.log("[easel-sw]"' in text
    assert "event.preventDefault()" in text


def test_native_host_installer_uses_ascii_exe_launcher():
    text = (ROOT / "scripts" / "install_beav_native_host.ps1").read_text(encoding="utf-8")
    assert r"easel-native-host" in text
    assert "LOCALAPPDATA" in text
    assert "Test-AsciiPath" in text
    assert "com.redbox.browser_control" in text
    assert "host.exe" in text
    assert "beav_native_host_stub.go" in text
    assert r".runtime\beav-native-host.cmd" not in text
    assert "UTF8Encoding]::new($false)" in text
    stub = (ROOT / "scripts" / "beav_native_host_stub.go").read_text(encoding="utf-8")
    assert "cmd.Stdin = os.Stdin" in stub
    assert "cmd.Stdout = os.Stdout" in stub
