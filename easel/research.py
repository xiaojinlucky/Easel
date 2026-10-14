"""A local collection adapter: CloakBrowser + Baoyu's maintained reader + Easel assets."""
import base64
import csv
import hashlib
import io
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
_OCR_SECTIONS = (
    '个人简历', '基本信息', '教育背景', '科研经历', '专业技能', '自我评价',
    '工作经历', '项目经历', '实习经历', '校园经历', '荣誉奖励', '发表论文',
    '论文成果', '核心课程', '证书',
)
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
# 长任务追加进正文的段落标记：追加、判重、重入库保段共用（实际写入形如 [视频转写·subtitles]）
TRANSCRIBE_MARKER = '[视频转写'
OCR_MARKER = '[图片文字]'
FTS_ID_CAP = 5000            # FTS 命中转成 id IN (...) 的上限，超了退 LIKE，别撞 SQLite 变量墙
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
    db.execute('CREATE TABLE IF NOT EXISTS enrich_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT, task TEXT, status TEXT NOT NULL DEFAULT \'pending\', error TEXT DEFAULT \'\', result_json TEXT DEFAULT \'\', attempts INTEGER NOT NULL DEFAULT 0, claim_key INTEGER NOT NULL DEFAULT 0, created_at REAL, updated_at REAL, UNIQUE(source_id, task))')
    db.execute('CREATE TABLE IF NOT EXISTS account_sessions (id TEXT PRIMARY KEY, account_id TEXT, platform TEXT, homepage_url TEXT, platform_user_id TEXT, username TEXT, avatar_url TEXT, bio TEXT, options_json TEXT, profile_json TEXT, status TEXT NOT NULL DEFAULT \'open\', imported_post_count INTEGER NOT NULL DEFAULT 0, failed_post_count INTEGER NOT NULL DEFAULT 0, last_error TEXT DEFAULT \'\', created_at REAL, updated_at REAL)')
    db.execute('CREATE TABLE IF NOT EXISTS account_items (session_id TEXT NOT NULL, kind TEXT NOT NULL, external_id TEXT NOT NULL, post_id TEXT NOT NULL DEFAULT \'\', source_id TEXT NOT NULL DEFAULT \'\', url TEXT NOT NULL DEFAULT \'\', title TEXT NOT NULL DEFAULT \'\', payload_json TEXT NOT NULL DEFAULT \'\', created_at REAL, updated_at REAL, PRIMARY KEY (session_id, kind, external_id))')
    db.execute('CREATE INDEX IF NOT EXISTS account_items_session_kind ON account_items (session_id, kind)')
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
    task_columns = {row[1] for row in db.execute('PRAGMA table_info(enrich_tasks)').fetchall()}
    if 'claim_key' not in task_columns:   # 老库补列：没有它 _finish 只能靠 attempts 判版本，会被 ABA 骗过
        db.execute('ALTER TABLE enrich_tasks ADD COLUMN claim_key INTEGER NOT NULL DEFAULT 0')
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
    for raw in list(tags or [])[:60]:
        # 换行/制表必须压掉：标签会被拼进导出 md 的 front matter，
        # 一个带 \n 的标签就能提前结束 YAML 块并注入任意键（模型或网页都能控制它）
        tag = re.sub(r'\s+', ' ', _TAG_STRIP.sub(' ', str(raw))).strip().strip('#')[:40].strip()
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
    """逐行重建，成功后再清孤儿条目。

    先 `DELETE FROM sources_fts` 再慢慢重建的话，中途任何一行报错（素材被并发硬删、
    extra_json 是坏值）都会留下"索引少了一半但没人知道"的状态。
    """
    with connection() as db:
        ids = [row[0] for row in db.execute('SELECT id FROM sources').fetchall()]
    built = 0
    for identifier in ids:
        try:
            index_source(identifier)
            built += 1
        except (sqlite3.Error, CollectionError):
            continue
    with connection() as db:
        db.execute('DELETE FROM sources_fts WHERE source_id NOT IN (SELECT id FROM sources)')
    return {'indexed': built, 'skipped': len(ids) - built}


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
        rows = db.execute('SELECT source_id FROM sources_fts WHERE sources_fts MATCH ? ORDER BY rank LIMIT ?',
                          (match, FTS_ID_CAP + 1)).fetchall()
    except sqlite3.OperationalError:
        return None
    if len(rows) > FTS_ID_CAP:
        # 命中太多：这些 id 会被拼成 id IN (?, ?, ...) 撞 SQLite 变量上限（32766）直接 500，
        # 不如退回 LIKE 扫（慢但不炸），所以报"FTS 不可用"
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
        # 不转义的话 query='%' 命中全库、'_' 变成单字通配：搜索框里输入的是字面量
        escaped = query[:200].replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        like = '%' + escaped + '%'
        # SQLite 的字符串字面量不做反斜杠转义，必须给出真实单字符 ESCAPE 子句，
        # 写成 ESCAPE '\\' 会被当成两个字符而直接报错。
        esc = "'\\'"
        like_columns = ('title', 'topic', 'content', 'author', 'kind', 'tags')
        filters.append(('(' + ' OR '.join(f'{column} LIKE ? ESCAPE {esc}' for column in like_columns) + ')',
                        [like] * len(like_columns)))
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


