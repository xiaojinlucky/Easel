# HANDOFF · Easel 自媒体工作台

> 交接时间：**2026-09-19 22:40**（UTC+8）—— 本轮为「合并上游 v0.2.0 + 两树对账」交接。
> **本轮按实测重写/修正过**：§0、§1、§2.1、§2.3、§3.3、§4.2、§5.9、§5.10、§6.1、§6.2、§7、§8.1、§9、§10–§12、§13。
> **未再核对、仍以 2026-09-15 15:50 快照为准**：§5.1–5.8、§2.2、§6.3–6.4、§8.2 —— 接手后要自己复核那几节。
> 交接对象：**完全没有上下文、也无法回头追问本会话的新 Agent**
> 本文件取代 2026-09-15 02:49 版交接。更早的 09-13 全文仍在 git：`git show 83d6bc4:HANDOFF.md`
> 本文是二次叙述。关键结论请对照代码、测试、git 与运行端口，不要把下文当唯一真源。
>
> ⚠️ **本文有过一次前提性错误，务必引以为戒**：09-15～09-19 期间本文通篇把 `Easel/` 写成"长期开发树"、
> 把 `Easel-official/` 写成"不要当长期开发树"。用户 09-19 明确纠正：**`Easel-official` 才是他的现役版本**。
> 教训见 §8.1 的 09-19 段首条 —— 接手前先问用户在用哪套、看端口，不要用本文的历史假设推导。

---

## 0. 60 秒速览（2026-09-19 22:40 实测核对）

