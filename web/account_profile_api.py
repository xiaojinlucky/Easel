import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from easel import account_profile, research

router = APIRouter(prefix='/api/account-profile')


class Build(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    source_ids: list[str] = Field(min_length=1, max_length=20)
    homepage_url: str = Field(default='', max_length=4096)
    intent: str = Field(default='', max_length=10000)


class Active(BaseModel):
    content: str = Field(min_length=1, max_length=100000)
    expected_version: int = Field(ge=0)


class FromSession(BaseModel):
    session_id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=100)
    intent: str = Field(default='', max_length=10000)


async def invoke(function, *args):
    try:
        return await asyncio.to_thread(function, *args)
    except (account_profile.ProfileError, research.CollectionError) as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.post('/build', status_code=202)
async def build(request: Build):
    return await invoke(account_profile.build, request.name, request.source_ids, request.homepage_url, request.intent)


@router.get('/sessions')
async def sessions(limit: int = 20):
    return {'items': await invoke(research.list_account_sessions, limit)}


@router.get('/sessions/{session_id}')
async def session(session_id: str):
    return await invoke(research.account_session_detail, session_id)


@router.post('/from-session', status_code=202)
async def build_from_session(request: FromSession):
    """把一次账号导入挂上的素材直接喂给画像分析；证据预算超了从尾部让位，不悄悄截断正文。"""
    detail = await invoke(research.account_session_detail, request.session_id)
    candidates = list(dict.fromkeys(detail['source_ids']))
    picked: list[str] = []
    budget = 180_000
    for identifier in candidates:
        try:
            source = await invoke(research.get_source, identifier)
        except HTTPException:
            continue    # 导入后素材被删或进了回收站：跳过，不为一条缺项毁掉整次生成
        content = str(source.get('content') or '').strip()
        if source.get('state') != 'saved' or not content:
            continue
        if len(picked) >= 20 or budget - len(content) < 0:
            break
        budget -= len(content)
        picked.append(identifier)
    if not picked:
        raise HTTPException(422, '这次导入没有可回读的素材正文，无法生成画像；先去素材库确认采集是否成功。')
    job = await invoke(account_profile.build, request.name, picked, detail.get('homepage_url') or '', request.intent)
    return {**job, 'used_source_count': len(picked), 'linked_source_count': len(candidates),
            'skipped_source_count': len(candidates) - len(picked)}


@router.get('/jobs/{identifier}')
async def job(identifier: str):
    return await invoke(account_profile.read_job, identifier)


@router.get('/{name}')
async def profile(name: str):
    return await invoke(account_profile.read_profile, name)


@router.put('/{name}/active')
async def active(name: str, request: Active):
    return await invoke(account_profile.save_active, name, request.content, request.expected_version)


@router.post('/{name}/analyze', status_code=202)
async def analyze(name: str):
    return await invoke(account_profile.start_analysis, name)
