"""本地工作流：JSON 图 + DAG 波次。节点执行复用现有 SKILL，不新造技能。"""

from __future__ import annotations

import json
import re
import time
import uuid
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS_DIR = PROJECT_ROOT / "workflows"

SAFE_ID = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$")

LAYER_LABELS = {
    "discover": "发现",
    "plan": "策划",
    "produce": "制作",
    "publish": "发布",
    "attribute": "归因",
    "general": "基础",
}


def _ensure_dir() -> Path:
    WORKFLOWS_DIR.mkdir(parents=True, exist_ok=True)
    return WORKFLOWS_DIR


def new_id() -> str:
    return f"wf-{int(time.time())}-{uuid.uuid4().hex[:6]}"


def _path(wf_id: str) -> Path:
    if not SAFE_ID.match(wf_id):
        raise ValueError(f"非法工作流 id: {wf_id}")
    return _ensure_dir() / f"{wf_id}.json"


def list_workflows() -> list[dict]:
    _ensure_dir()
    items: list[dict] = []
    for path in sorted(WORKFLOWS_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(data, dict) or not data.get("id"):
            continue
        items.append(_summary(data))
    items.sort(key=lambda x: x.get("updated") or 0, reverse=True)
    return items


def load(wf_id: str) -> dict:
    path = _path(wf_id)
    if not path.is_file():
        raise FileNotFoundError(wf_id)
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("工作流文件损坏")
    return data


def save(data: dict) -> dict:
    wf_id = str(data.get("id") or "").strip() or new_id()
    name = str(data.get("name") or "").strip() or "未命名工作流"
    nodes = data.get("nodes") or []
    edges = data.get("edges") or []
    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise ValueError("nodes / edges 必须是数组")
    graph = {
        "id": wf_id,
        "name": name,
        "updated": int(time.time()),
        "persona": str(data.get("persona") or "").strip()[:80],
        "nodes": [_normalize_node(n) for n in nodes],
        "edges": [_normalize_edge(e) for e in edges],
    }
    errors = validate(graph, for_run=False)
    if errors:
        raise ValueError("；".join(errors))
    path = _path(wf_id)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(graph, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)
    return graph


def delete(wf_id: str) -> None:
    path = _path(wf_id)
    if not path.is_file():
        raise FileNotFoundError(wf_id)
    path.unlink()


def _summary(data: dict) -> dict:
    nodes = data.get("nodes") or []
    edges = data.get("edges") or []
    steps = [s for s in recipe_steps(data) if s.get("skill")]
    return {
        "id": data.get("id"),
        "name": data.get("name") or "未命名工作流",
        "updated": data.get("updated") or 0,
        "persona": data.get("persona") or "",
        "nodeCount": len(nodes) if isinstance(nodes, list) else 0,
        "edgeCount": len(edges) if isinstance(edges, list) else 0,
        "stepCount": len(steps),
        "skills": [s["skill"] for s in steps],
    }


def _normalize_node(raw: object) -> dict:
    if not isinstance(raw, dict):
        raise ValueError("节点必须是对象")
    nid = str(raw.get("id") or "").strip()
    if not SAFE_ID.match(nid):
        raise ValueError(f"非法节点 id: {nid}")
    ntype = str(raw.get("type") or "skill").strip()
    if ntype not in ("input", "skill"):
        raise ValueError(f"未知节点类型: {ntype}")
    try:
        x = float(raw.get("x") or 0)
        y = float(raw.get("y") or 0)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"节点 {nid} 坐标无效") from exc
    return {
        "id": nid,
        "type": ntype,
        "title": str(raw.get("title") or "").strip()[:80],
        "skill": str(raw.get("skill") or "").strip()[:80],
        "prompt": str(raw.get("prompt") or "")[:4000],
        "layer": str(raw.get("layer") or "").strip()[:32],
        "x": x,
        "y": y,
    }


def _normalize_edge(raw: object) -> dict:
    if not isinstance(raw, dict):
        raise ValueError("边必须是对象")
    eid = str(raw.get("id") or "").strip() or f"e-{uuid.uuid4().hex[:8]}"
    src = str(raw.get("source") or "").strip()
    tgt = str(raw.get("target") or "").strip()
    if not SAFE_ID.match(src) or not SAFE_ID.match(tgt):
        raise ValueError("边的 source/target 非法")
    return {"id": eid[:80], "source": src, "target": tgt}


def validate(graph: dict, *, for_run: bool = False) -> list[str]:
    errors: list[str] = []
    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []
    if not nodes:
        errors.append("至少需要一个节点")
        return errors
    ids = [n["id"] for n in nodes]
    if len(ids) != len(set(ids)):
        errors.append("节点 id 重复")
    idset = set(ids)
    if for_run:
        if not any(n["type"] == "skill" for n in nodes):
            errors.append("运行前至少需要一个技能节点")
        for node in nodes:
            if node["type"] == "skill" and not node["skill"]:
                errors.append(f"节点 {node['id']} 未选择技能")
    for edge in edges:
        if edge["source"] not in idset:
            errors.append(f"边 {edge['id']} 起点不存在")
        if edge["target"] not in idset:
            errors.append(f"边 {edge['id']} 终点不存在")
        if edge["source"] == edge["target"]:
            errors.append(f"边 {edge['id']} 自环")
    if _has_cycle(ids, edges):
        errors.append("图中存在环，只能保存有向无环图")
    return errors