def tag_cloud(limit: int = 300) -> dict:
    """聚合全部已保存素材的标签与来源计数（知识库页「全部标签」抽屉用）。

    标签在库里是逗号分隔字符串，SQL 侧拆不干净，所以取回来在 Python 里聚合。
    只算 state=saved 且未删除的条目，与素材库列表口径一致。
    """
    counts: dict[str, int] = {}
    sites: dict[str, dict] = {}
    with connection() as db:
        rows = db.execute(
            "SELECT tags,platform,kind FROM sources WHERE deleted_at=0 AND state='saved'"
        ).fetchall()
    for tags, platform, kind in rows:
        site = str(platform or '').strip()
        kind_name = str(kind or '').strip()
        label = site or kind_name or '未标注来源'
        # 带上原始字段：platform 为空时 label 会落回 kind，前端拿 label 直接当 platform 筛会筛空。
        # /sources 同时支持 platform= 与 kind=，所以把两个真实可筛值一起给出去。
        node = sites.setdefault(label, {
            'name': label, 'count': 0,
            'platform': site, 'kind': '' if site else kind_name,
        })
        node['count'] += 1
        for tag in {t.strip() for t in str(tags or '').split(',') if t.strip()}:
            counts[tag] = counts.get(tag, 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[: max(1, limit)]
    return {
        'tags': [{'name': name, 'count': count} for name, count in ranked],
        'total_tags': len(counts),
        'sites': sorted(sites.values(), key=lambda v: (-v['count'], v['name'])),
    }


def get_source(identifier: str) -> dict:
    with connection() as db:
        row = db.execute('SELECT * FROM sources WHERE id=?', (identifier,)).fetchone()
    if row is None:
        raise CollectionError('素材不存在。', 404)
    return _shape_row(dict(row))


def source_exists(identifier: str) -> bool:
    """素材是否仍在库且不在回收站：宿主幂等回执复核对账用，不读正文。"""
    if not identifier:
        return False
    with connection() as db:
        return db.execute('SELECT 1 FROM sources WHERE id=? AND deleted_at=0 LIMIT 1',
                          (str(identifier),)).fetchone() is not None


def asset_exists(item: dict) -> bool:
    """asset_path 字段非空不等于文件真在：回执要说"读回过内容"就得 stat 一下。"""
    rel = str((item or {}).get('asset_path') or '')
    if not rel:
        return False
    target = (ROOT / 'outputs' / rel).resolve()
    return _inside(ROOT / 'outputs', target) and target.is_file()


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
        # 外部号只在平台内唯一：不带平台的话两个站点撞上同一个 id 会互相覆盖成同一条素材
        identity = 'ext\n' + (platform or 'unknown') + '\n' + external_id
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
            content = _merge_ocr_content(content, ocr_text)
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
    earlier_content = ''
    if state == 'saved':
        with connection() as db:
            earlier = db.execute(
                "SELECT content,title,tags,extra_json FROM sources WHERE id=? AND state='saved'",
                (identifier,)).fetchone()
        if earlier:
            same_content = (earlier['content'] or '') == content
            same_title = (earlier['title'] or '') == title[:500]
            save_status = 'unchanged' if same_content and same_title else 'updated'
            earlier_content = earlier['content'] or ''
            # 标签只并在前不覆盖：AI 打标一次几十秒，重新采集同一条不该把它清掉
            old_tags = [tag for tag in str(earlier['tags'] or '').split(',') if tag]
            merged_tags = _normalize_tags(old_tags + _normalize_tags(raw_tags))
            tags_sql = ','.join(merged_tags)
            try:
                old_extra = json.loads(earlier['extra_json'] or '{}')
            except json.JSONDecodeError:
                old_extra = {}
            if isinstance(old_extra, dict):
                # 已花过成本的识别结果与「已尝试」标记：本次没产出就留着，否则批量回填以为做过
                for key in ('ocr_attempted', 'ocr_text'):
                    if key in old_extra and key not in extra:
                        extra[key] = old_extra[key]
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
    if earlier_content:
        # 整列覆盖之后再把旧正文里的 OCR/转写段落原子补回（append 内部会同步 md 资产与索引）
        preserve_enriched_sections(identifier, earlier_content, content)
    result = get_source(identifier)
    result['save_status'] = save_status
    try:
        index_source(identifier)
    except sqlite3.Error:
        pass
    sync_knowledge(identifier, result)
    return result


_DNS_PRIVATE: dict[str, bool] = {}


def _resolves_to_private(host: str) -> bool:
    """通配 DNS（127.0.0.1.nip.io / *.sslip.io）字面看是公网域名，解析完才露出内网地址。

    解析失败时放行：本机离线时后面真去取也取不到，没必要为此把正常素材判死。
    """
    cached = _DNS_PRIVATE.get(host)
    if cached is not None:
        return cached
    try:
        addresses = socket.getaddrinfo(host, None)
    except OSError:
        return False
    verdict = bool(addresses) and any(
        not ipaddress.ip_address(record[4][0]).is_global for record in addresses)
    if len(_DNS_PRIVATE) > 512:
        _DNS_PRIVATE.clear()
    _DNS_PRIVATE[host] = verdict
    return verdict


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
        pass
    if host.endswith(('nip.io', 'sslip.io')) or _resolves_to_private(host):
        return False
    return True


def media_url_allowed(url: str) -> bool:
    """宿主与路由共用的公网地址判定：外链图片、待转写的视频地址同一套规则，别各处再写一遍。"""
    return _public_http_url(str(url or '').strip())


def ocr_available() -> bool:
    """只探测 rapidocr 是否可导入，不实例化模型（状态接口高频调用）。"""
    try:
        import importlib.util
        return importlib.util.find_spec('rapidocr_onnxruntime') is not None
    except Exception:
        return False


def _ocr_box_origin(box) -> tuple[float, float, float]:
    points = box if isinstance(box, (list, tuple)) else []
    xs = [float(p[0]) for p in points if isinstance(p, (list, tuple)) and len(p) >= 2]
    ys = [float(p[1]) for p in points if isinstance(p, (list, tuple)) and len(p) >= 2]
    if not xs or not ys:
        return 0.0, 0.0, 16.0
    return min(xs), min(ys), max(8.0, max(ys) - min(ys))


def _ocr_join_token(left: str, right: str, gap: float) -> str:
    if not left:
        return right
    if gap >= 70:
        return left + '    ' + right
    last = left[-1]
    first = right[0]
    cjk = '\u4e00' <= last <= '\u9fff' or '\u4e00' <= first <= '\u9fff'
    if cjk or first in '，。：、；,.:;）)]' or last in '（([':
        return left + right
    return left + ' ' + right


def layout_ocr_items(items: list) -> str:
    rows = []
    for item in items or []:
        if not isinstance(item, (list, tuple)) or len(item) < 2:
            continue
        text = str(item[1] or '').strip()
        if not text:
            continue
        x, y, height = _ocr_box_origin(item[0])
        rows.append((y, x, height, text))
    rows.sort()
    lines = []
    for y, x, height, text in rows:
        if lines and abs(y - lines[-1][0]) < max(8.0, 0.55 * lines[-1][2]):
            lines[-1][3].append((x, text))
            lines[-1][2] = (lines[-1][2] + height) / 2
        else:
            lines.append([y, x, height, [(x, text)]])
    out = []
    for _y, _x, _h, parts in lines:
        parts.sort()
        line = parts[0][1]
        for index in range(1, len(parts)):
            gap = parts[index][0] - parts[index - 1][0]
            line = _ocr_join_token(line, parts[index][1], gap)
        key = line.replace(' ', '').replace('#', '')
        if key in _OCR_SECTIONS or (len(key) <= 6 and key.endswith('经历')):
            if out:
                out.append('')
            out.append('## ' + key)
        else:
            out.append(line)
    return '\n'.join(out).strip()


def _merge_ocr_content(content: str, ocr_text: str) -> str:
    caption = (content or '').split('[图片文字]', 1)[0].rstrip()
    if ocr_text:
        return (caption + '\n\n[图片文字]\n' + ocr_text).strip()
    return caption


def ocr_local_images(rel_paths: list[str]) -> str:
    global _OCR
    try:
        from rapidocr_onnxruntime import RapidOCR
    except ImportError:
        return ''
    if _OCR is None:
        _OCR = RapidOCR()
    pages: list[str] = []
    for rel in rel_paths[:8]:
        path = ROOT / 'outputs' / str(rel)
        if not path.is_file():
            continue
        try:
            result, _elapsed = _OCR(str(path))
        except Exception:
            continue
        text = layout_ocr_items(result or [])
        if text:
            pages.append(text)
    return '\n\n'.join(pages)


def merge_extra_json(identifier: str, updates: dict) -> dict:
    """只把给的几个 key 并进 extra_json，其余 key 以库里当前值为准。

    耗时任务（OCR、转写）如果「整列读→算完整列写回」，中间别人补的字段就没了；
    这里交给 SQLite 的 json_set 原地合并。
    """
    args: list = []
    paths: list[str] = []
    for key, value in updates.items():
        key = str(key)
        if not key:
            continue
        paths.append("'$.'||json_quote(?), ?")   # 带点号/方括号的 key 不会被当成嵌套路径
        args.extend((key, value))
    if not paths:
        return get_source(identifier)
    args.append(identifier)
    with connection() as db:
        # json_valid 只说明"是合法 JSON"：根为 null/数字/数组/字符串时 json_set 原样返回，
        # UPDATE 照样 rowcount=1，于是并进去的东西其实一个字没落。只接受根是对象。
        # 注意 json_type() 返回类型名（'object'）不是路径 '$'；且它对非法 JSON 直接抛
        # malformed JSON，所以必须先用 json_valid() 挡一道，否则脏行会让合并整条失败。
        db.execute(
            "UPDATE sources SET extra_json = json_set("
            "CASE WHEN json_valid(extra_json) AND json_type(extra_json)='object' "
            "THEN extra_json ELSE '{}' END, "
            + ','.join(paths) + ') WHERE id=?', args)
    try:  # 合并的 key 里有 comments_text 这类进全文索引的字段，不重建就永远搜不到
        index_source(identifier)
    except (sqlite3.Error, CollectionError):
        pass
    return get_source(identifier)


def refresh_ocr(identifier: str) -> dict:
    item = get_source(identifier)
    extra = dict(item.get('extra') or {})
    ocr_text = ocr_local_images(list(extra.get('local_images') or []))
    if not ocr_text:
        return merge_extra_json(identifier, {'ocr_attempted': 1})
    merged = merge_extra_json(identifier, {'ocr_attempted': 1, 'ocr_text': ocr_text})
    # 换段而不是整列写回：OCR 跑几秒期间用户改过正文也不会被覆盖，只刷新 [图片文字] 那一段；
    # 也不能用「有标记就跳过」的追加，否则 grok 的按原图栏目排版重跑刷不掉旧的平铺文字。
    merged['ocr_appended'] = replace_marked_section(identifier, OCR_MARKER, OCR_MARKER + '\n' + ocr_text)
    return merged


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


ACCOUNT_ITEM_KINDS = ('post', 'media', 'comment')
MAX_ACCOUNT_ITEMS = 500          # 扩展把整批帖子一次性上报，默认量 50；留 10 倍余量，超出如实报 discarded
MAX_ACCOUNT_ITEM_BYTES = 200_000  # 单条 raw 上限：一个异常大的 raw 不该把素材库撑爆


def _new_identifier(seed: str) -> str:
    return hashlib.sha256(seed.encode('utf-8')).hexdigest()[:24]


def account_id_for(platform: str, platform_user_id: str, homepage_url: str) -> str:
    """同一博主反复导入要认成同一个账号：优先平台用户 id，缺了退回主页地址。"""
    return _new_identifier(f'{platform}|{platform_user_id or homepage_url}'.strip().lower())


def open_account_session(account_id: str, platform: str, homepage_url: str, platform_user_id: str,
                         username: str, avatar_url: str, bio: str, options: dict, profile: dict) -> dict:
    now = time.time()
    session_id = _new_identifier(f'{account_id}|{now}|{random.random()}')
    with connection() as db:
        db.execute('INSERT INTO account_sessions (id,account_id,platform,homepage_url,platform_user_id,username,'
                   'avatar_url,bio,options_json,profile_json,status,created_at,updated_at) '
                   "VALUES (?,?,?,?,?,?,?,?,?,?, 'open',?,?)",
                   (session_id, account_id, platform[:40], homepage_url[:2000], platform_user_id[:200],
                    username[:200], avatar_url[:2000], bio[:4000],
                    json.dumps(options, ensure_ascii=False)[:20000], json.dumps(profile, ensure_ascii=False)[:400000],
                    now, now))
    return get_account_session(session_id)


def _shape_session(row) -> dict:
    item = dict(row)
    for key, field in (('options', 'options_json'), ('profile', 'profile_json')):
        try:
            item[key] = json.loads(item.get(field) or '{}')
        except json.JSONDecodeError:
            item[key] = {}
        item.pop(field, None)
    return item


def get_account_session(session_id: str) -> dict:
    with connection() as db:
        row = db.execute('SELECT * FROM account_sessions WHERE id=?', (session_id,)).fetchone()
    if row is None:
        raise CollectionError('账号导入会话不存在。', 404)
    return _shape_session(row)


def latest_account_session(account_id: str) -> dict | None:
    """批量上报按 accountId 定址，sessionId 可能缺；缺了认这个账号最近一次会话。"""
    with connection() as db:
        row = db.execute('SELECT id FROM account_sessions WHERE account_id=? ORDER BY created_at DESC LIMIT 1',
                         (account_id,)).fetchone()
    return _shape_session(db.execute('SELECT * FROM account_sessions WHERE id=?', (row['id'],)).fetchone()) if row else None


def list_account_sessions(limit: int = 20) -> list[dict]:
    limit = max(1, min(int(limit or 20), 100))
    with connection() as db:
        rows = db.execute('SELECT * FROM account_sessions ORDER BY created_at DESC LIMIT ?', (limit,)).fetchall()
        out = []
        for row in rows:
            item = _shape_session(row)
            counts = {kind: 0 for kind in ACCOUNT_ITEM_KINDS}
            for kind, total in db.execute('SELECT kind,count(*) FROM account_items WHERE session_id=? GROUP BY kind',
                                          (item['id'],)).fetchall():
                counts[str(kind)] = total
            item['item_counts'] = counts
            out.append(item)
        identifiers = [item['id'] for item in out]
        marks = ','.join('?' * len(identifiers))
        linked = dict(db.execute(f'SELECT session_id,count(DISTINCT source_id) FROM account_items '
                                 f"WHERE source_id<>'' AND session_id IN ({marks}) GROUP BY session_id",
                                 identifiers).fetchall()) if identifiers else {}
        for item in out:
            item['linked_source_count'] = linked.get(item['id'], 0)
    return out


def upsert_account_items(session_id: str, kind: str, rows: list, default_post_id: str = '') -> dict:
    """按 (会话, 类型, 条目 id) 覆盖写：同一批重复投递不翻倍，也不静默丢超限部分。"""
    if kind not in ACCOUNT_ITEM_KINDS:
        raise CollectionError(f'未知的账号档案条目类型：{kind}')
    if not isinstance(rows, list):
        raise CollectionError(f'{kind} 批量数据必须是数组。')
    accepted = rows[:MAX_ACCOUNT_ITEMS]
    now = time.time()
    stored = linked = 0
    truncated = []
    with connection() as db:
        for index, raw in enumerate(accepted):
            item = raw if isinstance(raw, dict) else {}
            external_id = str(item.get('id') or item.get(f'{kind}Id') or item.get('platformPostId')
                              or item.get('commentId') or '').strip()
            if not external_id:
                # 没有稳定 id 也要能幂等：拿这条的内容指纹当 id
                external_id = _new_identifier(json.dumps(item, ensure_ascii=False, sort_keys=True)[:MAX_ACCOUNT_ITEM_BYTES])
                truncated.append(f'#{index + 1} 缺 id，按内容指纹入库')
            payload = json.dumps(item, ensure_ascii=False)
            if len(payload) > MAX_ACCOUNT_ITEM_BYTES:
                payload = json.dumps({'truncated_from_bytes': len(payload),
                                      'head': payload[:MAX_ACCOUNT_ITEM_BYTES]}, ensure_ascii=False)
                truncated.append(f'#{index + 1} 超出单条上限已截断')
            post_id = str(item.get('postId') or default_post_id or external_id)[:200] if kind != 'post' else external_id[:200]
            source_id = str(item.get('knowledgeEntryId') or '').strip()[:24]
            exists = bool(source_id) and db.execute('SELECT 1 FROM sources WHERE id=?', (source_id,)).fetchone() is not None
            db.execute('INSERT OR REPLACE INTO account_items (session_id,kind,external_id,post_id,source_id,url,title,'
                       'payload_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?, '
                       'COALESCE((SELECT created_at FROM account_items WHERE session_id=? AND kind=? AND external_id=?),?),?)',
                       (session_id, kind, external_id[:200], post_id, source_id if exists else '',
                        str(item.get('url') or '')[:2000], str(item.get('title') or '')[:300], payload,
                        session_id, kind, external_id[:200], now, now))
            stored += 1
            linked += 1 if exists else 0
    return {'kind': kind, 'received': len(rows), 'stored': stored, 'linked': linked,
            'discarded': len(rows) - len(accepted), 'notes': truncated[:10]}


def finish_account_session(session_id: str, status: str, imported: int, failed: int, last_error: str) -> dict:
    if status not in ('completed', 'partial', 'failed'):
        raise CollectionError(f'未知的导入会话结束状态：{status}')
    with connection() as db:
        db.execute("UPDATE account_sessions SET status=?, imported_post_count=?, failed_post_count=?, last_error=?, "
                   'updated_at=? WHERE id=?',
                   (status, max(0, int(imported or 0)), max(0, int(failed or 0)), str(last_error or '')[:500],
                    time.time(), session_id))
    return get_account_session(session_id)


def account_session_detail(session_id: str) -> dict:
    """给档案页看一次导入到底收了多少、有多少能回跳到素材库条目。"""
    session = get_account_session(session_id)
    detail = dict(session)
    with connection() as db:
        order = 'CASE kind ' + ' '.join(
            f"WHEN '{kind}' THEN {index}" for index, kind in enumerate(ACCOUNT_ITEM_KINDS)) + ' ELSE 99 END'
        rows = db.execute('SELECT kind, count(*) AS total, sum(CASE WHEN source_id<>\'\' THEN 1 ELSE 0 END) AS linked '
                          f'FROM account_items WHERE session_id=? GROUP BY kind ORDER BY {order}',
                          (session_id,)).fetchall()
        posts = db.execute("SELECT external_id, source_id, url, title FROM account_items "
                           "WHERE session_id=? AND kind='post' ORDER BY created_at LIMIT 50", (session_id,)).fetchall()
    detail['items'] = [{'kind': row['kind'], 'total': row['total'], 'linked': row['linked'] or 0} for row in rows]
    detail['source_ids'] = [row['source_id'] for row in posts if row['source_id']]
    detail['posts'] = [dict(row) for row in posts]
    return detail


def refresh_ocr_batch(limit: int = 20) -> dict:
    """给有本地图但没做过 OCR 的存量素材补识别（直接回应 Beav Issue #27 的批量诉求）。"""
    try:
        limit = max(1, min(int(limit), 100))
    except (TypeError, ValueError):
        limit = 20
    with connection() as db:
        rows = db.execute(
            "SELECT id FROM sources WHERE state='saved' AND deleted_at=0 "
            "AND extra_json LIKE '%local_images%' AND extra_json NOT LIKE '%ocr_attempted%' "
            'ORDER BY captured_at DESC LIMIT ?', (limit,)).fetchall()
    processed = with_text = 0
    for row in rows:
        try:
            item = refresh_ocr(row['id'])
        except CollectionError:
            continue
        processed += 1
        if (item.get('extra') or {}).get('ocr_text'):
            with_text += 1
    return {'processed': processed, 'with_text': with_text}


SITE_BY_DOMAIN = (
    ('xiaohongshu.com', 'xiaohongshu'), ('xhslink.com', 'xiaohongshu'), ('xhslink.cn', 'xiaohongshu'),
    ('zhihu.com', 'zhihu'), ('mp.weixin.qq.com', 'wechat-mp'), ('bilibili.com', 'bilibili'),
    ('douyin.com', 'douyin'), ('weibo.com', 'weibo'), ('youtube.com', 'youtube'), ('youtu.be', 'youtube'),
)
SITE_BY_PLATFORM = {'小红书': 'xiaohongshu', '知乎': 'zhihu', '公众号': 'wechat-mp', '哔哩哔哩': 'bilibili',
                    '抖音': 'douyin', '微博': 'weibo', 'X': 'x', 'Reddit': 'reddit', 'GitHub': 'github'}


def _knowledge_site(item: dict) -> str:
    host = (urlsplit(str(item.get('url') or '')).hostname or '').lower()
    for domain, slug in SITE_BY_DOMAIN:
        if host == domain or host.endswith('.' + domain):
            return slug
    slug = SITE_BY_PLATFORM.get(str(item.get('platform') or ''))
    if slug:
        return slug
    cleaned = re.sub(r'[^a-z0-9]+', '-', host).strip('-')[:60]   # 宿主可给超长主机名，目录名超 255 会让 mkdir 抛错
    return cleaned or 'imported'


# —— 知识库磁盘视图：一条素材 = 一个文件夹，对齐 Beav 的 knowledge/<site>/<id>/ ——
# sqlite 仍是索引与队列的真源；这里落的是「用户能直接用 Obsidian / 记事本打开、能直接 grep」的那一份。
KNOWLEDGE = ROOT / 'knowledge'
KNOWLEDGE_TRASH = KNOWLEDGE / '.trash'


def _knowledge_dir(item: dict) -> Path:
    return KNOWLEDGE / _knowledge_site(item) / str(item.get('id') or '')


def _atomic_write(target: Path, text: str) -> None:
    """先写同目录 .tmp 再 replace：中途被杀不会留下半截文件被 Obsidian 读走。"""
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_name(target.name + '.tmp')
    tmp.write_text(text, encoding='utf-8')
    tmp.replace(target)


def _iso_utc(ts) -> str | None:
    try:
        return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(float(ts or 0)))
    except (TypeError, ValueError, OSError):
        return None


