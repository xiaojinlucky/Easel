# HANDOFF · Easel 自媒体工作台

> 交接时间：**2026-09-15 15:50**（UTC+8）；**2026-09-19 增量见 §5.9 与 §13，正文其余仍以 09-15 快照为准**
> 交接对象：**完全没有上下文的新会话或新 Agent**
> 本文件取代 2026-09-15 02:49 版交接。更早的 09-13 全文仍在 git：`git show 83d6bc4:HANDOFF.md`
> 本文是二次叙述。关键结论请对照代码、测试、git 与运行端口，不要把下文当唯一真源。

---

## 0. 60 秒速览

| 项 | 现役事实（2026-09-15 15:50 核对） |
|---|---|
| 长期开发树 | `F:\科研大师兄\自媒体工作台\Easel`（二次开发）。HEAD `f44b3b2`，本地分支名 `main`，跟踪 **`origin/workbench`** |
| 上手/原版树 | `F:\科研大师兄\自媒体工作台\Easel-official`。detached **v0.1.1** `23d0f7c`，**不要当长期开发树** |
| 用户现在在用 | 原版 Web **`127.0.0.1:7870`**（pid 65120）+ 网关 **`127.0.0.1:18789`**（pid 46380） |
| 二次开发 Web | **7860 空**。桌面快捷方式「Easel 自媒体工作台」仍指向 7860，**此时不要和 7870 抢网关** |
| GitHub | `origin` = `git@github.com:xiaojinlucky/Easel.git`（用户 fork）。`upstream` = `https://github.com/ZJU-REAL/Easel.git`。`gh` 默认仓库 = `xiaojinlucky/Easel` |
| 相对上游 | 本地相对 `upstream/main`（`71de7f9`）：**超前 10 / 落后 11**。fork 的 `origin/main` 已等于当前上游 |
| 未提交 | 二次开发树有一批 **09-15 胶水未提交**（公众号登录态、Cloak 登录、发布页等）。根目录 `_*.py` **不要提交** |
| 原版未提交补丁 | `openclaw_cmd.py`、`scripts/gateway.ps1`、`xhs_publish.py`、`web/app.py`、`AccountsPage.tsx`；另有独立 `.venv`、启动脚本、show-me HTML |
| 对话模型 | 7870 对话 = OpenClaw → Codex 插件 → **`openai/gpt-6-astra`**（官方 Codex 订阅）。**不是** Cursor 里的 Grok 4.6 |
| 主未闭环 | 小红书扫码登录（Cloak 锁已加，**用户尚未扫出持久 cookie**）；公众号 **真实送草稿**未做；对话页中文乱码 |

用户是自媒体从业者，技术不敏感：白话、结论先行、给明确下一步。主战场是 **小红书 + 公众号**。

---

## 1. 新会话开场必读

按这个顺序，不要先改代码：

1. `F:\科研大师兄\自媒体工作台\AGENTS.md`（工作台规则真源；`CLAUDE.md` 只是入口指针）
2. 本文件
3. 需要改造史时：`Easel\.runtime\review\final-acceptance.md`（09-13）
4. 需要选型时：`F:\科研大师兄\自媒体工作台\工具复用台账.md`（C 区已有 09-15 行）
5. 先确认端口：7860 / 7870 / 18789。**两套 Easel 不能同时占 18789**

Python 一律：`Easel\.venv\Scripts\python.exe`，环境变量 `PYTHONUTF8=1`。不要用用户旧 Conda。

---

## 2. 项目是什么

`F:\科研大师兄\自媒体工作台` 是工作台目录，**Easel 是主体**。同级还有 `publisher-assistant`、`workbuddy-studio`、`xhs_content_workbench`、`inspiration_collector_v0`、`beav-*`、`RedBox`。

上游：`ZJU-REAL/Easel`，Apache-2.0。本地二次开发做成了 Electron 桌面壳 + 本机服务栈（Web / OpenClaw 网关 / Postiz / FreshRSS 等）。

### 2.1 必须分清的两棵树

| | 二次开发 `Easel/` | 原版 `Easel-official/` |
|---|---|---|
| 用途 | 长期改代码、跟 fork | 用户上手理解官方产品 |
| Web | 7860（快捷方式；此刻未监听） | **7870（用户正在用）** |
| OpenClaw profile | `easel-studio` → `~\.openclaw-easel-studio` | `easel` → `~\.openclaw-easel` |
| 网关端口 | 都要 **18789**，互斥 | 同左 |
| 技能目录 | `Easel\skills\openclaw` | `Easel-official\skills\openclaw`（约 113 个 `SKILL.md`） |
| remote | origin=用户 fork，upstream=官方 | origin 仍指 ZJU-REAL；detached v0.1.1 |

