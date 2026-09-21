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


async def invoke(function, *args):
    try:
        return await asyncio.to_thread(function, *args)
    except (account_profile.ProfileError, research.CollectionError) as exc:
        raise HTTPException(exc.status, str(exc)) from exc


@router.post('/build', status_code=202)
async def build(request: Build):
    return await invoke(account_profile.build, request.name, request.source_ids, request.homepage_url, request.intent)


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
