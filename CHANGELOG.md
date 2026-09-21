# Changelog

All notable changes to Easel are documented in this file.

## [0.2.0] - 2026-09-18

### Added

- Added the `video-production` Skill: an end-to-end video pipeline (probe → transcribe → scenes → design table → scaffold → verify → preview → render → deliver) with two human confirmation gates and quality gates (five-piece manifest, loudness, transitions). The upstream `video-pipeline-sdk` (MIT) is now vendored into the repo so the pipeline is self-contained, reproducible, and editable. Skill count is now 114.
- Added three-tier transcription with automatic fallback: SRT/VTT subtitles first, then SiliconFlow ASR API, then local whisper as a last resort — so a run no longer requires downloading the 3GB model when a transcript or API key is available.
- Added a **「笔」capability menu** to the workbench input area: click to browse everything Easel can do ("能做的都在这"); selecting an item prefills the prompt.
- Added a ffmpeg-based slideshow renderer for image-storyboard voiceover dramas (Ken Burns, differentiated transitions, libass dynamic captions, light whoosh SFX, loudnorm).

### Improved

- Improved the Skill library display: Chinese display names shown large with the original name beneath, kept in sync across search and the drawer.
- Improved in-conversation cards to support multi-select (`ask_user` multiSelect rendering and multi-value submission).
- Improved file uploads: files exceeding the upload limit are automatically converted to local materials via a copy channel (without changing the 50MB config).
- Improved reasoning visibility: `--thinking` now defaults to medium so chain-of-thought shows when the gateway supports it.

### Fixed

- Fixed chain-of-thought (CoT) display in the Web conversation: token/thinking now streams token-by-token, and the anti-stall heartbeat no longer overrides real status.
- Fixed the Gemini adapter to support `streamGenerateContent` streaming.
- Fixed UTF-8 persistence on Windows (state read/write) and migrated the shutdown hook to a lifespan handler.

[0.2.0]: https://github.com/ZJU-REAL/Easel/releases/tag/v0.2.0

## [本机改造] - 2026-09-14（09-19 更新）

以下为本地工作台的改造记录，不属于上游发布内容。

### 合并

- **2026-09-19 合并上游 v0.2.0**：接入对话直连常驻网关（`EASEL_CHAT_TRANSPORT`）、逐字流式与思考面板、
  技能库中文展示名、`ask_user` 多选卡、超限文件转本地素材、国内平台发布链直连兜底、
  `video-production` 视频产线、公众号扫码进程回收、Windows UTF-8 持久化、上游 CI。
  本机保留：OpenClaw `easel-studio` profile 隔离、受限 CORS + `local_write_guard`、
  CloakBrowser 登录内核与 profile 锁、`sessions delete` 走 OpenClaw 生命周期 API。
  随上游 CI（`pytest` + `scripts/validate_skills.py`）做的三处适配：
  `tests/test_web_security.py` 的 TestClient 夹具改为伪装本机工作台（原写法对端为 `testclient`，
  被 `local_write_guard` 判 403，导致负向用例假通过、正向用例必失败）；
  `tests/test_mp_login.py` 的 AST 取函数清单补上本机认领锁辅助函数；
  `ai-image-gen` 的 description 补「当用户要…时使用」触发语。全程只改测试适配实现，未放宽守卫。
- **2026-09-15 合并上游 v0.1.1**：接入公众号后台扫码会话（`wechat-oa`）、小红书登录容错、
  抖音发布回读、B站/抖音近 7 日数据；可选排版 Skill `gzh-design`（AGPL-3.0，仅本机自用）。

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
- 小红书登录内核改走 CloakBrowser，并以 `_ProfileLock`（`.easel.lock`）串行化 whoami 与登录，
  避免两个 Chromium 抢同一 `user-data-dir`。

### 修复

- **Windows 中文环境下「环境安装」整块失效**（`web/app.py`，09-19 由上游 CI 的 windows-latest 任务暴露）：
  `_install_tool_ids()` / `/api/env/tools` / 后台安装任务都用 `encoding="utf-8"` 解码 `install_tool.py`
  子进程的 stdout，但中文 Windows 上 Python 子进程默认按 cp936 写 —— 解出来是坏字节，JSON 解析失败，
  表现为配方表读空（`frozenset()`）、安装接口把一切合法工具 id 判成无效、环境体检 500。
  本机带 `PYTHONUTF8=1` 跑测试会正好盖住这颗雷，所以只在 CI runner 与双击启动的桌面版上暴露。
  现由 `_utf8_child_env()` 给子进程显式钉死 `PYTHONUTF8` + `PYTHONIOENCODING`，
  并加回归测试 `test_install_tool_json_forces_utf8_even_in_plain_env`。
  该缺陷来自上游 v0.2.0 的新引擎桥，本机先修；上游同样受影响的写法未回流。

## [0.1.1] - 2026-09-15

### Added

- Added WeChat Official Account (公众号) support: article publishing, Data Center metrics, and account management via a background QR-scan session.
- Added an optional vendored typesetting Skill (`gzh-design`, AGPL-3.0), bringing the Skill count to 113.

### Improved

- Improved the workbench **创作数据** panel: Bilibili and Douyin now populate "近 7 日 · 环比" (7-day metrics with week-over-week change) and "最近作品" (recent works).
  - Bilibili reads the creator overview API for play/like/comment/favorite/share/follower deltas, and lists recent uploads (title/link/cover/stats).
  - Douyin parses the real "近 7 日" labels with a section anchor to avoid mis-reading the "最新作品" card, handles the "较前7日±X" delta format, hardens polling stability, and scrapes recent works from the content-manage page.

### Fixed

- Fixed OpenClaw version detection in `easel doctor` on Windows (the `.cmd` shim cannot be invoked bare).
- Fixed cross-platform gateway/launcher robustness and Xiaohongshu login navigation races.

[0.1.1]: https://github.com/ZJU-REAL/Easel/releases/tag/v0.1.1

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
