import secrets
import zipfile
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from easel.runtime import ROOT, STATE, write_json
from easel.research import save_source
from web.research_api import Excerpt
import json

router = APIRouter()
TOKEN_FILE = STATE / 'clipper-pairing.json'


@router.post('/api/research/clipper-pair')
async def pair():
    if TOKEN_FILE.exists():
        token = json.loads(TOKEN_FILE.read_text(encoding='utf-8'))['token']
    else:
        token = secrets.token_urlsafe(32)
        write_json(TOKEN_FILE, {'token': token})
    return {'token': token}


@router.post('/api/clipper')
async def clip(request: Excerpt, authorization: str = Header(default='')):
    expected = json.loads(TOKEN_FILE.read_text(encoding='utf-8')).get('token', '') if TOKEN_FILE.exists() else ''
    if not expected or not secrets.compare_digest(authorization, 'Bearer ' + expected):
        raise HTTPException(401, '配对码无效，请从 Easel 调研页重新复制。')
    if not request.url.startswith(('https://', 'http://')):
        raise HTTPException(422, '只接受普通网页来源。')
    result = save_source(request.url, request.title, '浏览器采集', request.topic, request.content, 'Mozilla Readability / 用户选区')
    return {'ok': True, 'id': result['id'], 'title': result['title']}


@router.get('/api/research/clipper-download')
async def download():
    target = STATE / 'easel-clipper.zip'
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in (ROOT / 'extensions/easel-clipper').iterdir():
            if path.is_file():
                archive.write(path, path.name)
    return FileResponse(target, filename='easel-clipper.zip', media_type='application/zip')
