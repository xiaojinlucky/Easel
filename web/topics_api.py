"""选题中心 · 灵感漫步接口（对齐 Beav 的 nav.wander）。"""
import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from easel import topic_center

router = APIRouter(prefix='/api/topics')


class WanderRequest(BaseModel):
    direction: str = Field(default='', max_length=200)
    anchor_id: str = Field(default='', max_length=80)
    count: int = Field(default=4, ge=2, le=8)
    topic_count: int = Field(default=3, ge=1, le=6)
    # 模型在本机要跑几十秒；通道慢时调用方需要能自己收窄等待上限（不传＝240s）
    timeout: int = Field(default=240, ge=10, le=600)


@router.get('/status')
async def topics_status():
    return await asyncio.to_thread(topic_center.status)


@router.get('')
async def list_topics(limit: int = 100):
    return {'items': await asyncio.to_thread(topic_center.list_topics, max(1, min(limit, 500)))}


@router.post('/wander')
async def wander(payload: WanderRequest):
    """提交一次灵感漫步：模型在本机后台跑，立刻返回 job，前端轮询 /wander/jobs/{id}。

    以前这里是同步等模型跑完，页面一切走就等于白跑一次；现在把「提交」和「取结果」拆开，
    切到别的板块、甚至刷新页面，回来还能接着看进度。
    """
    try:
        return await asyncio.to_thread(
            topic_center.start_wander_job, payload.direction, payload.anchor_id,
            payload.count, payload.topic_count, payload.timeout,
        )
    except topic_center.TopicError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.get('/wander/jobs')
async def wander_jobs(limit: int = 10):
    return {'items': await asyncio.to_thread(topic_center.list_wander_jobs, max(1, min(limit, 40)))}


@router.get('/wander/jobs/{job_id}')
async def wander_job(job_id: str):
    try:
        return await asyncio.to_thread(topic_center.get_wander_job, job_id)
    except topic_center.TopicError as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.delete('/{topic_id}')
async def delete_topic(topic_id: str):
    try:
        return await asyncio.to_thread(topic_center.delete_topic, topic_id)
    except topic_center.TopicError as exc:
        raise HTTPException(exc.status, str(exc)) from exc
