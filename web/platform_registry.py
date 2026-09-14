"""社交媒体平台统一注册表。

规则依据：`AGENTS.md` §1「禁止重复造轮子」—— 平台差异只在此处声明一次，前端按键渲染，
不写 `if platform === 'xxx'` 分支。能力字段的组织方式**借鉴 Postiz 的 provider registry**
（github.com/gitroomhq/postiz-app，AGPL-3.0，**只学设计、不取代码**）。

状态不重复计算：直接复用 `web.app` 的 `LOGIN_RUNNERS` / `_account_logged_in`，
以及 `easel.wechat` 的本地配置读取，不另建一套状态体系。
"""
from __future__ import annotations

import asyncio
import socket
import threading
import time
from urllib.parse import urlsplit

from fastapi import APIRouter

router = APIRouter(prefix='/api/platforms')

# ---------------------------------------------------------------- 能力声明（静态）
# 字段含义：
#   authKind    qrcode（扫码登录）/ credential（填 AppID + AppSecret）/ service（第三方服务授权）
#   publishMode direct（一键发布）/ draft_then_publish（先送草稿箱，再确认正式发布）/ scheduled（排期发布）
#   contentKind media（封面+视频）/ longform（长文）/ markdown（Markdown 源 + 插图）/ any
#   analyticsSource scrape（抓取）/ official_api（官方接口）
#   workspace   该平台有独立工作区页面时，填此前端页面标识；空串 = 无专属页面
#   panels      该平台专属面板清单（驱动工作区内的分区渲染）
#   actionLabel 卡片主按钮文案（仅 service 类通道需要；其余的动作由 authKind 决定）
#
# 分组渲染依据 `authKind`（三种接入方式），与 `group`（内容形态）是两个维度，不要混用。
PLATFORM_CAPS: dict[str, dict] = {
    'xiaohongshu': {
        'group': 'note', 'authKind': 'qrcode', 'publishMode': 'direct',
        'contentKind': 'media', 'analyticsSource': 'scrape', 'workspace': '', 'panels': [],
    },
    'douyin': {
        'group': 'video', 'authKind': 'qrcode', 'publishMode': 'direct',
        'contentKind': 'media', 'analyticsSource': 'scrape', 'workspace': '', 'panels': [],
    },
    'kuaishou': {
        'group': 'video', 'authKind': 'qrcode', 'publishMode': 'direct',
        'contentKind': 'media', 'analyticsSource': 'scrape', 'workspace': '', 'panels': [],
    },
    'weixin-channels': {
        'group': 'video', 'authKind': 'qrcode', 'publishMode': 'direct',
        'contentKind': 'media', 'analyticsSource': 'scrape', 'workspace': '', 'panels': [],
    },
    'zhihu': {
        'group': 'longform', 'authKind': 'qrcode', 'publishMode': 'direct',
        'contentKind': 'longform', 'analyticsSource': 'scrape', 'workspace': '', 'panels': [],
    },
    'bilibili': {
        'group': 'video', 'authKind': 'qrcode', 'publishMode': 'direct',
        'contentKind': 'media', 'analyticsSource': 'scrape', 'workspace': '', 'panels': [],
    },
    'wechat': {
        'group': 'article', 'authKind': 'credential', 'publishMode': 'draft_then_publish',
        'contentKind': 'markdown', 'analyticsSource': 'official_api', 'workspace': 'wechat',
        'panels': [
            {'id': 'compose', 'label': '编辑排版'},
            {'id': 'drafts', 'label': '草稿箱'},
            {'id': 'analytics', 'label': '数据'},
            {'id': 'monitor', 'label': '同行监测'},
        ],
    },
    # Postiz 是「中转服务」而非平台：它自己不是发布目标，而是给别的渠道做排期与授权。
    # 纳入注册表的原因——它原先只存在于 AuthGuide 的三步引导里，平台总览页收敛后
    # 若不同步纳入，Postiz 状态就会从该页消失（信息丢失）。
    'postiz': {
        'group': 'relay', 'authKind': 'service', 'publishMode': 'scheduled',
        'contentKind': 'any', 'analyticsSource': 'official_api', 'workspace': '',
        'panels': [], 'actionLabel': '打开 Postiz 授权',
    },
}

# 未声明能力的平台兜底：保证接口**永远返回完整字段**，前端不会拿到 undefined。
# （新增平台却忘了补 PLATFORM_CAPS 时，退化为「扫码登录 + 直接发布 + 无专属页面」。）
DEFAULT_CAPS: dict = {
    'group': 'unknown', 'authKind': 'qrcode', 'publishMode': 'direct',
    'contentKind': 'media', 'analyticsSource': 'scrape', 'workspace': '',
    'panels': [], 'actionLabel': '',
}

# Postiz 管理台入口（授权频道在它自己的界面里完成，这里只做跳转）。
# 全工作台唯一常量：`web/auth_guide_api.py` 也引用它，避免同一地址写两份。
POSTIZ_URL = 'http://localhost:4007/'

