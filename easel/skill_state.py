"""技能启用 / 备选归档。未启用的技能不参与路由、对话和工作流。"""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = PROJECT_ROOT / ".runtime" / "skill-state.json"

# AI 生成视频 / 语音 / 音乐：默认进备选归档，可在技能库手动启用。
DEFAULT_DISABLED = frozenset({
    "ai-video-gen",
    "auto-short-video",
    "video-production",
    "slideshow-video",
    "beat-sync-video",
    "tts-voiceover",
    "voice-clone",
    "multi-voice-dubbing",
    "ai-music",
})


def _empty_state() -> dict:
    return {"disabled": sorted(DEFAULT_DISABLED)}


def load_state() -> dict:
    if not STATE_PATH.is_file():
        return _empty_state()
    try:
        data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return _empty_state()
    disabled = data.get("disabled")
    if not isinstance(disabled, list):
        return _empty_state()
    names = sorted({str(x) for x in disabled if isinstance(x, str) and x.strip()})
    return {"disabled": names}


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"disabled": sorted(set(state.get("disabled") or []))}, ensure_ascii=False, indent=2)
    fd, tmp = tempfile.mkstemp(dir=str(STATE_PATH.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(payload)
            handle.write("\n")
        os.replace(tmp, STATE_PATH)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def disabled_names() -> set[str]:
    return set(load_state()["disabled"])


def is_enabled(name: str) -> bool:
    return name not in disabled_names()


def set_enabled(name: str, enabled: bool) -> dict:
    name = (name or "").strip()
    if not name:
        raise ValueError("技能名不能为空")
    state = load_state()
    disabled = set(state["disabled"])
    if enabled:
        disabled.discard(name)
    else:
        disabled.add(name)
    state["disabled"] = sorted(disabled)
    save_state(state)
    _sync_openclaw_entry(name, enabled)
    return state


def _openclaw_config_path() -> Path:
    profile = (os.environ.get("OPENCLAW_PROFILE") or "easel").strip() or "easel"
    return Path.home() / f".openclaw-{profile}" / "openclaw.json"


def _sync_openclaw_entry(name: str, enabled: bool) -> None:
    """网关 Control UI / 运行时也认 skills.entries.<name>.enabled。"""
    path = _openclaw_config_path()
    if not path.is_file():
        return
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return
    skills = data.setdefault("skills", {})
    entries = skills.setdefault("entries", {})
    entry = entries.get(name) or {}
    if not isinstance(entry, dict):
        entry = {}
    entry["enabled"] = bool(enabled)
    entries[name] = entry
    extra = (skills.get("load") or {}).get("extraDirs") or []
    ext_dir = str(PROJECT_ROOT / "skills" / "extensions")
    openclaw_dir = str(PROJECT_ROOT / "skills" / "openclaw")
    load = skills.setdefault("load", {})
    dirs = list(load.get("extraDirs") or extra)
    for folder in (openclaw_dir, ext_dir):
        if Path(folder).is_dir() and folder not in dirs:
            dirs.append(folder)
    if dirs:
        load["extraDirs"] = dirs
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(text)
        try:
            os.replace(tmp, path)
        except OSError:
            try:
                path.write_text(text, encoding="utf-8")
            except OSError:
                pass
            try:
                os.unlink(tmp)
            except OSError:
                pass
    except OSError:
        try:
            os.unlink(tmp)
        except OSError:
            pass


def ensure_defaults() -> None:
    """首次无状态文件时写入默认归档名单，并同步到 OpenClaw。"""
    if STATE_PATH.is_file():
        return
    save_state(_empty_state())
    for name in DEFAULT_DISABLED:
        try:
            _sync_openclaw_entry(name, False)
        except OSError:
            pass
