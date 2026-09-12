"""Local WeChat publishing service.

The skill under ``skills/openclaw/skill-wechat-publisher`` owns the WeChat
implementation.  This module only validates local inputs, keeps the small
amount of Easel state, and invokes the skill in a fresh process.  A fresh
process is intentional: the skill keeps the selected account and token cache
in module globals.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import threading
import time
from datetime import date as date_type
from pathlib import Path
from typing import Any

import yaml

from easel.runtime import CREATE_FLAGS, ROOT, runtime_env


SKILL_ROOT = ROOT / "skills" / "openclaw" / "skill-wechat-publisher"
SKILL_CONFIG = SKILL_ROOT / "wechat-publisher.yaml"
WORKER = ROOT / "scripts" / "wechat_worker.py"
OUTPUTS_DIR = ROOT / "outputs"
STATE_FILE = ROOT / ".runtime" / "wechat-state.json"
_STATE_LOCK = threading.Lock()

_ACCOUNT_KEY = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_PUBLIC_MEDIA_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}


class WechatError(RuntimeError):
    """A safe, user-facing error from the local WeChat service."""


def sanitize_error(value: Any) -> str:
    """Remove request URLs and credential-shaped query values from errors."""
    text = str(value or "").replace("\r", " ").replace("\n", " ").strip()
    text = re.sub(r"https?://[^\s\"'<>]+", "[已隐藏请求地址]", text, flags=re.IGNORECASE)
    text = re.sub(
        r"(?i)(access[_-]?token|app[_-]?secret|secret|password|token)=([^&\s,;]+)",
        r"\1=[已隐藏]",
        text,
    )
    return text[:500] or "微信操作失败。"


def _safe_account_key(value: str) -> str:
    value = str(value or "").strip()
    if not _ACCOUNT_KEY.fullmatch(value):
        raise WechatError("账号标识只能包含字母、数字、下划线或连字符。")
    return value


def _load_config() -> dict[str, Any]:
    if not SKILL_CONFIG.is_file():
        return {}
    try:
        loaded = yaml.safe_load(SKILL_CONFIG.read_text(encoding="utf-8"))
    except Exception as exc:
        raise WechatError("公众号配置文件无法读取，请检查 YAML 格式。") from exc
    return loaded if isinstance(loaded, dict) else {}


def _account_map(config: dict[str, Any]) -> dict[str, dict[str, Any]]:
    accounts = config.get("accounts")
    if not isinstance(accounts, dict):
        return {}
    return {str(key): value for key, value in accounts.items() if isinstance(value, dict)}


def _state_template() -> dict[str, Any]:
    return {"history": {}, "analytics": {}}


def _load_state() -> dict[str, Any]:
    if not STATE_FILE.is_file():
        return _state_template()
    try:
        loaded = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise WechatError("公众号本地状态无法读取：" + sanitize_error(exc)) from exc
    if not isinstance(loaded, dict):
        return _state_template()
    loaded.setdefault("history", {})
    loaded.setdefault("analytics", {})
    if not isinstance(loaded["history"], dict):
        loaded["history"] = {}
    if not isinstance(loaded["analytics"], dict):
        loaded["analytics"] = {}
    return loaded


def _write_state(state: dict[str, Any]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = STATE_FILE.with_suffix(STATE_FILE.suffix + ".tmp")
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    try:
        temporary.replace(STATE_FILE)
    finally:
        temporary.unlink(missing_ok=True)


def _public_output_path(path: Path) -> str:
    return path.resolve().relative_to(OUTPUTS_DIR.resolve()).as_posix()


def safe_output_file(value: str, suffixes: set[str] | None = None) -> Path:
    """Resolve a user-supplied content-library path without leaving outputs."""
    raw = str(value or "").strip()
    if not raw or "\x00" in raw:
        raise WechatError("请选择内容库中的成品文件。")
    path = Path(raw)
    if path.is_absolute() or (len(raw) > 1 and raw[1] == ":"):
        raise WechatError("只接受内容库内的相对路径。")
    parts = list(path.parts)
    if parts and parts[0].lower() == "outputs":
        parts = parts[1:]
    if not parts or any(part in {"", ".", ".."} for part in parts):
        raise WechatError("成品路径不安全。")
    if parts[0].startswith(("_", ".")) or parts[0].lower() in {"analytics", "wechat"}:
        raise WechatError("该文件属于系统数据，不能用于公众号发布。")
    candidate = (OUTPUTS_DIR.joinpath(*parts)).resolve()
    try:
        candidate.relative_to(OUTPUTS_DIR.resolve())
    except ValueError as exc:
        raise WechatError("成品路径不安全。") from exc
    if not candidate.is_file():
        raise WechatError("成品文件不存在。")
    if suffixes is not None and candidate.suffix.lower() not in suffixes:
        raise WechatError("文件类型不符合公众号草稿要求。")
    return candidate


def _worker_error(result: dict[str, Any]) -> WechatError:
    error = result.get("error")
    if isinstance(error, dict):
        code = error.get("code")
        message = sanitize_error(error.get("message") or "微信操作失败。")
        if code is not None:
            return WechatError(f"[{code}] {message}")
        return WechatError(message)
    return WechatError(sanitize_error(result.get("message") or "微信操作失败。"))


def run_worker(payload: dict[str, Any], timeout: float = 120) -> dict[str, Any]:
    """Run one isolated skill operation using stdin JSON only."""
    if not WORKER.is_file():
        raise WechatError("公众号发布组件缺失。")
    encoded = json.dumps(payload, ensure_ascii=False)
    env = runtime_env()
    env["PYTHONUTF8"] = "1"
    try:
        completed = subprocess.run(
            [sys.executable, str(WORKER)],
            input=encoded,
            text=True,
            encoding="utf-8",
            capture_output=True,
            cwd=str(ROOT),
            env=env,
            timeout=timeout,
            creationflags=CREATE_FLAGS,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise WechatError("公众号操作超时，请稍后重试。") from exc
    except OSError as exc:
        raise WechatError("公众号组件启动失败：" + sanitize_error(exc)) from exc

    response: dict[str, Any] | None = None
    for line in reversed((completed.stdout or "").splitlines()):
        try:
            candidate = json.loads(line)
        except (TypeError, ValueError):
            continue
        if isinstance(candidate, dict):
            response = candidate
            break
    if response is None:
        detail = "公众号组件未返回结构化结果。"
        raise WechatError(detail)
    if completed.returncode and response.get("ok") is not True:
        raise _worker_error(response)
    if response.get("ok") is False:
        raise _worker_error(response)
    return response


def dashboard() -> dict[str, Any]:
    """Read local account metadata and non-secret local history."""
    config = _load_config()
    accounts = []
    for key, account in _account_map(config).items():
        app_id = str(account.get("app_id") or "")
        secret = str(account.get("app_secret") or "")
        accounts.append({
            "key": key,
            "name": str(account.get("name") or key),
            "app_id": app_id,
            "configured": bool(app_id and secret),
        })
    state = _load_state()
    history = []
    for records in state.get("history", {}).values():
        if isinstance(records, list):
            history.extend(record for record in records if isinstance(record, dict))
    analytics = []
    for account_snapshots in state.get("analytics", {}).values():
        if isinstance(account_snapshots, dict):
            analytics.extend(snapshot for snapshot in account_snapshots.values() if isinstance(snapshot, dict))
    history.sort(key=lambda item: str(item.get("created_at") or ""), reverse=True)
    analytics.sort(key=lambda item: str(item.get("date") or ""), reverse=True)
    default = config.get("default")
    account_keys = _account_map(config)
    return {
        "accounts": accounts,
        "default_account": str(default) if isinstance(default, str) and default in account_keys else None,
        "config_present": SKILL_CONFIG.is_file(),
        "history": history[:100],
        "analytics": analytics[:100],
    }


def save_account(
    key: str,
    name: str,
    app_id: str,
    app_secret: str | None = None,
    author: str | None = None,
) -> dict[str, Any]:
    """Update one account while preserving all unknown YAML fields/accounts."""
    key = _safe_account_key(key)
    name = str(name or "").strip()
    app_id = str(app_id or "").strip()
    if not name or not app_id:
        raise WechatError("账号名称和 app_id 不能为空。")
    config = _load_config()
    accounts = config.setdefault("accounts", {})
    if not isinstance(accounts, dict):
        raise WechatError("公众号配置中的 accounts 不是对象。")
    previous = accounts.get(key) if isinstance(accounts.get(key), dict) else {}
    supplied_secret = str(app_secret or "").strip()
    previous_id = str(previous.get("app_id") or "").strip()
    if not supplied_secret and previous and previous_id and previous_id != app_id:
        raise WechatError("更换 app_id 时必须同时填写新的 app_secret。")
    secret = supplied_secret or (str(previous.get("app_secret") or "") if previous_id == app_id else "")
    updated = dict(previous)
    updated.update({"name": name, "app_id": app_id, "app_secret": secret})
    if author is not None:
        updated["author"] = str(author).strip()
    accounts[key] = updated
    config["accounts"] = accounts
    if not config.get("default") and len(accounts) == 1:
        config["default"] = key
    SKILL_CONFIG.parent.mkdir(parents=True, exist_ok=True)
    temporary = SKILL_CONFIG.with_suffix(SKILL_CONFIG.suffix + ".tmp")
    temporary.write_text(yaml.safe_dump(config, allow_unicode=True, sort_keys=False), encoding="utf-8")
    try:
        temporary.replace(SKILL_CONFIG)
    finally:
        temporary.unlink(missing_ok=True)
    try:
        os.chmod(SKILL_CONFIG, 0o600)
    except OSError:
        pass
    if previous_id != app_id or str(previous.get("app_secret") or "") != secret:
        cache_name = ".token_cache.json" if key == "default" else f".token_cache_{key}.json"
        (SKILL_CONFIG.parent / "scripts" / cache_name).unlink(missing_ok=True)
    return dashboard()


def prepare_article(title: str, body: str, author: str | None = None, account: str | None = None) -> dict[str, str]:
    if not str(title or "").strip() or not str(body or "").strip():
        raise WechatError("标题和正文不能为空。")
    if account:
        _safe_account_key(account)
    result = run_worker({"op": "prepare", "title": title, "body": body, "author": author, "account": account})
    markdown_path = safe_output_file(result.get("markdown_path", ""), {".md", ".markdown"})
    html_path = safe_output_file(result.get("html_path", ""), {".html", ".htm"})
    return {"markdown_path": _public_output_path(markdown_path), "html_path": _public_output_path(html_path)}


def check_account(account: str) -> dict[str, Any]:
    account = _safe_account_key(account)
    return run_worker({"op": "check", "account": account})


def create_draft(
    account: str,
    markdown_path: str,
    cover_path: str,
    title: str,
    digest: str = "",
    author: str | None = None,
) -> dict[str, Any]:
    account = _safe_account_key(account)
    md = safe_output_file(markdown_path, {".md", ".markdown"})
    cover = safe_output_file(cover_path, _PUBLIC_MEDIA_SUFFIXES)
    if not str(title or "").strip():
        raise WechatError("草稿标题不能为空。")
    result = run_worker({
        "op": "draft",
        "account": account,
        "markdown_path": str(md),
        "cover_path": str(cover),
        "title": title,
        "digest": digest or "",
        "author": author,
    })
    media_id = result.get("media_id")
    if not isinstance(media_id, str) or not media_id.strip():
        raise WechatError("微信未返回有效的草稿 media_id。")
    receipt = {
        "account": account,
        "title": str(title),
        "digest": str(digest or "")[:120],
        "author": str(author or ""),
        "media_id": media_id,
        "markdown_path": _public_output_path(md),
        "cover_path": _public_output_path(cover),
        "status": "draft_created",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    with _STATE_LOCK:
        state = _load_state()
        state["history"].setdefault(account, []).append(receipt)
        _write_state(state)
    return {"media_id": media_id, "status": "draft_created", "account": account, "receipt": receipt}


def analytics(account: str, when: str) -> dict[str, Any]:
    account = _safe_account_key(account)
    when = str(when or "").strip()
    if not _DATE.fullmatch(when):
        raise WechatError("日期必须是 YYYY-MM-DD。")
    try:
        date_type.fromisoformat(when)
    except ValueError as exc:
        raise WechatError("日期不是有效的日历日期。") from exc
    result = run_worker({"op": "analytics", "account": account, "date": when}, timeout=180)
    snapshot = {"account": account, "date": when, "results": result.get("results", {})}
    with _STATE_LOCK:
        state = _load_state()
        state["analytics"].setdefault(account, {})[when] = snapshot
        _write_state(state)
    return snapshot



def onboard(account: str) -> dict[str, Any]:
    account = _safe_account_key(account)
    result = run_worker({"op": "onboard", "account": account}, timeout=180)
    snapshot = {key: result.get(key) for key in ("account", "collected_at", "articles", "analytics", "missing", "evidence_count", "prompt")}
    with _STATE_LOCK:
        state = _load_state()
        state.setdefault("onboarding", {})[account] = snapshot
        _write_state(state)
    return snapshot
