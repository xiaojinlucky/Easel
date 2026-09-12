"""Report installed components and observed connections without implying account readiness."""
import asyncio
import json
import urllib.request
from pathlib import Path
from fastapi import APIRouter
from easel.runtime import ROOT, STATE, read_settings
from easel.research import collection_status
from easel.services import healthy

router = APIRouter(prefix='/api/capabilities')


def snapshot():
    from web.app import _read_env, _skill_api_configured, LOGIN_RUNNERS, _account_logged_in
    env = _read_env()
    base_count = sum(1 for p in (ROOT / 'skills/openclaw').iterdir() if (p / 'SKILL.md').is_file())
    extensions = json.loads((ROOT / 'config/extensions.lock.json').read_text(encoding='utf-8'))
    evidence_file = STATE / 'acceptance.json'
    evidence = json.loads(evidence_file.read_text(encoding='utf-8')) if evidence_file.exists() else {}
    postiz_channels = None
    postiz_error = ''
    try:
        from easel.postiz import client, API
        with client() as session:
            response = session.get(API + '/integrations', timeout=3)
            response.raise_for_status()
            postiz_channels = len(response.json())
        postiz_online = True
    except Exception as exc:
        postiz_online = False
        postiz_error = str(exc)
    accounts = [{'name': cfg['name'], 'connected': _account_logged_in(key, cfg)} for key, cfg in LOGIN_RUNNERS.items()]
    return {'upstream_skills': base_count, 'extensions': extensions, 'gateway': healthy('gateway'), 'profile': read_settings()['active_id'], 'accounts': accounts, 'research': collection_status(), 'postiz_online': postiz_online, 'evidence': evidence,
            'postiz_channels': postiz_channels, 'postiz_error': postiz_error,
            'media': [{'name': name, 'configured': _skill_api_configured(skill, env)} for name, skill in [('外部图片 API', 'ai-image-gen'), ('外部视频 API', 'ai-video-gen'), ('外部音乐 API', 'ai-music')]]}


@router.get('')
async def capabilities():
    return await asyncio.to_thread(snapshot)
