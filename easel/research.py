"""A local collection adapter: CloakBrowser + Baoyu's maintained reader + Easel assets."""
import base64
import hashlib
import ipaddress
import json
import re
import shutil
import socket
import random
import sqlite3
import subprocess
import threading
import time
import urllib.parse
import urllib.request
from pathlib import Path

_OCR = None
_JIEBA = None
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
    db.execute('CREATE TABLE IF NOT EXISTS operations (operation_id TEXT PRIMARY KEY, receipt TEXT, at REAL)')
    db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS sources_fts USING fts5(source_id UNINDEXED, tokens)')
    existing = {row[1] for row in db.execute('PRAGMA table_info(sources)').fetchall()}
    for column, decl in (
        ('author', 'TEXT NOT NULL DEFAULT \'\''),
        ('kind', 'TEXT NOT NULL DEFAULT \'\''),
        ('cover_url', 'TEXT NOT NULL DEFAULT \'\''),
        ('extra_json', 'TEXT NOT NULL DEFAULT \'\''),
        ('tags', "TEXT NOT NULL DEFAULT ''"),
        ('summary', "TEXT NOT NULL DEFAULT ''"),
        ('pinned', 'INTEGER NOT NULL DEFAULT 0'),
        ('deleted_at', 'REAL NOT NULL DEFAULT 0'),
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


_TAG_STRIP = re.compile(r'[,，|]')


def _normalize_tags(tags) -> list[str]:
    result: list[str] = []
    for raw in (tags or []):
        tag = _TAG_STRIP.sub(' ', str(raw)).strip().strip('#')
        if tag and tag not in result:
            result.append(tag)
    return result[:24]


def _tokenize(text: str) -> str:
    """jieba 预切词；未安装时退化为按符号切，中文至少保住整段可搜。"""
    global _JIEBA
    text = str(text or '').lower()
    if not text.strip():
        return ''
    try:
        if _JIEBA is None:
            import jieba
            _JIEBA = jieba
        tokens = [token.strip() for token in _JIEBA.cut(text) if token.strip()]
    except Exception:
        tokens = re.sub(r'[^\w]+', ' ', text).split()
    return ' '.join(tokens)


def _shape_row(item: dict) -> dict:
    raw = item.get('extra_json') or ''
    if raw:
        try:
            item['extra'] = json.loads(raw)
        except json.JSONDecodeError:
            item['extra'] = {}
    item['tags'] = [tag for tag in str(item.get('tags') or '').split(',') if tag]
    return item


def index_source(identifier: str) -> None:
    row = get_source(identifier)
    blob = ' '.join(str(row.get(field) or '') for field in ('title', 'content', 'topic', 'url'))
    extra = row.get('extra') or {}
    blob += ' ' + str(extra.get('comments_text') or '') + ' ' + ' '.join(str(tag) for tag in row.get('tags') or [])
    tokens = _tokenize(blob)
    with connection() as db:
        db.execute('DELETE FROM sources_fts WHERE source_id=?', (identifier,))
        if tokens:
            db.execute('INSERT INTO sources_fts (source_id,tokens) VALUES (?,?)', (identifier, tokens))


def reindex_all() -> dict:
    with connection() as db:
        ids = [row[0] for row in db.execute('SELECT id FROM sources').fetchall()]
        db.execute('DELETE FROM sources_fts')
    for identifier in ids:
        index_source(identifier)
    return {'indexed': len(ids)}


def _ensure_index(db) -> None:
    indexed = db.execute('SELECT count(*) FROM sources_fts').fetchone()[0]
    rows = db.execute('SELECT count(*) FROM sources').fetchone()[0]
    if indexed == 0 and rows > 0:
        reindex_all()


def _fts_ids(db, query: str) -> list[str] | None:
    """返回 None 表示 FTS 不可用（调用方回退 LIKE）；[] 表示确实搜不到。"""
    tokens = _tokenize(query).split()
    if not tokens:
        return None
    match = ' AND '.join('"%s"' % token.replace('"', '') for token in tokens[:8])
    try:
        rows = db.execute('SELECT source_id FROM sources_fts WHERE sources_fts MATCH ? ORDER BY rank', (match,)).fetchall()
    except sqlite3.OperationalError:
        return None
    return [str(row[0]) for row in rows]


SORTS = {'recent': 'captured_at DESC', 'oldest': 'captured_at ASC', 'title': 'title COLLATE NOCASE ASC'}


def list_sources(query: str = '', limit: int = 200, offset: int = 0, kind: str = '', platform: str = '',
                 state: str = '', tag: str = '', sort: str = 'recent') -> dict:
    try:
        limit = max(1, min(int(limit), 500))
    except (TypeError, ValueError):
        limit = 200
    try:
        offset = max(0, int(offset))
    except (TypeError, ValueError):
        offset = 0
    filters: list[tuple[str, list]] = [('deleted_at=0', [])]
    if state:
        filters.append(('state=?', [state]))
    if kind:
        filters.append(('kind=?', [kind]))
    if platform:
        filters.append(('platform=?', [platform]))
    if tag:
        filters.append(("instr(',' || tags || ',', ?) > 0", [f',{tag.strip()},']))
    engine = 'none'
    if query:
        with connection() as db:
            _ensure_index(db)
            ids = _fts_ids(db, query)
    else:
        ids = None
    if query and ids:
        engine = 'fts5+jieba'
        filters.append(('id IN (' + ','.join('?' * len(ids)) + ')', list(ids)))
    elif query:
        engine = 'like'
        like = '%' + query[:200] + '%'
        filters.append(('(title LIKE ? OR topic LIKE ? OR content LIKE ? OR author LIKE ? OR kind LIKE ? OR tags LIKE ?)', [like] * 6))
    base = ' AND '.join(clause for clause, _ in filters)
    params = [value for _, values in filters for value in values]
    order = 'pinned DESC,' + SORTS.get(sort, SORTS['recent'])
    counts_base = ' AND '.join(clause for clause, _ in filters if clause != 'kind=?')
    counts_params = [value for clause, values in filters if clause != 'kind=?' for value in values]
    with connection() as db:
        total = db.execute(f'SELECT count(*) FROM sources WHERE {base}', params).fetchone()[0]
        kind_counts = {str(row[0] or ''): row[1] for row in db.execute(
            f'SELECT kind,count(*) FROM sources WHERE {counts_base} GROUP BY kind', counts_params).fetchall()}
        rows = db.execute(
            f'SELECT id,url,title,platform,topic,state,error,captured_at,asset_path,method,author,kind,cover_url,'
            f'tags,summary,pinned,deleted_at,extra_json,substr(content,1,220) AS excerpt '
            f'FROM sources WHERE {base} ORDER BY {order} LIMIT ? OFFSET ?',
            params + [limit, offset],
        ).fetchall()
    items = [_shape_row(dict(row)) for row in rows]
    return {'items': items, 'total': total, 'kindCounts': kind_counts,
            'limit': limit, 'offset': offset, 'engine': engine}


def get_source(identifier: str) -> dict:
    with connection() as db:
        row = db.execute('SELECT * FROM sources WHERE id=?', (identifier,)).fetchone()
    if row is None:
        raise CollectionError('素材不存在。', 404)
    return _shape_row(dict(row))


def save_source(url: str, title: str, platform: str, topic: str, content: str, method: str = 'manual', state: str = 'saved', error: str = '', author: str = '', kind: str = '', cover_url: str = '', extra: dict | None = None) -> dict:
    extra = dict(extra or {})
    data_images = [str(item) for item in (extra.pop('data_images', None) or []) if str(item).strip()]
    raw_tags = extra.get('tags')
    if isinstance(raw_tags, str):
        raw_tags = raw_tags.split(',')
    tags_sql = ','.join(_normalize_tags(raw_tags))
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
                return {**dict(previous), 'error': error, 'refresh_failed': True, 'save_status': 'preserved'}
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
        local_images += materialize_data_images(identifier, data_images)
        extra['local_images'] = local_images
        ocr_text = ocr_local_images(local_images) if local_images and len(str(content or '')) < 800 else ''
        if ocr_text:
            extra['ocr_text'] = ocr_text
            if '[图片文字]' not in content:
                content = (str(content or '').rstrip() + '\n\n[图片文字]\n' + ocr_text).strip()
        if local_images:
            header += '本地图片：\n' + '\n'.join(f'- {item}' for item in local_images) + '\n'
        if images:
            header += '图片：\n' + '\n'.join(f'- {item}' for item in images[:24]) + '\n'
        if comments:
            header += '\n## 评论\n\n' + comments + '\n'
        header += '\n---\n\n'
        target.write_text(header + content, encoding='utf-8')
        asset_path = target.relative_to(ROOT / 'outputs').as_posix()
    save_status = 'created'
    if state == 'saved':
        with connection() as db:
            earlier = db.execute("SELECT content,title FROM sources WHERE id=? AND state='saved'", (identifier,)).fetchone()
        if earlier:
            same_content = (earlier['content'] or '') == content
            same_title = (earlier['title'] or '') == title[:500]
            save_status = 'unchanged' if same_content and same_title else 'updated'
    extra_json = json.dumps(extra, ensure_ascii=False) if extra else ''
    with connection() as db:
        db.execute(
            'INSERT INTO sources (id,url,title,platform,topic,content,state,error,captured_at,asset_path,method,author,kind,cover_url,extra_json,tags) '
            'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET '
            'title=excluded.title,topic=excluded.topic,content=excluded.content,state=excluded.state,'
            'error=excluded.error,captured_at=excluded.captured_at,asset_path=excluded.asset_path,'
            'method=excluded.method,author=excluded.author,kind=excluded.kind,cover_url=excluded.cover_url,'
            'extra_json=excluded.extra_json,tags=excluded.tags,deleted_at=0',
            (identifier, url, title[:500], platform, topic, content, state, error, captured_at, asset_path, method, author, kind, cover_url, extra_json, tags_sql),
        )
    result = get_source(identifier)
    result['save_status'] = save_status
    try:
        index_source(identifier)
    except sqlite3.Error:
        pass
    return result


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


def ocr_available() -> bool:
    """只探测 rapidocr 是否可导入，不实例化模型（状态接口高频调用）。"""
    try:
        import importlib.util
        return importlib.util.find_spec('rapidocr_onnxruntime') is not None
    except Exception:
        return False


def ocr_local_images(rel_paths: list[str]) -> str:
    global _OCR
    try:
        from rapidocr_onnxruntime import RapidOCR
    except ImportError:
        return ''
    if _OCR is None:
        _OCR = RapidOCR()
    chunks: list[str] = []
    for rel in rel_paths[:8]:
        path = ROOT / 'outputs' / str(rel)
        if not path.is_file():
            continue
        try:
            result, _elapsed = _OCR(str(path))
        except Exception:
            continue
        if not result:
            continue
        for item in result:
            piece = item[1] if isinstance(item, (list, tuple)) and len(item) > 1 else item
            if isinstance(piece, str) and piece.strip():
                chunks.append(piece.strip())
    return '\n'.join(chunks)


def refresh_ocr(identifier: str) -> dict:
    item = get_source(identifier)
    extra = dict(item.get('extra') or {})
    ocr_text = ocr_local_images(list(extra.get('local_images') or []))
    if not ocr_text:
        return item
    extra['ocr_text'] = ocr_text
    content = item.get('content') or ''
    if '[图片文字]' not in content:
        content = (content.rstrip() + '\n\n[图片文字]\n' + ocr_text).strip()
    with connection() as db:
        db.execute(
            'UPDATE sources SET content=?, extra_json=? WHERE id=?',
            (content, json.dumps(extra, ensure_ascii=False), identifier),
        )
    try:
        index_source(identifier)
    except sqlite3.Error:
        pass
    return get_source(identifier)


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


def materialize_data_images(identifier: str, items: list[str]) -> list[str]:
    """把插件抓到的 base64 内联图片解码落盘，与 materialize_images 同等上限。"""
    folder = ROOT / 'outputs' / '研究素材' / identifier
    saved: list[str] = []
    for index, raw in enumerate(items):
        if len(saved) >= 8:
            break
        url = str(raw or '').strip()
        header, _, blob = url.partition(',')
        if not header.startswith('data:image/') or not header.endswith(';base64'):
            continue
        suffix = {'png': '.png', 'webp': '.webp', 'gif': '.gif'}.get(
            header[len('data:image/'):].split(';')[0].lower(), '.jpg')
        try:
            data = base64.b64decode(blob, validate=False)
        except ValueError:
            continue
        if not data or len(data) > 2_000_000:
            continue
        target = folder / f'inline{index:02d}{suffix}'
        try:
            folder.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            saved.append(target.relative_to(ROOT / 'outputs').as_posix())
        except OSError:
            continue
    return saved


def knowledge_counts() -> dict:
    """素材库真实统计，供 Native Host desktop.health 上报。"""
    with connection() as db:
        saved = db.execute("SELECT count(*) FROM sources WHERE state='saved'").fetchone()[0]
        kinds = {str(row[0] or ''): row[1] for row in db.execute(
            "SELECT kind,count(*) FROM sources WHERE state='saved' GROUP BY kind")}
        platforms = {str(row[0] or ''): row[1] for row in db.execute(
            "SELECT platform,count(*) FROM sources WHERE state='saved' GROUP BY platform")}
    return {'saved': saved, 'total': saved, 'kinds': kinds, 'platforms': platforms}


def get_operation(operation_id: str) -> dict | None:
    if not operation_id:
        return None
    with connection() as db:
        row = db.execute('SELECT receipt FROM operations WHERE operation_id=?', (operation_id,)).fetchone()
    if row is None:
        return None
    try:
        receipt = json.loads(row['receipt'])
    except json.JSONDecodeError:
        return None
    return receipt if isinstance(receipt, dict) else None


def put_operation(operation_id: str, receipt: dict) -> None:
    if not operation_id:
        return
    with connection() as db:
        db.execute('INSERT OR REPLACE INTO operations (operation_id,receipt,at) VALUES (?,?,?)',
                   (operation_id[:128], json.dumps(receipt, ensure_ascii=False), time.time()))


def update_source(identifier: str, title=None, topic=None, content=None, summary=None,
                  tags=None, pinned=None) -> dict:
    item = get_source(identifier)
    sets: list[str] = []
    params: list = []
    if title is not None:
        sets.append('title=?')
        params.append(str(title)[:500])
    if topic is not None:
        sets.append('topic=?')
        params.append(str(topic)[:100])
    if content is not None:
        sets.append('content=?')
        params.append(str(content)[:300000])
    if summary is not None:
        sets.append('summary=?')
        params.append(str(summary)[:1000])
    if tags is not None:
        sets.append('tags=?')
        params.append(','.join(_normalize_tags(tags)))
    if pinned is not None:
        sets.append('pinned=?')
        params.append(1 if pinned else 0)
    if sets:
        params.append(identifier)
        with connection() as db:
            db.execute(f"UPDATE sources SET {','.join(sets)} WHERE id=?", params)
    if content is not None and item.get('asset_path'):
        target = (ROOT / 'outputs' / item['asset_path']).resolve()
        outputs_root = (ROOT / 'outputs').resolve()
        if str(target).startswith(str(outputs_root)) and target.parent.is_dir():
            old = target.read_text(encoding='utf-8') if target.is_file() else ''
            head, sep, _body = old.partition('\n---\n\n')
            try:
                target.write_text((head + sep if sep else f"# {title or item.get('title') or ''}\n\n---\n\n") + str(content), encoding='utf-8')
            except OSError:
                pass
    try:
        index_source(identifier)
    except sqlite3.Error:
        pass
    return get_source(identifier)


def add_tag(identifier: str, tag: str) -> dict:
    item = get_source(identifier)
    return update_source(identifier, tags=list(dict.fromkeys(item['tags'] + _normalize_tags([tag]))))


def remove_tag(identifier: str, tag: str) -> dict:
    item = get_source(identifier)
    drop = set(_normalize_tags([tag]))
    return update_source(identifier, tags=[t for t in item['tags'] if t not in drop])


def delete_sources(ids: list[str]) -> int:
    now = time.time()
    done = 0
    with connection() as db:
        for identifier in [str(x) for x in ids if str(x).strip()][:200]:
            done += db.execute('UPDATE sources SET deleted_at=? WHERE id=? AND deleted_at=0', (now, identifier)).rowcount
    return done


def restore_sources(ids: list[str]) -> int:
    done = 0
    with connection() as db:
        for identifier in [str(x) for x in ids if str(x).strip()][:200]:
            done += db.execute('UPDATE sources SET deleted_at=0 WHERE id=? AND deleted_at>0', (identifier,)).rowcount
    return done


def list_trash() -> list[dict]:
    purge_expired()
    with connection() as db:
        rows = db.execute(
            'SELECT id,title,platform,kind,tags,deleted_at,captured_at FROM sources '
            'WHERE deleted_at>0 ORDER BY deleted_at DESC LIMIT 200').fetchall()
    return [dict(row) for row in rows]


def purge_expired(days: float = 30) -> int:
    """回收站超期硬删：行、FTS 条目与 md/图片目录一起清（对齐 Beav 30 天口径）。"""
    cutoff = time.time() - days * 86400
    purged = 0
    with connection() as db:
        rows = db.execute('SELECT id,asset_path FROM sources WHERE deleted_at>0 AND deleted_at<?', (cutoff,)).fetchall()
        for row in rows:
            db.execute('DELETE FROM sources WHERE id=?', (row['id'],))
            db.execute('DELETE FROM sources_fts WHERE source_id=?', (row['id'],))
            purged += 1
        expired = [(row['id'], row['asset_path']) for row in rows]
    outputs_root = (ROOT / 'outputs').resolve()
    for identifier, asset_path in expired:
        for candidate in ((ROOT / 'outputs' / asset_path) if asset_path else None,
                          ROOT / 'outputs' / '研究素材' / identifier):
            if not candidate:
                continue
            resolved = candidate.resolve()
            if str(resolved).startswith(str(outputs_root)) and resolved.exists():
                if resolved.is_dir():
                    shutil.rmtree(resolved, ignore_errors=True)
                else:
                    try:
                        resolved.unlink()
                    except OSError:
                        pass
    return purged


LEGACY_KIND_MAP = {
    'xhsv2': 'redbook-note', 'xhs': 'redbook-note', 'entryv2': 'redbook-note',
    'zhihuanswer': 'zhihu-answer', 'zhihuarticle': 'zhihu-article',
    'documentsource': 'document-source', 'mediaassets': 'media', 'comments': 'comments',
    'entry': 'webpage', 'webpage': 'webpage',
}


def migrate_legacy_kinds() -> dict:
    """把旧宿主写出的 XhsV2/ZhihuAnswer 这类 kind 串归一为 Beav 风格 slug。"""
    moved = {}
    with connection() as db:
        rows = db.execute('SELECT id,kind FROM sources WHERE kind<>""').fetchall()
        for row in rows:
            raw = str(row['kind'])
            target = LEGACY_KIND_MAP.get(raw.lower().replace('-', '').replace('_', ''))
            if target and target != raw:
                db.execute('UPDATE sources SET kind=? WHERE id=?', (target, row['id']))
                moved[raw] = moved.get(raw, 0) + 1
    return {'migrated': moved, 'rows': sum(moved.values())}


def index_status() -> dict:
    with connection() as db:
        total = db.execute("SELECT count(*) FROM sources WHERE state='saved'").fetchone()[0]
        indexed = db.execute('SELECT count(*) FROM sources_fts').fetchone()[0]
        trash = db.execute('SELECT count(*) FROM sources WHERE deleted_at>0').fetchone()[0]
        pending = db.execute(
            "SELECT count(*) FROM sources WHERE deleted_at=0 AND extra_json LIKE '%transcribe%'").fetchone()[0]
    return {'total': total, 'fts_indexed': indexed, 'trash': trash,
            'pending_transcribe': pending, 'ocr_available': ocr_available()}


def collection_status() -> dict:
    with connection() as db:
        blocked = [dict(row) for row in db.execute('SELECT * FROM blocked')]
        cooldowns = [dict(row) for row in db.execute('SELECT * FROM cooldowns')]
        total = db.execute("SELECT count(*) FROM sources WHERE state='saved'").fetchone()[0]
    endpoint = research_cdp_endpoint()
    return {'sampling_mode': 'single_page_no_scroll', 'ocr_available': ocr_available(), 'connection_mode': 'existing_browser' if endpoint else 'managed_research_profile', 'cdp_url': endpoint or f'http://127.0.0.1:{CLOAK_PORT}', 'browser': 'CloakBrowser', 'reader': 'Baoyu / Defuddle', 'min_interval_seconds': MIN_INTERVAL, 'max_interval_seconds': MAX_INTERVAL, 'cooldowns': cooldowns, 'hourly_limit_per_platform': HOURLY_LIMIT, 'cache_hours': CACHE_SECONDS // 3600, 'platforms': sorted(set(PLATFORMS.values())), 'blocked': blocked, 'saved_count': total}


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
