"""Meta 创作：复用素材快照、outputs、现有会话与卡片渲染器。"""
from __future__ import annotations

import copy
import datetime as dt
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import uuid
import zipfile
from pathlib import Path
from xml.etree import ElementTree

from fastapi import HTTPException
from pydantic import BaseModel, Field


SEARCH_FIELDS = {
    "title": "标题", "author": "作者", "summary": "摘要", "topic": "主题",
    "body": "正文", "transcript": "视频转写", "ocr": "图片文字", "keyPoints": "要点",
    "imageDesc": "图片内容", "commentsSay": "评论洞察", "hotComments": "热门评论",
    "useForMe": "创作用途", "whyHot": "传播原因",
}


def search_materials(cache: dict, query: str) -> list[dict]:
    terms = query.strip().casefold().split()
    if not terms:
        return cache["items"]
    if len(query) > 200:
        raise HTTPException(400, "搜索词请控制在 200 字内")
    found = []
    for item in cache["items"]:
        full = cache["full"].get(item["id"], item)
        fields = [(label, str(full.get(key) or "")) for key, label in SEARCH_FIELDS.items()]
        if not all(any(t in value.casefold() for _, value in fields) for t in terms):
            continue
        matches = []
        for label, value in fields:
            positions = [value.casefold().find(t) for t in terms if t in value.casefold()]
            if positions:
                start = max(0, min(positions) - 36)
                matches.append({"field": label, "snippet": ("…" if start else "") + value[start:start + 160] + ("…" if len(value) > start + 160 else "")})
        found.append({**item, "matches": matches[:3]})
    return found


