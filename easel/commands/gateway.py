"""easel gateway — 管理 OpenClaw gateway。"""

from __future__ import annotations

import subprocess
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GATEWAY_SCRIPT = PROJECT_ROOT / "scripts" / ("gateway.ps1" if os.name == "nt" else "gateway.sh")


def cmd_gateway(args) -> int:
    action = getattr(args, "action", "status") or "status"
    if os.name == 'nt':
        from easel.services import start, stop, healthy
        if action in ('stop', 'restart'):
            print(stop('gateway'))
        if action in ('start', 'restart'):
            print(start('gateway'))
        if action == 'status':
            print({'gateway': healthy('gateway')})
        return 0
    command = (
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(GATEWAY_SCRIPT), action]
        if os.name == "nt"
        else ["bash", str(GATEWAY_SCRIPT), action]
    )
    result = subprocess.run(command, cwd=PROJECT_ROOT)
    return result.returncode
