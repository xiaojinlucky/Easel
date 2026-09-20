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
    "knowledge.batchIngest",
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


def _text_from_payload(payload: dict) -> tuple[str, str, str]:
    if not isinstance(payload, dict):
        payload = {}
    inner = payload.get("payload") if isinstance(payload.get("payload"), dict) else payload
    source = inner.get("source") if isinstance(inner.get("source"), dict) else {}
    content = inner.get("content") if isinstance(inner.get("content"), dict) else {}
    note = inner.get("note") if isinstance(inner.get("note"), dict) else {}
    url = (
        source.get("sourceUrl")
        or source.get("sourceLink")
        or note.get("url")
        or inner.get("url")
        or ""
    )
    title = content.get("title") or note.get("title") or inner.get("title") or "网页收藏"
    text = (
        content.get("text")
        or content.get("excerpt")
        or note.get("desc")
        or inner.get("text")
        or url
    )
    return str(url).strip(), str(title).strip()[:300], str(text or "").strip()


def _ingest(params: dict) -> dict:
    url, title, text = _text_from_payload(params if isinstance(params, dict) else {})
    if not url.startswith(("http://", "https://")):
        raise ValueError("缺少可保存的网页链接")
    if not text:
        text = url
    row = save_source(url, title, "Beav采集", "", text, "Beav 开源浏览器插件")
    return {"success": True, "id": row.get("id"), "title": row.get("title")}


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
                    items.append(_ingest(item if isinstance(item, dict) else {"payload": item}))
                except Exception as exc:  # noqa: BLE001
                    items.append({"success": False, "error": str(exc)})
            return {"success": True, "results": items}
        return _ingest(params if isinstance(params, dict) else {})
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
