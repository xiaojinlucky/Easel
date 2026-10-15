# -*- coding: utf-8 -*-
"""Meta 工作台 · 素材库「最推荐」打分（离线、可解释、不调付费 API）。

总分 100 = 画像贴合 45 + 爆款信号 25 + 新鲜度 15 + 信息完整 10 + 飞书「选题潜力」5
- 画像贴合：按 meta-profile\\推荐词表.json 的主题组（来自最终画像的内容支柱）匹配标题/摘要/专题/要点/正文。
  标题命中算 2 次。每组有权重，最多计 3 组。词表可以自己改。
- 爆款信号：同平台内（赞+藏+评）或热度分，相对该平台中位数的倍数，取对数：1 倍=0，≥30 倍=满分。
- 新鲜度：按发布时间（没有就用收藏时间），半衰期 180 天。
- 信息完整：有正文/转写/图字、要点、摘要、封面、「对你有什么用」各 2 分。
结果缓存到 G:\\MetaWorkbench-deps\\cache\\materials-recommend.json。
素材快照或画像（含词表）变了就重算，所以点「更新」或改画像后会自动重排。
"""
from __future__ import annotations
import hashlib, json, math, os, re, statistics, time
from pathlib import Path

ROOT = Path(os.environ.get("META_ROOT", r"F:\科研大师兄\自媒体工作台"))
PROFILE_DIR = ROOT / "meta-profile" / "画像"
LEX_FILE = ROOT / "meta-profile" / "推荐词表.json"
CACHE = Path(os.environ.get("META_REC_CACHE", r"G:\MetaWorkbench-deps\cache\materials-recommend.json"))

DEFAULT_LEX = {
    "_说明": "最推荐打分用的主题词。weight 越大越贴合画像；label 会显示在卡片上。改完保存，下次打开素材库自动重算。",
    "groups": [
        {"label": "单细胞", "weight": 10, "words": ["单细胞", "scRNA", "Seurat", "Scanpy", "细胞注释", "人工注释", "聚类", "亚群", "UMAP", "高变基因", "FindMarkers", "细胞类型", "marker", "拟时序", "CellChat", "细胞通讯"]},
        {"label": "空间多组学", "weight": 10, "words": ["空间转录组", "空间组学", "空间多组学", "Visium", "Xenium", "Stereo", "多组学"]},
        {"label": "AI 辅助科研", "weight": 9, "words": ["AI", "GPT", "ChatGPT", "Codex", "Claude", "Gemini", "大模型", "提示词", "Prompt", "Agent", "智能体", "skill", "DeepSeek", "Kimi", "AI科研"]},
        {"label": "生信分析", "weight": 8, "words": ["生信", "生物信息", "差异分析", "富集", "GSEA", "GEO", "TCGA", "R语言", "Python", "代码", "bulk", "转录组", "WGCNA", "孟德尔随机化"]},
        {"label": "科研绘图与组图", "weight": 7, "words": ["绘图", "组图", "Figure", "配色", "排版", "可视化", "热图", "火山图", "作图", "Illustrator"]},
        {"label": "课题与开题答辩", "weight": 7, "words": ["课题", "开题", "答辩", "组会", "汇报", "PPT", "选题", "研究思路", "创新点", "idea"]},
        {"label": "读文献与写论文", "weight": 6, "words": ["文献", "论文", "SCI", "写作", "投稿", "审稿", "综述", "Nature", "Cell", "Science", "顶刊"]},
        {"label": "肿瘤与医学研究", "weight": 5, "words": ["肿瘤", "癌", "免疫", "临床", "医学", "微环境", "巨噬细胞", "T细胞"]},
        {"label": "研究生成长", "weight": 3, "words": ["导师", "读博", "博士", "研究生", "科研新手", "科研小白"]},
    ],
}


