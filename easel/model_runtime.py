"""7870 对话模型：官方 Codex 订阅目录 + OpenClaw --model。

移植自 7860 `easel/runtime.py` 的订阅/目录/档案部分，profile 改为 `easel`。
不引入 PA 的 API 适配器，不读 API Key。
"""
from __future__ import annotations

import json
import os
import queue
import shutil
import subprocess
import tempfile
import threading
import time
from pathlib import Path

from easel.openclaw_cmd import openclaw_base_cmd

ROOT = Path(__file__).resolve().parents[1]
PROFILE = "easel"
CONFIG_FILE = Path.home() / f".openclaw-{PROFILE}/openclaw.json"
STATE = ROOT / ".runtime"
SETTINGS_FILE = STATE / "model-settings.json"
CREATE_FLAGS = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
DEFAULT_MODEL = "gpt-5.6-luna"
DEFAULT_EFFORT = "low"
_rpc_lock = threading.Lock()
_json_write_lock = threading.Lock()
_catalog_cache: tuple[float, list] = (0, [])


def openclaw_command() -> list[str]:
    return openclaw_base_cmd()


def codex_command() -> list[str]:
    if os.name == "nt":
        entry = Path(os.environ.get("APPDATA", "")) / "npm/node_modules/@openai/codex/bin/codex.js"
        if entry.is_file():
            return [openclaw_command()[0], str(entry)]
        candidate = Path(os.environ.get("LOCALAPPDATA", "")) / "OpenAI/Codex/bin/codex.exe"
        if candidate.is_file():
            return [str(candidate)]
    executable = shutil.which("codex")
    if executable:
        return [executable]
    raise RuntimeError("未找到官方 Codex CLI。")


def runtime_env() -> dict[str, str]:
    env = os.environ.copy()
    extra = [
        str(ROOT / ".venv" / ("Scripts" if os.name == "nt" else "bin")),
        str(ROOT / ".runtime" / "node_modules" / "node" / "bin"),
        str(ROOT.parent / "Easel" / ".runtime" / "node_modules" / "node" / "bin"),
        env.get("PATH", ""),
    ]
    env["PATH"] = os.pathsep.join(p for p in extra if p)
    env["PYTHONUTF8"] = "1"
    env["EASEL_ROOT"] = str(ROOT)
    env["NO_COLOR"] = "1"
    env["NO_PROXY"] = ",".join(filter(None, [env.get("NO_PROXY", ""), "localhost", "127.0.0.1", "::1"]))
    env["no_proxy"] = env["NO_PROXY"]
    for key in ("OPENAI_API_KEY", "CODEX_API_KEY", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"):
        env.pop(key, None)
    return env


def default_settings() -> dict:
    return {
        "active_id": "daily",
        "profiles": [{
            "id": "daily",
            "name": "日常创作",
            "model": DEFAULT_MODEL,
            "reasoning_effort": DEFAULT_EFFORT,
        }],
    }


def read_settings() -> dict:
    if SETTINGS_FILE.is_file():
        return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    return default_settings()


def active_profile() -> dict:
    settings = read_settings()
    return next(p for p in settings["profiles"] if p["id"] == settings["active_id"])


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, prefix=path.name + ".", suffix=".tmp", delete=False) as output:
        temp = Path(output.name)
        json.dump(data, output, ensure_ascii=False, indent=2)
        output.write("\n")
    try:
        with _json_write_lock:
            temp.replace(path)
    finally:
        temp.unlink(missing_ok=True)


def apply_openclaw_models(settings: dict) -> None:
    """把档案写进 OpenClaw：primary + 每个型号的 Codex runtime。"""
    if not CONFIG_FILE.is_file():
        raise RuntimeError("未找到 OpenClaw 配置，请先启动 7870 网关。")
    config = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    defaults = config.setdefault("agents", {}).setdefault("defaults", {})
    active = next(p for p in settings["profiles"] if p["id"] == settings["active_id"])
    defaults["model"] = {"primary": "openai/" + active["model"]}
    models = defaults.setdefault("models", {})
    allow = defaults.setdefault("modelPolicy", {}).setdefault("allow", [])
    for profile in settings["profiles"]:
        key = "openai/" + profile["model"]
        models[key] = {"agentRuntime": {"id": "codex"}}
        if key not in allow:
            allow.append(key)
    write_json(CONFIG_FILE, config)


def agent_options() -> list[str]:
    profile = active_profile()
    thinking = (os.environ.get("EASEL_THINKING_LEVEL") or "").strip() or profile.get("reasoning_effort", DEFAULT_EFFORT)
    return ["--model", "openai/" + profile["model"], "--thinking", thinking]


