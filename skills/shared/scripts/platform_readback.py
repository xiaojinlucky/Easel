#!/usr/bin/env python3
"""platform_readback.py — 平台读回对账（发布可靠性核心）。

发布后回到创作者中心**读本人作品列表**，与本次发布对账（标题 + 时间窗），
对上才算「已发布」。协议取自生产级发布引擎的读回对账实践：
抖音 = 页面内 fetch work_list 接口（同域、登录态随 cookie 走），小红书 = 捕获
页面自身签名响应（待补）。原则：没有平台侧证据时保留「未核实」，
不凭脚本结束声明已提交。

outcome 四档（调用方据此落回执，绝不把未核实当成功）：
  verified       读回对上（标题前缀 + since 时间窗）——附带作品 id 与状态为准
  unverified     读回通了但多轮未见新作品（索引延迟/审核队列等，保留待查）
  login_required 读回时登录态已失效——明确报「需重新登录」
  readback_error 读回通道本身失败（网络/页面结构改版），附原始证据

非目标：不管理登录、不碰凭据、不写状态文件（由调用方决定如何落回执）。
"""
from __future__ import annotations

import sys
import time
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlencode

DOUYIN_MANAGE_URL = "https://creator.douyin.com/creator-micro/content/manage"
DOUYIN_WORK_LIST_URL = "https://creator.douyin.com/janus/douyin/creator/pc/work_list"
DOUYIN_PROFILE_API = "https://creator.douyin.com/web/api/media/user/info/?aid=1128"

# 标题前缀匹配长度：与 douyin_publish._verify_published 现有口径一致（前 12 字）
TITLE_KEY_LEN = 12
# 时间窗容差：允许平台时间戳精度/索引延迟（发布到出现在列表里的间隔）
SINCE_TOLERANCE_MS = 10 * 60 * 1000


@dataclass
class WorkItem:
    platform_content_id: str
    title: str
    status: str
    published_at_ms: int | None = None
    stats: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "platform_content_id": self.platform_content_id,
            "title": self.title,
            "status": self.status,
            "published_at_ms": self.published_at_ms,
            "stats": self.stats,
        }


@dataclass
class ReadbackResult:
    outcome: str  # verified | unverified | login_required | readback_error
    matched: WorkItem | None = None
    candidates: list[WorkItem] = field(default_factory=list)
    evidence: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "outcome": self.outcome,
            "matched": self.matched.as_dict() if self.matched else None,
            "candidates": [w.as_dict() for w in self.candidates],
            "evidence": self.evidence,
            "error": self.error,
        }


class LoginRequiredError(RuntimeError):
    """读回时确认登录态已失效（区别于通道故障——那是 readback_error）。"""


# 页面内 fetch：同域请求自动带 cookie；返回结构化结果而不是裸文本，便于错误诊断。
_JS_FETCH_JSON = """
async ([url, timeoutMs]) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      credentials: 'include',
      signal: ctrl.signal,
      headers: { 'accept': 'application/json, text/plain, */*' },
    });
    const text = await resp.text();
    let body = null, parseError = null;
    try { body = JSON.parse(text); } catch (e) { parseError = String(e); }
    return { httpStatus: resp.status, finalUrl: resp.url, body, parseError,
             textHead: text.slice(0, 300) };
  } catch (e) {
    return { fetchError: String((e && e.message) || e) };
  } finally { clearTimeout(timer); }
}
"""


def _navigation_safe_evaluate(page, script: str, arg, *, retries: int = 3):
    """page.evaluate 的导航竞态容错（页面跳转瞬间 context 销毁会抛错，重试即可）。"""
    last_error: Exception | None = None
    for attempt in range(max(1, retries)):
        try:
            return page.evaluate(script, arg)
        except Exception as e:  # noqa: BLE001 —— 只挑导航竞态重试，其余上抛
            msg = str(e)
            racing = ("Execution context was destroyed" in msg
                      or "Cannot find context" in msg
                      or "navigation" in msg.lower())
            if not racing:
                raise
            last_error = e
            time.sleep(0.8 * (attempt + 1))
    raise last_error  # type: ignore[misc]


def _epoch_ms(value: Any) -> int | None:
    """秒/毫秒 epoch 归一化。"""
    try:
        n = float(value or 0)
    except (TypeError, ValueError):
        return None
    if n <= 0:
        return None
    return int(n * 1000) if n < 10_000_000_000 else int(n)


def _normalize_douyin_status(status: Any, public_time: Any) -> str:
    """作品状态归一化（平台状态码 → 统一枚举）。"""
    if isinstance(status, (int, float)):
        return str(status)
    s = status if isinstance(status, dict) else {}
    if s.get("is_delete"):
        return "deleted"
    if s.get("is_prohibited"):
        return "prohibited"
    if s.get("in_reviewing"):
        return "reviewing"
    if s.get("is_private"):
        return "private"
    try:
        public_s = float(public_time or 0)
    except (TypeError, ValueError):
        public_s = 0
    if public_s > time.time():
        return "scheduled"
    return "published"


