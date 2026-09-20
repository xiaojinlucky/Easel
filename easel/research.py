"""A local collection adapter: CloakBrowser + Baoyu's maintained reader + Easel assets."""
import hashlib
import ipaddress
import json
import socket
import random
import sqlite3
import subprocess
import threading
import time
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from easel.research_browser import (
    ROOT, STATE, CREATE_FLAGS, CLOAK_PORT, runtime_env,
    start, research_cdp_endpoint, verify_research_cdp,
)

DB = STATE / 'research.sqlite'
MIN_INTERVAL = 60
MAX_INTERVAL = 120
HOURLY_LIMIT = 12
CACHE_SECONDS = 86400
PLATFORMS = {'xiaohongshu.com': '小红书', 'xhslink.com': '小红书', 'xhslink.cn': '小红书', 'bilibili.com': '哔哩哔哩', 'douyin.com': '抖音', 'zhihu.com': '知乎', 'mp.weixin.qq.com': '公众号', 'weibo.com': '微博', 'x.com': 'X', 'twitter.com': 'X', 'reddit.com': 'Reddit', 'news.ycombinator.com': 'Hacker News', 'github.com': 'GitHub 社区', 'beav.me': 'Beav', 'redbox.ziz.hk': 'Beav', 'linux.do': 'Linux.do', 'v2ex.com': 'V2EX'}
CAPTURE_METHOD = 'CloakBrowser + Baoyu（单页，不滚动或分页）'
CLIPPER_METHOD = 'Mozilla Readability / 用户选区'
_capture_lock = threading.Lock()


class CollectionError(ValueError):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def connection() -> sqlite3.Connection:
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, url TEXT, title TEXT, platform TEXT, topic TEXT, content TEXT, state TEXT, error TEXT, captured_at REAL, asset_path TEXT, method TEXT)')
    db.execute('CREATE TABLE IF NOT EXISTS visits (platform TEXT, at REAL)')
    db.execute('CREATE TABLE IF NOT EXISTS blocked (platform TEXT PRIMARY KEY, reason TEXT, at REAL)')
    db.execute('CREATE TABLE IF NOT EXISTS cooldowns (platform TEXT PRIMARY KEY, next_at REAL)')
    existing = {row[1] for row in db.execute('PRAGMA table_info(sources)').fetchall()}
    for column, decl in (
        ('author', 'TEXT NOT NULL DEFAULT \'\''),
        ('kind', 'TEXT NOT NULL DEFAULT \'\''),
        ('cover_url', 'TEXT NOT NULL DEFAULT \'\''),
        ('extra_json', 'TEXT NOT NULL DEFAULT \'\''),
    ):
        if column not in existing:
            db.execute(f'ALTER TABLE sources ADD COLUMN {column} {decl}')
    return db


def normalize_url(raw: str, check_network: bool = False) -> tuple[str, str]:
    try:
        parsed = urlsplit(raw.strip())
        port = parsed.port
    except ValueError as exc:
        raise CollectionError('来源链接格式无效。') from exc
    host = (parsed.hostname or '').lower().rstrip('.')
    if parsed.scheme != 'https' or parsed.username or parsed.password or port not in (None, 443):
        raise CollectionError('请使用公开网页的 HTTPS 链接。')
    platform = next((label for domain, label in PLATFORMS.items() if host == domain or host.endswith('.' + domain)), None)
    if platform is None:
        raise CollectionError('该站点暂未接入自动采集，可使用「导入摘录」保存内容与来源。')
    if check_network:
        try:
            addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        except OSError as exc:
            raise CollectionError('无法解析来源地址。', 502) from exc
        if not addresses or any(not ipaddress.ip_address(record[4][0]).is_global for record in addresses):
            raise CollectionError('来源解析到非公开地址，已停止采集。')
    return urlunsplit(('https', parsed.netloc.lower(), parsed.path or '/', parsed.query, '')), platform


