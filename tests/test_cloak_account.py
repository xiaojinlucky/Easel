import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "skills/shared/scripts"))
import cloak_account
import xhs_publish


def _playwright():
    chromium = SimpleNamespace(connect_over_cdp=Mock(), launch_persistent_context=Mock())
    return SimpleNamespace(chromium=chromium), chromium


def test_attach_tracks_only_pages_it_opens(monkeypatch):
    page = SimpleNamespace(close=Mock())
    context = SimpleNamespace(new_page=Mock(return_value=page))
    browser = SimpleNamespace(contexts=[context], close=Mock())
    pw, chromium = _playwright()
    chromium.connect_over_cdp.return_value = browser
    monkeypatch.setattr(cloak_account, "cdp_endpoint", lambda: "http://127.0.0.1:9345")
    session = cloak_account.open_account_context(
        pw, profile_base=None, profile_name="XiaohongshuProfile", headed=True)
    assert session.pages == []
    assert session.new_page() is page
    assert session.pages == [page]
    session.close()
    page.close.assert_called_once()
    browser.close.assert_not_called()
    chromium.launch_persistent_context.assert_not_called()
    chromium.connect_over_cdp.assert_called_once_with("http://127.0.0.1:9345")


def test_profile_base_stays_isolated_when_cdp_is_up(tmp_path, monkeypatch):
    monkeypatch.setattr(cloak_account, "cdp_endpoint", lambda: "http://127.0.0.1:9345")
    pw, chromium = _playwright()
    chromium.launch_persistent_context.return_value = "ctx"
    ctx = cloak_account.open_account_context(
        pw, profile_base=str(tmp_path), profile_name="ZhihuProfile", headed=False,
        extra_args=["--no-sandbox"])
    assert ctx == "ctx"
    chromium.connect_over_cdp.assert_not_called()
    args, kwargs = chromium.launch_persistent_context.call_args
    assert args[0] == str(tmp_path / "ZhihuProfile")
    assert "channel" not in kwargs
    assert kwargs["headless"] is True
    assert (tmp_path / "ZhihuProfile").is_dir()


def test_missing_executable_does_not_fall_back_to_chrome(monkeypatch):
    monkeypatch.setattr(cloak_account, "cdp_endpoint", lambda: None)
    monkeypatch.setattr(cloak_account, "canonical_profile", lambda: Path(r"D:\cloakbrowser\profile"))
    monkeypatch.setattr(cloak_account, "profile_in_use", lambda profile: False)
    monkeypatch.setattr(cloak_account, "executable", lambda: None)
    popen = Mock()
    monkeypatch.setattr(cloak_account.subprocess, "Popen", popen)
    pw, chromium = _playwright()
    with pytest.raises(cloak_account.CloakAccountError, match="不会改用 Chrome"):
        cloak_account.open_account_context(
            pw, profile_base=None, profile_name="XiaohongshuProfile", headed=True)
    popen.assert_not_called()
    chromium.launch_persistent_context.assert_not_called()
    chromium.connect_over_cdp.assert_not_called()


def test_open_profile_without_port_does_not_launch_a_second_browser(monkeypatch):
    monkeypatch.setattr(cloak_account, "cdp_endpoint", lambda: None)
    monkeypatch.setattr(cloak_account, "canonical_profile", lambda: Path(r"D:\cloakbrowser\profile"))
    monkeypatch.setattr(cloak_account, "profile_in_use", lambda profile: True)
    popen = Mock()
    monkeypatch.setattr(cloak_account.subprocess, "Popen", popen)
    pw, chromium = _playwright()
    with pytest.raises(cloak_account.CloakAccountError, match="不要改用 Chrome"):
        cloak_account.open_account_context(
            pw, profile_base=None, profile_name="XiaohongshuProfile", headed=True)
    popen.assert_not_called()
    chromium.launch_persistent_context.assert_not_called()


def test_whoami_does_not_launch_when_cloak_is_closed(monkeypatch):
    monkeypatch.setattr(cloak_account, "cdp_endpoint", lambda: None)
    popen = Mock()
    monkeypatch.setattr(cloak_account.subprocess, "Popen", popen)
    pw, chromium = _playwright()
    with pytest.raises(cloak_account.CloakAccountError, match="不要用 Chrome"):
        cloak_account.open_account_context(
            pw, profile_base=None, profile_name="XiaohongshuProfile", headed=False,
            allow_launch=False)
    popen.assert_not_called()
    chromium.connect_over_cdp.assert_not_called()


def test_login_starts_the_desktop_shortcut_then_attaches(tmp_path, monkeypatch):
    profile = tmp_path / "profile"
    profile.mkdir()
    exe = tmp_path / "chrome.exe"
    exe.write_text("x", encoding="utf-8")
    calls = {"n": 0}

    def endpoint():
        calls["n"] += 1
        return None if calls["n"] == 1 else "http://127.0.0.1:9345"

    context = SimpleNamespace(new_page=Mock())
    browser = SimpleNamespace(contexts=[context], close=Mock())
    pw, chromium = _playwright()
    chromium.connect_over_cdp.return_value = browser
    monkeypatch.setattr(cloak_account, "cdp_endpoint", endpoint)
    monkeypatch.setattr(cloak_account, "canonical_profile", lambda: profile)
    monkeypatch.setattr(cloak_account, "profile_in_use", lambda path: False)
    monkeypatch.setattr(cloak_account, "executable", lambda: exe)
    popen = Mock()
    monkeypatch.setattr(cloak_account.subprocess, "Popen", popen)
    cloak_account.open_account_context(
        pw, profile_base=None, profile_name="XiaohongshuProfile", headed=True, allow_launch=True)
    cmd = popen.call_args.args[0]
    assert f"--user-data-dir={profile}" in cmd
    assert "--remote-debugging-port=9345" in cmd
    assert "--remote-debugging-address=127.0.0.1" in cmd
    chromium.launch_persistent_context.assert_not_called()
    chromium.connect_over_cdp.assert_called_once_with("http://127.0.0.1:9345")


def test_stale_lock_cleanup_never_touches_the_desktop_profile(tmp_path, monkeypatch):
    desktop = tmp_path / "profile"
    desktop.mkdir()
    keep = desktop / "SingletonLock"
    keep.write_text("busy", encoding="utf-8")
    other = tmp_path / "other"
    other.mkdir()
    drop = other / "SingletonLock"
    drop.write_text("old", encoding="utf-8")
    monkeypatch.setattr(cloak_account, "canonical_profile", lambda: desktop)
    xhs_publish._clear_stale_chrome_locks(desktop)
    xhs_publish._clear_stale_chrome_locks(other)
    assert keep.exists()
    assert not drop.exists()