| 项 | 现役事实 |
|---|---|
| **用户现役版本** | `F:\科研大师兄\自媒体工作台\Easel-official`（原版树，Web **7870**，profile `easel`）。用户 09-19 原话："**前者才是我的现役版本**" |
| 原版树 git 状态 | 分支 `snapshot/official-active-0919` = **`8648784`**；`9f2690d` 把 09-19 工作区 48 文件（+4848/−376）收进库，`8648784` 记录可运行性验证。已推 remote **`fork`** = `git@github.com:xiaojinlucky/Easel.git`。**唯一不可逆风险已消除**（此前这批改动零提交、只存硬盘） |
| 二次开发树 | `F:\科研大师兄\自媒体工作台\Easel`。`main` = **`0b22a04`** = `origin/workbench`（含上游 v0.2.0 合并 `89a828a` + 编码修复 `cab8712` + 4 个文档提交）。工作区只剩根目录 `_*.py` 未跟踪（本就不该提交） |
| GitHub | fork `origin` = `git@github.com:xiaojinlucky/Easel.git`；`upstream` = `ZJU-REAL/Easel`，`upstream/main` = `ed3bf27`（v0.2.0）。`gh` 默认仓库 = `xiaojinlucky/Easel` |
| 回退点 | `backup/pre-upstream-merge` = `5ab86a0`（合并前干净基线）。临时分支 `merge/upstream-v020`（`862a36d`）**本地+远端都还在**，未删 |
| 端口（本轮 netstat） | **7870 listen（pid 38932）**、**18789 listen（pid 46380）**、7860 空、9344/8089 空。两棵树抢同一个 18789 网关，互斥 |
| CI | [PR #1](https://github.com/xiaojinlucky/Easel/pull/1) 三个 job 全绿（Skill contracts / pytest ubuntu / pytest windows）。首跑 windows 红过一次 → 抓出上游 `install_tool` 桥接的 cp936 编码 bug，已修 `cab8712` |
| 本轮质量门 | `pytest tests/ -q` → **322 passed**；`validate_skills.py` → OK 114；`validate_skill_commands.py` → OK 273；前端 `tsc -b && vite build` 通过 |
| **未验证** | 真机四条链（小红书 Cloak 扫码出码、公众号真送草稿、对话逐字流式不乱码、桌面壳托盘完全退出）**一条都没跑** —— 要起服务、会抢用户在用的 18789 |
| **用户的新诉求** | "我受够了同时维护两套工作台，我想把他们合并到一起。" → 对账已完成。**2026-09-19 已拍板：一切按现在的 official**（7870 / profile `easel` / official 模型设置 / 扫码不弹窗）。方案第 0/4/5 节已改写；原先「以 `Easel` 为底、official 退役」**作废** |
| 对话模型 | 7870 对话 = OpenClaw → Codex 插件 → `openai/gpt-6-astra`（官方 Codex 订阅）。**不是** Cursor 里的模型 |

用户是自媒体从业者，技术不敏感：白话、结论先行、给明确下一步。主战场是 **小红书 + 公众号**。

---

## 1. 新会话开场必读

按这个顺序，不要先改代码：

1. `F:\科研大师兄\自媒体工作台\AGENTS.md`（工作台规则真源；`CLAUDE.md` 只是入口指针）
2. 本文件
3. **`F:\科研大师兄\自媒体工作台\两树合并方案-2026-09-19.md`**（当前主线的决策材料：对账数字、值得搬的 4 块、12 处硬冲突、7 步落地、4 个待用户决策项）
4. `F:\科研大师兄\自媒体工作台\Easel-official\HANDOFF.md`（指针文件；新会话若在工作区是原版树，先被它引到这里）
5. 需要改造史时：`Easel\.runtime\review\final-acceptance.md`（09-13）
6. 需要选型时：`F:\科研大师兄\自媒体工作台\工具复用台账.md`（C 区已有 09-15 行）
7. **先问用户"你现在开的是哪套"，再确认端口**：7860 / 7870 / 18789。09-19 22:40 实测 7870 + 18789 在听、7860 空。**两套 Easel 不能同时占 18789**

Python 一律：`Easel\.venv\Scripts\python.exe`，环境变量 `PYTHONUTF8=1`。不要用用户旧 Conda。

---

## 2. 项目是什么

`F:\科研大师兄\自媒体工作台` 是工作台目录，**Easel 是主体**。同级还有 `publisher-assistant`、`workbuddy-studio`、`xhs_content_workbench`、`inspiration_collector_v0`、`beav-*`、`RedBox`。

上游：`ZJU-REAL/Easel`，Apache-2.0。本地二次开发做成了 Electron 桌面壳 + 本机服务栈（Web / OpenClaw 网关 / Postiz / FreshRSS 等）。

### 2.1 必须分清的两棵树

| | 二次开发 `Easel/` | 原版 `Easel-official/` |
|---|---|---|
| 用途 | 代码资产最全（上游 v0.2.0 + 235 第一方文件 + 322 测试），但**用户当前不在用它** | **用户 09-19 确认的现役版本**，他每天在 7870 上操作 |
| Web | 7860（快捷方式；此刻未监听） | **7870（用户正在用）** |
| OpenClaw profile | `easel-studio` → `~\.openclaw-easel-studio` | `easel` → `~\.openclaw-easel` |
| 网关端口 | 都要 **18789**，互斥 | 同左 |
| 技能目录 | `Easel\skills\openclaw` | `Easel-official\skills\openclaw`（约 113 个 `SKILL.md`） |
| remote | origin=用户 fork，upstream=官方 | origin=ZJU-REAL；**09-19 新增 `fork` → 用户 fork**；分支 `snapshot/official-active-0919`（不再是 detached v0.1.1），已推 fork |

> 本文原先把"哪棵是长期树"当成定论写死了。**那个前提被用户推翻**：原版树是现役，二次开发树反而没在用。
> 两棵树的定位现在处于待定状态，由 `两树合并方案-2026-09-19.md` 第 0 节给出建议（以 `Easel` 为唯一树），
> 等用户拍板。在此之前不要按"某棵是废弃的"行事。

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
- ~~本地缺的 11 个上游提交~~ **09-19 已补齐并超过**：v0.1.1 之后又经 [PR #1](https://github.com/xiaojinlucky/Easel/pull/1)
  合入 `upstream/main` v0.2.0（`ed3bf27`），`origin/workbench` 现 = `0b22a04`，**不再落后上游**。
  fork 的 `main` 分支仍保持上游内容，**没有被本地覆盖**（当初的"不强推 main"依旧成立）。

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

### 3.3 09-19 这一轮实际生效 / 被重申的规则

- **安全守卫只紧不松**：测试与上游实现冲突时**改测试夹具**，不动 `local_write_guard` / CORS / TrustedHost。
- **永不修改 git config**。需要提交身份时用 `git -c user.name=… -c user.email=…` 单次传参。
- **不可逆动作先给选项、等用户点头**：merge、推送、开对外 issue、删分支、改现役实例。
  本轮的推送与 PR #1 合并都是用户回"1"明确选择后才做的。
- **交付物要能被另一个 AI 独立复核**（用户习惯把结论交给别的模型对抗验收）：
  事实 / 推断 / 未做 三档显式分开，各附证据出处与可复制的复核命令 + 期望值。见 §13 的结构。
  自己修正过的判断要显式标"此说已被削弱，勿沿用"，不要静默替换。
- **沟通**：结论先行、白话、少术语。用户 09-19 说过"我不懂你说的是什么意思"。
- **进实现前**必须先有 `AGENTS.md` §1.5 复用调研表（本轮的两树合流即卡在这一步，见 §6.1 第 9 行）。
- 跨会话仍有效的旧约束：不提交 `_*.py` / `.env` / cookie / `.runtime`；不跑官方 `setup.ps1`；
  不 `npm i -g openclaw`；不抢/停用户在用的 18789 与 7870；不用调研 Cloak profile（CDP 9344/9345）做登录；
  不把 AppID 当公众号已登录；不把 AGPL 的 `gzh-design` 当对外默认排版；token/key/密码不进记忆与文档。

---

## 4. 用户提过的问题、需求与修改意见（跨会话累积）

### 4.1 09-14 ~ 09-15 那轮

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

### 4.2 09-19 这一轮（上游合并 + 两树对账）

| 用户说了什么（原意） | 处理结论 | 闭环？ |
|---|---|---|
| 「我去看看我现在对 Easel 的二次开发，相比上游原本仓库有了哪些改进型内容？」 | 按 blob 对账拆成"第一方原创 vs 随上游 vendored"，输出改进清单 | 已交付 |
| 「你先看看上游的改动我们能否进行安全合并。」 | 只做评估、不动手：列出 51 个上游提交的变更面与冲突点，给三档风险 | 已交付 |
| 「**我不懂你说的是什么意思**」 | **沟通反馈，长期有效**：从现在起结论先行、白话、少术语、少嵌套从句。接手后继续保持这个说话方式 | 已调整 |
| 「同意先只做第一步」 | 只把工作区未提交的 09-15 胶水安全提交（`5ab86a0`），**不做 merge** | 已完成 |
| 「1.提交 2.可以开始从最安全的几项开始合并上游」 | 合并 `upstream/main` v0.2.0（149 文件）进 `merge/upstream-v020`，先做技能中文展示名、`ask_user` 多选等低风险项，再攻 `web/app.py` 与安全姿态 | 已完成 |
| 「1」（选项：先推分支让 CI 验，不碰 `main`） | 推 fork + 开 [PR #1](https://github.com/xiaojinlucky/Easel/pull/1)，三个 job 全绿；首跑 windows 红 → 定位到真 bug `cab8712` | 已完成 |
| 「1」（选项：直接合 PR，本地 `main` 快进跟上） | `89a828a` 合入 `workbench`，本地 `main` `--ff-only` 到同点，文档提交 `0b22a04` | 已完成 |
| 「你合并的是 `Easel-official` 还是 `Easel`？**前者才是我的现役版本**。」 | **前提被推翻**：本会话全程按 HANDOFF 认定 `Easel/` 是长期树。当场承认文档过时，转去盘原版树风险，发现其 48 文件改动**零提交、零分支、零 stash**，只存硬盘 | 已纠正 |
| AskUserQuestion 答复：「先保护入库，方向稍后再定（推荐）」 | 在 `Easel-official` 建 `snapshot/official-active-0919`，纯保护性提交 `9f2690d` + 验证记录 `8648784`，新增 `fork` remote 并推送。**不改行为、不重启服务、不定真源归属** | 已完成 |
| 「看看 Easel 有哪些内容值得添加到 Easel-official 中去的，我受够了同时维护两套工作台，我想把他们合并到一起。」 | 只读对账产出方案。用户随后拍板「一切按 official」：以 official 为唯一现役，冲突留 official。原先「以 `Easel` 为底、official 退役」作废 | **4 个决策已拍板；隔离合尚未验收** |
| 「使用 handoff 这个技能，这个会话要结束了……写一份交接文档存到 HANDOFF.md」 | 就是本文件 | 本次提交 |

**用户在这一轮明确表达过的偏好（要延续）**：
- 同时维护两套工作台是他的痛点，合并动机是"以后只维护一套"，不是"多一个功能"。
- 他关心"哪些值得加进现役版本"，即以**现役树为中心**做加法。反向建议（以 `Easel` 为底、official 退役）已被他否定。
- 对不可逆动作（推送、合 PR、改现役树）他要求先给选项再点头；本会话所有推送/合并均在明确同意后执行。

**4 个决策已拍板**（用户原话：「一切都按照现在的 official 来吧」）：端口 **7870**、profile **`easel`**、模型设置 **official 这一版**、扫码 **不弹有头窗口**。合并方向 = 以 official 为唯一现役，冲突留 official。

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

### 5.4 09-15 上午：公众号登录态与送草稿（二次开发树；09-19 已以 `5ab86a0` 入库）

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
2. **`91945f0` → 经 PR #1 于 09-19 落地**：合并 `upstream/main` v0.2.0，
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

**已验证**：`pytest tests/ -q` → **322 passed**（含在 CI 同等环境下复跑）；`scripts/validate_skills.py` → OK 114 skills；
`scripts/validate_skill_commands.py` → OK 273 commands；前端 `tsc -b && vite build` 通过；合并提交内无 `.env`/cookie/凭证类文件；
GitHub CI 三个 job 全绿。合并过程中两处**故意的实现选择**，不要当成"测试写法问题"改回去：
`tests/test_web_security.py` 用 `client=('127.0.0.1', port)` + `base_url="http://127.0.0.1:7860"` 伪装本机工作台
（**改测试适配更严的守卫，不放宽 `local_write_guard`**）；`tests/test_mp_login.py` 除上游两个入口外还抽了本 fork 的
`_try_begin_login` / `_release_login_claim`，并额外加 `test_concurrent_start_claims_once`（本 fork 独有的认领锁保证）。

**未验证**：真机四条链（小红书 Cloak 扫码出码、公众号真送草稿、对话逐字流式不乱码、桌面壳托盘完全退出）
一条都没跑过 —— 起服务会抢用户正在用的 18789，必须等用户让跑。

**遗留决定**：上游 `SettingsPanel`/`EnvBoard` 与本机 `ModelSettingsPage` 是两套模型设置 UI，功能重叠，
需要产品级去重（建议：上游做默认入口，本机页折进去当一个分区），未动。这条现在并入 §13 的 4 个待决策项。

---

### 5.10 09-19 后半段：原版树保护入库 + 两树对账（**未改任何产品代码**）

三件事，全部只读或纯保护性：

1. **`Easel-official` 唯一不可逆风险已消除**。发现时该树状态是：detached `23d0f7c`（v0.1.1）、
   **零分支、零 stash、48 个改动文件只存在硬盘上**。现已建 `snapshot/official-active-0919`：
   - `9f2690d` —— 收口 48 文件（+4848 / −376）
   - `8648784` —— 记录可运行性验证（**110 passed**；注意该树 `.venv` 里没装 pytest，测试是用另一棵树的环境跑的）
   - 新增 remote `fork = git@github.com:xiaojinlucky/Easel.git`，两个提交都已推上去。
   - 提交身份用 `git -c user.name=local-workbench -c user.email=local@workbench.local` 单次传参，
     **没有写任何 git config**（用户级红线）。
   - 该树工作区现在只剩 `.venv/`、`.runtime/` 未跟踪。
2. **两树 git 跟踪面 blob 对账**（`git ls-files -s` 跨仓库比对）：
   `Easel` 1216 文件 / `Easel-official` 888 → **806 逐字节相同、65 内容不同、345 只在 `Easel`、17 只在 `Easel-official`**。
   345 再按 `upstream/main` 归属拆分 = **110 来自上游 v0.2.0 + 235 第一方原创**
   （skills/extensions 124、tests 19、deploy 17、desktop 15、scripts 11、web/frontend 9、docs 7、extensions 7、config 3、其他 23）。
   原版独有 17 个里真正的核心是 4 块 ≈**1,896 行**：`easel/workflow.py`(311)、`easel/skill_route.py`(461)、
   `easel/model_runtime.py`(256)、`easel/model_settings_api.py`(154)，加配套前端 `WorkflowsPage.tsx`(714) 等。
   已核实 `Easel` 树搜 `api/workflows|skill_route` 命中 **0**，原版命中 **10**。
3. **产出 `F:\科研大师兄\自媒体工作台\两树合并方案-2026-09-19.md`**（6 节 + 合规声明）：
   结论"方向反过来 —— 以 `Easel` 为唯一树，把原版独有 4 块搬过去，原版退役归档"；12 处硬冲突表；7 步落地（每步带验收）。
   **这是当前主线的下一步真源，本文件不重复其内容。**

---

## 6. 当前问题

### 6.1 接手优先（会挡住用户真用）

| # | 问题 | 证据 / 注意 |
|---|---|---|
| 1 | 小红书登录未形成持久 cookie | Cloak + 锁已进代码。用户需在 **7870** 关弹层、等 10s、点一次登录并扫码。不要连点 |
| 2 | 公众号真实送草稿未跑通 | 不要代用户点「登录」或送草稿。扫码会开有头 Chromium |
| 3 | 7870 对话页中文乱码 | 会话 jsonl 正常。未修前端/网关编码 |
| 4 | ~~二次开发 09-15 胶水未提交~~ 已做 | `5ab86a0` → `main` 已推 `origin/workbench`，见 §5.9。根目录 `_*.py` 仍未提交，且**不该**提交 |
| 5 | ~~本地落后上游~~ 已合并已落地 | `main` = `origin/workbench` = **`0b22a04`**（PR #1 `89a828a` + 编码修复 `cab8712` + 文档）。**只剩真机四条链未验** |
| 6 | 两套网关互斥 | 用户在用 7870。不要擅自起 7860 桌面版去抢 18789 |
| 7 | ~~原版补丁只在 detached HEAD~~ 已入库 | 现为分支 `snapshot/official-active-0919` = `8648784`，已推 fork（见 §5.10）。**硬盘丢失风险已解除** |
| 8 | ~~两树合并方向未拍板~~ **已拍板：以 official 为现役** | 用户 2026-09-19：「一切都按照现在的 official 来吧」。7870 / `easel` / official 模型设置 / 不弹窗。原先「以 `Easel` 为底退役 official」作废 |
| 9 | ~~开工前置：`AGENTS.md` §1.5 复用调研表未做~~ **已写入台账 A14** | `工具复用台账.md` A14 + C 区 2026-09-19 行。结论：本机 git `merge -X ours` + 隔离 worktree，零新装。**现役 7870/18789 仍不准动** |

### 6.2 未修、不影响当前上手的 P2（旧账，可后做）

- ~~`_session_locks` 永不释放；`stdout_lines` 无界~~ 已修：`_release_session_lock` 按 waiter 计数清条目，
  本轮对话用 `deque(maxlen=_STDOUT_MAX_LINES)`。仍留的旧账：**进程归属靠命令行字符串**
- `/api/auth-guide` 与 `/api/platforms` 双真源（有 Dashboard 消费方，收敛要另排）
- `lib/whoami.ts` 对污染的 localStorage 不做类型校验（既有、不在改动面）
- 问答卡端到端仍缺**用户实机点一次**（沙箱不能起会调 `reg.exe` 的网关）
- **上游 bug 是否上报未决**：`install_tool` 桥接的 Windows cp936 编码缺陷是上游 v0.2.0 自带
  （本机修复在 `cab8712`）。要不要给 `ZJU-REAL/Easel` 开 issue，**用户尚未同意**，属对外动作不能擅自做
- **临时分支未清理**：`merge/upstream-v020`（`862a36d`）本地与 `origin` 都还在，已完成使命。删除待用户点头

### 6.3 刻意保留

- 根目录 9 个 `_*.py`：可能是旧缺陷复现证据。归档优于删除，清理先问用户
- `~\.openclaw\workspace-easel` 那种跨盘 junction：不要再对它 `doctor --fix` 硬搬目录
- Postiz 探测超时必须大于冷启动实测（约 2.1s），压低会误报未就绪

### 6.4 全局 Skill 清单漂移（本轮发现，未顺手改）

`active-global-skills` 磁盘上多了两个**未写入** `skill-scope.json` 的目录：`codex-desktop-db-recovery`、`win-lnk-electron-diagnose`。capability index 标了 `manifest_drift.extras`。不要为了「对齐」擅自删它们或把它们升成官方全局，除非用户明确要求。

---

## 7. 下一步计划

只列会改变结果的路线，不列「再审查一遍」。

**路线 D — 两树合流（当前主线；方向已拍板）**

现役合同：网页 **7870**、profile **`easel`**、模型设置 **official 版**、扫码 **不弹窗**。
冲突文件留 official。不要再问这 4 题。

开工顺序：

1. ~~补复用调研表~~ **已完成**（台账 A14）。
2. ~~等 4 个决策~~ **已拍板**。
3. 隔离 worktree 已建：`F:\科研大师兄\自媒体工作台\Easel-merge-wip`。
   第一次合在暂存区、未提交：**+345 独有文件 / official 已有文件 0 改动**。
   坑：`merge -X ours` 仍会自动合成 `web/app.py`（profile 会变成 `easel-studio`），必须再 `git checkout 8648784 -- .` 把 official 已有路径取回。
   **不要在正在跑的 `Easel-official/` 里改文件，不要重建 `web/frontend/dist`，不要重启 7870/18789。**
   提交、切现役、归档隔壁 `Easel/` 必须再问一次。

可直接发给新会话的开场提示词：

> 两套 Easel 要合成一套，现役是 `Easel-official`（7870 / profile easel）。
> 先读 `Easel\HANDOFF.md` §0、§5.10、§13 和 `两树合并方案-2026-09-19.md` 第 0/4/5 节。
> 4 个决策已按 official 拍板，别再问。别抢 18789、别重启 7870。
> 在隔离 worktree 里 `git merge -X ours` 二次开发 `Easel/main`。未经同意不要推送、不要切现役。

**路线 A — 用户在原版走通小红书登录（可与 D 并行，价值最高）**

> 我在用原版 Easel（`F:\科研大师兄\自媒体工作台\Easel-official`，Web 7870）。请先读 `Easel\HANDOFF.md` §5.6。不要启动 7860。等我关掉登录弹层约 10 秒后，我自己只点一次小红书「登录」并扫码。你只读 `outputs/_login` 与 `xhs_publish` 日志，确认 cookie 是否进了 `~\.easel-browser-profiles\XiaohongshuProfile`，不要代我点登录。

**已完成、不要再当任务列出**：路线 B（胶水收口 → `5ab86a0` 已推）、路线 C（上游 v0.2.0 → `89a828a` 落地，文档 `0b22a04`）。

⚠️ 无论走哪条：**不要在用户盯着 7870 对话时重启网关或起 7860 桌面版**。18789 是互斥的。

---

## 8. 踩过的坑（09-15 + 09-19 新增，以及仍会咬人的旧坑）

### 8.1 新增坑（按轮次）

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

**09-19 这一轮又踩的（第一条最贵）**

- 🔴 **交接文档会把"哪棵树是现役"写死，然后过时**。本文 09-15 版把 `Easel/` 定为长期开发树、`Easel-official/`
  定为"不要当长期开发树"。09-19 全程按这个前提推：合上游、开 PR、写文档，**做的都是用户没在用的那一棵**。
  用户一句"前者才是我的现役版本"才掰回来。**接手动作**：先 `netstat` 看 7870/7860 谁在听，再直接问用户
  "你现在开的是哪套"，两个都确认前不要在任何一棵树上写代码。文档里的定位描述属于**易过期断言**。
- **"为了过测试而写的回归测试"会自洽地写错**。第一版 `test_install_tool_json_forces_utf8_even_in_plain_env`
  把 `_utf8_child_env()` 刚塞进去的 `PYTHONUTF8`/`PYTHONIOENCODING` 又 pop 掉了 —— 等于在测试里复刻修复前行为，
  然后期望它通过。**写完回归测试要问一句：这个测试在"没有修复"的代码上会红吗？** 不会红就是假测试。
- **上游新增测试可能只 `ast` 抽它自己那两个函数**：`tests/test_mp_login.py` 通过 `load_web_functions()`
  按名单从 `web/app.py` 抠函数，fork 多的 `_try_begin_login` / `_release_login_claim` 不在名单里 → `NameError`。
  解法是扩名单 + 在 `env` 里补锁状态（`_LOGIN_PENDING` / `_LOGIN_PENDING_LOCK`），**不是**改实现。
- **Bash 双引号里的反引号会被命令替换**：`\`91945f0\`` 直接变成 `command not found`，把文档改坏过。
  改中文 Markdown 一律用 Edit 工具，不要用 `python -c "…"` 或 `sed` 嵌反引号。
- **原版树没有 git 身份**：`git commit` 报 `Author identity unknown`。**不要写 git config**（用户红线），
  用 `git -c user.name=local-workbench -c user.email=local@workbench.local commit …` 单次传参。

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
| 两树合并方案 | `F:\科研大师兄\自媒体工作台\两树合并方案-2026-09-19.md`（当前主线决策材料） |
| 原版树交接指针 | `F:\科研大师兄\自媒体工作台\Easel-official\HANDOFF.md` |
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

端口（**09-19 22:40 实测**）：**7870 listen（pid 38932）、18789 listen（pid 46380）、7860 空、9344/8089 空**。
pid 会随重启变化，接手时以当场 `netstat` 为准（15:50 那次 7870 是 pid 65120）。

---

## 10. Suggested skills

新会话按需加载，不要一次全开：

- **`handoff`**（现已全局）：会话结束或阶段交接时更新本文件
- **`task-navigation`**：长任务收口、恢复主线
- **`neat-freak`**：复杂阶段结束后清临时物；**不要删** `_*.py` 和回滚材料
- **`manage-skills` / `agent-skill-sync`**：改 Skill 可见性时走现役管理器，不要手改镜像
- **`show-me`**：继续给用户画上手路径
- **`frontend-design`**：动 `web/frontend`
- **`find-repo` / `find-skills`**：按 AGENTS.md §1 做复用调研。**下一步开工前必须用一次**：
  §1.5「合并手段选型」表要现场联网核实 git 三方合并 / difftastic / Meld 等候选的 star、最近发版、License
- **`grilling`**：对 `两树合并方案-2026-09-19.md` 做对抗质询（尤其"以 `Easel` 为唯一树"这个反向结论）
- **`engineering-defaults`**：提交、测试、CI
- 本会话已用 **`handoff`** 完成本次交接（技能入口：`~\.agents\skills\handoff\SKILL.md`，磁盘已全局）

`win-python-verify` 已退役。不要为交接再造新 Skill。

---

## 11. 交接清单

**Do**

- **先确认用户现役是哪棵树**（问 + `netstat`），再动代码 —— 本轮最大的错就出在跳过这步
- 先读 AGENTS.md 和本文件，再动两棵树中的任何一棵
- 先看端口，避免和用户正在用的 7870/18789 打架
- 改完跑 `py_compile` + `pytest tests/`
- 选型写台账；零新付费依赖
- 复杂改动走 §2.4 三视角，结论落到文件+行+复现条件

**Don't**

- 🔴 **绝不为让测试通过而放宽 `local_write_guard` / CORS / TrustedHost**。测试不适配就改测试夹具（伪装本机客户端），守卫一律只紧不松
- 🔴 **永不修改 git config**。需要身份时用 `git -c user.name=… -c user.email=…` 单次传参
- 🔴 **未获用户明确同意不要 merge、推送、开对外 issue、删分支**。本会话的推送与 PR #1 合并均在明确同意后执行
- 不要在用户没说的时候停/抢 18789 或重启 7870
- 不要 `npm i -g openclaw`，不要跑官方 `setup.ps1`
- 不要用调研 Cloak profile / 9344 / 9345 登录
- 不要把 AppID 当成公众号已登录
- 不要提交 `_*.py`、`.env`、真实 cookie、`.runtime` 缓存
- 不要强推本地 `main` 覆盖 fork 的 `main`
- 不要把 AGPL 的 `gzh-design` 当对外默认排版
- 不要把「对话里报了技能名」写成「脚本已执行」
- 不要回显 API Key；token/key/cookie/授权文件/密码不进记忆、文档、命令与日志

**敏感信息**：本文无 Key / token / 密码。网关 scope 名（`operator.questions` 等）不是凭据。

---

## 12. 交接时额外做的（neat-freak）

**09-15 那轮**

- 对齐：handoff 的库路径、全局 junction、`skill-scope.json`、`local-scope-manifest.json`、capability index
- 清理：无。未删 `_*.py`，未停 7870/18789，未动用户 `outputs/`
- 保留：磁盘上未声明的 `codex-desktop-db-recovery`、`win-lnk-electron-diagnose`（§6.4）
- 阻塞：无管理器阻塞。用户要在**新 Cursor 对话**里才能稳定看到全局 `handoff` 条目

**09-19 这轮**

- 本文件已按本轮事实重写：§0、§1、§2.1、§3.3、§4.2、§5.9–5.10、§6.1–6.2、§7、§8.1、§9–§11、§13。
  未重写的 §5.1–5.8 仍以 09-15 快照为准，接手后要自己复核。
- 清理：**无**。未删 `_*.py`、未删回退分支 `backup/pre-upstream-merge`、未停 7870/18789、未动用户 `outputs/`。
- 有意保留的遗留物：`Easel` 的 `merge/upstream-v020`（本地+远端）、`Easel-official` 的 `.venv/` 与 `.runtime/`（未跟踪）。
- 未做（不是遗漏，是等授权）：上游 cp936 bug 的对外 issue、临时分支删除、真机四条链、§1.5 调研表。
- **阻塞**：切现役 / 重启 7870 / 归档隔壁 `Easel/` 仍要用户点头。4 个决策和复用调研表已完成。

---

## 13. 09-19 收尾与下一步真源

> 本节按「**事实 / 推断 / 未做**」三档分开写。用户会拿这份东西交给另一个 AI 对抗验收，
> 所以**未经核盘的话一律下沉到 13.2 / 13.3**，不要引用成结论。

### 13.1 A 档 · 已核盘事实（每条都有证据出处）

| 事实 | 证据（接手后可直接复核） |
|---|---|
| 上游 v0.2.0 已合进二次开发树并落地：`89a828a` = PR #1 merge commit，`main` = `origin/workbench` = **`0b22a04`** | `cd Easel ; git log --oneline -6` / `git branch -vv` |
| 落地前经 CI 双平台验证：Skill contracts、pytest ubuntu、pytest windows **三个 job 全 success** | `gh pr view 1 --repo xiaojinlucky/Easel`；run `35443628558` 结论 `success` |
| 首跑 windows 红过一次，根因是上游 `install_tool` 桥接的 **cp936 编码 bug**（真功能缺陷，不是测试写法），修复在 `cab8712` + 回归测试 | `git show cab8712 --stat`；`Easel/tests/test_web_security.py::test_install_tool_json_forces_utf8_even_in_plain_env`；机制见 §8.1 |
| 本地质量门全绿：`pytest tests/ -q` → 322 passed；`validate_skills.py` → OK 114；`validate_skill_commands.py` → OK 273；`tsc -b && vite build` 通过 | 见 13.4 命令 |
| `Easel` 工作区干净，只剩根目录 6 个 `_*.py` 未跟踪（刻意不提交） | `cd Easel ; git status --short` |
| **原版树已被用户确认为现役版本**，其 48 文件改动已入库并推到 fork：分支 `snapshot/official-active-0919` = `8648784`（`9f2690d` 收口 + `8648784` 记验证），remote `fork` → `xiaojinlucky/Easel` | `cd Easel-official ; git log --oneline -4 ; git branch -vv ; git remote -v ; git for-each-ref refs/remotes/fork` |
| 原版树工作区只剩 `.venv/`、`.runtime/` 未跟踪；**硬盘丢失导致工作消失的风险已解除** | `cd Easel-official ; git status --short` |
| 两树 git 跟踪面：806 相同 / **65 内容不同** / **345 只在 `Easel`**（=110 上游 + 235 第一方）/ **17 只在原版**；原版独有核心 4 块 ≈1,896 行 | `git ls-files -s` 跨仓库 blob 比对（脚本口径见方案文档 §1）；`easel/workflow.py` 311 行、`easel/skill_route.py` 461、`easel/model_runtime.py` 256、`easel/model_settings_api.py` 154、`WorkflowsPage.tsx` 714 |
| 「工作流 / 技能路由」这块能力**只存在于原版树**：`api/workflows` 与 `skill_route` 在 `Easel` 命中 0、在 `Easel-official` 命中 10 | 两树分别 `grep -rn "api/workflows\|skill_route" .` |
| 端口现状（09-19 22:40）：7870 在听（pid 38932）、18789 在听（pid 46380）、7860 空 | `netstat -ano \| grep LISTENING` |

> 🔁 **本会话自我修正的一条判断，此说已被削弱，勿沿用**：
> 09-15 版本文 §2.1 写的"原版树仅用于上手理解、**不要当长期开发树**"。
> 用户在 09-19 明确推翻（"前者才是我的现役版本"）。现在两棵树的定位**待定**，见 13.5。

### 13.2 B 档 · 推断与假设（未证实，别当结论）

- **推断**：以 `Easel` 为唯一基底、把原版独有 4 块搬过去，比反向搬省力 —— 依据是文件计数（反向要挪 345 个文件）。
  **没验证**：没实际搬过任何一块，也没测过搬过去后 workflow 功能在 `easel-studio` profile 下能否跑通。
- **推断**：12 处硬冲突（方案文档 §3）中 profile 名、`/api/model-settings` 双实现、`persona.chat_turn_message`
  位置参数语义这 3 处风险最高。依据是本轮读码比对，**未做**任何一处的合并演练。
- **假设**：`Easel-official` 的 48 文件改动"全部是用户自己长出来的新功能，不含误改"。
  本轮是**整体快照入库**，未逐文件审查每处 diff 的意图。
- **假设**：原版树快照 `8648784` 记录的"110 passed"能代表那棵树当前可用。注意**该树 `.venv` 里没装 pytest**，
  测试是借另一棵树的环境跑的，与该树真实启动路径不完全等价。

### 13.3 C 档 · 明确未做 / 未验证（这些不是"已解决"）

1. 🔴 **真机四条链一条都没跑**：小红书 Cloak 扫码出码、公众号真实送草稿、对话逐字流式不乱码、桌面壳托盘完全退出。
   原因：要起服务、会抢用户正在用的 18789。**"CI 全绿"不等于这四条通**。
2. ~~`AGENTS.md` §1.5 复用调研表未做~~ **已写入** `工具复用台账.md` A14（2026-09-19）。
3. ~~4 个决策用户未回答~~ **已拍板**：7870 / `easel` / official 模型设置 / 不弹窗。**隔离 worktree 的第一次合尚未验收。**
4. **上游 cp936 bug 未上报**：要不要给 `ZJU-REAL/Easel` 开 issue，用户未表态（对外动作）。
5. **临时分支未清理**：`merge/upstream-v020`（`862a36d`）本地 + `origin` 都还在。
6. **两套模型设置 UI 未去重**：`SettingsPanel`/`EnvBoard` vs `ModelSettingsPage`。
7. **`Easel-official` 的 48 文件未做逐文件意图审查**（见 13.2）。
8. 本会话**没有**在原版树上改过任何一行产品代码，也**没有**重启过用户的 7870/18789。

### 13.4 独立复核清单（复制即用；只读，不起服务、不碰 18789/7870）

> ⚠️ **期望值来自本会话自述，请核对而非相信。** 任何一条对不上，说明 13.1 相应事实已失效，先修本文再往下做。

```powershell
# ① 两棵树的 git 事实
cd 'F:\科研大师兄\自媒体工作台\Easel'
git log --oneline -6        # 期望首行 0b22a04；含 89a828a / cab8712
git branch -vv              # 期望 * main 0b22a04 [origin/workbench]；backup/pre-upstream-merge 5ab86a0
git status --short          # 期望只有 _*.py 六行，无已跟踪文件改动

cd 'F:\科研大师兄\自媒体工作台\Easel-official'
git log --oneline -4        # 期望 8648784 / 9f2690d / 23d0f7c
git remote -v               # 期望 fork -> git@github.com:xiaojinlucky/Easel.git
git status --short          # 期望只有 .runtime/ .venv/

# ② 质量门（全部只读）
cd 'F:\科研大师兄\自媒体工作台\Easel'
$env:PYTHONUTF8='1'
.\.venv\Scripts\python.exe -X utf8 -m pytest tests/ -q                     # 期望 322 passed
.\.venv\Scripts\python.exe -X utf8 scripts\validate_skills.py              # 期望 OK 114 skills
.\.venv\Scripts\python.exe -X utf8 scripts\validate_skill_commands.py      # 期望 OK 273 commands
cd web\frontend ; npm run build                                            # 期望 tsc + vite 通过

# ③ 编码修复的定向复核（证明它修的是真 bug）
cd 'F:\科研大师兄\自媒体工作台\Easel'
$env:PYTHONUTF8='1'
.\.venv\Scripts\python.exe -X utf8 -m pytest tests/test_web_security.py -q -k install_tool   # 期望通过
# 反证：去掉 env 里 UTF-8 后子进程输出应为 GBK 坏字节（本机可复现 rc0 / ~5KB 乱码 JSON）

# ④ 端口（别起服务，只看）
netstat -ano | Select-String ':7860|:7870|:18789' | Select-String LISTENING   # 期望 7870 + 18789 在听，7860 不在

# ⑤ 两树对账口径（想复算 806/65/345/17）
#    两棵树分别 git ls-files -s，按路径 join，比 blob sha 分组计数
```

CI 记录复核（需要 `gh` 已登录）：`gh pr view 1 --repo xiaojinlucky/Easel`、
`gh run list --repo xiaojinlucky/Easel --branch merge/upstream-v020 --limit 5`。

### 13.5 4 个决策（已拍板，不要再问）

用户原话：「一切都按照现在的 official 来吧。」

1. **端口/实例**：**7870**
2. **profile**：**`easel`**
3. **模型设置**：**official 这一版**
4. **扫码窗口**：**不弹**

合并方向：以 `Easel-official` 为唯一现役；冲突留 official；隔壁 `Easel/` 只作资产来源，最终归档而不是接班。原文见 `两树合并方案-2026-09-19.md` 第 0 / 5 节。

### 13.6 回退点

- 上游合并回退：`git reset --hard backup/pre-upstream-merge`（= `5ab86a0`，合并前干净基线）。
  **远端回退要强推 `workbench`，必须先问用户。**
- 原版树快照回退：`8648784` / `9f2690d` 已推 fork，可 `git reset --hard 23d0f7c` 回到 v0.1.1 而不丢工作。
- 临时分支 `merge/upstream-v020` 已完成使命，待用户点头后本地与远端一起删。

### 13.7 合并后新增的对外行为（用户可能没预期到，先说清楚再动）

- `EASEL_CHAT_TRANSPORT` 默认仍是 `cli`；设成 `http` 才走常驻网关直连（省 6-7s 冷启动），
  起没起由 `_gateway_http_ready` 判定，失败自动回退 CLI。
- 上游 `video-production` 技能带进来一整套 vendor SDK（MIT）和字体资产，仓库体积明显变大。
- 上游 `.gitignore` 只排除 vendor 里的 `node_modules/`、`.remotion/`、`models/`，不会误伤本机数据。
