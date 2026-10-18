"""确认删除只把飞书行标成不再同步，不物理删除。"""
import asyncio
import importlib.util
import json
import os
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import web.app as web


def _write_snapshot(directory: Path, rows: list[dict]) -> Path:
    path = directory / "feishu-收藏资产库-20261019.ndjson"
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")
    return path


def _isolate(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(web, "MATERIALS_DIR", tmp_path)
    monkeypatch.setattr(web, "COVERS_DIR", tmp_path / "covers")
    monkeypatch.setattr(web, "_MAT_CACHE", {"path": None, "mtime": 0.0, "items": [], "full": {}})
    monkeypatch.setattr(web, "_MAT_DISMISSED", set())
    monkeypatch.setattr(web, "_MAT_REFRESH", {"running": False, "msg": ""})
    env_file = tmp_path / ".env"
    env_file.write_text(
        "META_FEISHU_BASE_TOKEN=test-base-token\nMETA_FEISHU_TABLE_ID=tbltesttable\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(web, "ENV_FILE", env_file)
    monkeypatch.delenv("META_FEISHU_BASE_TOKEN", raising=False)
    monkeypatch.delenv("META_FEISHU_TABLE_ID", raising=False)
    monkeypatch.delenv("HERMES_HOME", raising=False)


def _rows():
    return [
        {"record_id": "recAAA", "标题": "甲", "收藏状态": ["收藏中"], "原始ID": "xhs:1", "链接": "https://example.test/a"},
        {"record_id": "recBBB", "标题": "乙", "收藏状态": ["收藏中"], "原始ID": "xhs:2"},
        {"record_id": "recCCC", "标题": "丙"},
    ]


def test_load_hides_tombstone_and_memory_mark(tmp_path, monkeypatch):
    _isolate(monkeypatch, tmp_path)
    rows = _rows()
    rows[1]["收藏状态"] = ["不再同步"]
    _write_snapshot(tmp_path, rows)
    loaded = web._mat_load()
    assert [item["id"] for item in loaded["items"]] == ["recAAA", "recCCC"]
    web._MAT_DISMISSED.add("recAAA")
    web._MAT_CACHE.update({"path": None, "mtime": 0.0})
    again = web._mat_load()
    assert [item["id"] for item in again["items"]] == ["recCCC"]


def test_dismiss_marks_feishu_and_local_snapshot(tmp_path, monkeypatch):
    _isolate(monkeypatch, tmp_path)
    path = _write_snapshot(tmp_path, _rows())
    monkeypatch.setattr(web.shutil, "which", lambda _name: "lark-cli.exe")
    monkeypatch.setenv("HERMES_HOME", r"C:\should-not-pass")
    seen = {}

    def fake_run(cmd, **kwargs):
        seen["cmd"] = cmd
        seen["env"] = kwargs.get("env")
        flag = cmd[cmd.index("--json") + 1]
        assert flag.startswith("@")
        seen["payload"] = json.loads(Path(flag[1:]).read_text(encoding="utf-8"))
        return SimpleNamespace(returncode=0, stdout="true\n", stderr="")

    monkeypatch.setattr(web.subprocess, "run", fake_run)
    result = asyncio.run(web.api_materials_dismiss(web.MaterialDismissRequest(ids=["recAAA", "recAAA"])))
    assert result == {"ok": True, "count": 1}
    assert "record-delete" not in " ".join(seen["cmd"])
    assert "+record-batch-update" in seen["cmd"]
    assert "HERMES_HOME" not in seen["env"]
    assert seen["payload"]["update_records"]["recAAA"]["收藏状态"] == ["不再同步"]
    assert seen["payload"]["update_records"]["recAAA"]["取消发现日期"]
    saved = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    by_id = {row["record_id"]: row for row in saved}
    assert by_id["recAAA"]["收藏状态"] == ["不再同步"]
    assert by_id["recAAA"]["原始ID"] == "xhs:1"
    assert by_id["recAAA"]["标题"] == "甲"
    assert by_id["recAAA"]["链接"] == "https://example.test/a"
    assert by_id["recBBB"]["收藏状态"] == ["收藏中"]
    assert [item["id"] for item in web._mat_load()["items"]] == ["recBBB", "recCCC"]
    assert not (Path(os.environ.get("TEMP") or ".") / f"easel-dismiss-{os.getpid()}.json").exists()


def test_dismiss_feishu_failure_keeps_snapshot(tmp_path, monkeypatch):
    _isolate(monkeypatch, tmp_path)
    path = _write_snapshot(tmp_path, _rows())
    before = path.read_text(encoding="utf-8")
    monkeypatch.setattr(web.shutil, "which", lambda _name: "lark-cli.exe")

    def fake_run(cmd, **kwargs):
        return SimpleNamespace(returncode=1, stdout="", stderr="boom test-base-token tbltesttable")

    monkeypatch.setattr(web.subprocess, "run", fake_run)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(web.api_materials_dismiss(web.MaterialDismissRequest(ids=["recBBB"])))
    assert exc.value.status_code == 502
    assert "素材还在" in exc.value.detail
    assert "test-base-token" not in exc.value.detail
    assert "tbltesttable" not in exc.value.detail
    assert path.read_text(encoding="utf-8") == before
    assert "recBBB" in {item["id"] for item in web._mat_load()["items"]}


@pytest.mark.parametrize("ids,status", [
    ([], 400),
    ([f"rec{i:03d}" for i in range(101)], 400),
    (["not-a-record"], 400),
    (["recZZZ"], 404),
])
def test_dismiss_rejects_bad_selection(tmp_path, monkeypatch, ids, status):
    _isolate(monkeypatch, tmp_path)
    _write_snapshot(tmp_path, _rows())
    called = []
    monkeypatch.setattr(web.shutil, "which", lambda _name: "lark-cli.exe")
    monkeypatch.setattr(web.subprocess, "run", lambda *args, **kwargs: called.append(args))
    with pytest.raises(HTTPException) as exc:
        asyncio.run(web.api_materials_dismiss(web.MaterialDismissRequest(ids=ids)))
    assert exc.value.status_code == status
    assert not called


def test_stamp_keeps_dismissed_rows_in_a_stale_export(tmp_path, monkeypatch):
    _isolate(monkeypatch, tmp_path)
    web._MAT_DISMISSED.update({"recAAA"})
    exported = tmp_path / "incoming.ndjson"
    exported.write_text(json.dumps({"record_id": "recAAA", "收藏状态": ["收藏中"], "标题": "甲"}, ensure_ascii=False) + "\n", encoding="utf-8")
    web._mat_stamp_dismissed(exported)
    row = json.loads(exported.read_text(encoding="utf-8"))
    assert row["收藏状态"] == ["不再同步"]
    assert row["标题"] == "甲"


def test_unfav_does_not_restore_tombstone(tmp_path):
    path = Path(r"C:\Users\Administrator\fav-sync\nightly\unfav_lib.py")
    if not path.is_file():
        pytest.skip("unfav_lib missing")
    spec = importlib.util.spec_from_file_location("unfav_lib_under_test", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    rows = [
        {"来源平台": ["小红书"], "原始ID": "xhs:a", "record_id": "recA", "收藏状态": ["收藏中"]},
        {"来源平台": ["小红书"], "原始ID": "xhs:b", "record_id": "recB", "收藏状态": ["不再同步"]},
        {"来源平台": ["小红书"], "原始ID": "xhs:c", "record_id": "recC", "收藏状态": ["已取消收藏"]},
        {"来源平台": ["小红书"], "原始ID": "xhs:d", "record_id": "recD", "收藏状态": ["不再同步"]},
    ]
    updates = mod.apply("小红书", "xhs:", rows, ["a", "b", "c"], True, str(tmp_path / "state.json"), today="2026-10-19", log=lambda *_args: None)
    assert "recB" not in updates
    assert "recD" not in updates
    assert updates["recC"]["收藏状态"] == ["收藏中"]
    assert "recA" not in updates
