"""Read FreshRSS's documented Google Reader API into Easel's source library."""
import hashlib
import requests
from bs4 import BeautifulSoup
from dotenv import dotenv_values
from urllib.parse import urlsplit
from easel.runtime import STATE
from easel.research import connection, save_source

BASE = 'http://localhost:8089/api/greader.php'


def sync_recent():
    password = dotenv_values(STATE / 'postiz.env').get('FRESHRSS_API_PASSWORD')
    if not password:
        raise RuntimeError('请先启动并初始化 FreshRSS 订阅库。')
    with requests.Session() as session:
        session.trust_env = False
        response = session.post(BASE + '/accounts/ClientLogin', data={'Email': 'easel', 'Passwd': password}, timeout=10)
        response.raise_for_status()
        auth = next((line[5:] for line in response.text.splitlines() if line.startswith('Auth=')), None)
        if not auth:
            raise RuntimeError('FreshRSS API 登录失败，请检查订阅库的 API 设置。')
        session.headers['Authorization'] = 'GoogleLogin auth=' + auth
        response = session.get(BASE + '/reader/api/0/stream/contents/reading-list', params={'n': 20, 'output': 'json'}, timeout=15)
        response.raise_for_status()
        items = response.json().get('items', [])
    saved, skipped = [], 0
    for item in items[:20]:
        url = next((entry.get('href') for entry in item.get('alternate', []) if entry.get('href')), '')
        if urlsplit(url).scheme not in ('https', 'http'):
            skipped += 1
            continue
        identifier = hashlib.sha256(('rss\n' + url).encode()).hexdigest()[:24]
        with connection() as db:
            existing = db.execute('SELECT id FROM sources WHERE id=?', (identifier,)).fetchone()
        if existing:
            skipped += 1
            continue
        soup = BeautifulSoup((item.get('summary') or item.get('content') or {}).get('content', ''), 'html.parser')
        for element in soup(['script', 'style', 'iframe']):
            element.decompose()
        content = soup.get_text('\n', strip=True)[:100000]
        if not content:
            skipped += 1
            continue
        origin = (item.get('origin') or {}).get('title', 'RSS 订阅')
        content = f'订阅来源：{origin}\n原文发布时间（Unix）：{item.get("published", "未知")}\n以下是订阅源提供的摘录，完整内容请查看原文。\n\n' + content
        saved.append(save_source(url, item.get('title') or url, 'RSS / Atom', '订阅更新', content, method='FreshRSS'))
    return {'imported': len(saved), 'skipped': skipped, 'read': len(items), 'sources': [{'id': item['id'], 'title': item['title']} for item in saved]}
