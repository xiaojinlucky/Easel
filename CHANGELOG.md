# Changelog

All notable changes to Easel are documented in this file.

## [本机改造] - 2026-09-14

以下为本地工作台的改造记录，不属于上游 0.1.0 的发布内容。

### 行为变更

- **本机写入守卫放宽**（`web/app.py` → `local_write_guard`）。原行为是「不带 `Origin` 的写请求一律 403」，
  这会把本机命令行、脚本与测试客户端一起封死（它们不带 `Origin`，而 CSRF 依赖浏览器自动附带凭据，
  本服务没有基于 Cookie 的会话）。现改为两条判据：
  - 带 `Origin` → 必须精确命中 `_LOCAL_ORIGINS`，否则 403（跨站页面驱动的写请求仍是这一条拦下）；
  - 不带 `Origin` → 要求对端来自回环地址（`request.client` 经 `ipaddress.is_loopback` 判定），否则 403。
  
  未放宽的部分：`_LOCAL_ORIGINS` 仍是精确比较；`TrustedHostMiddleware` 仍只放行 localhost/127.0.0.1；
  应用仍只绑 `127.0.0.1`；未启用 `--proxy-headers`，全仓未设 `FORWARDED_ALLOW_IPS`，
  因此无法用 `X-Forwarded-For` 冒充回环。

### 新增

- `scripts/backup_accounts.py`：账号登录态轻量备份 / 恢复。不停服、不碰 Docker，覆盖
  `~/.easel-browser-profiles`（登录态，位于项目目录之外）、`outputs/_login`、`profiles/`、
  `cookies.json`、公众号凭据等，是 `scripts/backup_local.py` 之外的互补一层。
  用法与分工见 `docs/BACKUP_RESTORE.md`。
- `web/platform_registry.py`：平台能力与状态的单一注册表（`/api/platforms`），前端按键渲染，不写平台分支。

## [0.1.0] - 2026-08-31

Easel's first public release, jointly developed by REAL Lab and OpenDCAI Lab.

### Highlights

- Added an end-to-end social media operations workflow covering discovery, planning, creation, publishing, and attribution.
- Added profile-driven account context and persistent operating memory across sessions and platforms.
- Added 112 executable Skills for research, writing, visual production, audio, video, publishing, and analytics.
- Added the Web workspace and CLI for running workflows, inspecting outputs, and managing projects locally.
- Added multimodal production workflows for knowledge cards, stories, lifestyle content, audio, and video.
- Added publishing workflows for Xiaohongshu, Douyin, Kuaishou, Zhihu, Bilibili, and WeChat Channels.
- Added output manifests, publishing checks, content calendars, and performance attribution workflows.
- Added Chinese and English documentation, examples, product showcases, and institutional branding.

[0.1.0]: https://github.com/ZJU-REAL/Easel/releases/tag/v0.1.0
