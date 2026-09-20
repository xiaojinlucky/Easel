"""把用户一句话导航到现有 SKILL.md。不新造技能，只读 skills/openclaw 的 frontmatter。"""

from __future__ import annotations

import argparse
import json
import re
import sys
from functools import lru_cache
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SKILLS_DIR = PROJECT_ROOT / "skills" / "openclaw"
SKILL_ROOTS = (
    PROJECT_ROOT / "skills" / "openclaw",
    PROJECT_ROOT / "skills" / "extensions",
)

LAYER_LABEL = {
    "discover": "发现",
    "plan": "策划",
    "produce": "制作",
    "publish": "发布",
    "attribute": "归因",
    "general": "基础",
}

LAYER_HINTS = {
    "discover": ("热点", "热搜", "趋势", "竞品", "新闻", "资讯", "节日", "发现", "ugc", "rss"),
    "plan": ("选题", "策划", "大纲", "排期", "定位", "钩子", "日历", "策略", "矩阵", "诊断"),
    "produce": ("写", "文案", "润色", "改写", "风格", "封面", "图片", "视频", "脚本", "卡片", "字幕", "配音", "口播", "笔记", "种草", "小红书", "成稿"),
    "publish": ("发布", "登录", "适配", "草稿", "合规", "检查", "一键发"),
    "attribute": ("数据", "粉丝", "评论", "阅读", "复盘", "归因", "账号"),
}

STAGE_TO_LAYER = {
    "discover": "discover",
    "plan": "plan",
    "produce": "produce",
    "publish": "publish",
    "attribute": "attribute",
    "发现": "discover",
    "策划": "plan",
    "制作": "produce",
    "发布": "publish",
    "归因": "attribute",
    "trends": "discover",
    "breakdown": "discover",
    "ideas": "plan",
    "calendar": "plan",
    "outputs": "produce",
    "accounts": "publish",
}


def project_root() -> Path:
    return PROJECT_ROOT