def list_sources(query: str = '') -> list[dict]:
    with connection() as db:
        rows = db.execute('SELECT id,url,title,platform,topic,state,error,captured_at,asset_path,method,author,kind,cover_url,substr(content,1,220) AS excerpt FROM sources WHERE title LIKE ? OR topic LIKE ? OR content LIKE ? OR author LIKE ? OR kind LIKE ? ORDER BY captured_at DESC LIMIT 200', ('%' + query + '%',) * 5).fetchall()
    return [dict(row) for row in rows]


def get_source(identifier: str) -> dict:
    with connection() as db:
        row = db.execute('SELECT * FROM sources WHERE id=?', (identifier,)).fetchone()
    if row is None:
        raise CollectionError('素材不存在。', 404)
    item = dict(row)
    raw = item.get('extra_json') or ''
    if raw:
        try:
            item['extra'] = json.loads(raw)
        except json.JSONDecodeError:
            item['extra'] = {}
    return item


def save_source(url: str, title: str, platform: str, topic: str, content: str, method: str = 'manual', state: str = 'saved', error: str = '', author: str = '', kind: str = '', cover_url: str = '', extra: dict | None = None) -> dict:
    extra = extra or {}
    external_id = str(extra.get('external_id') or '').strip()
    if method == 'FreshRSS':
        identity = 'rss\n' + url
    elif method == CLIPPER_METHOD:
        identity = 'clipper\n' + url + '\n' + content
    elif external_id:
        identity = 'ext\n' + external_id
    elif method != 'manual':
        identity = url
    else:
        identity = url + '\n' + content
    identifier = hashlib.sha256(identity.encode()).hexdigest()[:24]
    if method == CLIPPER_METHOD:
        legacy_identifier = hashlib.sha256(url.encode()).hexdigest()[:24]
        with connection() as db:
            legacy = db.execute('SELECT id FROM sources WHERE id=? AND method=? AND content=?', (legacy_identifier, method, content)).fetchone()
        if legacy:
            identifier = legacy['id']
    if state != 'saved':
        with connection() as db:
            previous = db.execute("SELECT * FROM sources WHERE id=? AND state='saved'", (identifier,)).fetchone()
            if previous:
                error = '刷新失败，保留上次素材：' + error
                db.execute('UPDATE sources SET error=? WHERE id=?', (error, identifier))
                return {**dict(previous), 'error': error, 'refresh_failed': True}
    asset_path = ''
    captured_at = time.time()
    if state == 'saved':
        target = ROOT / 'outputs/研究素材' / f'{identifier}.md'
        target.parent.mkdir(parents=True, exist_ok=True)
        images = extra.get('image_urls') or []
        comments = extra.get('comments_text') or ''
        header = (
            f'# {title}\n\n来源：{url or "用户导入"}\n采集时间：{time.strftime("%Y-%m-%d %H:%M:%S%z")}\n'
            f'方式：{method}\n主题：{topic}\n作者：{author}\n类型：{kind}\n'
        )
        if cover_url:
            header += f'封面：{cover_url}\n'
        local_images = materialize_images(identifier, ([cover_url] if cover_url else []) + list(images))
        extra['local_images'] = local_images
        if local_images:
            header += '本地图片：\n' + '\n'.join(f'- {item}' for item in local_images) + '\n'
        if images:
            header += '图片：\n' + '\n'.join(f'- {item}' for item in images[:24]) + '\n'
        if comments:
            header += '\n## 评论\n\n' + comments + '\n'
        header += '\n---\n\n'
        target.write_text(header + content, encoding='utf-8')
        asset_path = target.relative_to(ROOT / 'outputs').as_posix()
    extra_json = json.dumps(extra, ensure_ascii=False) if extra else ''
    with connection() as db:
        db.execute(
            'INSERT INTO sources (id,url,title,platform,topic,content,state,error,captured_at,asset_path,method,author,kind,cover_url,extra_json) '
            'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET '
            'title=excluded.title,topic=excluded.topic,content=excluded.content,state=excluded.state,'
            'error=excluded.error,captured_at=excluded.captured_at,asset_path=excluded.asset_path,'
            'method=excluded.method,author=excluded.author,kind=excluded.kind,cover_url=excluded.cover_url,'
            'extra_json=excluded.extra_json',
            (identifier, url, title[:500], platform, topic, content, state, error, captured_at, asset_path, method, author, kind, cover_url, extra_json),
        )
    return get_source(identifier)


