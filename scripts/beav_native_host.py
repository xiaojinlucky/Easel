"""Chrome Native Messaging host: Beav 开源采集插件 → Easel 调研素材库。

个人非商用。宿主名 com.easel.research_clipper，不占用商业版 Beav 的
com.redbox.browser_control。
"""
from __future__ import annotations

import json
import os
import re
import struct
import sys
import traceback
from pathlib import Path
from urllib.parse import urlsplit


def _project_root() -> Path:
    env = (os.environ.get("EASEL_ROOT") or "").strip()
    if env:
        return Path(env)
    sidecar = Path(__file__).with_name("easel-root.txt")
    if sidecar.is_file():
        return Path(sidecar.read_text(encoding="utf-8-sig").strip())
    return Path(__file__).resolve().parents[1]


ROOT = _project_root()
sys.path.insert(0, str(ROOT))

from easel.research import (  # noqa: E402
    save_source,
    knowledge_counts,
    get_operation,
    put_operation,
    source_exists,
    media_url_allowed,
    asset_exists,
)

MAX_INBOUND_BYTES = 32 * 1024 * 1024   # 单帧上限：长度头能声明到 4GB，不设限一条坏帧就能撑爆宿主

HOST_NAME = "com.easel.research_clipper"
APP_VERSION = "2.7.18"
LOG = ROOT / ".runtime" / "beav-native-host.log"

HOST_METHODS = [
    "ping",
    "extension.register",
    "desktop.health",
    "desktop.context",
    "knowledge.ingestEntry",
    "knowledge.ingestXhsEntryV2",
    "knowledge.ingestZhihuAnswer",
    "knowledge.ingestZhihuArticle",
    "knowledge.ingestDocumentSource",
    "knowledge.ingestComments",
    "knowledge.ingestMediaAssets",
    "knowledge.batchIngest",
    "accounts.createImportSession",
    "accounts.upsertPostsBatch",
    "accounts.upsertCommentsBatch",
    "accounts.upsertMediaBatch",
    "accounts.completeImportSession",
]


def _log(message: str) -> None:
    try:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with LOG.open("a", encoding="utf-8") as handle:
            handle.write(message.rstrip() + "\n")
    except OSError:
        pass


def _read() -> dict | None:
    raw = sys.stdin.buffer.read(4)
    if not raw or len(raw) < 4:
        return None
    (length,) = struct.unpack("<I", raw)
    if length > MAX_INBOUND_BYTES:
        # 长度头能声明到 4GB：不设上限就等于让任何一个坏帧把宿主进程整个吃掉
        _log(f"refused oversized frame: {length} bytes > {MAX_INBOUND_BYTES}")
        return None
    payload = sys.stdin.buffer.read(length)
    if len(payload) < length:
        return None
    return json.loads(payload.decode("utf-8"))


def _write(message: dict) -> None:
    blob = json.dumps(message, ensure_ascii=False).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(blob)))
    sys.stdout.buffer.write(blob)
    sys.stdout.buffer.flush()


def _ok_ping() -> dict:
    return {
        "ok": True,
        "appVersion": APP_VERSION,
        "nativeConnected": True,
        "desktopBridge": {
            "connected": True,
            "appVersion": APP_VERSION,
            "availability": "connected",
            "browserControl": False,
        },
        "capabilities": {
            "hostMethods": HOST_METHODS,
            "browserControl": False,
            "debugger": False,
        },
    }


def _unwrap(params: dict) -> dict:
    if not isinstance(params, dict):
        return {}
    inner = params.get("payload") if isinstance(params.get("payload"), dict) else params
    return inner if isinstance(inner, dict) else {}


def _as_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