# Postiz 探测缓存：冷请求 2.1s / 热请求 10ms，缓存让页面加载只在必要时才付这个成本
_POSTIZ_TTL = 30.0
_POSTIZ_TIMEOUT = 5.0
_postiz_cache: dict = {'ts': 0.0, 'data': None}
_postiz_lock = threading.Lock()


def _postiz_status() -> dict:
    """读 Postiz 自托管服务的频道授权状态。**全工作台唯一实现**——`web/auth_guide_api.py` 也调这里，
    不再各写一份探测逻辑（同一能力两个轮子属反模式）。

    延迟实测（2026-09-14）：Postiz 冷请求 ~2.1s、热请求 ~10ms。
    因此这里带 30 秒 TTL 缓存，并把超时放宽到 5s —— 原来 `auth_guide_api` 的 1.2s 会把
    「服务活着但冷启动慢」误判成「服务尚未就绪」（截图里就是这么显示的）。

    锁的必要性：`/api/platforms` 与 `/api/auth-guide` 都走 `asyncio.to_thread`，冷缓存下
    并发请求会**各探一次**（实测 8 线程 = 8 次探测，每次最坏 5s）。双重检查 + 锁把它收敛成一次。

    服务未启动 / 未配置 API Key 时退化为「未就绪」，任何异常都不外溢成 500。
    """
    cached = _postiz_cache['data']
    if cached is not None and time.time() - _postiz_cache['ts'] < _POSTIZ_TTL:
        return cached
    with _postiz_lock:
        cached = _postiz_cache['data']           # 等锁期间可能已被别的线程填好
        if cached is not None and time.time() - _postiz_cache['ts'] < _POSTIZ_TTL:
            return cached
        result = _postiz_probe()
        _postiz_cache['data'] = result
        _postiz_cache['ts'] = time.time()
        return result


def _postiz_target() -> tuple[str, int, str]:
    """从 `easel.postiz.API` 推导探测目标，返回 `(host, port, url)`。

    host 归一为 `127.0.0.1`：`localhost` 在 Windows 上会先试 `::1`，服务只监听 IPv4 时
    这段等待全被计入首屏耗时（实测 4.1s）。若整个工程的 API 常量换了地址，这里自动跟随。
    """
    from easel.postiz import API

    parts = urlsplit(API)
    host = parts.hostname or '127.0.0.1'
    if host in ('localhost', '::1'):
        host = '127.0.0.1'
    port = parts.port or (443 if parts.scheme == 'https' else 80)
    return host, port, f'{parts.scheme}://{host}:{port}{parts.path}'


def _port_open(host: str, port: int, timeout: float = 0.35) -> bool:
    """TCP 预检：端口没开就压根不发 HTTP，省掉数秒的连接等待。

    这里**刻意吞掉所有异常**：`socket.create_connection` 对非法主机名抛的是
    `UnicodeError`（idna 编码层），**不是** `OSError` —— 只捕 `OSError` 会让一个
    地址笔误把 `/api/platforms` 与 `/api/auth-guide` 一起变成 500（实测）。
    预检的语义就是「能不能连」，连不上就是 False。
    """
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False


def _postiz_probe() -> dict:
    """真正发一次请求。失败一律转成「未就绪」的可读说明。

    两级防御，都由实测驱动：
    ① **先 TCP 预检**：服务没起来时直接发 HTTP，会在连接阶段耗掉 ~4.1s（实测），
       把账号页首屏从 40ms 拖到 4.1s。预检未通就立刻返回。
    ② **探测地址钉到 127.0.0.1**：绕开 `localhost` → `::1` 的等待。
    """
    try:
        host, port, url = _postiz_target()
    except Exception as exc:
        return {'loggedIn': False, 'channels': [], 'channelCount': 0, 'online': False,
                'note': '发布栈地址读取失败：' + str(exc)[:60]}

    if not _port_open(host, port):
        return {'loggedIn': False, 'channels': [], 'channelCount': 0, 'online': False,
                'note': f'服务未启动：端口 {port} 未监听，先启动本机发布栈'}

    from requests.exceptions import Timeout

    try:
        from easel.postiz import client

        with client() as session:
            response = session.get(url + '/integrations', timeout=_POSTIZ_TIMEOUT)
            response.raise_for_status()
            raw = response.json()
    except Timeout as exc:
        # 端口开着但服务不答（Docker 端口映射会先接住连接）——这跟「服务没启动」
        # 是两种处境：一个等一会就好，一个得去启动。文案必须分开，别混为一谈。
        return {'loggedIn': False, 'channels': [], 'channelCount': 0, 'online': False,
                'note': f'{port} 端口已监听但 {_POSTIZ_TIMEOUT:.0f}s 内无响应，可能正在启动：' + str(exc)[:50]}
    except RuntimeError as exc:
        return {'loggedIn': False, 'channels': [], 'channelCount': 0, 'online': False,
                'note': 'Postiz 本机账号尚未初始化：' + str(exc)[:60]}
    except Exception as exc:
        return {'loggedIn': False, 'channels': [], 'channelCount': 0, 'online': False,
                'note': '服务未就绪，先启动本机发布栈：' + str(exc)[:60]}

    channels = [{
        'id': str(item.get('id') or item.get('_id') or ''),
        'name': str(item.get('name') or item.get('identifier') or item.get('type') or '未命名频道'),
        'type': str(item.get('identifier') or item.get('type') or ''),
        'disabled': bool(item.get('disabled')),
    } for item in raw if isinstance(item, dict)] if isinstance(raw, list) else []

    if channels:
        return {'loggedIn': True, 'channels': channels, 'channelCount': len(channels), 'online': True,
                'note': f'已授权 {len(channels)} 个频道，可在 Postiz 排期'}
    return {'loggedIn': False, 'channels': [], 'channelCount': 0, 'online': True,
            'note': '服务已连接，还没有频道'}