class CreateWork(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    title: str = Field(default="未命名创作", max_length=160)
    sourceIds: list[str] = Field(default_factory=list, max_length=5)
    sourcePath: str = Field(default="", max_length=1000)
    ideaId: str = Field(default="", max_length=100)


class SaveWork(BaseModel):
    revision: int = Field(ge=0)
    operationId: str = Field(min_length=1, max_length=80)
    title: str = Field(max_length=160)
    body: str = Field(max_length=200000)
    label: str = Field(default="保存稿件", max_length=100)
    platforms: dict[str, str] = Field(default_factory=dict, max_length=12)
    tags: str = Field(default="", max_length=2000)
    media: list[str] = Field(default_factory=list, max_length=50)


class VersionAction(BaseModel):
    revision: int = Field(ge=0)
    operationId: str = Field(min_length=1, max_length=80)
    versionId: str


class CardAction(BaseModel):
    revision: int = Field(ge=0)
    operationId: str = Field(min_length=1, max_length=80)
    index: int | None = Field(default=None, ge=0, le=29)
    text: str = Field(default="", max_length=5000)


class CreationStore:
    def __init__(self, outputs: Path, project: Path, materials, related):
        self.root = outputs.resolve()
        self.project = project
        self.directory = self.root / "_meta" / "creations"
        self.materials = materials
        self.related = related
        self.lock = threading.RLock()

    def path(self, work_id: str) -> Path:
        if not re.fullmatch(r"[a-f0-9]{32}", work_id):
            raise HTTPException(400, "创作编号不合法")
        return self.directory / f"{work_id}.json"

    def file(self, rel: str) -> Path:
        full = (self.root / rel).resolve()
        if not rel or self.root not in full.parents:
            raise HTTPException(400, "文件必须在内容库中")
        return full

    def read(self, work_id: str) -> dict:
        path = self.path(work_id)
        if not path.is_file():
            raise HTTPException(404, "未找到这篇创作")
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError) as exc:
            raise HTTPException(500, "创作记录读取失败，请保留文件并重试") from exc

    def write(self, work: dict):
        self.directory.mkdir(parents=True, exist_ok=True)
        path = self.path(work["id"])
        temp = path.with_suffix(".tmp")
        temp.write_text(json.dumps(work, ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(path)

    def view(self, work: dict) -> dict:
        result = copy.deepcopy(work)
        result["body"] = ""
        result["fileError"] = ""
        if work["versions"]:
            current = work["versions"][-1]
            try:
                result["body"] = self.file(current["bodyPath"]).read_text(encoding="utf-8")
            except OSError:
                result["fileError"] = "当前稿件文件不在原位置，请在内容库查找；已有版本记录已保留。"
        result["related"] = self.related(work["id"])
        return result

    def imported_body(self, rel: str) -> str:
        path = self.file(rel)
        parts = path.relative_to(self.root).parts
        if any(p.startswith((".", "_")) or p == "03-变现交付" for p in parts):
            raise HTTPException(403, "该目录不用于创作导入")
        if not path.is_file():
            raise HTTPException(404, "原稿不存在")
        if path.stat().st_size > 12 * 1024 * 1024:
            raise HTTPException(400, "请导入 12 MB 以内的文字稿")
        if path.suffix.lower() in (".md", ".txt"):
            try:
                text = path.read_text(encoding="utf-8-sig")
            except UnicodeError as exc:
                raise HTTPException(400, "请先另存为 UTF-8 文本") from exc
        elif path.suffix.lower() == ".docx":
            try:
                with zipfile.ZipFile(path) as archive:
                    if archive.getinfo("word/document.xml").file_size > 2_000_000:
                        raise HTTPException(400, "Word 正文过大，请按篇拆分")
                    doc = ElementTree.fromstring(archive.read("word/document.xml"))
                ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
                text = "\n\n".join("".join(p.itertext()) for p in doc.iter(ns + "p"))
            except (zipfile.BadZipFile, KeyError, ElementTree.ParseError) as exc:
                raise HTTPException(400, "无法读取这个 Word 文件") from exc
        else:
            raise HTTPException(400, "创作导入支持 Markdown、TXT 和 DOCX")
        if len(text) > 200000:
            raise HTTPException(400, "正文过长，请按篇拆分")
        return text

    def create(self, req: CreateWork) -> dict:
        with self.lock:
            if self.path(req.id).exists():
                work = self.read(req.id)
                if work.get("creationRequest") != req.model_dump():
                    raise HTTPException(409, "此编号已用于另一篇创作")
                return self.view(work)
            full = self.materials()["full"]
            ids = list(dict.fromkeys(req.sourceIds))
            if any(rid not in full for rid in ids):
                raise HTTPException(404, "部分素材已不在当前快照，请重新选择")
            sources = [{**{key: full[rid].get(key, "") for key in ("id", "title", "link", "platform", "author")},
                        "content": {key: full[rid].get(key, "") for key in SEARCH_FIELDS}} for rid in ids]
            work = {"id": req.id, "title": req.title.strip() or "未命名创作", "sourceIds": ids,
                    "sources": sources, "sourcePath": req.sourcePath, "ideaId": req.ideaId,
                    "sessionId": "creation-" + req.id, "revision": 0, "versions": [],
                    "createdAt": dt.datetime.now().isoformat(timespec="seconds"), "creationRequest": req.model_dump()}
            body = self.imported_body(req.sourcePath) if req.sourcePath else ""
            self.commit(work, SaveWork(revision=0, operationId="initial", title=work["title"], body=body,
                                      label="从原稿另存" if req.sourcePath else "开始创作"))
            return self.view(work)

    def check(self, work: dict, revision: int, operation: str) -> bool:
        if any(v["operationId"] == operation for v in work["versions"]):
            return False
        if work["revision"] != revision:
            raise HTTPException(409, "这篇创作已有新版本。你的编辑已保留，请重新载入后对照保存。")
        return True

    def commit(self, work: dict, req: SaveWork, cards: list[dict] | None = None) -> None:
        if any(not re.fullmatch(r"[a-z0-9-]{1,40}", key) or len(value) > 200000 for key, value in req.platforms.items()):
            raise HTTPException(400, "平台版本的名称或长度不合法")
        for rel in req.media:
            path = self.file(rel)
            if not path.is_file() or any(p.startswith(("_", ".")) for p in path.relative_to(self.root).parts):
                raise HTTPException(400, "媒体文件不存在或不属于内容库")
        revision = work["revision"] + 1
        slug = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "-", req.title).strip(" .")[:48] or "创作"
        folder = self.root / "meta-drafts" / f"{dt.date.today()}-{slug}-{work['id'][:8]}-v{revision}-{uuid.uuid4().hex[:6]}"
        folder.mkdir(parents=True, exist_ok=False)
        try:
            body_path = folder / "母稿.md"
            body_path.write_text(req.body, encoding="utf-8")
            for platform, body in req.platforms.items():
                (folder / f"{platform}.md").write_text(body, encoding="utf-8")
            previous = work["versions"][-1] if work["versions"] else {}
            version = {"id": uuid.uuid4().hex, "number": revision, "title": req.title,
                       "createdAt": dt.datetime.now().isoformat(timespec="seconds"), "label": req.label,
                       "operationId": req.operationId, "bodyPath": body_path.relative_to(self.root).as_posix(),
                       "bodyHash": hashlib.sha256(req.body.encode()).hexdigest(), "platforms": req.platforms,
                       "tags": req.tags, "media": req.media, "cards": cards if cards is not None else previous.get("cards", [])}
            work.update(title=req.title.strip() or "未命名创作", revision=revision, updatedAt=version["createdAt"])
            work["versions"].append(version)
            self.write(work)
        except Exception:
            # Only this attempt's newly created folder; never a user's original or a committed version.
            shutil.rmtree(folder)
            raise

    def save(self, work_id: str, req: SaveWork) -> dict:
        with self.lock:
            work = self.read(work_id)
            if self.check(work, req.revision, req.operationId):
                self.commit(work, req)
            return self.view(work)

    def restore(self, work_id: str, req: VersionAction) -> dict:
        with self.lock:
            work = self.read(work_id)
            if not self.check(work, req.revision, req.operationId):
                return self.view(work)
            old = next((v for v in work["versions"] if v["id"] == req.versionId), None)
            if not old:
                raise HTTPException(404, "未找到这个版本")
            try:
                body = self.file(old["bodyPath"]).read_text(encoding="utf-8")
            except OSError as exc:
                raise HTTPException(409, "历史稿件文件缺失，未覆盖当前稿件") from exc
            self.commit(work, SaveWork(revision=req.revision, operationId=req.operationId, title=old["title"], body=body,
                                      label=f"恢复版本 {old['number']}", platforms=old["platforms"], tags=old["tags"], media=old["media"]), copy.deepcopy(old["cards"]))
            return self.view(work)

    def render_cards(self, work_id: str, req: CardAction) -> dict:
        with self.lock:
            work = self.read(work_id)
            if not self.check(work, req.revision, req.operationId):
                return self.view(work)
            current = work["versions"][-1]
            body = self.view(work)["body"]
            if not body.strip() or len(body) > 20000:
                raise HTTPException(400, "请先保存非空稿件；一次卡片排版支持 2 万字以内")
            cards = copy.deepcopy(current["cards"])
            if req.index is not None and req.index >= len(cards):
                raise HTTPException(400, "该卡片不存在")
            if req.index is not None and not req.text.strip():
                raise HTTPException(400, "单张卡片内容不能为空")
        # Rendering is slow: do it outside the lock, then reject a stale revision before committing.
        self.directory.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="render-", dir=self.directory) as temp:
            folder = Path(temp)
            (folder / "input.md").write_text(req.text if req.index is not None else body, encoding="utf-8")
            cmd = [sys.executable, str(self.project / "skills/builtin/text-to-card/render_card.py"),
                   str(folder / "input.md"), str(folder / "cards"), "--manifest", str(folder / "manifest.json")]
            if req.index is not None:
                cmd += ["--single", "1", "--continuation", "1" if req.index else "0"]
            try:
                run = subprocess.run(cmd, cwd=self.project, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
            except subprocess.TimeoutExpired as exc:
                raise HTTPException(504, "卡片排版超时，原卡片未改变") from exc
            if run.returncode:
                raise HTTPException(400, "卡片排版失败，原卡片未改变。" + (run.stderr or run.stdout)[-700:])
            manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
            if not 1 <= len(manifest) <= 30:
                raise HTTPException(400, "卡片数量须为 1–30 张，请缩短稿件")
            with self.lock:
                work = self.read(work_id)
                if not self.check(work, req.revision, req.operationId):
                    return self.view(work)
                asset_dir = self.root / "meta-drafts" / f"cards-{work_id[:8]}-{uuid.uuid4().hex[:10]}"
                asset_dir.mkdir(parents=True, exist_ok=False)
                try:
                    rendered = []
                    for page in manifest:
                        source = folder / "cards" / page["file"]
                        dest = asset_dir / page["file"]
                        shutil.copy2(source, dest)
                        rendered.append({"path": dest.relative_to(self.root).as_posix(), "text": page["text"],
                                         "bodyHash": current["bodyHash"], "edited": req.index is not None})
                    if req.index is None:
                        cards = rendered
                    else:
                        cards[req.index] = rendered[0]
                    self.commit(work, SaveWork(revision=req.revision, operationId=req.operationId, title=work["title"], body=body,
                                              label="生成文字卡片" if req.index is None else f"只改第 {req.index + 1} 张卡片",
                                              platforms=current["platforms"], tags=current["tags"], media=current["media"]), cards)
                except Exception:
                    shutil.rmtree(asset_dir)
                    raise
                return self.view(work)

    def relocations(self, old: str, new: str):
        def remap(value):
            if isinstance(value, str):
                return new + value[len(old):] if value == old or value.startswith(old + "/") else value
            if isinstance(value, list):
                return [remap(v) for v in value]
            if isinstance(value, dict):
                return {k: remap(v) if k in {"bodyPath", "path", "sourcePath", "media", "cards", "versions"} else v for k, v in value.items()}
            return value
        changes = []
        for path in self.directory.glob("*.json"):
            work = self.read(path.stem)
            updated = remap(work)
            if updated != work:
                changes.append((work, updated))
        return changes

    def relocate(self, old: str, new: str):
        with self.lock:
            for _, updated in self.relocations(old, new):
                self.write(updated)

    def move_output(self, source: Path, destination: Path):
        """Preflight linked records before moving; roll back this move if a metadata write fails."""
        with self.lock:
            changes = self.relocations(source.relative_to(self.root).as_posix(), destination.relative_to(self.root).as_posix())
            # Backups are prepared before any move. Rollback uses rename, not another JSON write.
            backups = []
            for original, _ in changes:
                backup = self.path(original["id"]).with_suffix(f".move-{uuid.uuid4().hex}.bak")
                shutil.copy2(self.path(original["id"]), backup)
                backups.append((original["id"], backup))
            shutil.move(str(source), str(destination))
            try:
                for _, updated in changes:
                    self.write(updated)
            except Exception:
                shutil.move(str(destination), str(source))
                for work_id, backup in backups:
                    backup.replace(self.path(work_id))
                raise
            else:
                for _, backup in backups:
                    backup.unlink()


def install_creation_workspace(app, outputs: Path, project: Path, materials, related) -> CreationStore:
    store = CreationStore(outputs, project, materials, related)

    @app.get("/api/creations")
    def list_works():
        items, errors = [], []
        for path in store.directory.glob("*.json"):
            try:
                work = store.read(path.stem)
                items.append({k: work[k] for k in ("id", "title", "revision", "sourceIds", "updatedAt", "sessionId")})
            except HTTPException:
                errors.append(path.stem)
        return {"items": sorted(items, key=lambda w: w["updatedAt"], reverse=True), "unreadable": errors}

    @app.post("/api/creations")
    def create_work(req: CreateWork):
        return store.create(req)

    @app.get("/api/creations/{work_id}")
    def get_work(work_id: str):
        return store.view(store.read(work_id))

    @app.post("/api/creations/{work_id}/versions")
    def save_work(work_id: str, req: SaveWork):
        return store.save(work_id, req)

    @app.post("/api/creations/{work_id}/restore")
    def restore_work(work_id: str, req: VersionAction):
        return store.restore(work_id, req)

    @app.post("/api/creations/{work_id}/cards")
    def render_cards(work_id: str, req: CardAction):
        return store.render_cards(work_id, req)

    @app.get("/api/creations/{work_id}/context")
    def work_context(work_id: str):
        work = store.read(work_id)
        # New creations hold the chosen source text, so later snapshot refreshes cannot change a draft's evidence.
        full = materials()["full"] if any("content" not in source for source in work["sources"]) else {}
        sources = [{**source, "content": source.get("content", {key: full.get(source["id"], {}).get(key, "") for key in SEARCH_FIELDS}),
                    "snapshot": "captured" if "content" in source else "legacy-current"} for source in work["sources"]]
        return {"workId": work_id, "title": work["title"], "sources": sources, "sourcePath": work["sourcePath"],
                "bodyPath": work["versions"][-1]["bodyPath"], "body": store.view(work)["body"]}

    return store
