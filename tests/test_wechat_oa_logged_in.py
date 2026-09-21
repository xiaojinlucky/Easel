"""公众号账号页「已登录」只认后台扫码，填 AppID 不能冒充。"""
from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "web"))

import app as web  # noqa: E402


def test_wechat_oa_logged_in_is_mp_session_not_appid(monkeypatch):
    cfg = web.LOGIN_RUNNERS["wechat-oa"]
    monkeypatch.setattr(web, "_wechat_has_credentials", lambda: True)
    monkeypatch.setattr(web, "_mp_login_status", lambda: {"state": "unknown"})
    assert web._account_logged_in("wechat-oa", cfg) is False
    monkeypatch.setattr(web, "_mp_login_status", lambda: {"state": "success"})
    assert web._account_logged_in("wechat-oa", cfg) is True
    monkeypatch.setattr(web, "_wechat_has_credentials", lambda: False)
    assert web._account_logged_in("wechat-oa", cfg) is True


def test_save_credentials_does_not_stamp_login_success():
    src = Path(web.__file__).read_text(encoding="utf-8")
    start = src.index("async def api_save_credentials")
    end = src.index("\ndef _mp_login_status")
    body = src[start:end]
    assert "_write_login_marker" not in body
    assert "发布仍需" in body
