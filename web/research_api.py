import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from easel import research

router = APIRouter(prefix='/api/research')


class Capture(BaseModel):
    url: str = Field(min_length=8, max_length=4096)
    topic: str = Field(default='', max_length=100)


class Excerpt(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    url: str = Field(default='', max_length=4096)
    topic: str = Field(default='', max_length=100)
    content: str = Field(min_length=1, max_length=300000)


@router.get('/status')
async def research_status():
    return research.collection_status()


@router.get('/sources')
async def sources(query: str = '', limit: int = 200, offset: int = 0, kind: str = '',
                  platform: str = '', state: str = '', tag: str = '', sort: str = 'recent'):
    return research.list_sources(query[:200], limit=limit, offset=offset, kind=kind,
                                 platform=platform, state=state, tag=tag[:60], sort=sort)


class SourcePatch(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    topic: str | None = Field(default=None, max_length=100)
    content: str | None = Field(default=None, max_length=300000)
    summary: str | None = Field(default=None, max_length=1000)
    tags: list[str] | None = None
    pinned: bool | None = None


class BatchIds(BaseModel):
    ids: list[str] = Field(default_factory=list, max_length=200)


class TagRequest(BaseModel):
    tag: str = Field(min_length=1, max_length=60)


@router.patch('/sources/{identifier}')
async def patch_source(identifier: str, request: SourcePatch):
    payload = request.model_dump(exclude_none=True)
    if not payload:
        raise HTTPException(422, '没有要更新的字段。')
    try:
        return await asyncio.to_thread(research.update_source, identifier, **payload)
    except research.CollectionError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.delete('/sources/{identifier}')
async def delete_source(identifier: str):
    return {'deleted': await asyncio.to_thread(research.delete_sources, [identifier])}


@router.post('/sources/batch-delete')
async def batch_delete(request: BatchIds):
    return {'deleted': await asyncio.to_thread(research.delete_sources, request.ids)}


@router.post('/sources/{identifier}/tags')
async def add_source_tag(identifier: str, request: TagRequest):
    try:
        return await asyncio.to_thread(research.add_tag, identifier, request.tag)
    except research.CollectionError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.delete('/sources/{identifier}/tags/{tag}')
async def remove_source_tag(identifier: str, tag: str):
    try:
        return await asyncio.to_thread(research.remove_tag, identifier, tag)
    except research.CollectionError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.get('/trash')
async def trash():
    return {'items': await asyncio.to_thread(research.list_trash)}


@router.post('/trash/restore')
async def trash_restore(request: BatchIds):
    return {'restored': await asyncio.to_thread(research.restore_sources, request.ids)}


@router.post('/trash/purge')
async def trash_purge():
    return {'purged': await asyncio.to_thread(research.purge_expired)}


@router.post('/reindex')
async def reindex():
    return await asyncio.to_thread(research.reindex_all)


@router.get('/index-status')
async def index_status():
    return await asyncio.to_thread(research.index_status)


@router.post('/migrate-kinds')
async def migrate_kinds():
    return await asyncio.to_thread(research.migrate_legacy_kinds)


@router.post('/feeds/sync')
async def sync_feeds():
    try:
        from easel.feeds import sync_recent
    except ImportError as exc:
        raise HTTPException(503, '本机尚未配置订阅库，可用导入摘录或采集网页。') from exc
    try:
        return await asyncio.to_thread(sync_recent)
    except Exception as exc:
        raise HTTPException(503, '订阅同步失败：' + str(exc)) from exc


@router.get('/sources/{identifier}')
async def source(identifier: str):
    try:
        return research.get_source(identifier)
    except research.CollectionError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.post('/capture')
async def capture(request: Capture):
    try:
        return await asyncio.to_thread(research.capture, request.url, request.topic)
    except research.CollectionError as exc:
        raise HTTPException(exc.status, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(503, str(exc)) from exc


@router.post('/import')
async def import_excerpt(request: Excerpt):
    if request.url and not request.url.startswith(('http://', 'https://')):
        raise HTTPException(422, '来源请填写网页链接，或留空。')
    return research.save_source(request.url, request.title, '导入摘录', request.topic, request.content)


class BeavHostRequest(BaseModel):
    extensionId: str = Field(min_length=32, max_length=32)


@router.post('/beav-host')
async def install_beav_host(request: BeavHostRequest):
    import re
    import subprocess
    from easel.research_browser import ROOT
    ext = request.extensionId.strip().lower()
    if not re.fullmatch(r'[a-z]{32}', ext):
        raise HTTPException(422, '请填写 chrome://extensions 里 32 位扩展 ID。')
    script = ROOT / 'scripts' / 'install_beav_native_host.ps1'
    if not script.is_file():
        raise HTTPException(500, '未找到宿主安装脚本。')
    completed = await asyncio.to_thread(
        subprocess.run,
        ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(script), '-ExtensionId', ext],
        capture_output=True,
        text=True,
        encoding='utf-8',
    )
    if completed.returncode != 0:
        raise HTTPException(500, (completed.stderr or completed.stdout or '宿主注册失败')[-800:])
    return {'ok': True, 'extensionId': ext, 'host': 'com.easel.research_clipper'}


@router.post('/restore/{platform}')
async def restore(platform: str):
    if platform not in research.PLATFORMS.values():
        raise HTTPException(422, '来源不存在。')
    research.restore_platform(platform)
    return {'ok': True}
