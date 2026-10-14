"""资产库接口（对齐 Beav 的「资产库」）。

对应前端侧栏一级入口「资产库」，磁盘落在 asset-library/<标题>/asset.md。
"""
import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from easel import asset_library

router = APIRouter(prefix='/api/assets')


class AssetInput(BaseModel):
    title: str = Field(default='', max_length=200)
    type: str = Field(default='person', max_length=40)
    category: str = Field(default='', max_length=40)
    platform: str = Field(default='', max_length=40)
    cover: str = Field(default='', max_length=600)
    tags: list[str] = Field(default_factory=list)
    aliases: list[str] = Field(default_factory=list)
    description: str = Field(default='', max_length=20000)


class CategoryInput(BaseModel):
    name: str = Field(min_length=1, max_length=20)


def _fail(exc: asset_library.AssetError):
    return HTTPException(exc.status, str(exc))


@router.get('/status')
async def assets_status():
    return await asyncio.to_thread(asset_library.library_status)


@router.get('/items')
async def list_items(query: str = '', category: str = '', type: str = '', limit: int = 500):
    return {
        'items': await asyncio.to_thread(
            asset_library.list_assets, query, category, type, max(1, min(limit, 2000))
        )
    }


@router.post('/items')
async def create_item(payload: AssetInput):
    try:
        return await asyncio.to_thread(asset_library.create_asset, payload.model_dump())
    except asset_library.AssetError as exc:
        raise _fail(exc) from exc


@router.get('/items/{identifier}')
async def get_item(identifier: str):
    try:
        return await asyncio.to_thread(asset_library.get_asset, identifier)
    except asset_library.AssetError as exc:
        raise _fail(exc) from exc


@router.patch('/items/{identifier}')
async def patch_item(identifier: str, payload: AssetInput):
    try:
        current = await asyncio.to_thread(asset_library.get_asset, identifier)
        merged = payload.model_dump()
        merged['folder'] = current['folder']
        merged['id'] = current['id']
        # 未提交的字段保持原值：前端只送要改的部分，其余按旧值回填
        for key in ('title', 'type', 'category', 'platform', 'cover', 'description'):
            if not merged.get(key):
                merged[key] = current.get(key) or ''
        for key in ('tags', 'aliases'):
            if not merged.get(key):
                merged[key] = current.get(key) or []
        return await asyncio.to_thread(asset_library.write_asset, merged)
    except asset_library.AssetError as exc:
        raise _fail(exc) from exc


@router.delete('/items/{identifier}')
async def delete_item(identifier: str):
    try:
        return await asyncio.to_thread(asset_library.delete_asset, identifier)
    except asset_library.AssetError as exc:
        raise _fail(exc) from exc


@router.get('/file/{folder}/{filename}')
async def asset_file(folder: str, filename: str):
    """取资产文件夹里的本地图片。Beav 的封面写成同目录相对路径（./xxx.webp）。"""
    try:
        path = await asyncio.to_thread(asset_library.resolve_file, folder, filename)
    except asset_library.AssetError as exc:
        raise _fail(exc) from exc
    return FileResponse(path)


@router.get('/categories')
async def list_categories():
    return {'categories': await asyncio.to_thread(asset_library.list_categories)}


@router.post('/categories')
async def create_category(payload: CategoryInput):
    try:
        return await asyncio.to_thread(asset_library.create_category, payload.name)
    except asset_library.AssetError as exc:
        raise _fail(exc) from exc


@router.patch('/categories/{category_id}')
async def patch_category(category_id: str, payload: CategoryInput):
    try:
        return await asyncio.to_thread(asset_library.update_category, category_id, payload.name)
    except asset_library.AssetError as exc:
        raise _fail(exc) from exc


@router.delete('/categories/{category_id}')
async def delete_category(category_id: str):
    try:
        return await asyncio.to_thread(asset_library.delete_category, category_id)
    except asset_library.AssetError as exc:
        raise _fail(exc) from exc