def knowledge_meta(item: dict) -> dict:
    """meta.json 以 Beav 开源版的字段名为主（captureKind / sourceUrl / createdAt / stats…），
    在其上补 Easel 自有字段；两套名字不冲突，Beav 侧和本工作台都能读。
    """
    extra = item.get('extra') or {}
    identifier = str(item.get('id') or '')
    url = str(item.get('url') or '')
    return {
        # —— 与 Beav 同名同义 ——
        'id': identifier,
        'captureKind': item.get('kind') or 'document-source',
        'externalId': str(extra.get('external_id') or identifier),
        'title': item.get('title') or '',
        'author': item.get('author') or '',
        'cover': item.get('cover_url') or None,
        'createdAt': _iso_utc(item.get('captured_at')),
        'sourceUrl': url,
        'sourceLink': url,
        'sourceDomain': (urlsplit(url).hostname or ''),
        'sourceAppId': 'easel',
        'siteName': _knowledge_site(item),
        'excerpt': str(item.get('content') or '')[:200],
        'summary': item.get('summary') or None,
        'tags': list(item.get('tags') or []),
        'images': list(extra.get('local_images') or []),
        'stats': {'likes': extra.get('likes'), 'collects': extra.get('collects'),
                  'comments': extra.get('comments'), 'shares': None, 'views': None},
        # —— Easel 自有（Beav 无同名字段）——
        'platform': item.get('platform') or '',
        'topic': item.get('topic') or '',
        'method': item.get('method') or '',
        'capturedAt': item.get('captured_at'),
        'videoUrl': extra.get('video_url') or None,
        'ocrIncluded': bool(extra.get('ocr_text')),
        'storageStatus': 'stored',
    }