def _parse_frontmatter(path: Path) -> tuple[str, str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return "", ""
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end is None:
        return "", ""
    desc, layer = "", ""
    fm = lines[1:end]
    i = 0
    while i < len(fm):
        st = fm[i].strip()
        if st.startswith("layer:"):
            layer = st.split(":", 1)[1].strip().strip('"').strip("'")
            i += 1
        elif st.startswith("description:"):
            val = st.split(":", 1)[1].strip()
            if val and val[0] in "|>":
                block = []
                j = i + 1
                while j < len(fm):
                    if fm[j].strip() == "":
                        block.append("")
                        j += 1
                        continue
                    if len(fm[j]) - len(fm[j].lstrip()) == 0:
                        break
                    block.append(fm[j].strip())
                    j += 1
                desc = " ".join(x for x in block if x).strip()
                i = j
            else:
                desc = val.strip('"').strip("'")
                i += 1
        else:
            i += 1
    return desc, layer


def _catalog_stamp() -> tuple[int, int]:
    newest = 0
    count = 0
    for root in SKILL_ROOTS:
        if not root.is_dir():
            continue
        for child in root.iterdir():
            skill = child / "SKILL.md"
            if child.is_dir() and skill.is_file():
                count += 1
                newest = max(newest, int(skill.stat().st_mtime_ns))
    return (count, newest)


@lru_cache(maxsize=4)
def _catalog_cached(_stamp: tuple[int, int]) -> tuple[dict, ...]:
    items: list[dict] = []
    for root in SKILL_ROOTS:
        if not root.is_dir():
            continue
        rel_root = root.relative_to(PROJECT_ROOT).as_posix()
        for child in sorted(root.iterdir()):
            skill = child / "SKILL.md"
            if not (child.is_dir() and skill.is_file()):
                continue
            desc, layer = _parse_frontmatter(skill)
            items.append({
                "name": child.name,
                "description": desc,
                "layer": layer or "general",
                "path": f"{rel_root}/{child.name}/SKILL.md",
            })
    return tuple(items)


def summarize(description: str, name: str = "") -> str:
    """把 SKILL.md 描述收成一句人话标题，避免界面只剩英文缩写。"""
    text = re.sub(r"\s+", " ", (description or "").strip())
    if not text:
        return (name or "").replace("skill-", "").replace("-", " ") or name
    sent = re.split(r"[。！？]", text, maxsplit=1)[0].strip()
    if "，" in sent and len(sent) > 28:
        sent = sent.split("，", 1)[0].strip()
    if len(sent) > 40:
        sent = sent[:40].rstrip("，、；; ") + "…"
    return sent or name


def catalog() -> list[dict]:
    out = []
    for item in _catalog_cached(_catalog_stamp()):
        row = dict(item)
        row["summary"] = summarize(row.get("description") or "", row["name"])
        out.append(row)
    return out


def _purpose_text(description: str) -> str:
    """只取技能在干什么，去掉「当用户说 / 和某某的区别」以免抢分。"""
    text = re.sub(r"\s+", " ", (description or "").strip())
    return re.split(r"当用户说|和 skill-|本 SKILL|区别：", text, maxsplit=1)[0].strip()


def _trigger_text(description: str) -> str:
    found = re.findall(r"当用户说[“\"'](.+?)[”\"']时使用", description or "")
    return " ".join(found)


def _match_text(item: dict) -> str:
    desc = item.get("description") or ""
    title = item.get("summary") or summarize(desc, item.get("name") or "")
    return f"{item.get('name') or ''} {title} {_purpose_text(desc)} {_trigger_text(desc)}"


PLATFORM_WORDS = ("小红书", "抖音", "快手", "视频号", "B站", "微博", "知乎", "公众号", "微信")


def _query_for_layer(query: str, layer: str) -> str:
    """按层选技能时，去掉其它层的提示词，避免「做成小红书」污染发现层。平台名不删。"""
    out = query or ""
    keep_platform = layer in ("produce", "publish")
    drop = [
        word
        for other, words in LAYER_HINTS.items()
        if other != layer
        for word in words
        if not (keep_platform and word in PLATFORM_WORDS)
    ]
    for word in sorted(set(drop), key=len, reverse=True):
        if word in out:
            out = out.replace(word, " ")
    return re.sub(r"\s+", " ", out).strip()


def _mentioned_layers(query: str) -> list[str]:
    mentioned: list[str] = []
    publish_intent = any(word in query for word in LAYER_HINTS["publish"])
    for layer in LAYER_ORDER:
        words = LAYER_HINTS.get(layer, ())
        if layer == "produce" and publish_intent:
            words = tuple(word for word in words if word not in PLATFORM_WORDS)
        if any(word in query for word in words):
            mentioned.append(layer)
    return mentioned


def _tokens(text: str) -> set[str]:
    raw = (text or "").lower()
    toks = set(re.findall(r"[a-z0-9_\-]{2,}|[\u4e00-\u9fff]{2,}", raw))
    for run in re.findall(r"[\u4e00-\u9fff]+", raw):
        for i in range(len(run) - 1):
            toks.add(run[i:i + 2])
    return toks


def infer_layer(query: str, stage: str | None = None) -> str | None:
    if stage:
        mapped = STAGE_TO_LAYER.get(stage.strip().lower())
        if mapped:
            return mapped
    q = query or ""
    scores: dict[str, int] = {}
    for layer, words in LAYER_HINTS.items():
        scores[layer] = sum(1 for w in words if w in q)
    best = max(scores, key=scores.get)
    if not scores[best]:
        return None
    winners = [layer for layer, n in scores.items() if n == scores[best]]
    if len(winners) > 1:
        return None
    return best


_INVOKE_PREFIX = re.compile(
    r"(?:请执行\s*)+(?:/|\$)?(?:skill-)?[a-z0-9\-]+\s*[：:]\s*",
    re.I,
)


def clean_query(query: str) -> str:
    """去掉误叠进输入框的「请执行 /技能：」，只留用户原意。"""
    q = query or ""
    prev = None
    while prev != q:
        prev = q
        q = _INVOKE_PREFIX.sub("", q)
    return q.strip()


def _named_in_query(query: str) -> list[str]:
    """只把 /name、$name、skill-xxx 当点名，避免普通英文词误加 120 分。"""
    q = query or ""
    hits = []
    for match in re.finditer(
        r"(?:(?:/|\$)((?:skill-)?[a-z][a-z0-9\-]{2,}))|(skill-[a-z0-9\-]{2,})",
        q,
        re.I,
    ):
        hits.append(next(group for group in match.groups() if group))
    return hits


def route(
    query: str,
    stage: str | None = None,
    limit: int = 3,
    pin: str | None = None,
) -> list[dict]:
    items = catalog()
    if not items:
        return []
    from easel.skill_state import disabled_names
    blocked = disabled_names()
    items = [item for item in items if item["name"] not in blocked]
    if not items:
        return []
    q = clean_query(query)
    q_low = q.lower()
    q_toks = _tokens(q)
    layer = infer_layer(q, stage)
    named = {n.lower() for n in _named_in_query(q)}
    pin_l = (pin or "").strip().lower()
    scored: list[tuple[int, dict]] = []
    for item in items:
        name = item["name"]
        desc = item["description"]
        score = 0
        name_l = name.lower()
        if pin_l and (name_l == pin_l or name_l.replace("skill-", "") == pin_l.replace("skill-", "")):
            score += 200
        if name_l in named or name_l in q_low or name_l.replace("skill-", "") in named:
            score += 120
        hay_toks = _tokens(_match_text(item))
        overlap = q_toks & hay_toks
        score += 8 * len(overlap)
        if name_l.replace("skill-", "") in q_low:
            score += 40
        if layer and item["layer"] == layer:
            score += 18
        if q and q[:20] and q[:20] in desc:
            score += 12
        if layer in (None, "produce", "publish"):
            if "小红书" in q and re.search(r"xhs|xiaohongshu", name_l):
                score += 24
            if any(word in q for word in ("笔记", "图文", "一篇", "写", "文案", "种草")) and "note" in name_l and "video" not in name_l:
                score += 16
            if "卡片" not in q and "card" in name_l and any(word in q for word in ("一篇", "写", "文案", "笔记")):
                score -= 12
        if score > 0:
            scored.append((score, item))
    scored.sort(key=lambda pair: (-pair[0], pair[1]["name"]))
    out = []
    for score, item in scored[: max(1, min(limit, 8))]:
        row = dict(item)
        row["score"] = score
        row["layerLabel"] = LAYER_LABEL.get(item["layer"], item["layer"])
        out.append(row)
    return out


def format_route_block(matches: list[dict]) -> str:
    root = str(PROJECT_ROOT)
    lines = [
        "〔技能导航·非用户所说，勿复述〕",
        f"运行时项目根：{root}",
        "技能只在项目根 skills/openclaw/*/SKILL.md。不要在 OpenClaw workspace 里搜技能。",
    ]
    if not matches:
        lines.append("本轮没有高置信命中：先用通用能力；只有用户明确点名技能时再去读 SKILL.md。")
        return "\n".join(lines)
    lines.append("本轮主技能是第 1 条：先打开它的 SKILL.md，按其流程/脚本/数据源做，不要凭记忆裸做。其余为备选。")
    for i, item in enumerate(matches, 1):
        desc = re.sub(r"\s+", " ", item.get("description") or "").strip()
        if len(desc) > 80:
            desc = desc[:77] + "…"
        mark = "主技能 " if i == 1 else ""
        title = item.get("summary") or summarize(item.get("description") or "", item["name"])
        lines.append(
            f"{i}. {mark}{title} / {item['name']}（{item.get('layerLabel') or item.get('layer')}）"
            f" {item['path']}"
            + (f" — {desc}" if desc else "")
        )
    return "\n".join(lines)


LAYER_ORDER = ("discover", "plan", "produce", "publish", "attribute")
WF_STEP_RE = re.compile(
    r"WF_STEP\s+layer=([a-z]+)\s+skill=([a-z][a-z0-9\-]{2,})",
    re.I,
)
ASSEMBLE_REMINDER = (
    "〔配方助手·勿复述〕用户在工作流页说明目的。不要执行技能、不要写 outputs、不要去登录或发布。"
    "用中文先解释你会怎么拼：每步一句人话（环节 + 干什么），不要只丢英文名。"
    "最后必须用机器行收口，一行一个，只能用上面目录里的技能名："
    "WF_STEP layer=discover skill=skill-trending-topics"
    "不必五个环节都选；用户没提到的层不要硬凑。"
)


def format_catalog_digest() -> str:
    lines = ["〔配方目录·非用户所说，勿复述〕只许从下面选技能名："]
    for item in catalog():
        title = item.get("summary") or summarize(item.get("description") or "", item["name"])
        lines.append(f"{LAYER_LABEL.get(item['layer'], item['layer'])} | {item['name']} | {title}")
    return "\n".join(lines)


def format_assemble_hits(matches: list[dict]) -> str:
    lines = ["〔配方参考命中·勿复述〕只作选技能参考，不要打开 SKILL.md 去执行、不要写 outputs。"]
    if not matches:
        lines.append("没有特别高的命中：按用户目的从目录里挑，宁缺毋滥。")
        return "\n".join(lines)
    for i, item in enumerate(matches, 1):
        title = item.get("summary") or summarize(item.get("description") or "", item["name"])
        lines.append(
            f"{i}. {item.get('layerLabel') or LAYER_LABEL.get(item.get('layer') or '', item.get('layer'))}"
            f" · {title} / {item['name']}"
        )
    return "\n".join(lines)


def format_assemble_block(matches: list[dict]) -> str:
    return "\n\n".join([ASSEMBLE_REMINDER, format_catalog_digest(), format_assemble_hits(matches)])


def parse_wf_steps(text: str) -> list[dict]:
    names = {item["name"].lower(): item for item in catalog()}
    out: list[dict] = []
    seen: set[str] = set()
    for match in WF_STEP_RE.finditer(text or ""):
        layer = match.group(1).lower()
        skill = match.group(2).lower()
        item = names.get(skill)
        if not item or skill in seen:
            continue
        seen.add(skill)
        use_layer = layer if layer in LAYER_LABEL else item["layer"]
        out.append(_step_from_item(item, use_layer))
    return out


def _step_from_item(item: dict, layer: str | None = None) -> dict:
    use_layer = layer or item.get("layer") or "general"
    return {
        "name": item["name"],
        "layer": use_layer,
        "layerLabel": LAYER_LABEL.get(use_layer, use_layer),
        "summary": item.get("summary") or summarize(item.get("description") or "", item["name"]),
        "description": item.get("description") or "",
    }


def _suggest_reply(steps: list[dict]) -> str:
    if not steps:
        return "这句话里我还对不上现成技能。你可以再说具体一点，比如「先看热点再写成小红书」，或点左边环节自己选。"
    lines = ["按你的目的，我先用现成技能拼了这几步（还没开始跑）："]
    for i, step in enumerate(steps, 1):
        lines.append(f"{i}. {step['layerLabel']} · {step['summary']}（{step['name']}）")
    lines.append("点「采用到配方」会写到左边，你还可以改。不会自动运行。")
    return "\n".join(lines)


def suggest_recipe(query: str, limit: int = 4) -> dict:
    """按用户目的从现有 SKILL 拼一条配方。网关挂了也能用。"""
    q = clean_query(query)
    mentioned = _mentioned_layers(q)
    steps: list[dict] = []
    used: set[str] = set()
    for layer in mentioned:
        for hit in route(_query_for_layer(q, layer), stage=layer, limit=3):
            if hit.get("layer") != layer or hit["name"] in used:
                continue
            used.add(hit["name"])
            steps.append(_step_from_item(hit, layer))
            break
    if not steps and q:
        seen_layers: set[str] = set()
        for hit in route(q, limit=6):
            layer = hit.get("layer") or "general"
            if hit["name"] in used or layer in seen_layers:
                continue
            used.add(hit["name"])
            seen_layers.add(layer)
            steps.append(_step_from_item(hit, layer))
            if len(steps) >= min(max(limit, 1), 3):
                break
    steps = steps[: max(1, min(limit, 5))] if steps else []
    return {"query": q, "steps": steps, "reply": _suggest_reply(steps)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="导航到最匹配的 Easel SKILL")
    parser.add_argument("--query", "-q", default="", help="用户原话")
    parser.add_argument("--stage", "-s", default="", help="发现/策划/制作/发布/归因，或页面名")
    parser.add_argument("--limit", "-n", type=int, default=3)
    parser.add_argument("--pin", default="", help="用户点选的技能名，提升为主技能")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    matches = route(args.query, stage=args.stage or None, limit=args.limit, pin=args.pin or None)
    if args.json:
        json.dump(
            {"root": str(PROJECT_ROOT), "matches": matches},
            sys.stdout,
            ensure_ascii=False,
            indent=2,
        )
        sys.stdout.write("\n")
    else:
        print(format_route_block(matches))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
