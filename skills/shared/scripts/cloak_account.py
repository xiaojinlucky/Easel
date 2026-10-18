"""把账号登录接到用户已经在用的桌面 CloakBrowser。

不要另开 Google Chrome，不要另建一份小红书登录目录。同一账号再扫一次，会把 Cloak 里的登录挤掉。
出卡片、转文档用的无头浏览器不走这里。

桌面快捷方式（2026-10-19 核对）：
  D:\\cloakbrowser\\binaries\\chromium-146.0.7680.177.5\\chrome.exe
  --user-data-dir=D:\\cloakbrowser\\profile
  --remote-debugging-port=9345
"""
from __future__ import annotations

import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

DEFAULT_PROFILE = Path(r"D:\cloakbrowser\profile")
CDP_PORT = 9345


class CloakAccountError(RuntimeError):
    pass


class CloakSession:
    """已连上的 Cloak。close() 只关本次打开的标签，不关掉用户的浏览器。"""

    def __init__(self, context, created: list):
        self._context = context
        self._created = created

    @property
    def pages(self):
        return list(self._created)

    def new_page(self, *args, **kwargs):
        page = self._context.new_page(*args, **kwargs)
        self._created.append(page)
        return page

    def close(self):
        for page in list(self._created):
            try:
                page.close()
            except Exception:
                pass
        self._created.clear()

    def __getattr__(self, name):
        return getattr(self._context, name)


def canonical_profile() -> Path:
    override = os.environ.get("EASEL_CLOAK_PROFILE", "").strip()
    path = Path(override).expanduser() if override else DEFAULT_PROFILE
    if not path.is_dir():
        raise CloakAccountError(
            f"没找到 Cloak 的登录目录 {path}。工作台不会另建空目录，也不会改用 Chrome。")
    return path


def executable() -> Path | None:
    override = os.environ.get("EASEL_CLOAK_BROWSER", "").strip()
    if override:
        path = Path(override).expanduser()
        return path if path.is_file() else None
    found: list[Path] = []
    for root in (Path(r"D:\cloakbrowser\binaries"), Path.home() / ".cloakbrowser"):
        if root.is_dir():
            found.extend(item for item in root.glob("chromium-*/chrome.exe") if item.is_file())
    desktop = [item for item in found if str(item).lower().startswith(r"d:\cloakbrowser")]
    pool = desktop or found
    if not pool:
        return None
    return sorted(pool, key=lambda item: item.stat().st_mtime, reverse=True)[0]


def _loopback(url: str) -> bool:
    try:
        parsed = urlsplit(url)
    except ValueError:
        return False
    return (parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost"}
            and parsed.port and not parsed.username and not parsed.password
            and parsed.path in {"", "/"} and not parsed.query and not parsed.fragment)


def _debugger_ready(url: str) -> bool:
    if not _loopback(url):
        return False
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(url.rstrip("/") + "/json/version", timeout=1.5) as response:
            if response.status != 200:
                return False
            data = json.loads(response.read().decode("utf-8", "replace"))
    except (OSError, ValueError, TypeError):
        return False
    return isinstance(data, dict) and bool(data.get("webSocketDebuggerUrl"))


def cdp_endpoint() -> str | None:
    raw = os.environ.get("EASEL_CLOAK_CDP", "").strip()
    if raw.lower() in {"0", "off", "false"}:
        return None
    if raw:
        return raw.rstrip("/") if _debugger_ready(raw) else None
    url = f"http://127.0.0.1:{CDP_PORT}"
    return url if _debugger_ready(url) else None


def profile_in_use(profile: Path) -> bool:
    needle = str(profile).lower()
    if os.name != "nt":
        return (profile / "SingletonLock").exists()
    try:
        out = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "Get-CimInstance Win32_Process -Filter \"Name = 'chrome.exe'\" "
             "| Select-Object -ExpandProperty CommandLine"],
            capture_output=True, text=True, timeout=20,
            encoding="utf-8", errors="replace",
        )
    except (OSError, subprocess.TimeoutExpired):
        return (profile / "SingletonLock").exists()
    return needle in (out.stdout or "").lower()


def _drop_stale_singleton(profile: Path) -> None:
    for name in ("SingletonLock", "SingletonCookie", "SingletonSocket"):
        try:
            (profile / name).unlink()
        except OSError:
            pass


def start_cloak() -> None:
    """按桌面快捷方式把 Cloak 拉起来。已在跑就不再开第二个。"""
    profile = canonical_profile()
    if profile_in_use(profile):
        raise CloakAccountError(
            "Cloak 已经开着，但调试端口 9345 没开。请关掉后用桌面的 CloakBrowser 重新打开。"
            "不要改用 Chrome 扫码。")
    exe = executable()
    if exe is None:
        raise CloakAccountError("没找到本机 Cloak 浏览器。工作台不会改用 Chrome 扫码。")
    _drop_stale_singleton(profile)
    subprocess.Popen(
        [str(exe), f"--user-data-dir={profile}", "--no-first-run",
         "--no-default-browser-check", "--remote-debugging-address=127.0.0.1",
         f"--remote-debugging-port={CDP_PORT}"],
        cwd=str(exe.parent),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    deadline = time.time() + 25
    while time.time() < deadline:
        if cdp_endpoint():
            return
        time.sleep(0.4)
    raise CloakAccountError("Cloak 已启动，但调试端口没有就绪。不要改用 Chrome 扫码。")


def _attach(playwright, endpoint: str) -> CloakSession:
    browser = playwright.chromium.connect_over_cdp(endpoint)
    contexts = list(browser.contexts)
    if not contexts:
        raise CloakAccountError("Cloak 已连上，但没有可用窗口。请在 Cloak 里打开一个页面后再试。")
    return CloakSession(contexts[0], [])


def open_account_context(playwright, *, profile_base: str | None, profile_name: str,
                         headed: bool, extra_args: list | None = None, proxy: str | None = None,
                         allow_launch: bool = True, viewport: dict | None = None):
    """profile_base 有值时沿用测试用的独立目录。默认接到桌面 Cloak。"""
    if profile_base:
        profile = Path(profile_base).expanduser() / profile_name
        profile.mkdir(parents=True, exist_ok=True)
        kwargs = dict(headless=not headed, locale="zh-CN", args=list(extra_args or []))
        if proxy:
            kwargs["proxy"] = {"server": proxy}
        if viewport:
            kwargs["viewport"] = viewport
        return playwright.chromium.launch_persistent_context(str(profile), **kwargs)

    endpoint = cdp_endpoint()
    if endpoint is None:
        if not allow_launch:
            raise CloakAccountError(
                "Cloak 浏览器没开。请先打开桌面的 CloakBrowser。登录留在那里，不要用 Chrome 再扫一次。")
        start_cloak()
        endpoint = cdp_endpoint()
    if endpoint is None:
        raise CloakAccountError("Cloak 的调试端口没有就绪。不要改用 Chrome 扫码。")
    return _attach(playwright, endpoint)