def knowledge_markdown(item: dict) -> str:
    """content.md：YAML frontmatter + H1 + Beav 风格的「来源」分节 + 正文（+ 评论）。"""
    plain_title = re.sub(r'\s+', ' ', str(item.get('title') or '')).strip()[:200]
    date = time.strftime('%Y-%m-%d', time.localtime(item.get('captured_at') or time.time()))
    # YAML 的双引号标量与 JSON 兼容：标题/URL 里有引号或换行时，不转义就能提前结束 front matter 注入键
    front = (f'---\ntitle: {json.dumps(plain_title, ensure_ascii=False)}'
             f'\nsource: {json.dumps(str(item.get("url") or ""), ensure_ascii=False)}'
             f'\ntags: [{", ".join(json.dumps(t, ensure_ascii=False) for t in item.get("tags") or [])}]'
             f'\ndate: {date}\n---\n\n')
    lines = []
    if item.get('author'):
        lines.append(f'- 作者：{item["author"]}')
    if item.get('url'):
        lines.append(f'- 原文：{item["url"]}')
    if item.get('platform'):
        lines.append(f'- 平台：{item["platform"]}')
    body = str(item.get('content') or '')
    extra = item.get('extra') or {}
    if extra.get('comments_text'):
        body += '\n\n## 评论\n\n' + str(extra['comments_text'])
    source_block = ('## 来源\n' + '\n'.join(lines) + '\n\n') if lines else ''
    return front + f'# {plain_title}\n\n{source_block}{body}\n'