def _first_id(item: dict) -> str:
    for key in ("aweme_id", "item_id", "id"):
        v = item.get(key)
        if v is not None and str(v).strip():
            return str(v).strip()
    raise ValueError("作品缺少 id（aweme_id/item_id）")


def read_douyin_works(page, *, limit: int = 20, evaluate_retries: int = 3) -> list[WorkItem]:
    """在创作者中心页读取本人作品列表（页面内 fetch，登录态随 cookie 走）。

    取数口径：
    count / max_cursor / status=0 / scene=7 / device_platform=webapp / aid=2906，
    解析 data.work_list（回退 aweme_list/items）。本函数只取第一页（对账不需要全量）。
    登录失效 → raise LoginRequiredError；通道故障 → 抛原始异常（调用方分类）。
    """
    limit = max(1, min(50, int(limit or 20)))
    try:
        current_url = page.url or ""
    except Exception:  # noqa: BLE001
        current_url = ""
    if DOUYIN_MANAGE_URL not in current_url:
        page.goto(DOUYIN_MANAGE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(1500)  # 页面异步渲染，等上下文稳定
    try:
        landed = page.url or ""
    except Exception:  # noqa: BLE001
        landed = ""
    if "creator.douyin.com" in landed and "login" in landed.lower():
        raise LoginRequiredError(f"会话已失效（跳转登录页：{landed[:120]}）")

    query = urlencode({
        "count": limit,
        "max_cursor": 0,
        "status": "0",
        "scene": "7",
        "device_platform": "webapp",
        "aid": "2906",
    })
    result = _navigation_safe_evaluate(
        page, _JS_FETCH_JSON, [f"{DOUYIN_WORK_LIST_URL}?{query}", 15000],
        retries=evaluate_retries,
    )
    if not isinstance(result, dict):
        raise RuntimeError(f"读回返回结构异常：{type(result).__name__}")
    if result.get("fetchError"):
        raise RuntimeError(f"读回请求失败：{result['fetchError']}")
    http_status = int(result.get("httpStatus") or 0)
    if http_status in (401, 403):
        raise LoginRequiredError(f"读回 HTTP {http_status}")
    body = result.get("body")
    if not isinstance(body, dict):
        final_url = str(result.get("finalUrl") or "")
        try:
            page_url = page.url or ""
        except Exception:  # noqa: BLE001
            page_url = ""
        if "login" in final_url.lower() or "login" in page_url.lower():
            raise LoginRequiredError("会话已失效（响应重定向到登录页）")
        raise RuntimeError(
            f"读回响应非 JSON（HTTP {http_status}）：{str(result.get('textHead') or '')[:120]}")
    status_code = body.get("status_code")
    if status_code not in (0, None):
        msg = str(body.get("status_msg") or body.get("message") or "")
        if "登录" in msg or "login" in msg.lower() or status_code in (8, 1002, 2154):
            raise LoginRequiredError(f"读回被拒：status_code={status_code} {msg}")
        raise RuntimeError(f"读回接口报错：status_code={status_code} {msg}")

    data = body.get("data") if isinstance(body.get("data"), dict) else {}
    raw_items = (data.get("work_list") or body.get("aweme_list")
                 or data.get("aweme_list") or body.get("items") or [])
    if not isinstance(raw_items, list):
        raise RuntimeError("读回响应缺少 work_list（页面结构可能改版）")

    works: list[WorkItem] = []
    for raw in raw_items[:limit]:
        if not isinstance(raw, dict):
            continue
        statistics = raw.get("statistics") if isinstance(raw.get("statistics"), dict) else {}
        works.append(WorkItem(
            platform_content_id=_first_id(raw),
            title=str(raw.get("desc") or raw.get("title") or "").strip(),
            status=_normalize_douyin_status(raw.get("status"), raw.get("public_time")),
            published_at_ms=_epoch_ms(raw.get("create_time") or raw.get("public_time")),
            stats={
                "play_count": statistics.get("play_count"),
                "digg_count": statistics.get("digg_count"),
                "comment_count": statistics.get("comment_count"),
            },
        ))
    return works


def read_douyin_account(page) -> dict[str, Any]:
    """读创作者中心当前登录账号身份（uid/昵称/粉丝）——「我是谁」接口。

    读当前账号（user/info, aid=1128）：
    登录态上报、发布回执的账号身份快照、身份核验共用这一条读法。
    登录失效 raise LoginRequiredError；响应缺 uid raise RuntimeError。
    """
    try:
        current_url = page.url or ""
    except Exception:  # noqa: BLE001
        current_url = ""
    if "creator.douyin.com" not in current_url:
        page.goto(DOUYIN_MANAGE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
    result = _navigation_safe_evaluate(
        page, _JS_FETCH_JSON, [DOUYIN_PROFILE_API, 15000], retries=2)
    if not isinstance(result, dict):
        raise RuntimeError(f"账号读取返回结构异常：{type(result).__name__}")
    if result.get("fetchError"):
        raise RuntimeError(f"账号读取请求失败：{result['fetchError']}")
    body = result.get("body")
    if not isinstance(body, dict):
        raise RuntimeError(f"账号读取响应非 JSON（HTTP {result.get('httpStatus')}）")
    status_code = body.get("status_code")
    if status_code not in (0, None):
        msg = str(body.get("status_msg") or "")
        if "登录" in msg or status_code in (8, 1002, 2154):
            raise LoginRequiredError(f"账号读取被拒：status_code={status_code} {msg}")
        raise RuntimeError(f"账号读取接口报错：status_code={status_code} {msg}")
    user = body.get("user_info") if isinstance(body.get("user_info"), dict) else (
        body.get("user") if isinstance(body.get("user"), dict) else {})
    uid = str(user.get("uid") or user.get("sec_uid") or user.get("open_id") or "").strip()
    if not uid:
        raise RuntimeError("账号信息缺少 uid（页面结构可能改版）")

    def _num(v):  # noqa: ANN001
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    return {
        "platform_account_id": uid,
        "display_name": str(user.get("nickname") or user.get("name") or uid).strip(),
        "username": str(user.get("unique_id") or user.get("short_id") or "").strip() or None,
        "fans_count": _num(user.get("follower_count")),
        "work_count": _num(user.get("aweme_count")),
    }


def capture_douyin_snapshot(page) -> set[str]:
    """发前快照：读取当前作品列表的全部作品 id。
    发布前抓一遍，读回时用它排除「本来就存在的旧作品」，让对账只认**新出现**的条目。
    失败（未登录/通道异常）返回空集合——对账自动退化为标题+时间窗，不影响主流程。"""
    try:
        works = read_douyin_works(page, limit=30)
        return {w.platform_content_id for w in works}
    except Exception:
        return set()


def find_published_work(works: list[WorkItem], title: str, *,
                        since_ms: int | None = None,
                        key_len: int = TITLE_KEY_LEN,
                        exclude_ids: set[str] | None = None) -> WorkItem | None:
    """对账：列表中找属于本次发布的作品（标题前缀命中 + 不早于 since 时间窗）。

    - 标题为空 → 无法对账（返回 None，调用方按 unverified 处理）。
    - since_ms 给了时：作品发布时间明显早于 since 的跳过（防同标题旧作品误判），
      容差 SINCE_TOLERANCE_MS 吸收平台时间戳精度与索引延迟。
    - exclude_ids（发前快照）里的 id 视为旧作品跳过——发布前就存在的条目不可能是本次，
      同标题+时间戳精度边缘时它是比时间窗更硬的证据。
    """
    key = (title or "").strip().replace("\n", " ")[:key_len]
    if not key:
        return None
    for w in works:
        if key not in (w.title or ""):
            continue
        if exclude_ids and w.platform_content_id in exclude_ids:
            continue
        if since_ms and w.published_at_ms and (w.published_at_ms + SINCE_TOLERANCE_MS) < since_ms:
            continue
        return w
    return None


def verify_douyin_publish(page, *, title: str, since_ms: int | None = None,
                          limit: int = 20, attempts: int = 4,
                          delay_s: float = 12.0,
                          snapshot_ids: set[str] | None = None) -> ReadbackResult:
    """发布后对账入口：多轮读回（列表异步更新，给平台索引时间）。

    返回 ReadbackResult；除 KeyboardInterrupt 外不抛异常——
      verified        对上（matched 为对应作品）
      unverified      通道通、未见新作品（candidates 为读到的近期作品，供诊断）
      login_required  登录失效
      readback_error  通道故障（error 带原始信息）
    """
    last_error: Exception | None = None
    last_candidates: list[WorkItem] = []
    evidence: dict[str, Any] = {"attempts": 0}
    for i in range(max(1, attempts)):
        evidence = {"attempts": i + 1, "checked_at": int(time.time())}
        try:
            works = read_douyin_works(page, limit=limit)
        except LoginRequiredError as e:
            return ReadbackResult(outcome="login_required", evidence=evidence, error=str(e))
        except Exception as e:  # noqa: BLE001
            last_error = e
            print(f"⚠️ 读回第 {i + 1}/{attempts} 轮失败：{e}", file=sys.stderr)
            if i + 1 < attempts:
                time.sleep(delay_s)
            continue
        last_candidates = works
        evidence["count"] = len(works)
        matched = find_published_work(works, title, since_ms=since_ms, exclude_ids=snapshot_ids)
        if matched:
            # 顺带读账号身份快照（回执标准件；失败不影响对账结论）
            try:
                evidence["account"] = read_douyin_account(page)
            except Exception as e:  # noqa: BLE001
                evidence["account_error"] = str(e)
            print(f"✅ 读回对账通过：{matched.platform_content_id}（{matched.status}）", file=sys.stderr)
            return ReadbackResult(outcome="verified", matched=matched,
                                  candidates=works[:5], evidence=evidence)
        print(f"… 读回第 {i + 1}/{attempts} 轮：列表 {len(works)} 条未见本次作品", file=sys.stderr)
        if i + 1 < attempts:
            time.sleep(delay_s)
    if last_error is not None and not last_candidates:
        return ReadbackResult(outcome="readback_error", evidence=evidence, error=str(last_error))
    return ReadbackResult(outcome="unverified", candidates=last_candidates[:5], evidence=evidence)
