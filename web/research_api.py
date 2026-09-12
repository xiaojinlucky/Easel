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
async def sources(query: str = ''):
    return research.list_sources(query[:200])


@router.post('/feeds/sync')
async def sync_feeds():
    from easel.feeds import sync_recent
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
    # This path saves a user-provided excerpt; it never fetches or executes its content.
    if request.url and not request.url.startswith(('http://', 'https://')):
        raise HTTPException(422, '来源请填写网页链接，或留空。')
    return research.save_source(request.url, request.title, '导入摘录', request.topic, request.content)


@router.post('/restore/{platform}')
async def restore(platform: str):
    if platform not in research.PLATFORMS.values():
        raise HTTPException(422, '来源不存在。')
    research.restore_platform(platform)
    return {'ok': True}
