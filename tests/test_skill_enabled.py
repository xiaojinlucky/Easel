"""未启用技能不参与路由；默认把 AI 生成视频/语音放进备选归档。"""
from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "web"))

from easel import skill_state
from easel.skill_route import route


def test_ai_media_skills_default_disabled(tmp_path, monkeypatch):
    monkeypatch.setattr(skill_state, "STATE_PATH", tmp_path / "skill-state.json")
    monkeypatch.setattr(skill_state, "_sync_openclaw_entry", lambda *a, **k: None)
    assert skill_state.is_enabled("copywriting") is True
    assert skill_state.is_enabled("ai-video-gen") is False
    assert skill_state.is_enabled("tts-voiceover") is False
    assert skill_state.is_enabled("voice-clone") is False


def test_set_enabled_round_trip(tmp_path, monkeypatch):
    monkeypatch.setattr(skill_state, "STATE_PATH", tmp_path / "skill-state.json")
    monkeypatch.setattr(skill_state, "_sync_openclaw_entry", lambda *a, **k: None)
    skill_state.set_enabled("ai-video-gen", True)
    assert skill_state.is_enabled("ai-video-gen") is True
    skill_state.set_enabled("ai-video-gen", False)
    assert skill_state.is_enabled("ai-video-gen") is False


def test_route_skips_disabled_skills(tmp_path, monkeypatch):
    monkeypatch.setattr(skill_state, "STATE_PATH", tmp_path / "skill-state.json")
    monkeypatch.setattr(skill_state, "_sync_openclaw_entry", lambda *a, **k: None)
    skill_state.save_state({"disabled": ["ai-video-gen", "tts-voiceover"]})
    hits = route("请用 ai-video-gen 生成一段视频", limit=8)
    names = {h["name"] for h in hits}
    assert "ai-video-gen" not in names