def _tags_from(note: dict, content: dict, inner: dict, text: str) -> list[str]:
    raw = note.get("tags") or content.get("tags") or inner.get("tags") or []
    if isinstance(raw, str):
        raw = [raw]
    tags = [str(item).strip().lstrip("#") for item in raw if str(item).strip()] if isinstance(raw, list) else []
    if not tags:
        tags = [item.strip() for item in re.findall(r"#([^\s#]+)", text)]
    seen: list[str] = []
    for tag in tags:
        if tag and tag not in seen:
            seen.append(tag)
    return seen[:24]


def _join_comments(items: object) -> str:
    if not isinstance(items, list):
        return ""
    lines = []
    for item in items[:200]:
        if not isinstance(item, dict):
            continue
        author = str(item.get("author") or item.get("nickname") or "").strip()
        text = str(item.get("text") or item.get("content") or "").strip()
        if text:
            lines.append(f"{author}：{text}" if author else text)
    return "\n".join(lines)


KIND_BY_METHOD = {
    "knowledge.ingestEntry": "webpage",
    "knowledge.ingestXhsEntryV2": "redbook-note",
    "knowledge.ingestZhihuAnswer": "zhihu-answer",
    "knowledge.ingestZhihuArticle": "zhihu-article",
    "knowledge.ingestDocumentSource": "document-source",
    "knowledge.ingestComments": "comments",
    "knowledge.ingestMediaAssets": "media",
}
KNOWN_KINDS = set(KIND_BY_METHOD.values()) | {"video"}
PLATFORM_BY_DOMAIN = {
    "xiaohongshu.com": "小红书", "xhslink.com": "小红书", "xhslink.cn": "小红书",
    "bilibili.com": "哔哩哔哩", "douyin.com": "抖音", "zhihu.com": "知乎",
    "mp.weixin.qq.com": "公众号", "weixin.qq.com": "公众号", "weibo.com": "微博",
    "youtube.com": "YouTube", "youtu.be": "YouTube", "x.com": "X", "twitter.com": "X",
    "reddit.com": "Reddit", "github.com": "GitHub",
}


def _normalize_kind(method: str, raw: str) -> str:
    raw = str(raw or "").strip().lower()
    if raw in KNOWN_KINDS:
        return raw
    if raw in {"视频", "video-note", "videonote"}:
        return "video"
    return KIND_BY_METHOD.get(method) or "webpage"


def _platform_from_url(url: str, kind: str) -> str:
    host = (urlsplit(url).hostname or "").lower()
    for domain, label in PLATFORM_BY_DOMAIN.items():
        if host == domain or host.endswith("." + domain):
            return label
    if kind.startswith(("redbook", "xhs")):
        return "小红书"
    if kind.startswith("zhihu"):
        return "知乎"
    return "Beav采集"


