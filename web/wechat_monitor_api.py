"""Expose the local WeRSS integration, without claiming WeChat authorization."""
import asyncio
import requests
from dotenv import dotenv_values
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from easel.runtime import STATE

router = APIRouter(prefix='/api/wechat-monitor')
URL = 'http://127.0.0.1:8090/'


def status():
    try:
        with requests.Session() as session:
            session.trust_env = False
            online = session.get(URL, timeout=3).status_code == 200
    except requests.RequestException:
        online = False
    configured = bool(dotenv_values(STATE / 'postiz.env').get('WERSS_ADMIN_PASSWORD'))
    return {'online': online, 'url': URL, 'username': 'easel', 'configured': configured,
            'message': '服务已就绪，请在订阅管理中扫码并添加同行公众号。' if online else '同行订阅服务尚未就绪。'}


@router.get('')
async def monitor_status():
    return await asyncio.to_thread(status)


@router.post('/credentials')
async def local_credentials():
    password = dotenv_values(STATE / 'postiz.env').get('WERSS_ADMIN_PASSWORD')
    if not password:
        raise HTTPException(503, '同行订阅服务尚未配置。')
    return JSONResponse({'username': 'easel', 'password': password}, headers={'Cache-Control': 'no-store'})
