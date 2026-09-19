"""工作流图：存储、校验、串并行波次。不调真实 Agent。"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from easel import workflow as wf


def _graph(**kwargs):
    base = {
        "id": "wf-test1",
        "name": "测",
        "nodes": [
            {"id": "start", "type": "input", "title": "起点", "skill": "", "prompt": "", "x": 0, "y": 0},
            {"id": "a", "type": "skill", "title": "A", "skill": "skill-trending-topics", "prompt": "", "x": 1, "y": 0},
            {"id": "b", "type": "skill", "title": "B", "skill": "skill-xhs-content", "prompt": "", "x": 2, "y": 0},
        ],
        "edges": [
            {"id": "e1", "source": "start", "target": "a"},
            {"id": "e2", "source": "a", "target": "b"},
        ],
    }
    base.update(kwargs)
    return base


def test_serial_waves():
    g = _graph()
    groups = wf.waves([n["id"] for n in g["nodes"]], g["edges"])
    assert groups == [["start"], ["a"], ["b"]]


def test_parallel_fork():
    g = _graph(
        nodes=[
            {"id": "start", "type": "input", "title": "起点", "skill": "", "prompt": "", "x": 0, "y": 0},
            {"id": "a", "type": "skill", "title": "A", "skill": "skill-trending-topics", "prompt": "", "x": 1, "y": 0},
            {"id": "b", "type": "skill", "title": "B", "skill": "skill-xhs-content", "prompt": "", "x": 1, "y": 1},
        ],
        edges=[
            {"id": "e1", "source": "start", "target": "a"},
            {"id": "e2", "source": "start", "target": "b"},
        ],
    )
    groups = wf.waves([n["id"] for n in g["nodes"]], g["edges"])
    assert groups[0] == ["start"]
    assert set(groups[1]) == {"a", "b"}


def test_cycle_rejected():
    g = _graph(
        edges=[
            {"id": "e1", "source": "a", "target": "b"},
            {"id": "e2", "source": "b", "target": "a"},
        ],
    )
    errs = wf.validate(g, for_run=True)
    assert any("环" in e for e in errs)


def test_draft_can_omit_skill_but_run_cannot():
    g = _graph(nodes=[
        {"id": "start", "type": "input", "title": "起点", "skill": "", "prompt": "", "x": 0, "y": 0},
        {"id": "a", "type": "skill", "title": "A", "skill": "", "prompt": "", "x": 1, "y": 0},
    ], edges=[{"id": "e1", "source": "start", "target": "a"}])
    assert wf.validate(g, for_run=False) == []
    assert any("未选择技能" in e for e in wf.validate(g, for_run=True))


def test_compose_includes_parent_and_prompt():
    nodes = {
        "start": {"id": "start", "title": "起点"},
        "a": {"id": "a", "title": "热点", "prompt": "只看小红书\n{{input}}"},
    }
    text = wf.compose_input(nodes["a"], "今天热搜", {"start": "用户原话"}, ["start"], nodes)
    assert "只看小红书" in text
    assert "今天热搜" in text
    assert "上游 起点" in text
    assert "用户原话" in text


def test_bad_id_rejected():
    try:
        wf._path("../escape")
        assert False, "should reject"
    except ValueError:
        pass


def test_recipe_roundtrip_drops_empty_steps():
    g = wf.graph_from_recipe(
        "wf-recipe",
        "热点到成稿",
        [
            {"id": "a", "layer": "discover", "skill": "", "prompt": ""},
            {"id": "b", "layer": "discover", "skill": "skill-trending-topics", "prompt": "只看小红书"},
            {"id": "c", "layer": "produce", "skill": "skill-xhs-content", "prompt": ""},
        ],
        persona="科研",
    )
    assert g["persona"] == "科研"
    skills = [n["skill"] for n in g["nodes"] if n["type"] == "skill"]
    assert skills == ["skill-trending-topics", "skill-xhs-content"]
    steps = wf.recipe_steps(g)
    assert [s["skill"] for s in steps] == ["skill-trending-topics", "skill-xhs-content"]
    assert steps[0]["layer"] == "discover"


def test_old_canvas_graph_reads_as_recipe():
    steps = wf.recipe_steps(_graph())
    assert [s["skill"] for s in steps] == ["skill-trending-topics", "skill-xhs-content"]


def test_save_load_delete(monkeypatch=None):
    old = wf.WORKFLOWS_DIR
    with tempfile.TemporaryDirectory() as tmp:
        wf.WORKFLOWS_DIR = Path(tmp)
        try:
            saved = wf.save(_graph())
            listed = wf.list_workflows()
            assert listed[0]["id"] == "wf-test1"
            loaded = wf.load("wf-test1")
            assert loaded["name"] == "测"
            assert len(loaded["nodes"]) == 3
            raw = json.loads((Path(tmp) / "wf-test1.json").read_text(encoding="utf-8"))
            assert raw["id"] == saved["id"]
            wf.delete("wf-test1")
            try:
                wf.load("wf-test1")
                assert False, "deleted"
            except FileNotFoundError:
                pass
        finally:
            wf.WORKFLOWS_DIR = old