def extract_entry(method: str, params: dict) -> dict:
    inner = _unwrap(params)
    source = _as_dict(inner.get("source"))
    content = _as_dict(inner.get("content"))
    note = _as_dict(inner.get("note"))
    answer = _as_dict(inner.get("answer"))
    article = _as_dict(inner.get("article"))
    assets = _as_dict(inner.get("assets"))
    comments = _as_dict(inner.get("comments"))
    url = str(
        source.get("sourceUrl")
        or source.get("sourceLink")
        or note.get("url")
        or inner.get("url")
        or inner.get("homepageUrl")
        or ""
    ).strip()
    title = str(content.get("title") or note.get("title") or article.get("title") or inner.get("title") or "网页收藏").strip()[:300]
    text = str(
        note.get("text")
        or content.get("text")
        or answer.get("text")
        or article.get("text")
        or content.get("excerpt")
        or note.get("desc")
        or inner.get("text")
        or ""
    ).strip()
    note_assets = _as_dict(note.get("assets"))
    author_obj = note.get("author") if isinstance(note.get("author"), dict) else {}
    author = str(
        author_obj.get("nickname")
        or note.get("author")
        or content.get("author")
        or answer.get("author")
        or article.get("author")
        or ""
    ).strip()
    if author.startswith("{") and "nickname" in author:
        author = ""
    candidates: list[str] = []
    for key in ("imageUrls", "images"):
        value = (
            note_assets.get(key)
            or assets.get(key)
            or note.get(key)
            or article.get(key)
            or inner.get(key)
        )
        if isinstance(value, list):
            candidates.extend(str(item) for item in value if item)
    if method == "knowledge.ingestMediaAssets":
        items = inner.get("items") if isinstance(inner.get("items"), list) else []
        for item in items:
            if isinstance(item, dict) and item.get("source"):
                candidates.append(str(item.get("source")))
                title = str(item.get("title") or title)[:300]
    images = [item for item in candidates if item.startswith(("http://", "https://"))]
    data_images = [item for item in candidates if item.startswith("data:image/")]
    cover = str(
        note_assets.get("coverUrl")
        or assets.get("coverUrl")
        or note.get("coverUrl")
        or article.get("coverUrl")
        or ""
    ).strip()
    if cover.startswith("data:image/"):
        data_images.insert(0, cover)
        cover = images[0] if images else ""
    elif not cover:
        cover = images[0] if images else ""
    if method == "knowledge.ingestMediaAssets":
        text = text or "\n".join(images)
    video_url = str(
        note_assets.get("videoUrl")
        or assets.get("videoUrl")
        or note.get("videoUrl")
        or inner.get("videoUrl")
        or ""
    ).strip()
    options = _as_dict(inner.get("options"))
    pending_tasks: list[str] = []
    # 转写会真的去请求这个地址：本机/内网地址不投任务（worker 侧同一套判定，不各处再写一遍）。
    # 地址本身照常保存，不悄悄丢数据。
    if video_url and (options.get("transcribe") or inner.get("transcribe")) and media_url_allowed(video_url):
        pending_tasks.append("transcribe")
    comments_text = _join_comments(comments.get("items")) or str(content.get("commentsSnapshot") or inner.get("indexText") or "").strip()
    kind = _normalize_kind(method, str(inner.get("kind") or note.get("noteType") or ""))
    external_id = str(source.get("externalId") or note.get("noteId") or answer.get("id") or article.get("id") or "").strip()
    if method.endswith("Comments") or kind == "comments":
        external_id = external_id and f"comments-{external_id}" or external_id
    platform = _platform_from_url(url, kind)
    return {
        "url": url,
        "title": title,
        "text": text or url,
        "author": author,
        "kind": kind,
        "cover_url": cover,
        "platform": platform,
        "extra": {
            "external_id": external_id,
            "image_urls": images[:24],
            "data_images": data_images[:8],
            "video_url": video_url,
            "pending_tasks": pending_tasks,
            "comments_text": comments_text,
            "likes": _as_dict(note.get("stats") or content.get("stats")).get("likes")
            or _as_dict(note.get("stats")).get("likedCount"),
            "collects": _as_dict(note.get("stats") or content.get("stats")).get("collects")
            or _as_dict(note.get("stats")).get("collectedCount"),
            "comments": _as_dict(note.get("stats") or content.get("stats")).get("comments")
            or comments.get("total"),
            "tags": _tags_from(note, content, inner, text),
            "html": str(content.get("html") or answer.get("html") or article.get("html") or "")[:20000],
            "method": method,
        },
    }


def _text_from_payload(payload: dict) -> tuple[str, str, str]:
    entry = extract_entry("", payload if isinstance(payload, dict) else {})
    return entry["url"], entry["title"], entry["text"]