def _public_http_url(url: str) -> bool:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in ('http', 'https') or parsed.username or parsed.password:
        return False
    host = (parsed.hostname or '').lower()
    if not host or host in {'localhost', '127.0.0.1', '::1'} or host.endswith('.local'):
        return False
    try:
        ip = ipaddress.ip_address(host)
        return bool(ip.is_global)
    except ValueError:
        return True


def materialize_images(identifier: str, urls: list[str]) -> list[str]:
    folder = ROOT / 'outputs' / '研究素材' / identifier
    saved: list[str] = []
    seen: set[str] = set()
    for index, raw in enumerate(urls):
        url = str(raw or '').strip()
        if not url or url in seen or not _public_http_url(url):
            continue
        seen.add(url)
        if len(saved) >= 8:
            break
        suffix = Path(urllib.parse.urlsplit(url).path).suffix.lower()
        if suffix not in {'.jpg', '.jpeg', '.png', '.webp', '.gif'}:
            suffix = '.jpg'
        target = folder / f'{index:02d}{suffix}'
        try:
            folder.mkdir(parents=True, exist_ok=True)
            request = urllib.request.Request(url, headers={'User-Agent': 'EaselResearch/1.0'})
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(request, timeout=8) as response:
                final = response.geturl()
                if not _public_http_url(final):
                    continue
                data = response.read(2_000_001)
            if not data or len(data) > 2_000_000:
                continue
            target.write_bytes(data)
            saved.append(target.relative_to(ROOT / 'outputs').as_posix())
        except (OSError, ValueError):
            continue
    return saved