def _lex() -> dict:
    try:
        if LEX_FILE.is_file():
            return json.loads(LEX_FILE.read_text(encoding="utf-8"))
        LEX_FILE.parent.mkdir(parents=True, exist_ok=True)
        LEX_FILE.write_text(json.dumps(DEFAULT_LEX, ensure_ascii=False, indent=1), encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    return DEFAULT_LEX


def _profile_sig(lex: dict) -> str:
    h = hashlib.sha1(json.dumps(lex, ensure_ascii=False, sort_keys=True).encode())
    for f in sorted(PROFILE_DIR.glob("*.md")) if PROFILE_DIR.is_dir() else []:
        h.update(f.read_bytes())
    return h.hexdigest()[:16]


def _has(text: str, w: str) -> bool:
    w = w.lower()
    if w.isascii():
        return re.search(r"(?<![a-z])" + re.escape(w) + r"(?![a-z])", text) is not None
    return w in text


def _days(d: str) -> float | None:
    try:
        return max(0.0, (time.time() - time.mktime(time.strptime(d[:10], "%Y-%m-%d"))) / 86400)
    except Exception:  # noqa: BLE001
        return None


def _eng(it: dict) -> float | None:
    vals = [it.get(k) for k in ("likes", "collects", "comments")]
    if any(v is not None for v in vals):
        return sum(v or 0 for v in vals)
    return it.get("heat")


def compute(items: list[dict], full: dict, snap_key: str) -> dict:
    lex = _lex(); sig = _profile_sig(lex); key = f"{snap_key}|{sig}|{Path(__file__).stat().st_mtime}"
    try:
        c = json.loads(CACHE.read_text(encoding="utf-8"))
        if c.get("key") == key:
            return c["scores"]
    except Exception:  # noqa: BLE001
        pass
    groups = lex.get("groups") or DEFAULT_LEX["groups"]
    wmax = max(g["weight"] for g in groups)
    med: dict[str, float] = {}
    by: dict[str, list] = {}
    for it in items:
        e = _eng(it)
        if e is not None and e > 0:
            by.setdefault(it.get("platform", ""), []).append(e)
    for p, v in by.items():
        med[p] = statistics.median(v)
    out = {}
    for it in items:
        f = full.get(it["id"], {})
        title = (it.get("title") or "").lower()
        # 只看素材本身（标题、摘要、专题、要点、正文前 3000 字）。「对你有什么用」是 AI 按画像写的，不算，免得每条都贴合
        text = " ".join(str(f.get(k) or it.get(k) or "") for k in ("summary", "topic", "keyPoints"))[:3000].lower() + " " + \
            " ".join(str(f.get(k) or "") for k in ("body", "transcript", "ocr"))[:3000].lower()
        hits = []
        for g in groups:
            ws = [w for w in g["words"] if _has(title, w)]
            wb = [w for w in g["words"] if w not in ws and _has(text, w)]
            n = 2 * len(ws) + len(wb)
            if n:
                hits.append((g["weight"] * min(1.0, 0.3 + 0.2 * n), g["label"], (ws + wb)[:2]))
        hits.sort(key=lambda x: -x[0])
        rel = min(45.0, sum(h[0] for h in hits[:3]) / (wmax * 2.2) * 45) if hits else 0.0
        e = _eng(it); m = med.get(it.get("platform", ""))
        ratio = (e / m) if (e is not None and m) else None
        hot = 0.0 if not ratio or ratio <= 1 else min(25.0, 25 * math.log(ratio) / math.log(30))
        d = _days(it.get("publishedAt") or "")
        d_kind = "发布"
        if d is None:
            d = _days(it.get("collectedAt") or "")
            d_kind = "收藏"
        fresh = 15 * 0.5 ** (d / 180) if d is not None else 4.0
        comp = 2 * sum(bool((f.get(k) or "").strip()) for k in ("keyPoints", "summary", "useForMe")) \
            + 2 * bool(any((f.get(k) or "").strip() for k in ("body", "transcript", "ocr"))) + 2 * bool(it.get("cover"))
        pot = {"高": 5, "中": 2.5}.get((it.get("potential") or "").strip()[:1], 0)
        score = round(rel + hot + fresh + comp + pot, 1)
        why = []
        if hits:
            why.append("贴合：" + "、".join(f"{h[1]}·{h[2][0]}" for h in hits[:2]))
        else:
            why.append("和画像主题关系不大")
        if ratio and ratio >= 2:
            why.append(f"互动是收藏库内同平台素材中位数的 {ratio:.1f} 倍")
        if d is not None and d <= 30:
            why.append(f"一个月内{d_kind}")
        if pot >= 5:
            why.append("飞书标了值得写")
        out[it["id"]] = {"score": score, "reason": "｜".join(why),
                         "parts": {"贴合": round(rel, 1), "爆款": round(hot, 1), "新鲜": round(fresh, 1), "完整": comp, "潜力": pot}}
    try:
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        tmp = CACHE.with_suffix(".tmp")
        tmp.write_text(json.dumps({"key": key, "at": time.strftime("%Y-%m-%d %H:%M"), "scores": out}, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, CACHE)
    except Exception:  # noqa: BLE001
        pass
    return out
