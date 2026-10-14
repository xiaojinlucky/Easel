"""盯住小红书主页和公众号，记下新帖，再交给现有发布页。

手机分享出来的是一整段话。这里只把里面的主页链接认出来。
读帖子交给本机已经安装的 opencli：小红书用 user/note，公众号用 weixin search/download。
不调用登录、发布、关注。读不到时保留已经记下的帖子。
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid
import urllib.parse
import urllib.request
from pathlib import Path

from easel.research import media_url_allowed
from easel.runtime import STATE

PLATFORMS = {'xiaohongshu': '小红书', 'wechat-oa': '公众号'}
MAX_TARGETS = 30
MAX_POSTS = 20
MAX_TEXT = 8000
_READ_LIMIT = 8
# Chrome 152 及更新版本会在调试器刚松开时拒绝打开页面。
# 读帖时带上「只在失败时留记录」，已装的浏览器桥就会跳过那一下松开。成功不留记录。
_READ_TAIL = ['--window', 'background', '-f', 'json', '--trace', 'retain-on-failure']
_CREATE_FLAGS = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
_OPENCLI_ALLOWED = {
    ('xiaohongshu', 'user'),
    ('xiaohongshu', 'note'),
    ('weixin', 'search'),
    ('weixin', 'download'),
}


class WatchError(ValueError):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def store_path() -> Path:
    return STATE / 'watch.json'


def load(path: Path | None = None) -> dict:
    file = path or store_path()
    if not file.is_file():
        return {'targets': []}
    try:
        data = json.loads(file.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError):
        return {'targets': []}
    if not isinstance(data, dict) or not isinstance(data.get('targets'), list):
        return {'targets': []}
    return data


def save(data: dict, path: Path | None = None) -> None:
    file = path or store_path()
    file.parent.mkdir(parents=True, exist_ok=True)
    tmp = file.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(file)


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


def _clean_name(name: str) -> str:
    text = re.sub(r'\s+', ' ', (name or '').strip())
    if not text:
        raise WatchError('先写账号名字。')
    if len(text) > 40:
        raise WatchError('名字太长了。')
    return text


def _host(url: str) -> str:
    return (urllib.parse.urlsplit(url).hostname or '').lower()


def _urls_in(text: str) -> list[str]:
    found: list[str] = []
    for raw in re.findall(r'https?://[^\s<>"\']+', text or ''):
        cleaned = raw.rstrip('.,，。、；;）)】》>」』"\'')
        if cleaned and cleaned not in found:
            found.append(cleaned)
    return found


def _profile_parts(path: str) -> list[str]:
    marker = '/user/profile/'
    if marker not in path:
        return []
    tail = path.split(marker, 1)[1].strip('/')
    return [part for part in tail.split('/') if part]


def _kind(url: str) -> str:
    host = _host(url)
    path = urllib.parse.urlsplit(url).path or ''
    if host in {'xhslink.com', 'xhslink.cn'}:
        return 'xhs-short'
    if 'xiaohongshu.com' in host and '/user/profile/' in path:
        # 主页只有用户这一段。后面再多一段时，那是一篇笔记，不是主页。
        parts = _profile_parts(path)
        if len(parts) >= 2:
            return 'xhs-note'
        if len(parts) == 1:
            return 'xhs-profile'
    if 'xiaohongshu.com' in host and any(part in path for part in ('/explore/', '/discovery/item/', '/item/')):
        return 'xhs-note'
    if 'mp.weixin.qq.com' in host and '/s/' in path:
        return 'wx-article'
    if 'mp.weixin.qq.com' in host and ('profile_ext' in path or '__biz=' in url):
        return 'wx-account'
    if host == 'weixin.sogou.com':
        return 'wx-search'
    return 'other'


def _identity(url: str) -> str:
    parts = urllib.parse.urlsplit(url)
    host = (parts.hostname or '').lower()
    if 'xiaohongshu.com' in host and '/user/profile/' in parts.path:
        profile = _profile_parts(parts.path)
        if profile:
            return host + '/user/profile/' + profile[0]
    if host == 'weixin.sogou.com':
        query = urllib.parse.parse_qs(parts.query).get('query', [''])[0]
        return 'sogou:' + query
    return url


def resolve_short(url: str) -> str:
    """只展开手机短链，不把页面正文拿来自己解析。"""
    if _host(url) not in {'xhslink.com', 'xhslink.cn'}:
        return url
    return final_url(url)


def interpret(platform: str, name: str, raw: str, resolve=None) -> tuple[str, str]:
    """从手机复制的整段里认出主页。选错平台时按链接本身改过来。"""
    if platform not in PLATFORMS:
        raise WatchError('只能盯小红书或公众号。')
    text = (raw or '').strip()
    if platform == 'wechat-oa' and not text:
        return platform, 'https://weixin.sogou.com/weixin?type=2&query=' + urllib.parse.quote(name)
    links = _urls_in(text)
    if not links and text and media_url_allowed(text):
        links = [text]
    if not links:
        raise WatchError('这段里没有主页链接。')
    follow = resolve or resolve_short
    profiles: list[tuple[str, str]] = []
    notes: list[str] = []
    blocked = False
    saw_public = False
    for link in links:
        if not media_url_allowed(link):
            blocked = True
            continue
        saw_public = True
        final = link
        kind = _kind(link)
        if kind == 'xhs-short':
            final = follow(link)
            if not final or _kind(final) == 'xhs-short':
                raise WatchError('这个短链这次没打开。')
            if not media_url_allowed(final):
                raise WatchError('这个链接不能用。')
            kind = _kind(final)
        if kind == 'xhs-profile':
            profiles.append(('xiaohongshu', final))
        elif kind in {'wx-account', 'wx-search'}:
            profiles.append(('wechat-oa', final))
        elif kind == 'xhs-note':
            notes.append('xiaohongshu')
        elif kind == 'wx-article':
            notes.append('wechat-oa')
    if profiles:
        for chosen, link in profiles:
            if chosen == platform:
                return chosen, link
        return profiles[0]
    if notes == ['xiaohongshu'] or (notes and 'wechat-oa' not in notes):
        raise WatchError('这是一篇笔记，不是主页。一篇笔记请记在这个账号下面。')
    if 'wechat-oa' in notes:
        raise WatchError('这是一篇文章，不是公众号主页。写上公众号名字就能盯。')
    if blocked and not saw_public:
        raise WatchError('这个链接不能用。')
    raise WatchError('这段里没有主页链接。')


def add_target(platform: str, name: str, url: str = '', path: Path | None = None, resolve=None) -> dict:
    title = _clean_name(name)
    chosen, link = interpret(platform, title, url, resolve)
    data = load(path)
    if len(data['targets']) >= MAX_TARGETS:
        raise WatchError('盯的账号太多了，先去掉一个。')
    identity = _identity(link)
    if any(_identity(item.get('url') or '') == identity for item in data['targets']):
        raise WatchError('这个账号已经在盯了。')
    target = {
        'id': _new_id(),
        'platform': chosen,
        'name': title,
        'url': link,
        'message': '',
        'posts': [],
    }
    data['targets'].insert(0, target)
    save(data, path)
    return target


def remove_target(target_id: str, path: Path | None = None) -> None:
    data = load(path)
    kept = [item for item in data['targets'] if item.get('id') != target_id]
    if len(kept) == len(data['targets']):
        raise WatchError('没有这个账号。', 404)
    data['targets'] = kept
    save(data, path)


def _find(data: dict, target_id: str) -> dict:
    for item in data['targets']:
        if item.get('id') == target_id:
            return item
    raise WatchError('没有这个账号。', 404)


def add_post(target_id: str, title: str, url: str = '', text: str = '', path: Path | None = None) -> dict:
    heading = re.sub(r'\s+', ' ', (title or '').strip())
    body = (text or '').strip()[:MAX_TEXT]
    link = (url or '').strip()
    if link and not media_url_allowed(link):
        raise WatchError('这篇的链接不能用。')
    if not heading and not body:
        raise WatchError('先写标题，或贴上帖子内容。')
    if not heading:
        heading = body.splitlines()[0][:40]
    data = load(path)
    target = _find(data, target_id)
    if link and any(post.get('url') == link for post in target['posts']):
        raise WatchError('这篇已经记下了。')
    post = {'id': _new_id(), 'title': heading[:80], 'url': link, 'text': body, 'manual': True}
    target['posts'].insert(0, post)
    target['posts'] = target['posts'][:MAX_POSTS]
    target['message'] = ''
    save(data, path)
    return post


def remove_post(post_id: str, path: Path | None = None) -> None:
    data = load(path)
    found = False
    for target in data['targets']:
        kept = [post for post in target.get('posts') or [] if post.get('id') != post_id]
        if len(kept) != len(target.get('posts') or []):
            target['posts'] = kept
            found = True
    if not found:
        raise WatchError('没有这篇。', 404)
    save(data, path)


def _coalesce(row: dict, *keys: str) -> str:
    lowered = {str(key).lower(): value for key, value in row.items()}
    for key in keys:
        value = row.get(key)
        if value is None:
            value = lowered.get(key.lower())
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ''


def _media_word(row: dict) -> str:
    current = _coalesce(row, 'media')
    if current in {'视频', '图文', '文章'}:
        return current
    kind = _coalesce(row, 'type', 'note_type').lower()
    if kind in {'video', '视频'}:
        return '视频'
    if kind in {'normal', 'image', 'images', '图文', 'note'}:
        return '图文'
    return ''


def normalize_post(row: dict) -> dict | None:
    if not isinstance(row, dict):
        return None
    title = re.sub(r'\s+', ' ', _coalesce(row, 'title', 'displayTitle', '标题'))
    url = _coalesce(row, 'url', 'note_url', 'link', '链接')
    if len(title) < 2 or not url or not media_url_allowed(url):
        return None
    media = _media_word(row)
    if not media and _kind(url) == 'wx-article':
        media = '文章'
    text = _coalesce(row, 'text', 'desc', 'description', 'summary', 'content', '正文', '描述')
    return {'title': title[:80], 'url': url, 'text': text[:MAX_TEXT], 'media': media}


def _posts_from_rows(platform: str, rows) -> list[dict]:
    kept: list[dict] = []
    for row in rows or []:
        post = normalize_post(row)
        if not post:
            continue
        kind = _kind(post['url'])
        if platform == 'xiaohongshu' and kind != 'xhs-note':
            continue
        if platform == 'wechat-oa' and kind != 'wx-article':
            continue
        if platform == 'wechat-oa' and not post['media']:
            post['media'] = '文章'
        kept.append(post)
    return kept[:MAX_POSTS]


def _merge_posts(target: dict, incoming: list[dict]) -> int:
    known = {post.get('url') for post in target['posts'] if post.get('url')}
    added = 0
    fresh = []
    for item in incoming:
        if item['url'] in known:
            continue
        known.add(item['url'])
        fresh.append({**item, 'id': _new_id(), 'manual': False})
        added += 1
    target['posts'] = (fresh + target['posts'])[:MAX_POSTS]
    return added


def refresh_target(target_id: str, read=None, path: Path | None = None) -> dict:
    data = load(path)
    target = _find(data, target_id)
    reader = read or read_account
    try:
        incoming = _posts_from_rows(target.get('platform') or '', reader(target))
    except WatchError as exc:
        target['message'] = str(exc)
        save(data, path)
        return target
    except Exception:
        target['message'] = '这次没读到新帖。'
        save(data, path)
        return target
    added = _merge_posts(target, incoming)
    target['message'] = f'新读到 {added} 篇。' if added else '这次没有新帖。'
    save(data, path)
    return target


def ensure_post_text(post_id: str, detail=None, path: Path | None = None) -> dict:
    data = load(path)
    fetch = detail or read_post_detail
    for target in data['targets']:
        for post in target.get('posts') or []:
            if post.get('id') != post_id:
                continue
            if len(post.get('text') or '') >= 40 or not post.get('url'):
                return post
            try:
                extra = fetch(target.get('platform') or '', post['url']) or {}
            except Exception:
                return post
            if extra.get('text'):
                post['text'] = str(extra['text'])[:MAX_TEXT]
            if extra.get('media') and not post.get('media'):
                post['media'] = extra['media']
            if extra.get('title') and post.get('title') in {'', '这篇公众号'}:
                post['title'] = extra['title']
            save(data, path)
            return post
    raise WatchError('没有这篇。', 404)


def task_prompt(post: dict) -> str:
    title = (post.get('title') or '').strip()
    body = (post.get('text') or '').strip()[:4000]
    media = (post.get('media') or '').strip()
    media_line = f'形态：{media}\n' if media else ''
    return (
        '请根据【对方的新帖】写一篇我自己的帖子，同时适合小红书和公众号。\n'
        '不要照抄原句，不要写写作说明。\n'
        '只输出下面两段：\n'
        '标题：一句话\n'
        '正文：\n'
        '从这里写正文\n\n'
        '【对方的新帖】\n'
        f'标题：{title}\n'
        f'{media_line}'
        f'正文：{body or "（只有标题）"}'
    )


def parse_draft(text: str) -> dict:
    raw = (text or '').strip()
    raw = re.sub(r'^```[a-z]*\n?|```$', '', raw, flags=re.I).strip()
    title_match = re.search(r'标题\s*[:：]\s*(.+)', raw)
    body_match = re.search(r'正文\s*[:：]\s*(.*)$', raw, re.S)
    title = title_match.group(1).strip().splitlines()[0] if title_match else ''
    body = body_match.group(1).strip() if body_match else ''
    if title in {'一句话', '<标题>'} or not title or len(body) < 2:
        raise WatchError('没写完。')
    return {'title': title[:64], 'body': body[:8000], 'platforms': ['xiaohongshu', 'wechat-oa']}


def find_post(post_id: str, path: Path | None = None) -> dict:
    data = load(path)
    for target in data['targets']:
        for post in target.get('posts') or []:
            if post.get('id') == post_id:
                return post
    raise WatchError('没有这篇。', 404)


class _PublicRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not media_url_allowed(newurl):
            raise WatchError('这个链接不能读。')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def final_url(url: str) -> str:
    if not media_url_allowed(url):
        raise WatchError('这个链接不能用。')
    opener = urllib.request.build_opener(_PublicRedirect, urllib.request.ProxyHandler({}))
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with opener.open(request, timeout=12) as response:
            return response.geturl()
    except WatchError:
        raise
    except Exception as exc:
        raise WatchError('这个短链这次没打开。') from exc


def _parse_cli_json(stdout: str):
    text = stdout or ''
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char not in '{[':
            continue
        try:
            data, _end = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        return data
    raise WatchError('这次没读到新帖。')


def _rows(data) -> list[dict]:
    if isinstance(data, list):
        dicts = [item for item in data if isinstance(item, dict)]
        if dicts and all('field' in item and 'value' in item for item in dicts):
            return [{str(item.get('field')): item.get('value') for item in dicts}]
        return dicts
    if isinstance(data, dict):
        if isinstance(data.get('error'), dict):
            message = str(data['error'].get('message') or data['error'].get('code') or '')
            raise WatchError(_read_failure(message, ''))
        for key in ('items', 'data', 'notes', 'rows'):
            if isinstance(data.get(key), list):
                return _rows(data[key])
        if 'field' in data and 'value' in data:
            return [{str(data.get('field')): data.get('value')}]
        return [data]
    return []


def _read_failure(stdout: str, stderr: str) -> str:
    blob = f'{stdout}\n{stderr}'
    if 'AUTH_REQUIRED' in blob or '需要登录' in blob or '未登录' in blob:
        return '先在浏览器里打开这个平台，再看一次。'
    if 'EMPTY_RESULT' in blob or '没有公开笔记' in blob:
        return '这次没有新帖。'
    if 'Navigation rejected' in blob:
        return '这次页面没打开，等一会儿再看。'
    return '这次没读到新帖。'


def _opencli_command(args: list[str]) -> list[str]:
    node = shutil.which('node')
    main = Path(os.environ.get('APPDATA', '')) / 'npm' / 'node_modules' / '@jackwener' / 'opencli' / 'dist' / 'src' / 'main.js'
    if node and main.is_file():
        return [node, str(main), *args]
    raise WatchError('这次没读到新帖。')


def _opencli(args: list[str], timeout: int = 90) -> list[dict]:
    if len(args) < 2 or (args[0], args[1]) not in _OPENCLI_ALLOWED:
        raise WatchError('这次没读到新帖。')
    try:
        result = subprocess.run(
            _opencli_command(args),
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=timeout,
            creationflags=_CREATE_FLAGS,
        )
    except WatchError:
        raise
    except Exception as exc:
        raise WatchError('这次没读到新帖。') from exc
    if result.returncode != 0:
        raise WatchError(_read_failure(result.stdout, result.stderr))
    return _rows(_parse_cli_json(result.stdout))


def read_account(target: dict) -> list[dict]:
    platform = target.get('platform')
    if platform == 'xiaohongshu':
        rows = _opencli(['xiaohongshu', 'user', target.get('url') or '', '--limit', str(_READ_LIMIT), *_READ_TAIL])
    elif platform == 'wechat-oa':
        rows = _opencli(['weixin', 'search', target.get('name') or '', '--limit', str(_READ_LIMIT), *_READ_TAIL])
    else:
        raise WatchError('只能盯小红书或公众号。')
    return _posts_from_rows(platform, rows)


def _wechat_article(url: str) -> dict:
    with tempfile.TemporaryDirectory(prefix='easel-wx-') as folder:
        rows = _opencli([
            'weixin', 'download', '--url', url, '--output', folder,
            '--download-images', 'false', *_READ_TAIL,
        ])
        title = _coalesce(rows[0], 'title', '标题') if rows else ''
        text = ''
        for file in Path(folder).rglob('*.md'):
            body = file.read_text(encoding='utf-8', errors='replace')
            if len(body) > len(text):
                text = body
        return {'title': title[:80], 'url': url, 'text': text[:MAX_TEXT], 'media': '文章'}


def read_post_detail(platform: str, url: str) -> dict:
    if platform == 'xiaohongshu':
        rows = _opencli(['xiaohongshu', 'note', url, *_READ_TAIL])
        post = normalize_post({**rows[0], 'url': rows[0].get('url') or url}) if rows else None
        return post or {'url': url}
    if platform == 'wechat-oa':
        return _wechat_article(url)
    return {}
