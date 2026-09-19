"""登录状态协议：子进程异常时把日志原因回给前端；窗口扫码态不算失败。"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "web"))
sys.path.insert(0, str(PROJECT_ROOT / "skills" / "shared" / "scripts"))

import app as web  # noqa: E402
import login_state  # noqa: E402


def test_login_state_accepts_window_login(tmp_path):
    path = tmp_path / "xiaohongshu.json"
    login_state.write_status(str(path), "window_login", "请在弹出的浏览器窗口里扫码")
    data = login_state.read_status(str(path))
    assert data["state"] == "window_login"
    assert "弹出" in data["message"]


def test_login_state_unknown_when_file_missing(tmp_path):
    data = login_state.read_status(str(tmp_path / "missing.json"))
    assert data["state"] == "unknown"


def test_login_log_hint_extracts_risk_ip(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    (tmp_path / "xiaohongshu.log").write_text(
        "INFO start\nERROR: 小红书判定当前网络为风险 IP（安全限制 300012）\n",
        encoding="utf-8",
    )
    assert "300012" in web._login_log_hint("xiaohongshu")


def test_login_log_hint_empty_when_no_log(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    assert web._login_log_hint("xiaohongshu") == ""


def test_login_status_dead_process_uses_log_not_generic_starting(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    (tmp_path / "xiaohongshu.json").write_text(
        json.dumps({"state": "starting", "message": ""}), encoding="utf-8")
    (tmp_path / "xiaohongshu.log").write_text(
        "ERROR: TimeoutError: Page.goto\n", encoding="utf-8")
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {
        "xiaohongshu": SimpleNamespace(poll=lambda: 1),
    })
    status = web._login_status("xiaohongshu")
    assert status["state"] == "error"
    assert "TimeoutError" in status["message"]


def test_login_status_dead_process_during_window_login(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    (tmp_path / "xiaohongshu.json").write_text(
        json.dumps({"state": "window_login", "message": "请扫码"}), encoding="utf-8")
    (tmp_path / "xiaohongshu.log").write_text(
        "ERROR: 打不开小红书页面 TimeoutError\n", encoding="utf-8")
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {
        "xiaohongshu": SimpleNamespace(poll=lambda: 1),
    })
    status = web._login_status("xiaohongshu")
    assert status["state"] == "error"
    assert "TimeoutError" in status["message"] or "打不开小红书" in status["message"]


def test_login_status_alive_process_keeps_window_login(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    (tmp_path / "xiaohongshu.json").write_text(
        json.dumps({"state": "window_login", "message": "请扫码"}), encoding="utf-8")
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {
        "xiaohongshu": SimpleNamespace(poll=lambda: None),
    })
    status = web._login_status("xiaohongshu")
    assert status["state"] == "window_login"


def test_login_status_success_not_overwritten_when_process_exited_zero(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    (tmp_path / "xiaohongshu.json").write_text(
        json.dumps({"state": "success", "message": "登录成功"}), encoding="utf-8")
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {
        "xiaohongshu": SimpleNamespace(poll=lambda: 0),
    })
    status = web._login_status("xiaohongshu")
    assert status["state"] == "success"


def test_login_log_hint_playwright_error_prefix(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    (tmp_path / "xiaohongshu.log").write_text(
        "Error: Timeout 30000ms exceeded.\n", encoding="utf-8")
    assert "Timeout" in web._login_log_hint("xiaohongshu")


def test_login_status_stale_window_login_without_process(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {})
    monkeypatch.setattr(web, "_LOGIN_PENDING", set())
    (tmp_path / "xiaohongshu.json").write_text(
        json.dumps({"state": "window_login", "message": "请扫码"}), encoding="utf-8")
    status = web._login_status("xiaohongshu")
    assert status["state"] == "error"
    assert "中断" in status["message"] or "重启" in status["message"]
    written = json.loads((tmp_path / "xiaohongshu.json").read_text(encoding="utf-8"))
    assert written["state"] == "error"


def test_login_status_success_survives_empty_process_table(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {})
    monkeypatch.setattr(web, "_LOGIN_PENDING", set())
    (tmp_path / "xiaohongshu.json").write_text(
        json.dumps({"state": "success", "message": "登录成功"}), encoding="utf-8")
    assert web._login_status("xiaohongshu")["state"] == "success"


def test_login_status_missing_file_without_process_stays_unknown(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {})
    monkeypatch.setattr(web, "_LOGIN_PENDING", set())
    status = web._login_status("xiaohongshu")
    assert status["state"] == "unknown"


def test_try_begin_login_rejects_second(monkeypatch):
    monkeypatch.setattr(web, "_LOGIN_PENDING", set())
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {})
    assert web._try_begin_login("xiaohongshu") is True
    assert web._try_begin_login("xiaohongshu") is False
    web._release_login_claim("xiaohongshu")
    assert web._try_begin_login("xiaohongshu") is True
    web._release_login_claim("xiaohongshu")


def test_try_begin_login_rejects_when_proc_alive(monkeypatch):
    monkeypatch.setattr(web, "_LOGIN_PENDING", set())
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {
        "xiaohongshu": SimpleNamespace(poll=lambda: None),
    })
    assert web._try_begin_login("xiaohongshu") is False


def test_whoami_begin_is_exclusive():
    web._whoami_end("xiaohongshu")
    try:
        assert web._whoami_begin("xiaohongshu") is True
        assert web._whoami_begin("xiaohongshu") is False
        assert web._whoami_busy("xiaohongshu") is True
        web._whoami_end("xiaohongshu")
        assert web._whoami_busy("xiaohongshu") is False
        assert web._whoami_begin("xiaohongshu") is True
    finally:
        web._whoami_end("xiaohongshu")


def test_login_status_wechat_oa_reads_mp_files(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {
        "wechat-oa-mp": SimpleNamespace(poll=lambda: None),
    })
    monkeypatch.setattr(web, "_LOGIN_PENDING", set())
    (tmp_path / "wechat-oa-mp.json").write_text(
        json.dumps({"state": "window_login", "message": "请扫码"}), encoding="utf-8")
    (tmp_path / "wechat-oa-mp.png").write_bytes(b"png")
    data = web._login_status("wechat-oa")
    assert data["state"] == "window_login"
    assert data["qr"] == "_login/wechat-oa-mp.png"


def test_mp_login_stale_window_login_after_restart_is_error(tmp_path, monkeypatch):
    monkeypatch.setattr(web, "LOGIN_DIR", tmp_path)
    monkeypatch.setattr(web, "LOGIN_PROCESSES", {})
    monkeypatch.setattr(web, "_LOGIN_PENDING", set())
    (tmp_path / "wechat-oa-mp.json").write_text(
        json.dumps({"state": "window_login", "message": "请扫码"}), encoding="utf-8")
    data = web._mp_login_status()
    assert data["state"] == "error"
    assert "中断" in data["message"]


def test_wechat_oa_logged_in_is_mp_session_not_appid(monkeypatch):
    """只填 AppID 不能把账号页/发布页标成已登录，否则会藏掉扫码入口，发布再 400。"""
    cfg = web.LOGIN_RUNNERS["wechat-oa"]
    monkeypatch.setattr(web, "_wechat_has_credentials", lambda: True)
    monkeypatch.setattr(web, "_mp_login_status", lambda: {"state": "unknown"})
    assert web._account_logged_in("wechat-oa", cfg) is False
    monkeypatch.setattr(web, "_mp_login_status", lambda: {"state": "success"})
    assert web._account_logged_in("wechat-oa", cfg) is True
    monkeypatch.setattr(web, "_wechat_has_credentials", lambda: False)
    assert web._account_logged_in("wechat-oa", cfg) is True


def test_platforms_list_has_wechat_oa_not_duplicate_wechat():
    from fastapi.testclient import TestClient
    client = TestClient(web.app, base_url="http://127.0.0.1:7860", client=("127.0.0.1", 9))
    body = client.get("/api/platforms").json()
    rows = body["platforms"]
    ids = [x.get("id") for x in rows]
    assert "wechat-oa" in ids
    assert ids.count("wechat") == 0
    assert "postiz" in ids
    oa = next(x for x in rows if x["id"] == "wechat-oa")
    assert oa["backend"] == "wechat-oa"
    assert oa["authKind"] == "qrcode"