def _wechat_status() -> dict:
    """读公众号本地配置状态。只读本地文件，不起网络请求。任何异常都不外溢成 500。

    import 也放在 try 内：`easel.wechat` 若因缺依赖/语法问题导入失败，同样只应退化为
    「读不到状态」，而不是让 `/api/platforms` 整页 500（文档承诺了，就得真做到）。
    """
    try:
        from easel import wechat

        dash = wechat.dashboard()
        accounts = (dash or {}).get('accounts') or []
        names = [str(a.get('name') or a.get('key') or '').strip() for a in accounts if a.get('configured')]
        names = [n for n in names if n]
        if names:
            return {'loggedIn': True, 'configured': len(names), 'total': len(accounts),
                    'note': '已配置：' + '、'.join(names)}
        if accounts:
            return {'loggedIn': False, 'configured': 0, 'total': len(accounts),
                    'note': '账号存在但未填全 AppID / AppSecret'}
        return {'loggedIn': False, 'configured': 0, 'total': 0,
                'note': '尚未配置：需 AppID 与 AppSecret'}
    except Exception as exc:                       # 配置损坏 / 返回值异常都不应让整页 500
        return {'loggedIn': False, 'configured': 0, 'total': 0,
                'note': '公众号配置读取失败：' + str(exc)[:80]}


def _caps(pid: str) -> dict:
    """能力表 = `DEFAULT_CAPS` 兜底 + 该平台声明。

    以 `DEFAULT_CAPS` 为基底再叠加平台声明，保证**今后在能力表里新增字段时，
    不用逐个平台回填**——曾经的写法（`PLATFORM_CAPS.get(pid, DEFAULT_CAPS)`）只在
    平台未声明时才会用到兜底，已声明的平台会漏掉新字段，直接导致 KeyError / 前端 undefined。
    """
    return {**DEFAULT_CAPS, **PLATFORM_CAPS.get(pid, {})}


def platform_list() -> list[dict]:
    """全部「通道」平级清单：注册表能力声明 + 实时状态。

    展开顺序：**能力表在前、保留字段在后** —— 保证能力表里的同名字段
    永远不会覆盖 `id` / `name` / `backend` / `loggedIn` 等由运行时决定的值。

    `actionUrl` / `actionLabel` 恒存在（可能为空串），前端据此按键渲染主操作：
    有 `workspace` → 「进入工作区」；有 `actionUrl` → 外链；否则走扫码登录流程。
    """
    from web.app import LOGIN_RUNNERS, _account_logged_in

    items: list[dict] = []
    for pid, cfg in LOGIN_RUNNERS.items():
        backend = cfg.get('backend', '')
        items.append({
            **_caps(pid),
            'id': pid,
            'name': cfg.get('name', pid),
            'backend': backend,
            # 早先只判 `!= 'unsupported'`：条目漏填 backend 会被当成「支持」，卡片给出
            # 「登录」按钮，一点就 500（`web/app.py` 用 cfg['backend'] 硬取）。空串必须算不支持。
            'supported': bool(backend) and backend != 'unsupported',
            'loggedIn': _account_logged_in(pid, cfg),
            'note': cfg.get('note', ''),
            'actionUrl': '',
        })

    status = _wechat_status()
    items.append({
        **_caps('wechat'),
        'id': 'wechat',
        'name': '微信公众号',
        'backend': 'official_api',
        'supported': True,
        'loggedIn': bool(status['loggedIn']),
        'note': str(status['note']),
        'actionUrl': '',
    })

    postiz = _postiz_status()
    items.append({
        **_caps('postiz'),
        'id': 'postiz',
        'name': 'Postiz 中转',
        'backend': 'postiz',
        'supported': True,
        'loggedIn': bool(postiz['loggedIn']),
        'note': str(postiz['note']),
        'actionUrl': POSTIZ_URL,
    })
    return items


@router.get('')
async def api_platforms() -> dict:
    return {
        'platforms': await asyncio.to_thread(platform_list),
        'hint': '各平台平级；差异（鉴权方式 / 发布方式 / 内容形态）由注册表声明，前端按键渲染。',
    }
