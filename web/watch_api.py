"""盯账号：只收小红书和公众号，写成一篇后由页面交到现有发布。"""
import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from easel import persona, watch

router = APIRouter(prefix='/api/watch')


class TargetIn(BaseModel):
    platform: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=40)
    url: str = Field(default='', max_length=4096)


class PostIn(BaseModel):
    title: str = Field(default='', max_length=80)
    url: str = Field(default='', max_length=4096)
    text: str = Field(default='', max_length=8000)


class PromptIn(BaseModel):
    post_id: str = Field(min_length=1, max_length=64)
    persona: str = Field(default='', max_length=100)


class DraftIn(BaseModel):
    text: str = Field(default='', max_length=20000)


async def _run(function, *args):
    try:
        return await asyncio.to_thread(function, *args)
    except watch.WatchError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.get('')
async def targets():
    return await _run(watch.load)


@router.post('/targets')
async def create_target(body: TargetIn):
    return await _run(watch.add_target, body.platform, body.name, body.url)


@router.delete('/targets/{target_id}')
async def delete_target(target_id: str):
    await _run(watch.remove_target, target_id)
    return {'ok': True}


@router.post('/targets/{target_id}/refresh')
async def refresh(target_id: str):
    return await _run(watch.refresh_target, target_id)


@router.post('/targets/{target_id}/posts')
async def create_post(target_id: str, body: PostIn):
    return await _run(watch.add_post, target_id, body.title, body.url, body.text)


@router.delete('/posts/{post_id}')
async def delete_post(post_id: str):
    await _run(watch.remove_post, post_id)
    return {'ok': True}


@router.post('/prompt')
async def prompt(body: PromptIn):
    chosen = body.persona.strip()
    if not chosen or any(part in chosen for part in ('/', '\\', '..')) or not persona.profile_exists(chosen):
        raise HTTPException(400, '先在左边选一个画像。')

    def prepare():
        post = watch.ensure_post_text(body.post_id)
        return {'prompt': watch.task_prompt(post)}

    return await _run(prepare)


@router.post('/parse')
async def parse(body: DraftIn):
    return await _run(watch.parse_draft, body.text)