def sync_knowledge(identifier: str, item: dict | None = None, force: bool = False) -> dict | None:
    """把一条素材同步成 knowledge/<site>/<id>/{meta.json,content.md}。

    落盘是「给人看的视图」，采集/加工主流程不依赖它：任何写盘异常都吞掉并返回 None，
    绝不因为磁盘只读、路径过长或被杀软占用，就让一条素材采不进来。
    """
    if item is None:
        try:
            item = get_source(identifier)
        except CollectionError:
            return None
    if int(item.get('deleted_at') or 0) > 0:
        return None
    # 采集失败/受限的条目只留在库里做错误记录，不进知识库；显式导出（force）时不拦
    if not force and str(item.get('state') or '') != 'saved':
        return None
    folder = _knowledge_dir(item)
    try:
        _atomic_write(folder / 'meta.json', json.dumps(knowledge_meta(item), ensure_ascii=False, indent=2))
        _atomic_write(folder / 'content.md', knowledge_markdown(item))
    except (OSError, ValueError):
        return None
    return {'id': str(item.get('id') or ''), 'folder': folder.relative_to(ROOT).as_posix()}


def sync_knowledge_all(limit: int = 5000) -> dict:
    """全量回填：把库里已有素材补成文件夹（迁旧数据 / 修复漏写）。已是最新也重写一遍，代价很小。"""
    with connection() as db:
        ids = [str(row[0]) for row in db.execute(
            "SELECT id FROM sources WHERE state='saved' AND deleted_at=0 ORDER BY captured_at DESC LIMIT ?",
            (limit,)).fetchall()]
    written = 0
    for identifier in ids:
        if sync_knowledge(identifier):
            written += 1
    return {'total': len(ids), 'written': written, 'failed': len(ids) - written}


