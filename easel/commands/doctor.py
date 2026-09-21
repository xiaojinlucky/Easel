"""easel doctor — 检查开发环境是否就绪。"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import urllib.request
import urllib.error
from pathlib import Path
from easel.runtime import openclaw_command, runtime_env, subscription_status

from easel.openclaw_cmd import openclaw_base_cmd

# 项目根目录（Easel/）
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# OpenClaw 已验证的稳定下限。低于此版本会命中一系列破坏性变更：anthropic provider 必须原子写入、
# timeoutSeconds 被判 Unrecognized key、记忆检索 schema 尚未迁移到 memory.search.* 等（见 issue #9/#11）。
MIN_OPENCLAW = (2026, 6, 11)

GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[0;33m"
NC = "\033[0m"


def _check(label: str, ok: bool, detail: str = "") -> bool:
    status = f"{GREEN}OK{NC}" if ok else f"{RED}FAIL{NC}"
    print(f"  {label:<40s} {status}")
    if not ok and detail:
        print(f"    └─ {detail}")
    return ok


def _node_version_ok(strict: bool) -> bool:
    """检查 Node.js 版本。

    strict=True 对齐 openclaw@latest（2026.9.x）的引擎：>=24.16.0 <25 || >=26.1.0（25.x/26.0 被排除）。
    strict=False 用于已装较旧 OpenClaw（<=2026.6.x，引擎 ^20.10 || ^22.11 || >=24）的宽松下限 >=20.10。
    """
    try:
        result = subprocess.run(
            [openclaw_command()[0], "--version"],
            capture_output=True, text=True, timeout=10,
        )
        if result.returncode != 0:
            return False
        # e.g. "v24.21.0"
        m = re.match(r"v(\d+)\.(\d+)", result.stdout.strip())
        if not m:
            return False
        major, minor = int(m.group(1)), int(m.group(2))
        if strict:
            return (major == 24 and minor >= 16) or (major == 26 and minor >= 1) or major >= 27
        return (major, minor) >= (20, 10)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def _openclaw_version() -> tuple[int, int, int] | None:
    """解析 `openclaw --version`，返回 (year, month, patch)；无法确定时返回 None。"""
    try:
        # 不能裸调 ["openclaw", ...]：Windows 上它是 npm 装的 `.cmd` shim，
        # CreateProcess 不按 PATHEXT 解析、裸名找不到文件 → FileNotFoundError
        # → 版本被误判「未知」。统一走 openclaw_cmd 的解析（Windows 上解析为
        # node + openclaw.mjs，Unix 上为直接可执行路径）。
        result = subprocess.run(
            openclaw_base_cmd() + ["--version"],
            capture_output=True, text=True, timeout=10,
        )
        if result.returncode != 0:
            return None
        # e.g. "OpenClaw 2026.9.4 (3a9d69d)"
        m = re.search(r"(\d+)\.(\d+)\.(\d+)", result.stdout)
        if not m:
            return None
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None


def _python_version_ok() -> bool:
    import sys
    return sys.version_info >= (3, 10)


def _module_available(name: str) -> bool:
    try:
        __import__(name)
        return True
    except ImportError:
        return False


def _venv_available() -> bool:
    return _module_available("venv")


def _chromium_available() -> bool:
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content('<title>Easel browser check</title>')
            available = page.title() == 'Easel browser check'
            browser.close()
            return available
    except (ImportError, OSError, RuntimeError):
        return False


def _gateway_healthy() -> bool:
    """Check OpenClaw gateway is running via healthz endpoint."""
    try:
        with urllib.request.urlopen("http://127.0.0.1:18789/healthz", timeout=5) as response:
            return response.status == 200
    except (OSError, urllib.error.URLError):
        return False


def _skills_synced() -> bool:
    """Check ~/.openclaw/workspace-easel/skills/ has content."""
    skills_dir = Path.home() / ".openclaw" / "workspace-easel" / "skills"
    if not skills_dir.is_dir():
        return False
    return any(skills_dir.iterdir())


def _env_key_valid() -> bool:
    """Check .env 配置了可用的认证。

    以下任一通道满足即可：
    - 标准 API key：ANTHROPIC_API_KEY
    - Anthropic-compatible 服务：EASEL_LLM_API_KEY + EASEL_LLM_BASE_URL

    ping 才是权威连通性测试；这里只做静态配置存在性检查。
    """
    env_file = PROJECT_ROOT / ".env"
    if not env_file.is_file():
        return False

    # 认证变量 → 是否已填入非占位值
    auth_vars: dict[str, str] = {}
    try:
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key, value = key.strip(), value.strip().strip('"').strip("'")
            if key in (
                "ANTHROPIC_API_KEY", "EASEL_LLM_API_KEY", "EASEL_LLM_BASE_URL",
                "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL",
                "OPENAI_API_KEY", "OPENAI_BASE_URL",
                "OPENAI_MAAS_API_KEY", "OPENAI_MAAS_ENDPOINT",
            ):
                auth_vars[key] = value
    except OSError:
        return False

    def _set(name: str) -> bool:
        v = auth_vars.get(name, "")
        return bool(v) and "REPLACE_ME" not in v

    # 标准 key 通道
    if _set("ANTHROPIC_API_KEY"):
        return True
    # Anthropic-compatible 服务：key + base_url 同时配好
    if _set("EASEL_LLM_API_KEY") and _set("EASEL_LLM_BASE_URL"):
        return True
    if _set("ANTHROPIC_AUTH_TOKEN") and _set("ANTHROPIC_BASE_URL"):
        return True
    if _set("OPENAI_API_KEY"):
        return True
    if _set("OPENAI_MAAS_API_KEY") and _set("OPENAI_MAAS_ENDPOINT"):
        return True
    return False


def cmd_doctor(_args) -> int:
    print("Easel — 环境检查\n")
    all_ok = True

    # 1. Runtime prerequisites
    all_ok &= _check("Python >= 3.10", _python_version_ok(),
                      "请安装 Python 3.10 或更高版本")
    all_ok &= _check("Python venv module", _venv_available(),
                      "Debian/Ubuntu 请安装 python3-venv")
    # openclaw 版本决定 Node 引擎要求：2026.9.x 需要 Node 24.16+，较旧版本沿用 >=20.10 的宽松下限。
    # 未装 openclaw 时按 setup 的默认安装目标（openclaw@latest）从严要求 24.16+。
    oc_ver = _openclaw_version()
    node_strict = oc_ver is None or oc_ver >= (2026, 9, 0)
    node_floor = "24.16" if node_strict else "20.10"
    has_node = shutil.which("node") is not None
    node_ok = _node_version_ok(node_strict)
    node_detail = (f"请安装 Node.js >= {node_floor}: https://nodejs.org/" if not has_node
                   else f"Node.js 版本不满足当前 OpenClaw 要求，请升级到 >= {node_floor}: https://nodejs.org/")
    all_ok &= _check(f"Node.js >= {node_floor}", node_ok, node_detail)
    all_ok &= _check("FFmpeg", shutil.which("ffmpeg") is not None,
                      "媒体处理需要 FFmpeg；请安装后重试")

    # 2. openclaw：本机工作台优先查独立运行时；找不到再退回 PATH。
    try:
        has_openclaw = Path(openclaw_command()[-1]).is_file()
    except RuntimeError:
        has_openclaw = shutil.which("openclaw") is not None
    all_ok &= _check("openclaw command", has_openclaw,
                      "请安装 openclaw: npm i -g openclaw")
    if has_openclaw:
        min_str = ".".join(map(str, MIN_OPENCLAW))
        ver_str = ".".join(map(str, oc_ver)) if oc_ver else "未知"
        oc_ver_ok = oc_ver is not None and oc_ver >= MIN_OPENCLAW
        all_ok &= _check(
            f"OpenClaw >= {min_str}", oc_ver_ok,
            f"当前 {ver_str}，过旧会有 provider/schema 兼容问题；请升级：npm i -g openclaw@latest",
        )

    for module in ("fastapi", "uvicorn", "sse_starlette", "multipart"):
        all_ok &= _check(f"Python package: {module}", _module_available(module),
                          "运行 pip install -e . 安装 Easel 运行依赖")

    frontend_ready = (PROJECT_ROOT / "web" / "frontend" / "dist" / "index.html").is_file()
    all_ok &= _check("Web frontend build", frontend_ready,
                      "运行 cd web/frontend && npm ci && npm run build")
    all_ok &= _check("Playwright Chromium", _chromium_available(),
                      "运行 python3 -m playwright install chromium")

    # 3. .env file with valid key
    try:
        status = subscription_status()
        all_ok &= _check('ChatGPT subscription', status['logged_in'], '在 AI 模型设置中通过官方 Codex 登录')
        print(f"  Weekly remaining (informational): {status['weekly_remaining']}%")
    except Exception as exc:
        all_ok &= _check('ChatGPT subscription', False, str(exc))

    # 4. OpenClaw gateway running
    gw_ok = _gateway_healthy()
    all_ok &= _check("OpenClaw gateway (localhost:18789)", gw_ok,
                      "运行 python -m easel gateway start")

    # 5. Skills synced
    synced = _skills_synced()
    all_ok &= _check("Skills synced", synced,
                      "重新运行 setup.ps1（Windows）或 bash openclaw/sync.sh（Linux/macOS）")

    # 6. Key project files
    gateway_label = "scripts/gateway.ps1" if os.name == "nt" else "scripts/gateway.sh"
    gateway_path = PROJECT_ROOT / "scripts" / ("gateway.ps1" if os.name == "nt" else "gateway.sh")
    key_files = [
        ("openclaw/openclaw.json5", PROJECT_ROOT / "openclaw" / "openclaw.json5"),
        ("skills/openclaw/", PROJECT_ROOT / "skills" / "openclaw"),
        (gateway_label, gateway_path),
    ]
    for label, path in key_files:
        all_ok &= _check(label, path.exists())

    print()
    if all_ok:
        print(f"{GREEN}✓ 环境就绪{NC} — 运行 python -m easel ping 验证连通性")
    else:
        print(f"{YELLOW}⚠ 有未满足项{NC} — 请按上述提示修复后重试")

    return 0 if all_ok else 1
