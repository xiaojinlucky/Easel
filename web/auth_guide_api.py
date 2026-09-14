"""Walkable account-authorization guide: platforms, WeChat, Postiz."""
from __future__ import annotations

import asyncio
from fastapi import APIRouter

router = APIRouter(prefix='/api/auth-guide')


def snapshot() -> dict:
    from easel import wechat
    from web.app import LOGIN_RUNNERS, _account_logged_in

    platforms = []
    for key, cfg in LOGIN_RUNNERS.items():
        logged = _account_logged_in(key, cfg)
        platforms.append({
            'key': key,
            'name': cfg['name'],
            'supported': cfg.get('backend') != 'unsupported',
            'loggedIn': logged,
            'next': '已登录，可去发布中心发内容' if logged else '打开账号页扫码登录',
        })
    logged_n = sum(1 for p in platforms if p['loggedIn'])

    try:
        dash = wechat.dashboard()
        wechat_accounts = dash.get('accounts') or []
        configured = [a for a in wechat_accounts if a.get('configured')]
        history = dash.get('history') or []
        last_draft = history[0] if history else None
        wechat_state = {
            'config_present': bool(dash.get('config_present')),
            'configured_count': len(configured),
            'account_count': len(wechat_accounts),
            'accounts': [{'key': a.get('key'), 'name': a.get('name'), 'configured': bool(a.get('configured'))} for a in wechat_accounts],
            'last_draft': ({'title': last_draft.get('title'), 'media_id': last_draft.get('media_id'), 'status': last_draft.get('status')} if isinstance(last_draft, dict) else None),
            'can_publish': bool(configured and last_draft and last_draft.get('media_id')),
            'next': (
                '已有草稿，可在公众号工作区点正式发布'
                if configured and last_draft and last_draft.get('media_id')
                else '已配置，去公众号工作区排版并送草稿箱'
                if configured
                else '去公众号工作区填写 AppID / AppSecret 并校验'
            ),
        }
    except Exception as exc:
        wechat_state = {
            'config_present': False,
            'configured_count': 0,
            'account_count': 0,
            'accounts': [],
            'last_draft': None,
            'can_publish': False,
            'next': '公众号状态读失败：' + str(exc)[:120],
        }

    # 复用注册表里的**唯一实现**：同一能力不写第二个轮子。
    # 顺带修掉一个真 BUG —— 这里原来的 `timeout=1.2` 比 Postiz 冷请求实测延迟（~2.1s）还短，
    # 于是「服务活着但刚冷启动」会被误判成「服务尚未就绪」（用户截图里就是这么显示的）。
    from web.platform_registry import POSTIZ_URL, _postiz_status

    postiz = _postiz_status()
    channels: list[dict] = postiz['channels']
    postiz_online = bool(postiz['online'])
    postiz_error = '' if postiz_online else str(postiz['note'])

    ready = bool(logged_n or wechat_state.get('configured_count') or channels)
    return {
        'platforms': platforms,
        'platforms_logged': logged_n,
        'wechat': wechat_state,
        'postiz': {
            'online': postiz_online,
            'channels': channels,
            'channel_count': len(channels),
            'error': postiz_error,
            'url': POSTIZ_URL,
            'next': (
                f'已授权 {len(channels)} 个频道，可在 Postiz 排期发布'
                if channels
                else '服务已连接，打开 Postiz 给各海外平台授权频道'
                if postiz_online
                else 'Postiz 未就绪。先启动本机发布栈，再打开 http://localhost:4007 登录并授权频道'
            ),
        },
        'ready': ready,
    }


@router.get('')
async def auth_guide():
    return await asyncio.to_thread(snapshot)