def knowledge_path(identifier: str) -> dict:
    """条目的磁盘落点（相对 ROOT），并如实回报文件夹是否真在（列了路径不等于文件存在）。"""
    item = get_source(identifier)
    folder = _knowledge_dir(item)
    return {'id': identifier, 'folder': folder.relative_to(ROOT).as_posix(),
            'title': item.get('title') or '', 'exists': (folder / 'content.md').is_file()}


def _stash_knowledge(item: dict) -> None:
    """软删时把文件夹挪进 knowledge/.trash/，而不是直接删：用户点错还能捞回来。"""
    folder = _knowledge_dir(item)
    if not folder.is_dir():
        return
    target = KNOWLEDGE_TRASH / str(item.get('id') or '')
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            shutil.rmtree(target, ignore_errors=True)
        shutil.move(str(folder), str(target))
    except OSError:
        pass


def _unstash_knowledge(identifier: str) -> None:
    """恢复时优先把 .trash 里那份挪回原位；没有就按当前库内容重建。"""
    try:
        item = get_source(identifier)
    except CollectionError:
        return
    folder = _knowledge_dir(item)
    stashed = KNOWLEDGE_TRASH / identifier
    if stashed.is_dir():
        try:
            folder.parent.mkdir(parents=True, exist_ok=True)
            if folder.exists():
                shutil.rmtree(folder, ignore_errors=True)
            shutil.move(str(stashed), str(folder))
            return
        except OSError:
            pass
    sync_knowledge(identifier, item)


def export_folder(identifier: str) -> dict:
    """照 Beav 目录约定导出：knowledge/<site>/<id>/meta.json+content.md（Obsidian 可直接吃）。

    与自动落盘共用同一实现：导出不是另生成一份副本，而是确保它已经在磁盘上。
    """
    item = get_source(identifier)
    if int(item.get('deleted_at') or 0) > 0:
        raise CollectionError('这条素材在回收站里，先恢复再导出。', 409)
    written = sync_knowledge(identifier, item, force=True)
    if written is None:
        raise CollectionError('磁盘写入失败，无法导出这条素材。', 500)
    return {**written, 'files': ['meta.json', 'content.md']}


def export_batch(ids: list[str], fmt: str = 'json') -> dict:
    """批量导出：folder=知识库目录；json/csv 落 outputs/导出/ 走 /api/media 下载。"""
    clean_ids = [str(x) for x in ids if str(x).strip()][:500]
    if fmt == 'folder':
        items = []
        for identifier in clean_ids:
            try:
                items.append(export_folder(identifier))
            except CollectionError:
                continue
        return {'format': 'folder', 'count': len(items), 'items': items}
    if fmt not in ('json', 'csv'):
        raise CollectionError('导出格式仅支持 folder / json / csv。')
    rows = []
    for identifier in clean_ids:
        try:
            rows.append(get_source(identifier))
        except CollectionError:
            continue
    # 文件名精确到毫秒再带一段随机：只到秒的话同一秒两次导出会后一次覆前一次，返回路径还一样
    stamp = time.strftime('%Y%m%d-%H%M%S') + f'-{int(time.time() * 1000) % 1000:03d}-{random.randrange(1000):03d}'
    fields = ('id', 'title', 'url', 'platform', 'kind', 'author', 'topic', 'tags', 'likes', 'collects',
              'comments', 'state', 'method', 'captured_at', 'content')

    def _neutralise(value) -> str:
        text = '' if value is None else str(value)
        # 网页正文可以以 = + - @ 开头；这类单元格在 Excel/WPS 里是公式（DDE 甚至能拉命令）
        return "'" + text if text[:1] in ('=', '+', '-', '@', '\t', '\r') else text

    records = []
    for row in rows:
        extra = row.get('extra') or {}
        record = {
            'id': row.get('id'), 'title': row.get('title'), 'url': row.get('url'), 'platform': row.get('platform'),
            'kind': row.get('kind'), 'author': row.get('author'), 'topic': row.get('topic'),
            'tags': ','.join(row.get('tags') or []), 'likes': extra.get('likes'), 'collects': extra.get('collects'),
            'comments': extra.get('comments'), 'state': row.get('state'), 'method': row.get('method'),
            'captured_at': row.get('captured_at'), 'content': row.get('content'),
        }
        records.append(record)
    target = ROOT / 'outputs' / '导出' / f'素材库-{stamp}.{fmt}'
    target.parent.mkdir(parents=True, exist_ok=True)
    if fmt == 'csv':
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        writer.writerows({key: _neutralise(value) for key, value in record.items()} for record in records)
        target.write_text('\ufeff' + buffer.getvalue(), encoding='utf-8')
    else:
        target.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    return {'format': fmt, 'count': len(records), 'file': target.relative_to(ROOT / 'outputs').as_posix()}


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
        _write_asset(item, content, title)
    try:
        index_source(identifier)
    except sqlite3.Error:
        pass
    updated = get_source(identifier)
    sync_knowledge(identifier, updated)
    return updated