def codex_rpc(methods: list[tuple[str, dict]], timeout: float = 20) -> list[dict]:
    with _rpc_lock:
        process = subprocess.Popen(
            codex_command() + ["app-server", "--listen", "stdio://"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", env=runtime_env(),
            creationflags=CREATE_FLAGS, cwd=str(STATE),
        )
        inbox: queue.Queue = queue.Queue()

        def reader() -> None:
            for line in process.stdout:
                try:
                    inbox.put(json.loads(line))
                except json.JSONDecodeError:
                    continue
            inbox.put(None)

        threading.Thread(target=reader, daemon=True).start()
        deadline = time.monotonic() + timeout

        def send(payload: dict) -> None:
            process.stdin.write(json.dumps(payload) + "\n")
            process.stdin.flush()

        def response(identifier: int) -> dict:
            while True:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise TimeoutError("Codex 状态读取超时。")
                try:
                    value = inbox.get(timeout=remaining)
                except queue.Empty as exc:
                    raise TimeoutError("Codex 状态读取超时。") from exc
                if value is None:
                    detail = process.stderr.read()[-1500:]
                    raise RuntimeError("Codex 状态连接提前关闭：" + detail)
                if value.get("id") == identifier:
                    if "error" in value:
                        raise RuntimeError(value["error"].get("message", "Codex RPC 失败"))
                    return value["result"]

        try:
            send({"id": 1, "method": "initialize", "params": {"clientInfo": {"name": "easel_status", "version": "1.0.0"}, "capabilities": {}}})
            response(1)
            send({"method": "initialized", "params": {}})
            results = []
            for identifier, (method, params) in enumerate(methods, 2):
                send({"id": identifier, "method": method, "params": params})
                results.append(response(identifier))
            return results
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


def model_catalog(refresh: bool = False) -> list[dict]:
    global _catalog_cache
    if not refresh and time.monotonic() - _catalog_cache[0] < 300:
        return _catalog_cache[1]
    result = codex_rpc([("model/list", {"includeHidden": False, "limit": 100})])[0]
    models = result.get("data", [])
    if not models:
        raise RuntimeError("当前 Codex 账号未返回可用模型。")
    _catalog_cache = (time.monotonic(), models)
    return models


def subscription_status() -> dict:
    account, usage = codex_rpc([("account/read", {"refreshToken": False}), ("account/rateLimits/read", {})])
    account = account.get("account") or {}
    limits = (usage.get("rateLimitsByLimitId") or {}).get("codex") or usage.get("rateLimits") or {}
    weekly = next((limits.get(k) for k in ("primary", "secondary") if (limits.get(k) or {}).get("windowDurationMins") == 10080), None)
    used = weekly.get("usedPercent") if weekly else None
    remaining = min(100, max(0, 100 - used)) if isinstance(used, (int, float)) else None
    return {
        "logged_in": account.get("type") == "chatgpt",
        "plan": account.get("planType"),
        "weekly_remaining": remaining,
        "resets_at": weekly.get("resetsAt") if weekly else None,
        "stop_reason": None,
        "checked_at": time.time(),
    }


def require_subscription() -> dict:
    account = (codex_rpc([("account/read", {"refreshToken": False})])[0].get("account") or {})
    if account.get("type") != "chatgpt":
        raise RuntimeError("请先通过官方 Codex 登录 ChatGPT。")
    return {"logged_in": True, "plan": account.get("planType")}


def agent_reply(stdout: str) -> str:
    try:
        response = json.loads(stdout)
        if response.get("status") not in (None, "ok"):
            raise RuntimeError("Agent 未完成：" + str(response.get("summary") or response.get("status")))
        result = response.get("result") or response
        if result.get("meta", {}).get("aborted"):
            raise RuntimeError("Agent 已中止。")
        payloads = result["payloads"]
        reply = "\n\n".join(p.get("text", "") for p in payloads if p.get("text")).strip()
        if not reply:
            raise RuntimeError("Agent 未返回完成内容，请查看运行日志。")
        return reply
    except (ValueError, KeyError, AttributeError, TypeError) as exc:
        raise RuntimeError("Agent 返回格式异常，请查看运行日志。") from exc


def run_agent_command(command: list[str], timeout: float) -> subprocess.CompletedProcess:
    require_subscription()
    process = subprocess.Popen(
        command, cwd=ROOT, env=runtime_env(),
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", creationflags=CREATE_FLAGS,
    )
    try:
        stdout, stderr = process.communicate(timeout=timeout)
        return subprocess.CompletedProcess(command, process.returncode, stdout, stderr)
    except subprocess.TimeoutExpired:
        process.kill()
        process.communicate(timeout=5)
        raise