def collection_status() -> dict:
    with connection() as db:
        blocked = [dict(row) for row in db.execute('SELECT * FROM blocked')]
        cooldowns = [dict(row) for row in db.execute('SELECT * FROM cooldowns')]
        total = db.execute("SELECT count(*) FROM sources WHERE state='saved'").fetchone()[0]
    endpoint = research_cdp_endpoint()
    return {'sampling_mode': 'single_page_no_scroll', 'connection_mode': 'existing_browser' if endpoint else 'managed_research_profile', 'cdp_url': endpoint or f'http://127.0.0.1:{CLOAK_PORT}', 'browser': 'CloakBrowser', 'reader': 'Baoyu / Defuddle', 'min_interval_seconds': MIN_INTERVAL, 'max_interval_seconds': MAX_INTERVAL, 'cooldowns': cooldowns, 'hourly_limit_per_platform': HOURLY_LIMIT, 'cache_hours': CACHE_SECONDS // 3600, 'platforms': sorted(set(PLATFORMS.values())), 'blocked': blocked, 'saved_count': total}


def capture(url: str, topic: str = '') -> dict:
    url, platform = normalize_url(url)
    identifier = hashlib.sha256(url.encode()).hexdigest()[:24]
    with connection() as db:
        previous = db.execute("SELECT * FROM sources WHERE id=? AND state='saved'", (identifier,)).fetchone()
        if previous and time.time() - previous['captured_at'] < CACHE_SECONDS:
            return {**dict(previous), 'cached': True}
    if not _capture_lock.acquire(blocking=False):
        raise CollectionError('已有采集正在进行，请等待完成。', 429)
    try:
        now = time.time()
        with connection() as db:
            db.execute('BEGIN IMMEDIATE')
            blocked = db.execute('SELECT reason FROM blocked WHERE platform=?', (platform,)).fetchone()
            if blocked:
                raise CollectionError(f'{platform} 已暂停：{blocked[0]}。完成登录或限制解除后，再由你手动恢复。', 409)
            recent = db.execute('SELECT max(at),count(*) FROM visits WHERE platform=? AND at>?', (platform, now - 3600)).fetchone()
            cooldown = db.execute('SELECT next_at FROM cooldowns WHERE platform=?', (platform,)).fetchone()
            wait = max((cooldown[0] if cooldown else 0), (recent[0] or 0) + MIN_INTERVAL) - now
            if wait > 0 or recent[1] >= HOURLY_LIMIT:
                raise CollectionError(f'已触发采集频率限制，请{str(int(wait) + 1) + " 秒后" if wait > 0 else "稍后"}再试。每个平台每小时最多 {HOURLY_LIMIT} 次。', 429)
            db.execute('INSERT INTO visits VALUES (?,?)', (platform, now))
            db.execute('INSERT OR REPLACE INTO cooldowns VALUES (?,?)', (platform, now + random.SystemRandom().uniform(MIN_INTERVAL, MAX_INTERVAL)))
            db.execute('DELETE FROM visits WHERE at<?', (now - 86400,))
        normalize_url(url, check_network=True)
        try:
            endpoint = research_cdp_endpoint()
            if endpoint:
                verify_research_cdp(endpoint)
            else:
                start('cloak')
                endpoint = f'http://127.0.0.1:{CLOAK_PORT}'
        except RuntimeError as exc:
            return save_source(url, url, platform, topic, '', CAPTURE_METHOD, 'error', str(exc))
        bun = STATE / 'node_modules/bun/bin/bun.exe'
        if not bun.is_file():
            return save_source(url, url, platform, topic, '', CAPTURE_METHOD, 'error', '本机尚未安装网页采集运行时。可改用「导入摘录」保存你已复制的正文。')
        command = [str(bun), str(ROOT / 'skills/extensions/baoyu-url-to-markdown/scripts/lib/cli.ts'), url, '--cdp-url', endpoint, '--json', '--timeout', '30000']
        env = runtime_env()
        env['EASEL_RESEARCH_SINGLE_PAGE'] = '1'
        env['EASEL_PUBLIC_RESEARCH_DOMAINS'] = json.dumps(list(PLATFORMS))
        try:
            result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, encoding='utf-8', timeout=75, creationflags=CREATE_FLAGS)
            data = json.loads(result.stdout) if result.stdout.strip() else {}
        except (subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
            return save_source(url, url, platform, topic, '', CAPTURE_METHOD, 'error', '正文提取超时或返回格式异常：' + type(exc).__name__)
        text = data.get('markdown') or ''
        needs_login = len(text) < 1500 and any(term in text.lower() for term in ('登录后查看搜索结果', '登录后查看', "you’ve been blocked", "you've been blocked", 'sign in to continue', 'verify you are human'))
        restricted = data.get('status') == 'needs_interaction' or needs_login or any(term in result.stderr.lower() for term in ('http 403', 'http 429', 'rate limit', 'login required'))
        if restricted:
            reason = (data.get('interaction') or {}).get('reason') or '该页面要求登录、验证或限制访问'
            with connection() as db:
                db.execute('INSERT OR REPLACE INTO blocked VALUES (?,?,?)', (platform, reason, now))
            return save_source(url, url, platform, topic, '', CAPTURE_METHOD, 'blocked', reason)
        if result.returncode or data.get('status') != 'ok' or not text.strip():
            return save_source(url, url, platform, topic, '', CAPTURE_METHOD, 'error', (result.stderr or data.get('message') or '未取得可用正文')[-1200:])
        try:
            normalize_url((data.get('document') or {}).get('url') or url, check_network=True)
        except CollectionError as exc:
            return save_source(url, url, platform, topic, '', CAPTURE_METHOD, 'error', str(exc))
        return save_source(url, (data.get('document') or {}).get('title') or url, platform, topic, text, CAPTURE_METHOD)
    finally:
        _capture_lock.release()


def restore_platform(platform: str) -> None:
    with connection() as db:
        db.execute('DELETE FROM blocked WHERE platform=?', (platform,))
