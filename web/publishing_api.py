import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from easel import postiz

router = APIRouter(prefix='/api/publishing')


class MediaUpload(BaseModel):
    path: str = Field(min_length=1, max_length=1000)


@router.post('/postiz/media')
async def send_media(request: MediaUpload):
    from web.app import _safe_output_path, _is_protected
    path = _safe_output_path(request.path)
    if _is_protected(path) or path.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.mov', '.webm'):
        raise HTTPException(422, '请选择内容库中的图片或视频。')
    if path.stat().st_size > 50 * 1024 * 1024:
        raise HTTPException(413, '当前快捷传送支持 50 MB 以内媒体，大文件请在 Postiz 原生界面上传。')
    try:
        return await asyncio.to_thread(postiz.upload, path)
    except Exception as exc:
        raise HTTPException(503, '媒体传送失败：' + str(exc)) from exc
