"""生图默认走 Codex 订阅：解析事件，未指定 IMG_PROVIDER 时不打自备接口。"""
from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "skills" / "shared" / "scripts"))

import ai_image  # noqa: E402


def test_codex_prompt_stays_one_line() -> None:
    text = ai_image._codex_prompt("a circle\non cream", 1, False)
    assert "\n" not in text
    assert "画面内容：a circle on cream" in text


def test_unset_provider_is_codex(monkeypatch) -> None:
    monkeypatch.delenv("IMG_PROVIDER", raising=False)
    assert ai_image.active_image_provider() == "codex"


def test_openai_provider_stays_on_api(monkeypatch) -> None:
    monkeypatch.setenv("IMG_PROVIDER", "openai")
    assert ai_image.active_image_provider() == "openai"


def test_exec_events_keep_image_path_and_message() -> None:
    lines = [
        '{"type":"item.completed","item":{"type":"image_generation","savedPath":"C:/tmp/a.png"}}',
        '{"type":"item.completed","item":{"type":"agent_message","text":"done"}}',
        "not json",
    ]
    paths, note = ai_image.codex_image_paths_from_events(lines)
    assert paths == ["C:/tmp/a.png"]
    assert note == "done"


def test_text2img_without_provider_calls_codex(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("IMG_PROVIDER", raising=False)
    seen: dict[str, str] = {}

    def fake(prompt, output, count, fmt, images=None, timeout=240):
        seen["prompt"] = prompt
        seen["output"] = output
        return [tmp_path / "x.png"]

    monkeypatch.setattr(ai_image, "run_codex_image", fake)
    args = ai_image.parse_args(["text2img", "--prompt", "cat", "--output", str(tmp_path / "x.png")])
    ai_image.cmd_text2img(args)
    assert seen == {"prompt": "cat", "output": str(tmp_path / "x.png")}
