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
    return await asyncio.to_thread(research.collection_status)


@router.get('/sources')
async def sources(query: str = '', limit: int = 200, offset: int = 0, kind: str = '',
                  platform: str = '', state: str = '', tag: str = '', sort: str = 'recent'):
    # 列表要分词 + FTS + 计数，素材库页每 6 秒就轮一次：放在事件循环里会把整个工作台卡住
    return await asyncio.to_thread(
        research.list_sources, query[:200], limit, offset, kind, platform, state, tag[:60], sort)


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
    from easel import research_enrich

    def read_and_nudge():
        value = research.index_status()
        # 扩展宿主进程只会投递任务，模型通道在本后端进程里：前端每 6 秒轮询这里时顺手把队列接上
        try:
            value['enrich_cooldown'] = round(research_enrich.channel_cooldown_remaining(), 1)
            if research_enrich._has_claimable():
                research_enrich.start_worker()
        except Exception:  # noqa: BLE001  触发失败不影响状态返回
            pass
        return value

    return await asyncio.to_thread(read_and_nudge)


@router.post('/migrate-kinds')
async def migrate_kinds():
    return await asyncio.to_thread(research.migrate_legacy_kinds)


class OcrRequest(BaseModel):
    ids: list[str] = Field(default_factory=list, max_length=200)
    limit: int = Field(default=20, ge=1, le=100)


@router.post('/refresh-ocr')
async def refresh_ocr(request: OcrRequest):
    if request.ids:
        def run():
            done = texts = 0
            for identifier in request.ids:
                try:
                    item = research.refresh_ocr(identifier)
                except research.CollectionError:
                    continue
                done += 1
                if (item.get('extra') or {}).get('ocr_text'):
                    texts += 1
            return {'processed': done, 'with_text': texts}
        return await asyncio.to_thread(run)
    return await asyncio.to_thread(research.refresh_ocr_batch, request.limit)


@router.get('/sources/{identifier}/export-folder')
async def export_source_folder(identifier: str):
    try:
        return await asyncio.to_thread(research.export_folder, identifier)
    except research.CollectionError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


class ExportRequest(BaseModel):
    ids: list[str] = Field(default_factory=list, max_length=500)
    format: str = Field(default='json', pattern='^(folder|json|csv)$')


@router.post('/export')
async def export_sources(request: ExportRequest):
    if not request.ids:
        raise HTTPException(422, '请勾选要导出的素材。')
    try:
        return await asyncio.to_thread(research.export_batch, request.ids, request.format)
    except research.CollectionError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


class EnrichRequest(BaseModel):
    ids: list[str] = Field(default_factory=list, max_length=200)
    limit: int = Field(default=50, ge=1, le=200)


@router.post('/enrich')
async def enrich(request: EnrichRequest):
    from easel import research_enrich
    if request.ids:
        def queue_selected() -> int:
            for identifier in request.ids:
                research.get_source(identifier)          # 不存在就抛，交给下面转成 404
                research_enrich.enqueue(identifier, 'enrich')
            return len(request.ids)
        try:
            queued = await asyncio.to_thread(queue_selected)
        except research.CollectionError as exc:
            raise HTTPException(exc.status, str(exc)) from exc
    else:
        queued = await asyncio.to_thread(research_enrich.enqueue_missing_enrich, request.limit)
    started = await asyncio.to_thread(research_enrich.start_worker)
    return {'queued': queued, 'workerStarted': started}


@router.get('/enrich/status')
async def enrich_status():
    from easel import research_enrich
    value = await asyncio.to_thread(research_enrich.queue_status)
    # 冷却期内队列一条都不领：不给出剩余秒数，前端只会显示"待处理 N 条"却看不出为什么不动
    value['channelCooldown'] = round(research_enrich.channel_cooldown_remaining(), 1)
    return value


@router.post('/sources/{identifier}/transcribe')
async def transcribe_source(identifier: str):
    from easel import research_enrich

    def queue_transcribe() -> None:
        item = research.get_source(identifier)
        video_url = str((item.get('extra') or {}).get('video_url') or '')
        if not video_url.startswith(('http://', 'https://')):
            raise research.CollectionError('这条素材里没有视频地址，无法转写。', 422)
        if not research.media_url_allowed(video_url):
            raise research.CollectionError('视频地址指向本机或内网，不会去请求它。', 422)
        research_enrich.enqueue(identifier, 'transcribe')

    try:
        await asyncio.to_thread(queue_transcribe)
    except research.CollectionError as exc:
        raise HTTPException(exc.status, str(exc)) from exc
    started = await asyncio.to_thread(research_enrich.start_worker)
    return {'queued': True, 'id': identifier, 'workerStarted': started}


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
        return await asyncio.to_thread(research.get_source, identifier)
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
    # save_source 会下载外链图片 / 跑 OCR / 写资产 / 建索引，是这条 API 里最慢的同步调用
    return await asyncio.to_thread(
        research.save_source, request.url, request.title, '导入摘录', request.topic, request.content)


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
