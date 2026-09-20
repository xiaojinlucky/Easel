"""Chrome Native Messaging host: Beav 开源采集插件 → Easel 调研素材库。

个人非商用。宿主名 com.easel.research_clipper，不占用商业版 Beav 的
com.redbox.browser_control。
"""
from __future__ import annotations

import json
import struct
import sys
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from easel.research import save_source  # noqa: E402

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
        },
        "capabilities": {"hostMethods": HOST_METHODS},
    }


def _unwrap(params: dict) -> dict:
    if not isinstance(params, dict):
        return {}
    inner = params.get("payload") if isinstance(params.get("payload"), dict) else params
    return inner if isinstance(inner, dict) else {}


def _as_dict(value: object) -> dict:
    return value if isinstance(value, dict) else {}


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
    images = []
    for key in ("imageUrls", "images"):
        value = (
            note_assets.get(key)
            or assets.get(key)
            or note.get(key)
            or article.get(key)
            or inner.get(key)
        )
        if isinstance(value, list):
            images.extend(str(item) for item in value if item)
    cover = str(
        note_assets.get("coverUrl")
        or assets.get("coverUrl")
        or note.get("coverUrl")
        or article.get("coverUrl")
        or (images[0] if images else "")
    ).strip()
    if method == "knowledge.ingestMediaAssets":
        items = inner.get("items") if isinstance(inner.get("items"), list) else []
        for item in items:
            if isinstance(item, dict) and item.get("source"):
                images.append(str(item.get("source")))
                title = str(item.get("title") or title)[:300]
        cover = cover or (images[0] if images else "")
        text = text or "\n".join(images)
    comments_text = _join_comments(comments.get("items")) or str(content.get("commentsSnapshot") or inner.get("indexText") or "").strip()
    kind = str(inner.get("kind") or note.get("noteType") or method.replace("knowledge.ingest", "").replace("Entry", "") or "webpage")
    external_id = str(source.get("externalId") or note.get("noteId") or answer.get("id") or article.get("id") or "").strip()
    if method.endswith("Comments") or "comment" in kind.lower():
        external_id = external_id and f"comments-{external_id}" or external_id
    platform = "Beav采集"
    if "xhs" in kind.lower() or "xiaohongshu" in url:
        platform = "小红书"
    elif "zhihu" in url or "zhihu" in method.lower():
        platform = "知乎"
    elif "douyin" in url:
        platform = "抖音"
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
            "comments_text": comments_text,
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
    return {
        "success": True,
        "id": row.get("id"),
        "entryId": row.get("id"),
        "title": row.get("title"),
        "duplicate": False,
        "comments": {"captured": bool(entry["extra"].get("comments_text"))},
    }


def handle(method: str, params: dict) -> dict:
    if method == "ping":
        return _ok_ping()
    if method == "extension.register":
        return {"ok": True, "registered": True}
    if method == "desktop.health":
        return {"ok": True, "knowledge": {"counts": {"saved": True}}}
    if method == "desktop.context":
        return {
            "space": {"name": "Easel", "id": "easel-official"},
            "initialization": {"ready": True},
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