原版是 10:09 用户要求「二次开发版自己都不会用了，隔离装一份上游原版，并用 show-me 带上手」时装的。上手图：`F:\科研大师兄\自媒体工作台\show-me-easel-official-onboarding.html`（官方树 `docs\` 下有副本）。启动：`Easel-official\启动原版工作台.ps1`。

官方侧栏：工作台、对话、技能库、内容库、账号、画像。**没有**二次开发那套「公众号长页 / 授权三步卡」。

### 2.2 桌面版（只属于二次开发树）

- 外壳：`Easel\desktop\main.cjs`。工作台视图 → `127.0.0.1:7860`
- 快捷方式：`D:\Desktop\Easel 自媒体工作台.lnk` → `Easel\.runtime\desktop-app\Easel-win32-x64\Easel.exe`
- 改 React 只需重建 `web/frontend/dist` 再重启 Web，不必重打 exe
- 用户数据：`G:\EaselData`（junction）。`.runtime/` 已 gitignore

### 2.3 Git 身份（09-15 下午已做成）

- 用户 GitHub：`xiaojinlucky`，原先没有名为 `Easel` 的仓库
- 已创建公开 fork：<https://github.com/xiaojinlucky/Easel>
- **没有**把本地 `main` 强推到 fork 的 `main`（fork `main` 已是上游最新）
- 本地历史推到了 `origin/workbench`（当前跟踪）和 `origin/local-workbench`（09-12 快照 `5914cd7`）
- 本地独有 10 个提交（含 `f44b3b2` 合并 v0.1.1、`1852dff` 合并前快照，以及 09-12/13 稳定性提交）
- 本地缺的 11 个上游提交：CI、CONTRIBUTING、wechat-oa ticket 鲁棒性、测试 utf-8、gzh-design description 等。**尚未 merge**

---

## 3. 本项目生效的规则（用户坚持的）

真源：`F:\科研大师兄\自媒体工作台\AGENTS.md`。

### 3.1 硬性

1. **禁止重复造轮子**（§1）：P0 = 闭源只借鉴设计 **并列** 成熟开源可依赖；P1 小而美开源；P2 才自研。开工前必须有复用调研表（≥3 候选、跨类别、许可证 + **现场核实**的活跃度）。写入 `工具复用台账.md`。
2. **零成本**（§1.7）：禁止付费 / 订阅 / 按量 / 绑卡。自托管免费 + 云收费时只用自托管。只能付费时先问用户。
3. **四项思维**（§2）：第一性原理（本质 + 证据，禁止把推测当结论）／奥卡姆（最小集、落地优先、默认不顺手改）／墨菲（空缺/边界/并发/中断/旧状态/回退/真实路径）／复杂改动后独立三视角审查（破坏者 / 验收者 / 回归守门人）。
4. **不要 `npm i -g openclaw@latest`**：系统 Node **v24.15.0**，上游要 24.16+。引擎用 `Easel\.runtime\node_modules\node\bin\node.exe` + `Easel\.runtime\node_modules\openclaw\openclaw.mjs`（OpenClaw **2026.9.3**）。
5. **不要主动新建 Skill**（用户 09-14 明确：skill 越多越添负担）。
6. 中文、白话、结论先行。不擅自提交 / 推送 / 强推。不回显 `.env` Key。

### 3.2 本会话用户又强调过的选型句

> 商业化闭源（只借鉴）≈ 成熟开源 ＞ 小范围高质量开源 ＞ 自己造轮子。从第一性原理和剃刀出发。

出现过两次：登录持久化（00:03）、Cloak 之外还有没有更稳方案（13:54）。

---

## 4. 本会话用户提过的问题、需求与修改意见

按时间，只记用户原意（系统自动 follow-up 略）：

| 时间 | 用户说了什么 | 处理结论 |
|---|---|---|
| 09-14 23:47 | 读旧 HANDOFF，修桌面「点关闭任务栏还不退、只能托盘完全退出」 | 用户 23:55 **改口**：关闭 = 收起窗口，**任务栏也不留图标，只留托盘**。已按此实现，见 `desktop/main.cjs` |
| 09-15 00:03 | 各平台登录失败；主战场小红书+公众号；登录要持久；按复用原则调研 | 登录「没记住」多半是误判。真正挡住的是小红书 **300012** 和 whoami/login 抢同一 profile |
| 01:38 | 上游大幅更新，去看 | 已出对比，未擅自合 |
| 01:52 | **全部安全合并**，合完多 Agent 对抗审查 | 合入 v0.1.1，`f44b3b2`。破坏者 2 个 P1 已修 |
| 08:14 | 上游 vs 本地「公众号工作区」谁更优 | 上游扫码会话更好；用户 08:26 **同意**把工作区送草稿改走 mp 会话 |
| 10:09 | 二次开发版自己不会用了；隔离装原版 + show-me 上手 | 装了 `Easel-official`，7870，show-me HTML |
| 10:45 | 截图：网关离线 | UI「已连接」= 18789/healthz。当时端口空。PATH 上的 `openclaw` 是 **openclaw-cn 0.2.0**（无 question RPC） |
| 12:14 | 截图：网络风险 / 300012，去查 | 出口 IP 相同；Playwright 自带无头 Chromium 被挡，真 Chrome / Cloak 能出码 |
| 12:21 | 正常登录小红书没问题，没有别的办法吗 | 问题不是「网坏了」，是自动化内核身份 |
| 12:29–12:30 | 能不能用 CloakBrowser？先测 | 本机已装，无头/有头都能出码 |
| 12:46 | 有头无头、三者区别、哪个避风控 | 已解释；风控看的是浏览器身份不是窗口有没有 |
| 13:44 | **用 CloakBrowser** | 两边 `xhs_publish.py` 已改 `executable_path` |
| 13:54 | Cloak 之外还有没有更好、更不易风控的复用方案 | 不叠 JS stealth；不换 Camoufox/patchright；不引入无 LICENSE 的 x-mcp |
| （下午） | 长期跟上游：做 GitHub fork | 已做成，见 §2.3 |
| （下午） | 7870 对话是不是 Cursor 的模型；技能怎么跑 | Astra 是大脑；技能是说明书，不自动点名执行 |
| 15:28 | 截图「目前是这样的」（对话乱码，可见「113 技能 / style-transfer + text-polisher」） | 会话日志证实这轮**真读了**那两个 SKILL.md，不是空口报名字 |
| 15:48 | 用 handoff 技能做完整交接，写入 `HANDOFF.md` | 当时 Cursor 入口里没有 handoff |
| 15:50 | handoff 在 skills-manager 里，**移到全局** | 已挂进 `active-global-skills`（见 §5.8） |

修改意见里已经落地、不要再争的：

- 关窗口 ≠ 退出应用；退出只走托盘「完全退出」
- 公众号「已登录」= 扫了 `mp.weixin.qq.com` 后台码，**不是填了 AppID**
- 不要点公众号「登录」或真送草稿，除非用户准备好扫码（有头 Chromium）
- 不要用调研用的 Cloak profile / CDP 9344/9345 做登录
- 不要用官方 `setup.ps1`（会全机装 openclaw）
- 不要把两棵树的配置、cookie、网关混用

---

## 5. 已完成（对照代码，不要盲信）

### 5.1 09-13 及更早（已在 git，不要重复修）

稳定性一批已提交：问答 SSE 超时、日志轮转 WinError 32、停会话误杀网关、启动等待 25s→60s、托盘僵死、gateway question scope 等。详见 `git log` 的 `fcc7ca3` / `04250ff` / `ad6f827` / `6acec96`。审查材料：`Easel\.runtime\review\`。

网关授权曾改过：`~\.openclaw-easel-studio\state\openclaw.sqlite` 里 questions 相关 scope 与代码对齐。**性质是本机自托管配对，不是绕过安全。**

### 5.2 09-14（多数已打进 `1852dff` 快照）

规则体系、DailyHot 自托管热点、平台注册表 `/api/platforms`、账号页去重、`local_write_guard` 改为「Origin 白名单 ∪ 回环 peer」、`scripts/backup_accounts.py`、公众号 yaml 空壳。细节以 02:49 旧 HANDOFF 和台账为准。

**登录持久化落盘地图（仍成立）**：扫码平台 cookie 在 `~\.easel-browser-profiles\<平台>Profile\`；成功标记在 `outputs\_login\<platform>.json` 且 `state==success`；公众号 AppID 在 skill yaml；Postiz 在 `.runtime` + Docker 卷。

### 5.3 09-15 凌晨：安全合并上游 v0.1.1

- 合并前提交快照 `1852dff`，再 merge 为 `f44b3b2`
- 冲突策略：**两边能力都留**。公众号默认上游 `wechat-oa` 扫码；本地工作区官方 API 当备用
- `gzh-design` 随上游进来，许可证 **AGPL-3.0**。排版主路径仍是仓库内 baoyu。**不要当分发/商用默认依赖**
- 合并后对抗审查：破坏者 2 个 P1 已修——AppID 不得冒充已登录；抖音 `--keep-open` 不得双开同一 profile
- 当时全量测试记录为 **252 passed**（本交接未重跑，接手后应再跑一次确认）

### 5.4 09-15 上午：公众号登录态与送草稿（二次开发树，**未提交**）

问题本质：合并后 UI 仍可能把「填了 AppID」当成已登录。

已落地、**不要回退**的不变量：

- 已登录 = `outputs/_login/wechat-oa-mp.json` 的 `state==success`，不是 AppID
- `POST /api/wechat/draft`：有 mp 会话走 `create_session_draft`；否则有 AppID 走 `create_draft`；都没有 → **422**，提示去账号页扫码
- mp 会话草稿 `via: mp-session`；正式群发接口保持关掉（`media_id` ≠ freepublish）
- 发布中心 `PUBLISHABLE` 含 `wechat-oa`，**不要再造一个 `id=wechat` 的第二平台**
- `LOGIN_PROCESSES` 键 `wechat-oa-mp`，claim 键 `wechat-oa`
- TestClient 必须 `client=('127.0.0.1', port)` 且 `base_url="http://127.0.0.1:7860"`
- `easel/wechat.py`：`/api/media/` 先解析再交给 `weixin_mp_stats.py`；空 `media_id` 拒绝
- `weixin_mp_stats._launch` 有 `.easel.lock`

涉及文件：`easel/wechat.py`、`web/wechat_api.py`、`web/app.py`、`web/auth_guide_api.py`、`docs/WECHAT.md`、`WechatPage.tsx`、`AccountsPage.tsx`、`PublishPage.tsx`、`lib/api.ts`、`tests/test_wechat.py`、`tests/test_login_session.py`、`tests/test_p2_hardening.py`、`weixin_mp_stats.py`、`douyin_publish.py`。

**真实扫码送草稿：未做。**

### 5.5 09-15 上午：隔离原版 + 网关

- `Easel-official` = tag v0.1.1
- 独立 `.venv`、独立 `outputs`、Web **7870**
- **未**跑官方 `setup.ps1`
- 网关离线根因：18789 没人听；PATH `openclaw-cn` 不能用
- 修复：隔离 OpenClaw `--profile easel`。`doctor --fix` 曾因 `~\.openclaw\workspace-easel` 是指向 `G:\EaselData\workspace-easel` 的 junction 触发 **EXDEV**。新 workspace：`~\.openclaw-easel\workspace` → 同一 G: 目标
- `~\.openclaw-easel\openclaw.json` 的 `skills.load.extraDirs` → `Easel-official\skills\openclaw`
- 本地补丁：`easel/openclaw_cmd.py` 优先找兄弟目录 `Easel\.runtime`；`scripts/gateway.ps1` 用隔离 node；启动脚本先起网关

### 5.6 09-15 中午：小红书 300012 → CloakBrowser（两棵树都改了）

**本质（已实测，不是猜）**：同一出口 IP。Playwright 自带无头 Chromium → 300012、不出码。本机真 Chrome 窗口和 Cloak（有头/无头）能到社区页并出码。

Cloak 可执行文件：`C:\Users\Administrator\.cloakbrowser\chromium-146.0.7680.177.5\chrome.exe`（可用 `EASEL_CLOAK_BROWSER` 覆盖）。**禁止**用 `Easel\.runtime\cloak-research-profile`、`D:/cloakbrowser/profile`、CDP 9344/9345 做登录。Cookie 只进 `~\.easel-browser-profiles\XiaohongshuProfile`。

不要 `pip install cloakbrowser` 追最新 151：包装 MIT，二进制专有，最新大版本可能要付费订阅。

实现：`skills/shared/scripts/xhs_publish.py` 的 `_cloak_executable()` + `_launch(executable_path=Cloak)`；无 Cloak 才回退有头 Chrome/Edge。Web 登录：`--no-proxy`，**不要**再加 `--headed`（码在页里）。

用户在 7870 点登录曾失败：Cloak 起来后 `TargetClosedError`，Chrome **exit 21**。根因是账号页 `verifyStale` 的 whoami 和登录**同时**打开同一 `user-data-dir`。

锁：`_ProfileLock`（`.easel.lock`，msvcrt/fcntl）。whoami 等锁 4s → JSON `error: profile-busy`。登录等 90s 或写中文错误。`_launch` 在 TargetClosed 时清 Singleton* 再试一次。官方 `api_account_whoami` 在登录进程活着时跳过（二次开发树原先已有）。

用户操作：关掉弹层，等约 10 秒，**只点一次**登录，不要连点。

13:54 复用调研结论（台账 C 区已记）：保持 Cloak 内核；`xiaohongshu-mcp` 官方 Cloak 路径写明**不要再打 stealth**；AdsPower/Multilogin/BitBrowser 只学「一账号一环境」；Camoufox / patchright / nodriver / MediaCrawler 本次否决。

### 5.7 09-15 下午：7870 对话与技能（已用会话日志核对）

- 网页 7870 → 网关 18789 → Codex → `gpt-6-astra`
- 每轮末尾有用户看不见的 `TURN_REMINDER`（`easel/persona.py`）：先查技能库
- 技能**不是**后台自动 dispatch。Astra 去读 `SKILL.md`、按里面的步骤自己写，就算用上了。`style-transfer` / `text-polisher` 没有独立脚本引擎
- 15:28 那轮：用户要求在 113 个技能里找文本创作技能。日志里模型数出 **113** 个 `SKILL.md`，读了 `style-transfer/SKILL.md`，复用早先读过的 `text-polisher`，成品在 `Easel-official\outputs\AI整理后我反而不敢改了\`
- 对话页乱码是**显示编码**问题，会话文件里是正常中文

强制点名跑某个技能：终端 `easel skill <名字>`。对话页没有这一步。

### 5.8 09-15 15:50：handoff 技能移到本机全局

现役库里本来没有独立 `handoff` 入口。内容一直在 Skills Manager 库：

- 库：`C:\Users\Administrator\.skills-manager\skills\handoff`
- 已在预设「桌面全量（Codex + Cursor）」「Grok 核心」里，但 **SM 侧所有 coding agent 保持 disabled**（本机约定：SM 只管内容库，不部署）
- 当时只 deploy 到了自定义 agent `doubao`

本机全局真源是 `~\.codex-shared\active-global-skills` + `skill-scope.json`。`~\.cursor\skills` 是指向该目录的 junction。

已做：

1. junction：`active-global-skills\handoff` → skills-manager 库
2. `skill-scope.json` 的 `global_skills` 已列入 `handoff`
3. `local-scope-manifest.json` 的 `content_ownership.global_core` 已列入；从 profile `skill-governance` **移出**
4. 已 `capability_index.py refresh --environment local-windows`。handoff 现为 `scope: shared`，`verified: true`
5. 读回：`~\.cursor\skills\handoff\SKILL.md` 与库文件 SHA256 一致（`8e7e5fee…1c87`）

**未做**：没有用 `skills deploy` 去打开 SM 里的 Cursor/Codex（会违反「agent 保持 disabled」）；没有改服务器 `server-scope-manifest.json` / `server_global_core`；没有跑 `sync-global-rules.ps1 -Server`。

本会话 Cursor 进程在改全局入口**之前**启动，**可能要新开对话**才把 `handoff` 列进系统技能表。文件已经在磁盘上。

---

### 5.9 09-19：胶水收口 + 合并上游 v0.2.0（二次开发树）

两件事，都在 `Easel/`，都没碰原版树：

1. **`5ab86a0`（已在 `main` 且已推 `origin/workbench`）**：09-15 那批未提交胶水入库（公众号登录态只认
   `outputs/_login/wechat-oa-mp.json` 的 `state==success`、`POST /api/wechat/draft` 三分支降级、
   CloakBrowser 内核、`_ProfileLock`、抖音 `--keep-open`）。仍排除根目录 `_*.py`。
2. **`91945f0`（在分支 `merge/upstream-v020`，**未并进 `main`、未推送**）**：合并 `upstream/main` v0.2.0，
   149 文件 / +18,598 / −219。父提交 `5ab86a0` + `ed3bf27`。回退点 `backup/pre-upstream-merge` = `5ab86a0`。

**合并时定下的、后续不要再改回去的三条不变量：**

- **profile 与工作区**：`OPENCLAW_PROFILE = PROFILE`（`easel-studio`），`OPENCLAW_WORKSPACE` 写死
  `~/.openclaw/workspace-easel`。09-19 核对过 `~/.openclaw-easel-studio/openclaw.json` 的
  `agents.defaults.workspace` 正是该路径 —— **不能**按 `f"workspace-{profile}"` 拼，那个目录不存在。
  两个 profile 的 gateway 端口都配 18789，互斥依旧成立。
- **安全姿态**：上游的 `allow_origins=["*"]` 已删除。本机 `_LOCAL_ORIGINS`（7860/5173）+
  `local_write_guard` + `TrustedHostMiddleware` + 只绑 127.0.0.1 全部保留。上游新增的
  `tests/test_web_security.py` 因此必须伪装本机客户端才能跑通 —— **改测试，不放宽守卫**。
- **Windows 逐字流式**：上游靠 `scripts/gateway.sh` 导出 `OPENCLAW_RAW_STREAM_PATH`（默认 `/tmp`）。
  本机 Windows 起 gateway 走 `easel/services.py`，已补注入同一份 `OPENCLAW_RAW_STREAM` /
  `OPENCLAW_RAW_STREAM_PATH` / `EASEL_RAW_STREAM_PATH`，落 `.runtime/easel-raw-stream.jsonl`
  （常量在 `easel/runtime.py: SHARED_RAW_STREAM`）。**删掉这段接线的表现**：回答整块蹦出来、
  「💭 思考过程」面板空白，而不是报错。

**已验证**：`pytest tests/ -q` → 321 passed；`scripts/validate_skills.py` → OK 114 skills；
前端 `tsc -b && vite build` 通过；合并提交内无 `.env`/cookie/凭证类文件。
**未验证**：真机四条链（小红书 Cloak 扫码出码、公众号真送草稿、对话逐字流式不乱码、桌面壳托盘完全退出）
一条都没跑过 —— 起服务会抢用户正在用的 18789，必须等用户让跑。

**遗留决定**：上游 `SettingsPanel`/`EnvBoard` 与本机 `ModelSettingsPage` 是两套模型设置 UI，功能重叠，
需要产品级去重（我的建议：上游做默认入口，本机页折进去当一个分区），未动。

---

## 6. 当前问题

### 6.1 接手优先（会挡住用户真用）

| # | 问题 | 证据 / 注意 |
|---|---|---|
| 1 | 小红书登录未形成持久 cookie | Cloak + 锁已进代码。用户需在 **7870** 关弹层、等 10s、点一次登录并扫码。不要连点 |
| 2 | 公众号真实送草稿未跑通 | 不要代用户点「登录」或送草稿。扫码会开有头 Chromium |
| 3 | 7870 对话页中文乱码 | 会话 jsonl 正常。未修前端/网关编码 |
| 4 | ~~二次开发 09-15 胶水未提交~~ 已做 | `5ab86a0` → `main` 已推 `origin/workbench`，见 §5.9。根目录 `_*.py` 仍未提交，且**不该**提交 |
| 5 | ~~本地落后上游 11 个提交~~ 已合，未落地 | 合并提交 `91945f0` 只在 `merge/upstream-v020`，**未进 `main`、未推送**；推不推由用户定 |
| 6 | 两套网关互斥 | 用户在用 7870。不要擅自起 7860 桌面版去抢 18789 |
| 7 | 原版官方补丁只在 detached HEAD | 长期开发请回到 `Easel/` + fork `workbench` |

### 6.2 未修、不影响当前上手的 P2（旧账，可后做）

- ~~`_session_locks` 永不释放；`stdout_lines` 无界~~ 已修：`_release_session_lock` 按 waiter 计数清条目，
  本轮对话用 `deque(maxlen=_STDOUT_MAX_LINES)`。仍留的旧账：**进程归属靠命令行字符串**
- `/api/auth-guide` 与 `/api/platforms` 双真源（有 Dashboard 消费方，收敛要另排）
- `lib/whoami.ts` 对污染的 localStorage 不做类型校验（既有、不在改动面）
- 问答卡端到端仍缺**用户实机点一次**（沙箱不能起会调 `reg.exe` 的网关）

### 6.3 刻意保留

- 根目录 9 个 `_*.py`：可能是旧缺陷复现证据。归档优于删除，清理先问用户
- `~\.openclaw\workspace-easel` 那种跨盘 junction：不要再对它 `doctor --fix` 硬搬目录
- Postiz 探测超时必须大于冷启动实测（约 2.1s），压低会误报未就绪

### 6.4 全局 Skill 清单漂移（本轮发现，未顺手改）

`active-global-skills` 磁盘上多了两个**未写入** `skill-scope.json` 的目录：`codex-desktop-db-recovery`、`win-lnk-electron-diagnose`。capability index 标了 `manifest_drift.extras`。不要为了「对齐」擅自删它们或把它们升成官方全局，除非用户明确要求。

---

## 7. 下一步计划

只列会改变结果的路线，不列「再审查一遍」。

**路线 A — 用户在原版走通登录（当前最高价值）**

> 我在用原版 Easel（`F:\科研大师兄\自媒体工作台\Easel-official`，Web 7870）。请先读 `Easel\HANDOFF.md` §5.6。不要启动 7860。等我关掉登录弹层约 10 秒后，我自己只点一次小红书「登录」并扫码。你只读 `outputs/_login` 与 `xhs_publish` 日志，确认 cookie 是否进了 `~\.easel-browser-profiles\XiaohongshuProfile`，不要代我点登录。

**路线 B — 把二次开发未提交胶水收进 `workbench`（09-19 已完成 → `5ab86a0` 已推）**

> 请先读 `F:\科研大师兄\自媒体工作台\Easel\HANDOFF.md`。只提交二次开发树里与公众号登录态、Cloak 登录、发布页相关的源码和测试，不要 `_*.py`、`.env`、`.runtime`。提交前再跑 `tests/`。需要我先口头确认再 commit。

**路线 C — 把落后的 11 个上游提交合进本地**

> 本地 `main`（`f44b3b2`）落后 `upstream/main`（`71de7f9`）11 个提交。先读 HANDOFF §2.3，评估 wechat-oa ticket 与 CI 提交和未提交胶水的冲突，给出合入方案，未经我同意不要 merge。

不要在用户盯着 7870 对话时重启网关或桌面版。

---

## 8. 踩过的坑（本会话新的 + 仍会咬人的旧坑）

### 8.1 本会话新坑

- **两棵树、一个 18789**：原版「网关离线」经常是二次开发桌面版没关、或根本没起隔离 profile。
- **PATH 上的 `openclaw` ≠ 项目引擎**：本机是 openclaw-cn 0.2.0，官方脚本会误用。
- **跨盘 junction + `doctor --fix` = EXDEV**：workspace 在 G:、配置在 C: 时不要让 doctor 搬目录。
- **300012 不是 IP 坏了**：同一出口，换内核就出码。不要先去「换网络」。
- **同一 `user-data-dir` 双开 Cloak**：whoami + 登录 → TargetClosed / exit 21。必须锁。
- **Cloak 上不要叠 stealth / 改 UA**：与 `xiaohongshu-mcp` 官方 Cloak 路径一致。
- **对话报「用了某技能」≠ 跑了脚本**：查 `~\.openclaw-easel\agents\...\rollout-*.jsonl` 里有没有读到 `SKILL.md`。
- **OpenClaw / 嵌入页会把中文显示成乱码**：以会话文件和 `outputs/` 为准。
- **SM 里有 skill ≠ Cursor 看得到**：本机全局看 `active-global-skills` + `skill-scope.json`。
- **官方 `setup.ps1` 会动全机 Node/openclaw**，禁止在这台机器跑。
- **`encoding="utf-8"` 解码子进程 ≠ 子进程真的写 UTF-8**：中文 Windows 上 Python 子进程默认按
  cp936 写 stdout，父进程按 utf-8 解出的是坏字节 → JSON 解析失败，异常又被 `except Exception` 吞掉，
  表现是「配方表读空」而不是报错。本机带 `PYTHONUTF8=1` 跑测试会**恰好掩盖**它（09-19 就是这样，
  只有 CI 的 windows runner 炸）。写这类桥接要给子进程 `env` 显式塞 `PYTHONUTF8` + `PYTHONIOENCODING`。

### 8.2 旧坑（仍有效）

- TestClient peer 默认是字面量 `testclient`，不是 IP；且必须 `base_url="http://127.0.0.1:7860"`，否则 TrustedHost 400
- Windows `localhost` 先试 `::1`；探测钉 `127.0.0.1` + TCP 预检
- 本机全局代理会把 `127.0.0.1` 打进隧道 → 502；本地请求 `trust_env=False`
- gateway 冷启动可超过 25s；探测超时必须大于被测服务冷启动
- FastAPI `include_router` 后用 `app.routes` 会误判路由缺失
- 前端 `dist` 是相对路径 `./assets/`；必须核对产物 mtime ≥ 源码 mtime
- 沙箱：`wsl.exe` / `reg.exe` 黑名单；PowerShell 可能吞 stdout —— 重要结论用 Python 写文件再 Read

---

## 9. 关键路径与命令

| 用途 | 路径 / 命令 |
|---|---|
| 二次开发根 | `F:\科研大师兄\自媒体工作台\Easel` |
| 原版根 | `F:\科研大师兄\自媒体工作台\Easel-official` |
| 规则 | `F:\科研大师兄\自媒体工作台\AGENTS.md` |
| 台账 | `F:\科研大师兄\自媒体工作台\工具复用台账.md` |
| 上手图 | `F:\科研大师兄\自媒体工作台\show-me-easel-official-onboarding.html` |
| Python | `Easel\.venv\Scripts\python.exe`（3.12） |
| 测试 | `.\.venv\Scripts\python.exe -X utf8 -m pytest tests/ -q` |
| 二次开发服务 | `python -m easel.services start\|stop\|status` |
| 原版启动 | `Easel-official\启动原版工作台.ps1` |
| 原版对话会话 | `~\.openclaw-easel\agents\main\agent\codex-home\sessions\` |
| 原版网关配置 | `~\.openclaw-easel\openclaw.json` |
| 扫码 profile | `~\.easel-browser-profiles\` |
| Cloak | `~\.cloakbrowser\chromium-*\chrome.exe` |
| 全局 Skill 运行时 | `~\.codex-shared\active-global-skills` |
| handoff 库 | `~\.skills-manager\skills\handoff` |
| SM CLI | `C:\Users\Administrator\AppData\Local\Programs\skills-manager\skills-manager-cli.exe`（`~\.skills-manager\bin` 未发布，属 PATH 回退） |

端口（15:50）：**7870 listen，18789 listen，7860 空，4007 空**。

---

## 10. Suggested skills

新会话按需加载，不要一次全开：

- **`handoff`**（现已全局）：会话结束或阶段交接时更新本文件
- **`task-navigation`**：长任务收口、恢复主线
- **`neat-freak`**：复杂阶段结束后清临时物；**不要删** `_*.py` 和回滚材料
- **`manage-skills` / `agent-skill-sync`**：改 Skill 可见性时走现役管理器，不要手改镜像
- **`show-me`**：继续给用户画上手路径
- **`frontend-design`**：动 `web/frontend`
- **`find-repo` / `find-skills`**：按 AGENTS.md §1 做复用调研
- **`engineering-defaults`**：提交、测试、CI

`win-python-verify` 已退役。不要为交接再造新 Skill。

---

## 11. 交接清单

**Do**

- 先读 AGENTS.md 和本文件，再动两棵树中的任何一棵
- 先看端口，避免和用户正在用的 7870/18789 打架
- 改完跑 `py_compile` + `pytest tests/`
- 选型写台账；零新付费依赖
- 复杂改动走 §2.4 三视角，结论落到文件+行+复现条件

**Don't**

- 不要在用户没说的时候停/抢 18789 或重启 7870
- 不要 `npm i -g openclaw`，不要跑官方 `setup.ps1`
- 不要用调研 Cloak profile / 9344 / 9345 登录
- 不要把 AppID 当成公众号已登录
- 不要提交 `_*.py`、`.env`、真实 cookie、`.runtime` 缓存
- 不要强推本地 `main` 覆盖 fork 的 `main`
- 不要把 AGPL 的 `gzh-design` 当对外默认排版
- 不要把「对话里报了技能名」写成「脚本已执行」
- 不要回显 API Key

**敏感信息**：本文无 Key / token / 密码。网关 scope 名（`operator.questions` 等）不是凭据。

---

## 12. 本轮交接时额外做的（neat-freak）

- 对齐：handoff 的库路径、全局 junction、`skill-scope.json`、`local-scope-manifest.json`、capability index
- 清理：无。未删 `_*.py`，未停 7870/18789，未动用户 `outputs/`
- 保留：磁盘上未声明的 `codex-desktop-db-recovery`、`win-lnk-electron-diagnose`（§6.4）
- 阻塞：无管理器阻塞。用户要在**新 Cursor 对话**里才能稳定看到全局 `handoff` 条目

---

## 13. 09-19 收尾：合并结果怎么落地（下一步真源）

当前 HEAD 在 `merge/upstream-v020`（`91945f0`）。`main` 仍停在 `5ab86a0`。三种走法，等用户选：

1. **就地验收再落地**（推荐）：用户允许起服务后，真机跑四条链 —— 小红书 Cloak 扫码出码、
   公众号真送草稿、对话逐字流式不乱码、桌面壳托盘完全退出。全绿再：
   `git checkout main && git merge --ff-only merge/upstream-v020`，然后推 `origin/workbench`。
2. **先推分支再长验**：`git push origin merge/upstream-v020`，让 fork 上的 CI（上游新加的
   `.github/workflows/ci.yml`，ubuntu+windows）替本机再跑一遍 `pytest` + `validate_skills`。
   不碰 `main`，回退成本为零。
3. **放弃合并**：`git checkout main && git branch -D merge/upstream-v020`。`5ab86a0` 就是干净基线。

复现验证命令（只读，不起服务、不碰 18789/7870）：

```powershell
cd 'F:\科研大师兄\自媒体工作台\Easel'
$env:PYTHONUTF8='1'
.\.venv\Scripts\python.exe -X utf8 -m pytest tests/ -q          # 期望 321 passed
.\.venv\Scripts\python.exe -X utf8 scripts\validate_skills.py    # 期望 OK 114 skills
cd web\frontend ; npm run build                                  # 期望 tsc + vite 通过
```

合并后新增的对外行为，用户可能没预期到，先说清楚再动：

- `EASEL_CHAT_TRANSPORT` 默认仍是 `cli`；设成 `http` 才走常驻网关直连（省 6-7s 冷启动），
  起没起由 `_gateway_http_ready` 判定，失败自动回退 CLI。
- 上游 `video-production` 技能带进来一整套 vendor SDK（MIT）和字体资产，仓库体积明显变大。
- 上游 `.gitignore` 只排除 vendor 里的 `node_modules/`、`.remotion/`、`models/`，不会误伤本机数据。
