"""Bounded, local-created snapshots exposed through a separate phone-only surface."""
from __future__ import annotations

import base64
import html
import io
import ipaddress
import os
from pathlib import Path
import secrets
import shutil
import socket
import stat
import tempfile
import threading
import time
import zipfile
from contextlib import asynccontextmanager
import logging

import segno
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel, Field, StrictStr

TTL = 1800
MAX_BYTES = 100 * 1024 * 1024
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.heic', '.mp4', '.mov', '.webm', '.m4v'}
BLOCKED = {'credentials', 'logs', 'config', 'configs', 'secrets', 'sessions', 'cookies', 'node_modules', '__pycache__'}
HEADERS = {'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
           'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"}


def private_addresses():
    addresses = set()
    for host in (socket.gethostname(), socket.getfqdn()):
        try:
            for result in socket.getaddrinfo(host, None, socket.AF_INET):
                address = ipaddress.ip_address(result[4][0])
                if any(address in ipaddress.ip_network(net) for net in ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16')):
                    addresses.add(str(address))
        except OSError:
            continue
    return sorted(addresses)


def qr(url):
    image = io.BytesIO()
    segno.make(url).save(image, kind='png', scale=5, border=4)
    return 'data:image/png;base64,' + base64.b64encode(image.getvalue()).decode('ascii')


class ShareInput(BaseModel):
    title: StrictStr = Field(default='', max_length=300)
    body: StrictStr = Field(default='', max_length=50000)
    tags: list[StrictStr] = Field(default_factory=list, max_length=30)
    media_paths: list[StrictStr] = Field(default_factory=list, max_length=30)
    platform: StrictStr = Field(default='', max_length=100)


class PhoneBoundary:
    def __init__(self, app, phone):
        self.app, self.phone = app, phone

    async def __call__(self, scope, receive, send):
        if scope['type'] in ('http', 'websocket'):
            path = scope.get('path', '')
            if path.startswith('/phone/'):
                if scope['type'] == 'websocket':
                    await send({'type': 'websocket.close', 'code': 1008})
                else:
                    await self.phone(scope, receive, send)
                return
            try:
                local = ipaddress.ip_address((scope.get('client') or ('', 0))[0]).is_loopback
            except ValueError:
                local = False
            if not local:
                if scope['type'] == 'websocket':
                    await send({'type': 'websocket.close', 'code': 1008})
                else:
                    await JSONResponse({'detail': '仅允许从本机工作台操作'}, status_code=403, headers=HEADERS)(scope, receive, send)
                return
        await self.app(scope, receive, send)


class SnapshotResponse(FileResponse):
    """An admitted download owns its snapshot until ASGI finishes sending it."""
    def __init__(self, *args, release, **kwargs):
        super().__init__(*args, **kwargs)
        self.release = release

    async def __call__(self, scope, receive, send):
        try:
            await super().__call__(scope, receive, send)
        finally:
            self.release()


def install_phone_sharing(app: FastAPI, outputs_dir: Path):
    """Call after the existing middleware declarations; returns state for diagnostics/tests."""
    outputs_dir = Path(outputs_dir).resolve()
    phone = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)
    packs = {}
    lock = threading.RLock()
    temp = tempfile.TemporaryDirectory(prefix='easel-phone-')
    stopped = threading.Event()
    pending_cleanup = set()
    active_downloads = {}

    def remove_directory(directory):
        if active_downloads.get(directory, 0):
            pending_cleanup.add(directory)
            return
        try:
            shutil.rmtree(directory)
            pending_cleanup.discard(directory)
        except FileNotFoundError:
            pending_cleanup.discard(directory)
        except OSError:
            pending_cleanup.add(directory)
            logging.getLogger(__name__).warning('Phone snapshot cleanup deferred: %s', directory, exc_info=True)

    def discard(token):
        pack = packs.pop(token, None)
        if pack:
            remove_directory(pack['directory'])

    def cleanup():
        with lock:
            for directory in list(pending_cleanup):
                remove_directory(directory)
            for token, pack in list(packs.items()):
                if pack['expires_at'] <= time.time():
                    discard(token)

    def sweeper():
        while not stopped.wait(30):
            cleanup()

    thread = threading.Thread(target=sweeper, name='easel-phone-expiry', daemon=True)
    thread.start()

    def close():
        stopped.set()
        thread.join(timeout=2)
        with lock:
            packs.clear()
            temp.cleanup()

    original_lifespan = app.router.lifespan_context

    @asynccontextmanager
    async def lifespan(application):
        try:
            async with original_lifespan(application) as lifespan_state:
                yield lifespan_state
        finally:
            close()

    app.router.lifespan_context = lifespan

    def get_pack(token):
        pack = packs.get(token)
        if not pack:
            raise HTTPException(404, '领取链接不存在或已结束')
        if pack['expires_at'] <= time.time():
            discard(token)
            raise HTTPException(410, '领取链接已过期，请在电脑重新生成')
        return pack

    def download(pack, path, filename, **kwargs):
        directory = pack['directory']
        active_downloads[directory] = active_downloads.get(directory, 0) + 1

        def release():
            with lock:
                remaining = active_downloads[directory] - 1
                if remaining:
                    active_downloads[directory] = remaining
                else:
                    del active_downloads[directory]
                    if directory in pending_cleanup:
                        remove_directory(directory)

        return SnapshotResponse(path, filename=filename, headers=HEADERS, release=release, **kwargs)

    def source_path(value):
        raw = Path(value)
        if '..' in raw.parts:
            raise HTTPException(400, '媒体路径不能包含上级目录')
        path = raw if raw.is_absolute() else outputs_dir / raw
        try:
            parts = path.relative_to(outputs_dir).parts
        except ValueError:
            raise HTTPException(400, '只能选择 outputs 内的媒体')
        if not parts or any(p.startswith(('.', '_')) or p.lower() in BLOCKED for p in parts):
            raise HTTPException(400, '不能分享隐藏、系统或凭据目录')
        current = outputs_dir
        try:
            for part in parts:
                current /= part
                info = current.lstat()
                if stat.S_ISLNK(info.st_mode) or getattr(info, 'st_file_attributes', 0) & 0x406:
                    raise HTTPException(400, '不能分享链接、隐藏或系统文件')
            if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
                raise HTTPException(400, '仅支持普通图片和视频文件')
            path.resolve().relative_to(outputs_dir)
        except (OSError, ValueError):
            raise HTTPException(400, '媒体不存在或路径无效')
        return path

    @app.post('/api/phone-shares')
    def create_share(data: ShareInput, request: Request):
        if any(len(tag) > 100 for tag in data.tags):
            raise HTTPException(400, '每个标签最多100字')
        if not (data.title.strip() or data.body.strip() or any(t.strip() for t in data.tags) or data.media_paths):
            raise HTTPException(400, '请先填写文案或选择媒体')
        addresses = private_addresses()
        if not addresses:
            raise HTTPException(400, '未找到局域网 IPv4 地址。请连接 Wi-Fi 或有线网络，让手机与电脑处于同一局域网后重试。')
        with lock:
            cleanup()
            if len(packs) + len(pending_cleanup) >= 4:
                raise HTTPException(409, '最多同时保留4个领取包，请先结束旧链接')
            sources = [source_path(value) for value in data.media_paths]
            if sum(path.stat().st_size for path in sources) > MAX_BYTES:
                raise HTTPException(413, '素材总量不能超过100 MiB')
            token = secrets.token_urlsafe(32)
            directory = Path(temp.name) / token
            directory.mkdir()
            media = []
            try:
                total = 0
                for i, source in enumerate(sources):
                    target = directory / f'{i:02d}{source.suffix.lower()}'
                    # Bounded copy also checks growth after the initial size check.
                    with source.open('rb') as incoming, target.open('wb') as outgoing:
                        while chunk := incoming.read(1024 * 1024):
                            total += len(chunk)
                            if total > MAX_BYTES:
                                raise HTTPException(413, '素材总量不能超过100 MiB')
                            outgoing.write(chunk)
                    media.append({'path': target, 'name': source.name})
                text = f"{data.title}\n\n{data.body}\n\n" + ' '.join(data.tags)
                with zipfile.ZipFile(directory / 'materials.zip', 'w', compression=zipfile.ZIP_STORED) as archive:
                    archive.writestr('文案.txt', text)
                    for i, item in enumerate(media):
                        archive.write(item['path'], f"{i + 1:02d}_{item['name']}")
                links = [{'url': f'http://{address}:{request.url.port or 7871}/phone/{token}'} for address in addresses]
                for link in links:
                    link['qr_data_url'] = qr(link['url'])
                response = {'token': token, 'expires_at': time.time() + TTL, 'share_url': links[0]['url'],
                            'qr_data_url': links[0]['qr_data_url'], 'media_count': len(media), 'links': links}
                packs[token] = {**response, 'directory': directory, 'media': media, 'data': data}
                return JSONResponse(response, headers=HEADERS)
            except BaseException:
                remove_directory(directory)
                raise

    @app.get('/api/phone-shares/{token}')
    def share_status(token: str):
        with lock:
            pack = get_pack(token)
            return JSONResponse({key: pack[key] for key in ('token', 'expires_at', 'share_url', 'qr_data_url', 'media_count', 'links')}, headers=HEADERS)

    @app.delete('/api/phone-shares/{token}')
    def revoke(token: str):
        with lock:
            discard(token)
        return JSONResponse({'revoked': True}, headers=HEADERS)

    @phone.middleware('http')
    async def headers(request, call_next):
        response = await call_next(request)
        response.headers.update(HEADERS)
        return response

    @phone.api_route('/phone/{token}', methods=['GET', 'HEAD'])
    def phone_page(token: str):
        with lock:
            pack = get_pack(token)
            data = pack['data']
            fields = [('标题', data.title), ('正文', data.body), ('标签', ' '.join(data.tags))]
            sections = ''.join(f'<section><h2>{label}</h2><textarea readonly>{html.escape(value)}</textarea><button onclick="copy(this)">复制{label}</button></section>' for label, value in fields if value)
            media = ''
            for i, item in enumerate(pack['media']):
                url = f'/phone/{token}/media/{i}'
                preview = f'<video controls preload="metadata" src="{url}"></video>' if item['path'].suffix in {'.mp4', '.mov', '.webm', '.m4v'} else f'<img loading="lazy" src="{url}" alt="素材 {i + 1}">'
                media += f'<section><h2>素材 {i + 1}</h2>{preview}<a download href="{url}">保存原文件 · {html.escape(item["name"])}</a></section>'
            template = Path(__file__).with_name('static').joinpath('phone_share.html').read_text(encoding='utf-8')
            return HTMLResponse(template.replace('{{ZIP}}', f'/phone/{token}/download.zip').replace('{{CONTENT}}', sections + media))

    @phone.api_route('/phone/{token}/media/{index}', methods=['GET', 'HEAD'])
    def phone_media(token: str, index: int):
        with lock:
            pack = get_pack(token)
            if index < 0 or index >= len(pack['media']):
                raise HTTPException(404, '素材不存在')
            item = pack['media'][index]
            return download(pack, item['path'], item['name'], content_disposition_type='inline')

    @phone.api_route('/phone/{token}/download.zip', methods=['GET', 'HEAD'])
    def phone_zip(token: str):
        with lock:
            pack = get_pack(token)
            return download(pack, pack['directory'] / 'materials.zip', '发布素材.zip')

    app.add_middleware(PhoneBoundary, phone=phone)
    state = {'packs': packs, 'close': close, 'cleanup': cleanup, 'temp_dir': Path(temp.name)}
    app.state.phone_sharing = state
    return state