def _has_cycle(ids: list[str], edges: list[dict]) -> bool:
    try:
        waves(ids, edges)
    except ValueError:
        return True
    return False


def waves(ids: list[str], edges: list[dict]) -> list[list[str]]:
    """Kahn：同一波次可并行，波次之间串行。"""
    incoming: dict[str, int] = {i: 0 for i in ids}
    outgoing: dict[str, list[str]] = {i: [] for i in ids}
    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        if src not in incoming or tgt not in incoming:
            continue
        outgoing[src].append(tgt)
        incoming[tgt] += 1
    ready = sorted(i for i, n in incoming.items() if n == 0)
    seen = 0
    result: list[list[str]] = []
    while ready:
        result.append(list(ready))
        nxt: list[str] = []
        for nid in ready:
            seen += 1
            for child in outgoing[nid]:
                incoming[child] -= 1
                if incoming[child] == 0:
                    nxt.append(child)
        ready = sorted(nxt)
    if seen != len(ids):
        raise ValueError("图中存在环")
    return result


def parents_of(node_id: str, edges: list[dict]) -> list[str]:
    return [e["source"] for e in edges if e["target"] == node_id]


def compose_input(node: dict, user_input: str, results: dict[str, str], parent_ids: list[str], nodes_by_id: dict[str, dict]) -> str:
    chunks: list[str] = []
    extra = (node.get("prompt") or "").replace("{{input}}", user_input).strip()
    if extra:
        chunks.append(extra)
    if user_input.strip():
        chunks.append(user_input.strip())
    for pid in parent_ids:
        parent = nodes_by_id.get(pid) or {}
        title = parent.get("title") or parent.get("skill") or pid
        text = (results.get(pid) or "").strip()
        if text:
            chunks.append(f"【上游 {title}】\n{text}")
    return "\n\n".join(chunks).strip()


def recipe_steps(graph: dict) -> list[dict]:
    """按波次展开技能节点，给「按环节拼技能」界面用。旧画布图也能读。"""
    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []
    if not isinstance(nodes, list):
        return []
    ids = [n["id"] for n in nodes if isinstance(n, dict) and n.get("id")]
    by_id = {n["id"]: n for n in nodes if isinstance(n, dict) and n.get("id")}
    try:
        order = [nid for wave in waves(ids, edges if isinstance(edges, list) else []) for nid in wave]
    except ValueError:
        order = ids
    steps: list[dict] = []
    for nid in order:
        node = by_id.get(nid) or {}
        if node.get("type") != "skill":
            continue
        steps.append({
            "id": nid,
            "layer": str(node.get("layer") or "").strip(),
            "title": str(node.get("title") or "").strip(),
            "skill": str(node.get("skill") or "").strip(),
            "prompt": str(node.get("prompt") or ""),
        })
    return steps


def graph_from_recipe(wf_id: str, name: str, steps: list[dict], persona: str = "") -> dict:
    """配方 → 线性 DAG，执行器不用改。空技能步丢弃。"""
    nodes = [{
        "id": "start",
        "type": "input",
        "title": "起点",
        "skill": "",
        "prompt": "",
        "layer": "",
        "x": 80,
        "y": 180,
    }]
    edges: list[dict] = []
    prev = "start"
    used = {"start"}
    filled = [s for s in steps if isinstance(s, dict) and str(s.get("skill") or "").strip()]
    for i, step in enumerate(filled):
        nid = str(step.get("id") or "").strip()
        if not SAFE_ID.match(nid) or nid in used:
            nid = f"s{i + 1}"
            if nid in used:
                nid = f"s{i + 1}-{uuid.uuid4().hex[:4]}"
        used.add(nid)
        layer = str(step.get("layer") or "").strip()
        skill = str(step.get("skill") or "").strip()[:80]
        title = str(step.get("title") or "").strip() or LAYER_LABELS.get(layer, "") or skill
        nodes.append({
            "id": nid,
            "type": "skill",
            "title": title[:80],
            "skill": skill,
            "prompt": str(step.get("prompt") or "")[:4000],
            "layer": layer[:32],
            "x": 80.0 + (i + 1) * 240,
            "y": 180.0,
        })
        edges.append({"id": f"e-{prev}-{nid}"[:80], "source": prev, "target": nid})
        prev = nid
    return {
        "id": wf_id or new_id(),
        "name": (name or "").strip() or "未命名工作流",
        "persona": (persona or "").strip()[:80],
        "nodes": nodes,
        "edges": edges,
    }


def default_graph(name: str = "未命名工作流") -> dict:
    return graph_from_recipe(new_id(), name, [])
