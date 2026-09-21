import json
import secrets
import zipfile
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from easel.research_browser import ROOT, STATE
from easel.research import save_source


class Excerpt(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    url: str = Field(default='', max_length=4096)
    topic: str = Field(default='', max_length=100)
    content: str = Field(min_length=1, max_length=300000)
    image_urls: list[str] = Field(default_factory=list)

router = APIRouter()
TOKEN_FILE = STATE / 'clipper-pairing.json'


@router.post('/api/research/clipper-pair')
async def pair():
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    if TOKEN_FILE.exists():
        token = json.loads(TOKEN_FILE.read_text(encoding='utf-8'))['token']
    else:
        token = secrets.token_urlsafe(32)
        TOKEN_FILE.write_text(json.dumps({'token': token}), encoding='utf-8')
    return {'token': token}


@router.post('/api/clipper')
async def clip(request: Excerpt, authorization: str = Header(default='')):
    expected = json.loads(TOKEN_FILE.read_text(encoding='utf-8')).get('token', '') if TOKEN_FILE.exists() else ''
    if not expected or not secrets.compare_digest(authorization, 'Bearer ' + expected):
        raise HTTPException(401, '配对码无效，请从调研页重新复制。')
    if not request.url.startswith(('https://', 'http://')):
        raise HTTPException(422, '只接受普通网页来源。')
    images = [u for u in request.image_urls if isinstance(u, str) and u.startswith(('https://', 'http://'))][:8]
    result = save_source(
        request.url, request.title, '浏览器采集', request.topic, request.content,
        'Mozilla Readability / 用户选区', extra={'image_urls': images},
    )
    return {'ok': True, 'id': result['id'], 'title': result['title']}


@router.get('/api/research/clipper-download')
async def download():
    folder = ROOT / 'extensions' / 'easel-clipper'
    if not folder.is_dir():
        raise HTTPException(404, '采集扩展尚未安装。')
    STATE.mkdir(parents=True, exist_ok=True)
    target = STATE / 'easel-clipper.zip'
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in folder.rglob('*'):
            if path.is_file() and path.name != 'easel-clipper.zip':
                archive.write(path, path.relative_to(folder).as_posix())
    return FileResponse(target, filename='easel-clipper.zip', media_type='application/zip')