def _inside(root: Path, candidate: Path) -> bool:
    """candidate 是否真在 root 里面。startswith 前缀比较不算：`../outputs_x/` 解析后仍以 outputs 开头。"""
    try:
        root = Path(root).resolve()
        candidate = Path(candidate).resolve()
    except OSError:
        return False
    return candidate != root and root in candidate.parents


def _write_asset(item: dict, content: str, title: str | None = None) -> None:
    """把正文同步回 outputs/ 里的 md 资产，保留 front header；越界路径一律不写。"""
    target = (ROOT / 'outputs' / str(item['asset_path'])).resolve()
    if not _inside(ROOT / 'outputs', target) or not target.parent.is_dir():
        return
    old = target.read_text(encoding='utf-8') if target.is_file() else ''
    head, sep, _body = old.partition('\n---\n\n')
    try:
        target.write_text((head + sep if sep else f"# {title or item.get('title') or ''}\n\n---\n\n") + str(content), encoding='utf-8')
    except OSError:
        pass


def append_marked_section(identifier: str, marker: str, block: str) -> bool:
    """原子追加一段带标记的内容（OCR 文字 / 视频转写）。

    长耗时任务不能「先读整行、算完再整行写回」——期间用户改过正文就会被覆盖；
    这里把「有没有这个标记」和追加都放进同一条 UPDATE，只有真的追加了才同步资产与索引。
    """
    with connection() as db:
        # COALESCE：content 为 NULL 时 trim()/instr() 都是 NULL，整条 UPDATE 会匹配 0 行，
        # 于是识别文字被静默丢弃（而 ocr_attempted 已写，批量回填再也不会回来补）。
        appended = db.execute(
            "UPDATE sources SET content = trim(COALESCE(content, ''), char(10)||' ') "
            "|| char(10)||char(10)||? WHERE id=? AND instr(COALESCE(content, ''), ?)=0",
            (block, identifier, marker)).rowcount > 0
    if not appended:
        return False
    item = get_source(identifier)
    _write_asset(item, item.get('content') or '')
    try:
        index_source(identifier)
    except sqlite3.Error:
        pass
    sync_knowledge(identifier, item)
    return True


# 与 easel/research_enrich.TRANSCRIBE_MARKER 同源（顶部常量区定义）
ENRICHED_MARKERS = (OCR_MARKER, TRANSCRIBE_MARKER)


def _marked_blocks(content: str) -> list[tuple[str, str]]:
    """从正文里切出各标记段落（同一标记只取第一段，避免重复堆积）。"""
    text = str(content or '')
    found: list[tuple[int, str, int]] = []
    for marker in ENRICHED_MARKERS:
        start = text.find(marker)
        if start < 0:
            continue
        ends = [end for end in (text.find(other, start + len(marker)) for other in ENRICHED_MARKERS) if end > 0]
        found.append((start, marker, min(ends) if ends else len(text)))
    return [(marker, text[start:end].strip()) for start, marker, end in sorted(found)]


def _swap_marked_block(content: str, marker: str, block: str) -> str:
    """只换掉 marker 自己那一段（到下一个别的标记段或文末），其余段落原样保留。"""
    text = str(content or '')
    start = text.find(marker)
    if start < 0:
        return (text.rstrip() + '\n\n' + block.strip()).strip()
    ends = [end for end in (text.find(other, start + len(marker)) for other in ENRICHED_MARKERS) if end > start]
    stop = min(ends) if ends else len(text)
    return (text[:start].rstrip() + '\n\n' + block.strip() + '\n\n' + text[stop:].strip()).strip()


def replace_marked_section(identifier: str, marker: str, block: str) -> bool:
    """在同一条写事务里重读正文、换掉带标记的那一段。

    与 append_marked_section 的差别是允许刷新同一段（识别结果的排版会变），
    但只吃自己那一段，视频转写不能被顺带抹掉；读改写放进 BEGIN IMMEDIATE，
    与另一个写者互斥，OCR 那几秒里用户改过的正文照样保留。
    """
    with connection() as db:
        db.execute('BEGIN IMMEDIATE')
        row = db.execute('SELECT content FROM sources WHERE id=?', (identifier,)).fetchone()
        if row is None:
            db.rollback()
            raise CollectionError('素材不存在。', 404)
        body = str(row['content'] or '')
        merged = _swap_marked_block(body, marker, block)
        if merged == body:
            db.rollback()
            return False
        db.execute('UPDATE sources SET content=? WHERE id=?', (merged, identifier))
    item = get_source(identifier)
    _write_asset(item, item.get('content') or '')
    try:
        index_source(identifier)
    except sqlite3.Error:
        pass
    sync_knowledge(identifier, item)
    return True


def preserve_enriched_sections(identifier: str, old_content: str, new_content: str) -> int:
    """重新采集/刷新正文时，把新采集没带的旧加工段落（OCR 文字、视频转写）补回来。

    这两段最短几十秒、最长几十分钟才能产出，过去 UPSERT 整列覆盖直接抹掉，
    而 extra 里的 ocr_attempted 还在，批量回填以为做过就不再补。
    用户在编辑器里主动删段落走的是 update_source，不经过这里，删除照旧生效。
    """
    restored = 0
    for marker, block in _marked_blocks(old_content):
        if not block or marker in str(new_content or ''):
            continue
        if append_marked_section(identifier, marker, block):
            restored += 1
    return restored


def merge_ai_fields(identifier: str, tags: list[str] | None = None,
                    summary: str | None = None, expected_summary: str | None = None) -> dict:
    """AI 产物写回：标签在库里并、摘要只在用户没同期改过时覆盖。

    模型一次要跑几十秒到 300 秒，「读整行→算→写整列」会把这期间用户加的标签或
    改的摘要吞掉，所以整段读改写放进同一条 BEGIN IMMEDIATE 事务，与另一个写者互斥。
    """
    with connection() as db:
        db.execute('BEGIN IMMEDIATE')
        row = db.execute('SELECT tags, summary FROM sources WHERE id=?', (identifier,)).fetchone()
        if row is None:
            db.rollback()
            raise CollectionError('素材不存在。', 404)
        current_tags = [tag for tag in str(row['tags'] or '').split(',') if tag]
        sets: list[str] = []
        params: list = []
        if tags is not None:
            sets.append('tags=?')
            params.append(','.join(_normalize_tags(current_tags + list(tags))))
        if summary is not None and (row['summary'] or '') == (expected_summary or ''):
            sets.append('summary=?')
            params.append(str(summary)[:1000])
        if sets:
            params.append(identifier)
            db.execute(f"UPDATE sources SET {','.join(sets)} WHERE id=?", params)
        db.commit()
    try:
        index_source(identifier)
    except (sqlite3.Error, CollectionError):
        pass
    merged = get_source(identifier)
    sync_knowledge(identifier, merged)
    return merged


