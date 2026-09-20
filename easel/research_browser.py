"""调研采集用的独立 Cloak 调试浏览器。不占用小红书登录档案。"""
from __future__ import annotations

import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".runtime"
CREATE_FLAGS = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
CLOAK_PORT = 9345
CLOAK_PROFILE = STATE / "cloak-research-profile"


def runtime_env() -> dict[str, str]:
    env = os.environ.copy()
    env.setdefault("PYTHONUTF8", "1")
    env.setdefault("EASEL_ROOT", str(ROOT))
    return env


def research_cdp_endpoint() -> str | None:
    if "EASEL_RESEARCH_CDP_URL" in os.environ:
        raw = os.environ["EASEL_RESEARCH_CDP_URL"].strip()
    else:
        config_path = STATE / "research-browser.json"
        if not config_path.exists():
            return None
        try:
            config = json.loads(config_path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            raise RuntimeError("research-browser.json 无法读取或 JSON 格式无效。") from exc
        if not isinstance(config, dict) or not isinstance(config.get("cdp_url"), str):
            raise RuntimeError("research-browser.json 必须包含字符串 cdp_url。")
        raw = config["cdp_url"].strip()
    if not raw:
        return None
    try:
        parsed = urlsplit(raw)
        valid = (
            parsed.scheme == "http"
            and parsed.hostname in ("127.0.0.1", "localhost", "::1")
            and parsed.port
            and not parsed.username
            and not parsed.password
            and parsed.path in ("", "/")
            and not parsed.query
            and not parsed.fragment
        )
    except ValueError:
        valid = False
    if not valid:
        raise RuntimeError("EASEL_RESEARCH_CDP_URL 必须是本机 loopback HTTP 调试端口地址。")
    return raw.rstrip("/")


def verify_research_cdp(endpoint: str) -> None:
    try:
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(
            endpoint + "/json/version", timeout=2
        ) as response:
            metadata = json.load(response)
            if response.status != 200 or not metadata.get("webSocketDebuggerUrl"):
                raise ValueError("missing debugger endpoint")
    except (OSError, ValueError, TypeError):
        raise RuntimeError(
            "指定的已有浏览器调试端口未就绪。未启动其他浏览器或迁移登录数据。"
        ) from None


def cloak_executable() -> Path:
    choices = sorted(
        (Path.home() / ".cloakbrowser").glob("chromium-*/chrome.exe"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not choices:
        raise RuntimeError("未找到已安装的 CloakBrowser。")
    return choices[0]


def _cloak_healthy() -> bool:
    try:
        verify_research_cdp(f"http://127.0.0.1:{CLOAK_PORT}")
        return True
    except RuntimeError:
        return False


def start(name: str) -> dict:
    if name != "cloak":
        raise ValueError("Unknown service")
    if _cloak_healthy():
        return {"service": name, "status": "running"}
    CLOAK_PROFILE.mkdir(parents=True, exist_ok=True)
    logs = STATE / "logs"
    logs.mkdir(parents=True, exist_ok=True)
    cmd = [
        str(cloak_executable()),
        "--headless=new",
        "--remote-debugging-address=127.0.0.1",
        f"--remote-debugging-port={CLOAK_PORT}",
        f"--user-data-dir={CLOAK_PROFILE}",
        "--no-first-run",
        "--disable-background-networking",
        "--disable-sync",
        "--disable-component-update",
        "about:blank",
    ]
    with (logs / "cloak-research.log").open("a", encoding="utf-8") as log:
        child = subprocess.Popen(
            cmd, cwd=ROOT, env=runtime_env(), stdout=log, stderr=log, creationflags=CREATE_FLAGS
        )
    for _ in range(40):
        if _cloak_healthy():
            return {"service": name, "status": "running", "pid": child.pid}
        if child.poll() is not None:
            break
        time.sleep(0.25)
    raise RuntimeError("调研浏览器启动失败。导入摘录仍可使用。")
