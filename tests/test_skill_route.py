"""技能导航：只读现有 SKILL.md，不新建技能。"""
from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from easel.persona import chat_turn_message
from easel.persona import TURN_REMINDER
from easel.skill_route import (
    catalog,
    format_route_block,
    infer_layer,
    parse_wf_steps,
    route,
    suggest_recipe,
    summarize,
)


def test_catalog_reads_openclaw_skills():
    items = catalog()
    names = {item["name"] for item in items}
    assert len(items) >= 50
    assert "skill-trending-topics" in names
    trending = next(item for item in items if item["name"] == "skill-trending-topics")
    assert trending["layer"] == "discover"
    assert "热搜" in trending["description"]
    assert trending["summary"]
    assert "skill-" not in trending["summary"]
    assert trending["path"] == "skills/openclaw/skill-trending-topics/SKILL.md"


def test_summarize_uses_first_clause():
    title = summarize(
        "抓取微博、抖音、知乎、头条、B站实时热搜，筛选与创作者赛道相关的热点，输出二创选题建议。当用户说热搜时使用。",
        "skill-trending-topics",
    )
    assert title == "抓取微博、抖音、知乎、头条、B站实时热搜"
    assert summarize("", "skill-foo-bar") == "foo bar"


def test_named_skill_wins():
    hits = route("/skill-trending-topics 今天有什么热搜", limit=3)
    assert hits
    assert hits[0]["name"] == "skill-trending-topics"
    assert hits[0]["score"] >= 120


def test_stacked_invoke_does_not_hijack_route():
    from easel.skill_route import clean_query
    stacked = "请执行 /skill-my-account：请执行 /skill-content-calendar：今天有什么热搜"
    assert clean_query(stacked) == "今天有什么热搜"
    hits = route(stacked, limit=3)
    assert hits
    assert hits[0]["name"] == "skill-trending-topics"


def test_pin_becomes_primary():
    hits = route("今天有什么热搜", pin="skill-event-calendar", limit=3)
    assert hits[0]["name"] == "skill-event-calendar"


def test_hot_query_routes_to_discover():
    assert infer_layer("看看现在微博和抖音有什么热搜") == "discover"
    hits = route("看看现在微博和抖音有什么热搜", limit=3)
    assert hits
    assert any(item["layer"] == "discover" for item in hits)


def test_tied_layer_hints_do_not_prefer_discover():
    assert infer_layer("热点选题") is None
    assert infer_layer("热点选题", "plan") == "plan"
    tied = route("热点选题", limit=3)
    planned = route("热点选题", stage="plan", limit=3)
    assert tied
    assert planned
    assert all(item["layer"] == "plan" for item in planned)


def test_stage_alias_and_empty_query():
    assert infer_layer("", "制作") == "produce"
    assert infer_layer("", "discover") == "discover"
    assert route("", limit=3) == []
    hits = route("润色这段小红书文案", stage="produce", limit=3)
    assert hits
    assert hits[0]["layer"] == "produce"


def test_named_skill_ignores_plain_english():
    from easel.skill_route import _named_in_query
    assert _named_in_query("please help me write outputs") == []
    assert _named_in_query("/skill-trending-topics") == ["skill-trending-topics"]
    assert _named_in_query("$skill-trending-topics") == ["skill-trending-topics"]


def test_chat_routes_on_user_text_not_attachment_manifest():
    polluted = (
        "帮我润色这段文案\n\n"
        "〔系统附件清单〕\n- outputs/_inbox/abc/skill-trending-topics.pdf"
    )
    msg = chat_turn_message(polluted, None, stage="produce", route_query="帮我润色这段文案")
    nav = msg.split("〔技能导航", 1)[-1]
    assert "skill-trending-topics.pdf" in msg
    assert "skill-trending-topics/SKILL.md" not in nav


def test_empty_route_query_ignores_attachment_manifest():
    polluted = (
        "〔系统附件清单〕\n- outputs/_inbox/abc/notes.pdf\n"
        "需要纳入内容项目时，将清单内文件复制到 outputs/<项目>/assets/"
    )
    msg = chat_turn_message(polluted, None, route_query="")
    nav = msg.split("〔技能导航", 1)[-1]
    assert "没有高置信" in nav
    assert "asset-manager" not in nav


def test_format_and_chat_inject_project_root():
    hits = route("帮我写一条小红书种草文案", stage="produce", limit=2)
    block = format_route_block(hits)
    assert "技能导航" in block
    assert str(PROJECT_ROOT) in block
    assert "skills/openclaw/" in block
    msg = chat_turn_message("帮我写一条小红书种草文案", None, stage="produce")
    assert "帮我写一条小红书种草文案" in msg
    assert "技能导航" in msg
    assert "内部提醒" in msg


def test_assemble_chat_does_not_ask_to_execute():
    msg = chat_turn_message("从今天热点写成一篇小红书", None, stage="assemble")
    assert "配方助手" in msg
    assert "从今天热点写成一篇小红书" in msg
    assert TURN_REMINDER not in msg
    assert "不要执行技能" in msg
    assert "按其流程" not in msg
    assert "不要打开 SKILL.md 去执行" in msg


def test_suggest_recipe_hot_to_note():
    out = suggest_recipe("围绕今天科研热点做成一篇小红书笔记")
    layers = [step["layer"] for step in out["steps"]]
    names = [step["name"] for step in out["steps"]]
    assert "discover" in layers
    assert "produce" in layers
    assert names[layers.index("discover")] == "skill-trending-topics"
    assert names[layers.index("produce")] == "xhs-note-creator"
    written = suggest_recipe("先看今天科研热点，再写成一篇能发的小红书")
    assert [s["name"] for s in written["steps"] if s["layer"] == "produce"] == ["xhs-note-creator"]
    published = suggest_recipe("发布到小红书")
    assert [s["name"] for s in published["steps"] if s["layer"] == "publish"] == ["skill-xhs-publisher"]
    assert all(s["layer"] != "produce" for s in published["steps"])
    assert all(step["summary"] for step in out["steps"])
    parsed = parse_wf_steps(
        "WF_STEP layer=discover skill=skill-trending-topics\n"
        "WF_STEP layer=produce skill=xhs-note-creator\n"
        "WF_STEP layer=produce skill=skill-missing-tool"
    )
    names = {item["name"] for item in parsed}
    assert names == {"skill-trending-topics", "xhs-note-creator"}