def add_tag(identifier: str, tag: str) -> dict:
    item = get_source(identifier)
    return update_source(identifier, tags=list(dict.fromkeys(item['tags'] + _normalize_tags([tag]))))


def remove_tag(identifier: str, tag: str) -> dict:
    item = get_source(identifier)
    drop = set(_normalize_tags([tag]))
    return update_source(identifier, tags=[t for t in item['tags'] if t not in drop])


def delete_sources(ids: list[str]) -> int:
    now = time.time()
    targets = [str(x) for x in ids if str(x).strip()][:200]
    if not targets:
        return 0
    done: list[str] = []
    with connection() as db:
        for identifier in targets:
            if db.execute('UPDATE sources SET deleted_at=? WHERE id=? AND deleted_at=0',
                          (now, identifier)).rowcount:
                done.append(identifier)
    # 落盘在事务外做：磁盘挪动慢，不该占着写锁
    for identifier in done:
        try:
            _stash_knowledge(get_source(identifier))
        except CollectionError:
            continue
    return len(done)


def restore_sources(ids: list[str]) -> int:
    targets = [str(x) for x in ids if str(x).strip()][:200]
    if not targets:
        return 0
    done: list[str] = []
    with connection() as db:
        for identifier in targets:
            if db.execute('UPDATE sources SET deleted_at=0 WHERE id=? AND deleted_at>0',
                          (identifier,)).rowcount:
                done.append(identifier)
    for identifier in done:
        _unstash_knowledge(identifier)
    return len(done)


def list_trash() -> list[dict]:
    purge_expired()
    with connection() as db:
        rows = db.execute(
            'SELECT id,title,platform,kind,tags,deleted_at,captured_at FROM sources '
            'WHERE deleted_at>0 ORDER BY deleted_at DESC LIMIT 200').fetchall()
    return [dict(row) for row in rows]


def purge_expired(days: float = 30) -> int:
    """回收站超期硬删：行、FTS 条目、加工任务与 md/图片目录一起清（对齐 Beav 30 天口径）。"""
    cutoff = time.time() - days * 86400
    purged = 0
    with connection() as db:
        # 整段放在一条写事务里，且 DELETE 复核 deleted_at 上界：
        # 否则与 restore 赛跑时会出现「restore 返回 1、素材连文件仍被硬删」
        db.execute('BEGIN IMMEDIATE')
        rows = db.execute('SELECT id,asset_path FROM sources WHERE deleted_at>0 AND deleted_at<?', (cutoff,)).fetchall()
        gone: list[tuple[str, str]] = []
        for row in rows:
            deleted = db.execute('DELETE FROM sources WHERE id=? AND deleted_at>0 AND deleted_at<?',
                                 (row['id'], cutoff)).rowcount
            if not deleted:
                continue
            purged += deleted
            gone.append((str(row['id']), str(row['asset_path'] or '')))
            db.execute('DELETE FROM sources_fts WHERE source_id=?', (row['id'],))
            # 任务行不清会留下僵尸：素材已没了还反复被领→报错，状态页永远挂着计数
            db.execute('DELETE FROM enrich_tasks WHERE source_id=?', (row['id'],))
        db.execute('DELETE FROM operations WHERE at<?', (time.time() - 30 * 86400,))
        db.commit()
    for identifier, asset_path in gone:
        for candidate in ((ROOT / 'outputs' / asset_path) if asset_path else None,
                          ROOT / 'outputs' / '研究素材' / identifier):
            if not candidate:
                continue
            # 真包含判定：startswith 会让 ../outputs_backup/... 通过，然后整个兄弟目录被 rmtree
            if not _inside(ROOT / 'outputs', candidate):
                continue
            resolved = candidate.resolve()
            if resolved.exists():
                if resolved.is_dir():
                    shutil.rmtree(resolved, ignore_errors=True)
                else:
                    try:
                        resolved.unlink()
                    except OSError:
                        pass
        # 知识库视图与它在 .trash 里那份一起清：软删已把目录挪走，这里兜住 stash 失败留下的
        for candidate in [KNOWLEDGE_TRASH / identifier, *KNOWLEDGE.glob(f'*/{identifier}')]:
            if not _inside(KNOWLEDGE, candidate):
                continue
            resolved = candidate.resolve()
            if resolved.is_dir():
                shutil.rmtree(resolved, ignore_errors=True)
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
        total = db.execute("SELECT count(*) FROM sources WHERE state='saved' AND deleted_at=0").fetchone()[0]
        indexed = db.execute('SELECT count(*) FROM sources_fts').fetchone()[0]
        trash = db.execute('SELECT count(*) FROM sources WHERE deleted_at>0').fetchone()[0]
        pending = db.execute(
            "SELECT count(*) FROM sources WHERE deleted_at=0 AND extra_json LIKE '%transcribe%'").fetchone()[0]
        queued = {str(row[0]): {'pending': row[1], 'running': row[2], 'failed': row[3]} for row in db.execute(
            "SELECT task, SUM(status='pending'), SUM(status='running'), SUM(status='failed') "
            'FROM enrich_tasks GROUP BY task').fetchall()}
    enrich = queued.get('enrich', {'pending': 0, 'running': 0, 'failed': 0})
    transcribe = queued.get('transcribe', {'pending': 0, 'running': 0, 'failed': 0})
    return {'total': total, 'fts_indexed': indexed, 'trash': trash,
            'pending_transcribe': pending, 'ocr_available': ocr_available(),
            'enrich_pending': enrich['pending'] + enrich['running'], 'enrich_failed': enrich['failed'],
            'transcribe_pending': transcribe['pending'] + transcribe['running'],
            'transcribe_failed': transcribe['failed']}


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