def _ingest(params: dict, method: str = "") -> dict:
    entry = extract_entry(method, params if isinstance(params, dict) else {})
    if not entry["url"].startswith(("http://", "https://")):
        raise ValueError("缺少可保存的网页链接")
    operation_id = str(
        (params or {}).get("operationId")
        or _unwrap(params or {}).get("operationId")
        or ""
    ).strip()
    cached = get_operation(operation_id)
    if cached:
        # 回执复放前先对账：素材可能事后被删或还在回收站，不能继续报 stored
        still_there = source_exists(str(cached.get("id") or ""))
        replayed = {**cached, "replayed": True}
        if not still_there:
            replayed.update({"success": False, "missing": True, "storageStatus": "missing"})
        return replayed
    row = save_source(
        entry["url"],
        entry["title"],
        entry["platform"],
        "",
        entry["text"],
        "Beav 开源浏览器插件",
        author=entry["author"],
        kind=entry["kind"],
        cover_url=entry["cover_url"],
        extra=entry["extra"],
    )
    status = str(row.get("save_status") or "created")
    receipt = {
        "success": True,
        "id": row.get("id"),
        "entryId": row.get("id"),
        "title": row.get("title"),
        "duplicate": status == "unchanged",
        "created": status == "created",
        "updated": status in {"updated", "preserved"},
        "storageStatus": "stored",
        "readBack": bool(row.get("content")) or asset_exists(row),
        "comments": {"captured": bool(entry["extra"].get("comments_text"))},
    }
    if row.get("refresh_failed"):
        receipt["preserved"] = True
    if status in {"created", "updated"}:
        wanted = ["enrich"] + (["transcribe"] if "transcribe" in (entry["extra"].get("pending_tasks") or []) else [])
        try:
            from easel import research_enrich

            source_id = str(row.get("id") or "")
            for name in wanted:
                research_enrich.enqueue(source_id, name)
            receipt["processing"] = {"queued": wanted}
        except Exception as exc:  # noqa: BLE001  加工队列故障不能挡入库，但要说出来
            _log("enqueue failed for " + str(row.get("id")) + ": " + repr(exc)[:200])
            receipt["processing"] = {"queued": [], "failed": str(exc)[:200] or exc.__class__.__name__}
    put_operation(operation_id, receipt)
    return receipt


def handle(method: str, params: dict) -> dict:
    if method == "ping":
        return _ok_ping()
    if method == "extension.register":
        return {"ok": True, "registered": True}
    if method == "desktop.health":
        return {"ok": True, "knowledge": {"counts": knowledge_counts()}}
    if method == "desktop.context":
        return {
            "space": {"name": "Easel", "id": "easel-official"},
            "initialization": {"ready": True, "state": "ready"},
            "ingest": {"allowed": True, "reason": "EASEL_RESEARCH"},
        }
    if method.startswith("knowledge.") or method.startswith("accounts."):
        if method == "knowledge.batchIngest":
            items = []
            blob = params.get("payload") if isinstance(params, dict) else {}
            entries = blob.get("entries") if isinstance(blob, dict) else None
            if not isinstance(entries, list):
                entries = [params]
            for item in entries:
                try:
                    items.append(_ingest(item if isinstance(item, dict) else {"payload": item}, method))
                except Exception as exc:  # noqa: BLE001
                    items.append({"success": False, "error": str(exc)})
            return {"success": True, "results": items}
        if method.startswith("accounts."):
            raise ValueError("账号档案导入尚未接到 Easel，请用保存笔记/网页。")
        return _ingest(params if isinstance(params, dict) else {}, method)
    raise ValueError(f"unsupported method: {method}")


def main() -> int:
    _log(f"host start {HOST_NAME}")
    while True:
        try:
            message = _read()
        except Exception:  # noqa: BLE001
            _log(traceback.format_exc())
            return 1
        if message is None:
            return 0
        msg_id = message.get("id")
        method = str(message.get("method") or "")
        params = message.get("params") if isinstance(message.get("params"), dict) else {}
        if not msg_id:
            continue
        try:
            result = handle(method, params)
            _write({"jsonrpc": "2.0", "id": str(msg_id), "result": result})
        except Exception as exc:  # noqa: BLE001
            _log(traceback.format_exc())
            _write({
                "jsonrpc": "2.0",
                "id": str(msg_id),
                "error": {"code": -32000, "message": str(exc)},
            })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
