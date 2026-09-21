"""CLI 入口：从项目根运行 python skills/shared/scripts/skill_route.py -q '...'"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from easel.skill_route import main

if __name__ == "__main__":
    raise SystemExit(main())
