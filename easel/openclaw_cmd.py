"""Resolve how to invoke the openclaw CLI as an argv prefix.

Windows pitfall this solves: `openclaw` on PATH is a `.cmd` shim. Python's
CreateProcess cannot run it directly, and wrapping in cmd.exe /c breaks
messages containing newlines (cmd treats the rest of the line as a separate
command -> "your message got cut off" / silently truncated input). Running
`node openclaw.mjs` directly avoids both problems.

On Linux/macOS `openclaw` on PATH is a real executable (a symlink to
`openclaw.mjs` with a `#!/usr/bin/env node` shebang), so running it directly
is fine. The resolution below therefore prefers `node + openclaw.mjs` when it
can locate the script (robust everywhere, mandatory on Windows), and falls
back to the PATH `openclaw` executable rather than hard-failing.
"""

from __future__ import annotations

import os
import shutil
from functools import lru_cache
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _isolated_openclaw_cmd() -> list[str] | None:
    """Prefer a local OpenClaw 2026.9.x, never PATH ``openclaw-cn`` 0.2.0.

    This machine cannot ``npm i -g openclaw@latest`` (system Node is 24.15,
    upstream wants 24.16+). Reuse the already-installed isolated runtime from
    the sibling fork, or a project-local ``.runtime`` if present.
    """
    node_name = "node.exe" if os.name == "nt" else "node"
    candidates = (
        _PROJECT_ROOT / ".runtime",
        _PROJECT_ROOT.parent / "Easel" / ".runtime",
    )
    for state in candidates:
        entry = state / "node_modules" / "openclaw" / "openclaw.mjs"
        node_bin = state / "node_modules" / "node" / "bin" / node_name
        if entry.is_file() and node_bin.is_file():
            return [str(node_bin), str(entry)]
    return None


@lru_cache(maxsize=1)
def openclaw_base_cmd() -> list[str]:
    """Return the argv prefix for invoking openclaw.

    Prefers ``[node, /path/to/openclaw.mjs]``; falls back to ``[openclaw]`` on
    PATH. Raises FileNotFoundError only when openclaw cannot be located at all.
    """
    isolated = _isolated_openclaw_cmd()
    if isolated:
        return isolated

    node = shutil.which("node")
    oc = shutil.which("openclaw")

    # 1) PATH `openclaw` that resolves to the .mjs (Unix symlink, or a direct
    #    .mjs on PATH): run it through node explicitly.
    if oc and node:
        resolved = Path(oc).resolve()
        if resolved.suffix == ".mjs" and resolved.is_file():
            return [node, str(resolved)]

    # 2) Hunt for openclaw.mjs under the known npm global layouts.
    if node:
        node_dir = Path(node).resolve().parent
        candidates = [
            # Unix standard: <prefix>/bin/node -> <prefix>/lib/node_modules/...
            node_dir.parent / "lib" / "node_modules" / "openclaw" / "openclaw.mjs",
            # npm global prefix == node dir (zip / some nvm-style installs)
            node_dir / "node_modules" / "openclaw" / "openclaw.mjs",
            # Windows standard: npm global prefix == %APPDATA%/npm
            Path.home() / "AppData" / "Roaming" / "npm" / "node_modules" / "openclaw" / "openclaw.mjs",
        ]
        for cand in candidates:
            if cand.is_file():
                return [node, str(cand)]

    # 3) Fallback: run the PATH `openclaw` directly. On Unix this is a real
    #    executable and works. On Windows this is the `.cmd` shim (only reached
    #    when the .mjs truly can't be found) — still better than hard-failing.
    if oc:
        return [oc]

    raise FileNotFoundError(
        "openclaw CLI not found: no 'node'+openclaw.mjs and no 'openclaw' on PATH"
    )
