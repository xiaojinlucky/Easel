# HANDOFF · Easel 自媒体工作台（本地改造版）

> 交接时间：**2026-09-14 23:11**
> 交接对象：**完全没有上下文的新会话**
> 项目根：`F:\科研大师兄\自媒体工作台\Easel`（Windows，中文路径；git 仓库）
> 规则真源：`F:\科研大师兄\自媒体工作台\AGENTS.md`（在**上一级**工作台根，Easel 自身无独立规则文件）
> 本文件取代 2026-09-13 版交接（旧版仍在 git 里：`git show 83d6bc4:HANDOFF.md`，其中已被本文件吸收的内容不再重复）

---

## 0. 60 秒速览

| 项目 | 状态 |
|---|---|
| 工作台现在能不能用 | **能**，但**当前是停机状态**——用户 22:44 主动退出桌面应用，服务被优雅停止（正常生命周期，不是崩溃） |
| 全量测试 | **217 passed**（4.48s，无失败） |
| 未提交的改动 | **42 项**（25 个已修改 + 17 个未跟踪）。自 `83d6bc4`（09-13）之后**所有工作都还没提交** |
| 今天（09-14）干了什么 | ① 建工作台级规则体系 ② 热点雷达接自托管数据源 ③ 平台框架落地（公众号并入）④ 平台总览页去重 ⑤ 账号持久化核查 ⑥ 四项收尾任务（公众号配置/备份脚本/Postiz 确认/写守卫修复）⑦ 三轮多 Agent 对抗性审查 |
| 唯一"未生效"项 | `local_write_guard` 修复**已进代码但未在实时服务上跑过**——整个栈已停，下次启动才加载 |
| 唯一"未闭环"项（历史遗留） | 问答卡端到端仍需**用户实机点一次**确认（沙箱禁止启动网关，见 §6.1） |
| 未修项 | P2 加固 5 项（原 6 项里的「无 Origin 可绕过写保护」本轮已修） |
| 上一轮总报告 | `.runtime/review/final-acceptance.md`（09-13 那轮，仍是了解项目的最佳入口） |

用户是自媒体从业者，**技术不敏感、只看结果**：沟通要白话、结论先行、别堆术语、给明确动作。

---

## 1. 项目是什么

`F:\科研大师兄\自媒体工作台` 是一个**工作台目录**，里面有多个自子项目，**Easel 是主体**：

| 子项目 | 说明 |
|---|---|
| **`Easel/`** | 自媒体工作台主体。上游 `ZJU-REAL/Easel`（**Apache-2.0**，1078★，上游当天仍有提交），本地做了深度改造。**本文件主要讲它** |
| `publisher-assistant/` | 发布助手（另有自己的 `HANDOFF.md`） |
| `workbuddy-studio/` | 含 whisper 部署脚本等 |
| `xhs_content_workbench/` | 小红书内容工作台（v0） |
| `inspiration_collector_v0/` | 灵感采集 |
| `beav-appdata/` `beav-workspace/` | BEAV 应用数据与工作区 |
| `RedBox/` | 仅一个 json |

**Easel 本地的改造方向（5 处）**：本地运行时底座（环境隔离）、chat 链路重写、公众号发布链路、服务守护与日志轮转、Postiz 自托管容器编排。逐项分类见 `.runtime/review/diff-report.md`（257 文件 / **+41680 −353**，纯叠加、零删除）。

**桌面版形态**（避免误判"打开了旧版本"）：
- Electron 外壳 `desktop/main.cjs` 只提供 54px 顶栏，四个视图全部指向本机 URL（`desktop/policy.cjs` 的 `SERVICES`）：工作台 → `127.0.0.1:7860`（Easel React，由 `web/app.py` 的 `REACT_DIR=web/frontend/dist` 提供）、发布日历 → `localhost:4007`（Postiz）、订阅阅读 → `localhost:8089`（FreshRSS）、队列 → `localhost:8088`。
- **改前端只需重建 `web/frontend/dist` 再重启，不必重新打包 exe**；只有改 `desktop/` 下的 `.cjs|html|css` 才需 `node desktop/package.cjs`。
- 桌面快捷方式：`D:\Desktop\Easel 自媒体工作台.lnk` → `Easel\.runtime\desktop-app\Easel-win32-x64\Easel.exe`，WorkingDir = 项目根；全机仅此一份，无第二副本。
- 用户数据在 `G:\EaselData`（经 junction 挂载）；`.runtime/` 已被 `.gitignore`。

---

## 2. 项目规则与用户约定（**新会话必读，用户在这项目上坚持的**）

### 2.1 工作台级规则（唯一真源：`F:\科研大师兄\自媒体工作台\AGENTS.md`，09-14 建立）

| 章节 | 内容 | 硬性程度 |
|---|---|---|
| §0 | 效力范围与优先级 | — |
| **§1** | **禁止重复造轮子** | **硬性，不可豁免** |
| **§2** | **四项思维准则** | **硬性，贯穿全部工作** |
| §3 | 适用场景（触发条件） | — |
| §4 | 本领域候选索引 | — |
| §5 | 反模式清单（禁止行为） | — |
| §6 | 验收标准 | — |
| §7 | 台账维护 | 每次选型追加一行 |

**§1「禁止重复造轮子」要点**：
- **三级瀑布（逐级下降，须写否决理由）**：**P0 = 成熟方案层**，含两类同级并列方案——**P0-① 商业化闭源工具（只借鉴设计，不取代码）** 与 **P0-② 成熟活跃的开源工具（可直接依赖）**；**P1 = 小而高质量开源**；**P2 = 从零自研**。
- **复用深度由浅到深**：直接依赖 > 包装/Fork > 借鉴设计 > 只学原理。**取最浅的可行深度**。
- **每次决策必须输出「复用调研」清单**：≥3 候选、跨类别、含**许可证**与**活跃度实测值**（须现场核实，**禁止凭记忆**）。**没有清单不得进入实现**。
- **三处强制关口**：设计关口（无清单不开工）／交付关口（写明来源与许可）／复盘关口（自研要回填台账）。
- **台账**：`F:\科研大师兄\自媒体工作台\工具复用台账.md`。A 区候选总表 / B 区红旗 / C 区决策记录 / D 区零成本核对。

**§1.7 零成本红线（用户明确要求，硬性）**：只采用**完全免费、无需付费**的方案。禁止付费/订阅/按量计费/需绑卡的服务；同一产品「自托管免费 + 云版收费」时**只用自托管**。取用顺序：**自托管开源 > 免费公益接口（无 key）> 本机计算**。只能靠付费满足时**先停下问用户**。

**§2「四项思维准则」**：
1. **第一性原理**（解决问题/修 BUG/设计架构）：先写「问题本质 + 证据」再写方案；结论必须来自**实测复现**，禁止把推测当结论。
2. **奥卡姆剃刀**（开发功能）：只做当前需求最小集，**落地优先、完成大于完美**；两条路等价时选改动更少的；「要不要顺手一起改」**默认不改**。
3. **墨菲定律**（功能验收/测试）：七类必查——空与缺 / 边界 / 重复并发 / 中断 / 旧状态 / 回退 / **真实路径**。禁止只测正常路径，禁止把「编译通过」当「功能可用」。
4. **多 Agent 对抗性审查**（相对复杂任务完成后）：触发 = ≥3 文件 / 跨前后端 / 涉数据模型或导航结构 / >200 行。**另起独立 Agent**，三视角（**破坏者 / 验收者 / 回归守门人**），**实现者不得自评通过**；结论须落到**文件 + 行 + 可复现条件**。

### 2.2 用户在本项目长期坚持的约定（延续 09-13 版）

1. 交付必须区分「已知事实 / 合理推断 / 未验证假设」，无来源就写「暂无可靠数据」。
2. **诚实披露连带损害与未验证项**，不用静态通过冒充运行通过。
3. 改动后必须验证：`py_compile` → `import` → 冒烟（TestClient / 真实 API）。
4. 审查/报告按 **P0/P1/P2 分级**，每项附证据（文件行号、命令、原始输出）。
5. **归档优于删除**；删除前查引用；正式回滚材料不删。
6. 工作区保持整洁（neat）：无临时文件、无临时进程、无死代码。
7. 中文交流，白话优先，结论先行，给明确下一步；数据用表格。
8. 复杂任务倾向**多个子代理并行** + 主会话独立交叉核查兜底。
9. **不擅自改动用户的正式产物**；涉及用户资源的操作先确认。
10. **（09-14 新增）不得主动创建/沉淀 Skill**——用户明确表示 skill 越多越加重以后运行负担，只想要「必要时够用」。日常踩坑写进记忆文件即可。

---

## 3. 已完成内容

### 3.1 任务目标（用户在本系列的总体诉求）

**目标**：把从 GitHub 下载的开源自媒体工作台 Easel 改造成**可日常稳定使用**的本地版本，并持续加固。
上游作者维护力度有限，因此本地改造必须**自己承担质量责任**：每轮都要做「同步检查 → 差异对比 → 对抗性审查 → 修复 → 验证 → 交接」。

### 3.2 第一轮（09-13，已提交）

| 任务 | 结论 | 详情位置 |
|---|---|---|
| ① 同步上游 | 上游**零新提交**，无需合并 | — |
| ② 差异对比 | 257 文件 / **+41680 −353**，纯叠加无删除；高风险 6 项、最关键差异 5 处 | `.runtime/review/diff-report.md` |
| ③ 对抗审核（代码层） | 发现 **P0×2、P1×6、P2×5** | `.runtime/review/audit1.md` |
| ③ 对抗审核（运行时） | 语法/导入/前端构建/服务启停/核心 API/日志轮转**全通过**；唯一堵点=问答卡授权 | `.runtime/review/runtime-test.md` |

**已修复 9 个问题（11 处改动，提交 `fcc7ca3` + `04250ff`）—— 不要重复修**：

| 级别 | 问题（白话） | 文件 |
|---|---|---|
| P0 | 问答接口死等网关，一抖动冻结整个工作台（单请求 12s） | `web/app.py` |
| P0 | 对话事件流无终态兜底，后台一挂前端一直"生成中" | `web/app.py` |
| P1 | 日志轮转遇文件占用即崩溃（`WinError 32`） | `easel/services.py` |
| P1 | 跨进程锁超时不释放文件句柄 | `web/app.py` |
| P1 | 中止会话失败会**误杀整个网关** | `web/app.py` |
| P1 | 平台服务启动无容错（WSL/docker 未就绪直接抛异常） | `easel/platform_services.py` |
| P1 | 账号分析在 Web 重启后被误判"失败" | `easel/account_profile.py` |
| P1 | 启动等待窗口 25s 撞上 gateway 冷启动 26.5s → 误报失败 + 留孤儿进程 | `easel/services.py` |
| P1 | 问答卡请求的授权范围与设备已批准范围不匹配 | `easel/gateway_questions.py` + 网关 DB |

**清理**（提交 `7e408e3`）：删 `desktop/main.cjs.bak-20260912`、打包目录 5 个冗余 `.bak`、10 个 `__pycache__`、全部临时脚本。

**数据库授权调整（关键、易忘）**：`C:\Users\Administrator\.openclaw-easel-studio\state\openclaw.sqlite` 里 `device_pairing_paired.approved_scopes_json` 与 `device_auth_tokens.scopes_json` **双向一致化**为 `["operator.questions","operator.read","operator.write"]`，与代码请求对齐。性质是本机自托管网关的正当做法（非绕过安全），**需重启工作台才生效**。核验证据 `.runtime/review/scope-verify-final.txt`。

### 3.3 第二轮（09-14，**全部未提交**）

#### (a) 建立工作台级规则体系
新建 `AGENTS.md`（唯一真源）+ `CLAUDE.md`（入口指针）+ `工具复用台账.md`（台账）。含「禁止重复造轮子」三级瀑布、复用深度分级、决策清单硬要求、**零成本红线**、**四项思维准则**、三处强制关口。

#### (b) 热点雷达接自托管数据源（P0-② 直接依赖）
- 改：`web/app.py`（新增 `EASEL_DAILYHOT_BASE`、20 平台映射、`/api/trends/sources`、**本机地址绕代理**）、`TrendsPage.tsx`、`lib/api.ts`、`.env.example`、`skills/shared/hotlist-apis.md`；新增 `deploy/dailyhot/`（compose + UPSTREAM.json + README）。
- **未配置时行为零变化**（原 6 平台公益接口保留为兜底）；配置后 6 → 20 平台。
- 顺带修掉一个隐患：本机有全局代理，原取数逻辑会把 `127.0.0.1` 也塞进隧道 → 本机源必然 502；现已对 localhost 绕代理。

#### (c) 「社交媒体平台」框架落地（公众号并入平台总览）
- **新增** `web/platform_registry.py`：`PLATFORM_CAPS`（`authKind` / `publishMode` / `contentKind` / `analyticsSource` / `workspace` / `panels`）+ `DEFAULT_CAPS` 兜底 + `_wechat_status()`（复用 `easel.wechat.dashboard()`）+ `platform_list()`（复用 `LOGIN_RUNNERS` / `_account_logged_in`，**不新建状态体系**）→ 暴露 **`GET /api/platforms`**（8 条平级通道）。
- **改动**：`web/app.py`（挂 router；另有 1 行把 `_account_logged_in` 的 `cfg['backend']` 改 `cfg.get('backend','')` 消除 500 路径）、`lib/api.ts`、`AccountsPage.tsx`（重写为平级卡片，数据源换 `fetchPlatforms`）、`Sidebar.tsx`（删「公众号工作区」顶层项、「账号」→「社交媒体平台」）、`SubNav.tsx`（泛化 `backTo`/`backLabel`/`tabs`，默认值保持原行为）、`App.tsx`、`styles/index.css`。
- **8 条通道** = 6 个扫码平台（小红书/快手/视频号/知乎/B站/抖音，`authKind='qrcode'`）+ 微信公众号（`credential`）+ Postiz 中转（`service`）。**加一个平台 = 加一行 `LOGIN_RUNNERS` + 一行 `PLATFORM_CAPS`**，前端按键渲染、不写平台分支。
- 新增 `web/auth_guide_api.py`、`web/frontend/src/components/AuthGuide.tsx`（未跟踪）。

#### (d) 平台总览页「上下重复枚举」消除（用户带截图反馈）
- 问题定性：不是样式问题，是**同一份信息被两个组件各表达一次**（`AuthGuide` 答"怎么开始"、卡片网格答"怎么管"，当"怎么开始"要逐平台列举时必然撞车）。
- 外部范式调研（**读源码 + 读官方文档实测 4 个实现**：Mixpost / Postiz 源码，Buffer / Hootsuite 文档）→ 收敛 6 条范式，写入台账 **A9 区**与 C 区。
- 落地：账号页删 `<AuthGuide>`，改为「汇总一行 + 筛选芯片（全部/待处理/已接入）+ 按 `authKind` 分三组卡片 + 说明贴分组标题」；**Postiz 作为「中转服务」通道纳入注册表**（补上原 `AuthGuide` 独有状态，避免信息丢失）。
- **信息架构分工（既定，勿再重复枚举）**：`DashboardPage` = 上手引导（`AuthGuide`，回答"怎么开始"）；「社交媒体平台」页 = 管理台（回答"现在什么状态、怎么管"）。**同一批平台不得在同一页出现两次。**

#### (e) 账号配置持久化核查（回答用户「弄一次能否持久生效」）
**结论：全部落盘，重启/关机/重开快捷方式/重建前端产物都不丢。** 落盘地图：

| 配置项 | 落盘位置 | 在项目目录内？ |
|---|---|---|
| 扫码平台登录态（小红书/快手/视频号/知乎/抖音） | `C:\Users\Administrator\.easel-browser-profiles\<平台>Profile\` | ❌ **用户主目录** |
| 登录状态标记 | `Easel\outputs\_login\<platform>.json`（`state=="success"` 才算已登录） | ✅ |
| B站 | `Easel\cookies.json` | ✅ |
| 公众号 AppID/AppSecret | `Easel\skills\openclaw\skill-wechat-publisher\wechat-publisher.yaml` | ✅ |
| Postiz | `.runtime\postiz-account.json` + `.runtime\postiz.env` | ✅ |
| AI 模型设置 | `.runtime\model-settings.json` | ✅ |
| Postiz 频道授权 | Docker 命名卷（`postgres-volume`/`postiz-config`/`postiz-uploads`） | ❌ Docker 卷 |

**5 个失效边界**：① 平台 cookie 过期/被风控踢下线（最常见）；② 点「退出登录」= `POST /api/logout/{platform}` 会 `rmtree` 整个 profile + 删标记，**不可撤销**；③ 删/重装 Easel 项目目录 → 项目内的 `.runtime`/`outputs`/`cookies.json`/公众号 yaml 全丢，**只有扫码登录态能幸存**；④ `docker compose down -v` / 重置 Docker → Postiz 频道授权丢；⑤ 换 Windows 用户/换机器。

**实测当时的真实状态（09-14 22:20）：用户一个平台都没真正登上。** 5 个 profile 目录存在但**无一含有效登录 cookie**；`outputs\_login\` **无任何 `status.json`**；`cookies.json` 不存在；`wechat-publisher.yaml` 当时不存在。**小红书有明确失败证据**：`outputs\_login\xiaohongshu.log` 写「判定当前网络为风险 IP（安全限制 300012）——二维码在此环境无法弹出」→ **属出口 IP 被风控，非配置问题**。扫码平台需干净/家宽 IP，或在正常网络登录后把 `<平台>Profile` 整个目录拷过来复用。

#### (f) 本轮四项收尾任务（用户指令：`1 2 3 4 轮流去做`）

| # | 任务 | 结果 |
|---|---|---|
| **1** | 生成公众号凭据配置 `wechat-publisher.yaml` | ✅ 由 `.example` 生成，AppID/AppSecret **留空待用户填**。实测 `dashboard()` 返回 `configured: false`。已在 `.gitignore` |
| **2** | 账号备份/恢复脚本 | ✅ 新增 `scripts/backup_accounts.py`（纯标准库，`status/backup/list/verify/restore`）。浏览器 profile 原始 **163.5 MB → 归档 870 KB**；往返 restore + 逐文件 SHA-256 一致 |
| **3** | 启动 Postiz | ✅ **无需动作——实测本就在运行**。22:37 四个端口全部 HTTP 200。上一轮「Docker 守护进程没跑」是**测量假象** |
| **4** | 修复 `local_write_guard` 403 | ✅ 已修（详见 §3.4） |

**任务 1 三项注意**（已写进 `docs/WECHAT.md`）：两项都填才生效；须在公众号后台加 IP 白名单（否则报 40164）；改凭据后要清 `.token_cache*.json`（2h 的 access_token 缓存）。**另**：`save_account` 用 `yaml.safe_dump` 会**丢掉 YAML 注释**（未引 `ruamel.yaml`，因零新依赖），建议手改文件而非走 UI 保存。

**任务 2 刻意不备份的三类**（理由已写进 docstring 与 `docs/BACKUP_RESTORE.md`）：`~/.openclaw-easel-studio/`（约 1.04 GB 可重建缓存）、`.token_cache*.json`（短期令牌）、Docker 命名卷（Postiz 自管）。安全设计：ZIP + 内嵌 `MANIFEST.json` + 逐文件 SHA-256 + CRC；恢复前自动快照；`verify` 明示「这是完整性校验**不是来源签名**」。

### 3.4 任务 4 详情：`local_write_guard` 修复（**新会话最需要理解的一处改动**）

**问题（第一轮回归守门人报告）**：工作树里一处他人未提交的改动把守卫改成「**无 Origin 一律 403**」，导致 **curl / 脚本 / TestClient 等非浏览器写请求被误杀**（原行为是放行）。

**第一性原理定性**：守卫真正要防的是「**浏览器**里被第三方页面跨域发起的写请求」——CSRF 需要**浏览器 + 携带凭据 + 跨站**三个条件同时成立。所以判据应是 **Origin 白名单 ∪ 回环 peer**，而**不是**「必须带 Origin」（那会把正常自动化全杀掉）。

**改法**（`web/app.py`）：
- 新增 `import ipaddress` 与 `_loopback_peer(request)`：读 `request.client.host` → `ipaddress.ip_address(host).is_loopback`，None / 非法 → False。
- 中间件判据改为：`allowed = origin in _LOCAL_ORIGINS if origin else _loopback_peer(request)`。

**不可被 `X-Forwarded-For` 绕过**（已核实）：`easel/services.py` 的 uvicorn 启动参数**无 `--proxy-headers`**、未设 `FORWARDED_ALLOW_IPS`；Caddy 只监听回环 → 外部无法伪造 peer。

**测试注意（重要坑）**：`TestClient` 默认 peer 是**字面量 `'testclient'`，不是 IP** → 测回环分支必须显式传 `client=('127.0.0.1', <port>)`。相关测试：`tests/test_local_write_guard.py`（12 例）、`test_p2_hardening.py`、`test_local_workbench.py`。

### 3.5 三轮多 Agent 对抗性审查（§2.4 实战）

| 轮次 | 主题 | 抓到真缺陷 | 状态 |
|---|---|---|---|
| 第 1 轮 | 社交媒体平台框架 | 6 条 | ✅ 全修 |
| 第 2 轮 | 平台总览页去重 | 9 条（+2 个真 BUG） | ✅ 全修 |
| 第 3 轮 | 本轮四项任务 | P0/P1 = 0，**5 条 P2** | ✅ 全修 |

**第 3 轮 5 条 P2（全部当轮修复）**：

| # | 缺陷 | 修复 |
|---|---|---|
| 1 | `outputs/_login` 备份路径分类错误 | 归位到正确的 `TREES`/`FILES` |
| 2 | `FILES` 里的**符号链接会被跟随**（`TREES` 却不跟随）→ 可能读出可控路径之外的文件 | `_collect()` 对 `FILES` 的 symlink **跳过并记入 missing 说明** |
| 3 | 归档临时文件名固定 `.part` → **并发两个 backup 会互相覆盖** | 改 `{name}.{pid}.part`；失败路径 `except BaseException` 清理；加 `_sweep_stale_parts()`（>1h 的 `.part` 清掉） |
| 4 | **畸形 `MANIFEST.json`**（非 zip / 非法 JSON / 缺字段）抛未捕获栈回溯 | `_read_manifest()` 包装 `BadZipFile/JSONDecodeError/KeyError/ValueError` → 可读 `SystemExit`；`cmd_verify()` 逐条校验条目形状 |
| 5 | 台账缺 `backup_accounts.py` 登记行（违反 §1.8 交付关口） | 已在 C 区追加（含复用调研 + 刻意不含项 + 安全设计） |

**第 2 轮的两个真 BUG（不在改动面，被审查暴露）**：
- `/api/auth-guide` 探 Postiz **超时 1.2s < 冷启动实测 2.1s** → 「服务活着但刚冷启动」被判成「服务尚未就绪」。已改复用唯一实现 + 超时放宽到 5s。**教训：探测超时必须大于被探测服务的冷启动实测值。**
- `localhost:4007` 在 Windows 上**先试 `::1`**，服务只监听 IPv4 时连接阶段耗 **4.1s**（与全局代理无关）。改为 **TCP 预检（0.35s）+ 探测地址钉到 `127.0.0.1`** → 账号页首屏 **4138ms → 357ms**。

**第 1/2 轮的典型缺陷类型（有参考价值）**：`**caps` 展开顺序静默覆盖保留键；探测函数只捕 `OSError` 而非法主机名抛 `UnicodeError`（idna 层）→ 接口 500；`from easel import wechat` 放在 `try` 之外与文档承诺不符；能力表 fallback 层是**死代码**；冷缓存**无锁**导致 8 线程探测 8 次；**前端产物落后于源码**（构建早于最后一处编辑 77 秒）。**关键经验：多数缺陷只在「异常分支 + 并发 + 边界」出现，正常路径测试一律测不到。**

### 3.6 本轮验证证据（实际跑过的）

- **全量测试套件：217 passed**（4.48s）。
- **实时端到端探针**（临时 uvicorn 7871，用完即停）：跨域 Origin → **403**；无 Origin + 回环 peer → **422**（过守卫、卡 body 校验，证明放行）；本机 dev Origin → **422**；`GET /api/platforms` → **200**。
- **副产品证据**：uvicorn 日志里 peer 显示 `127.0.0.1:57120` → **证实生产环境 `request.client` 确实被填充为回环地址**，闭合了「prod 下 `request.client` 是否为 None」的疑问。
- **变异测试**：把守卫改回旧行为 → 3 个测试立刻失败 → 恢复后全绿（证明测试真的在守护该行为）。
- 前端（第 2 轮）：`tsc -b --force` 0 错误；vite 52 模块；产物含新标记且**产物 mtime ≥ 最新源码 mtime**。

---

## 4. 当前问题

### 4.1 未生效 / 未闭环（**接手第一优先**）

| # | 级别 | 问题 | 状态 |
|---|---|---|---|
| 1 | — | **整个服务栈当前是停止的**（用户 22:44 退出桌面应用，`Detached service-stop` 优雅停 web/gateway/platforms + Postiz compose）。⚠️ **不要擅自拉起半套服务** | 等用户下次启动 |
| 2 | — | `local_write_guard` 修复**已进代码但未在实时服务跑过** | 下次启动自动生效 |
| 3 | P1 | 问答卡端到端**未验证**：授权已在 DB 改好，但沙箱禁止启动网关（其启动会调 `reg.exe`），无法完成真实 WS 连接测试 | **待用户实机验证** |

### 4.2 未修的 P2 加固项（不影响使用）

> 注：原列表 6 项里的「独立运行 `python -m web.app` 监听 `0.0.0.0` + 无 Origin 可绕过写保护」**已在本轮修复**。

| # | 问题 | 备注 |
|---|---|---|
| 1 | `_session_locks` 每会话一把锁、**永不释放** | `web/app.py` |
| 2 | 模型输出行在内存**无界累积**（`stdout_lines`） | — |
| 3 | 进程归属靠**命令行字符串匹配**（中文路径 + 相似目录名可能误判） | — |
| 4 | 公众号大图文任务超时上限 120/180s **可能不足** | — |
| 5 | `/api/auth-guide` 与 `/api/platforms` 对「平台是否接入」**各答一遍**（双真源） | `auth-guide` 有 Dashboard 消费方，**收敛另行排期**，不动以避免回归 |

### 4.3 已知残留（**刻意保留**，勿当 bug 修）

- `lib/whoami.ts` 的 `getWhoamiCache()` 对 `localStorage` 被污染成 `null`/`[]`/`5` 的值不做类型校验 → 可能触发整站 ErrorBoundary。**既有代码、不在改动面**，需外部污染才触发，按 §2.2「顺手一起改默认不改」**仅上报**。
- 二维码轮询回调 `setQr` 无 `aliveRef` 守卫（既有代码；React 18 静默忽略已卸载组件 setState，无实际后果）。
- Postiz **端口开着但服务不答**时首次探测最多等 5s（之后 30s 走缓存）——**刻意保留**：超时必须 > 冷启动 2.1s，压低会退回上面那个误报 BUG。

### 4.4 工作区待清理项（**未删，仅登记**）

项目根有 **9 个临时/调试脚本未跟踪**：`_build_fe.py`、`_cleanup.py`、`_find_node.py`、`_finish_probe.py`、`_qna_debug.py`、`_qna_e2e.py`、`_restart_web.py`、`_run_verify.py`、`_shot_guide.py`。
按「归档优于删除」+「不擅自改动用户产物」，**本会话未删**——它们可能是前几轮缺陷复现的**证据**。若用户要求 neat 清理，删前先查全项目引用。
`.runtime/_*.json` / `_*.png` / `_*.txt` 也有大量同类中间产物（`.runtime/` 已 gitignore，不影响仓库）。

### 4.5 范围外

未做全项目死代码审计。轻量扫描结论（09-13）：`easel/`、`web/` 无孤儿模块，无 `breakpoint()`/`pdb` 调试残留。

---

## 5. 下一步计划

### 第一优先：等用户实机验证（不要自己抢着做）

**路线 A —— 实机验证问答卡与写守卫（最高价值）**

> 我在用 Easel 自媒体工作台（`F:\科研大师兄\自媒体工作台\Easel`）。请先读 `Easel\HANDOFF.md` 了解上下文。现在帮我做两件事：(1) 用 `python -m easel.services start` 启动工作台（web + gateway），确认启动成功、`http://127.0.0.1:7860` 可访问；(2) 验证 `local_write_guard` 修复在实时服务上生效：对 `http://127.0.0.1:7860/api/clipper` 发一个**不带 Origin 头**的 POST，预期**不是 403**（应为 401/422 等业务响应）。然后把结果报告给我。

**路线 B —— 按需修 P2 加固项**

> 我在用 Easel 自媒体工作台。请先读 `Easel\HANDOFF.md` 的 §4.2。按优先级修 P2 加固项，建议顺序：`_session_locks` 永不释放 > `stdout_lines` 无界累积 > 进程归属字符串匹配。每项按 `AGENTS.md §2` 先写「问题本质 + 证据」再改，改完跑 `tests/` 全量测试，并用对抗性审查（三个独立视角）复核。

**路线 C —— 下次同步上游**

> 我在用 Easel 自媒体工作台。请先读 `Easel\HANDOFF.md`。现在做一次上游同步检查：`git fetch origin` → 若 `git rev-list --count HEAD..origin/main` > 0，先把本地 42 项未提交改动**分类提交**（本地改造已按主题分组，便于重放），再评估合并策略。注意：本沙箱 `head`/`tail` 等管道工具不可用，判定提交关系用 `git merge-base --is-ancestor`。

### 建议的接手动作顺序

1. **先读 `.runtime/review/final-acceptance.md`**，再按需读 `.runtime/review/` 下三份专题报告。
2. 读 `F:\科研大师兄\自媒体工作台\AGENTS.md`（规则真源，**必读**）。
3. 读 `.workbuddy/memory/2026-09-14.md` 与 `.workbuddy/memory/MEMORY.md`（当日工作日志与项目长期约定）。
4. 确认 gateway / web 是否正在运行（**避免与用户正在用的实例冲突**）。
5. 考虑把 42 项未提交改动**分类提交**（当前所有 09-14 的工作都还是工作树状态，风险点）。

---

## 6. 踩过的坑

### 6.1 沙箱环境坑（会让新会话白费大量时间）

| 现象 | 应对 |
|---|---|
| **Bash 工具 PATH 极受限**：`ls`/`head`/`tail`/`cut`/`dirname`/`wc` 全报 not found，但 `git` 可用 | 改用**托管 Python**：`C:\Users\Administrator\.workbuddy\binaries\python\versions\3.13.12\python.exe`，或用项目 venv `.venv\Scripts\python.exe`；文件操作优先用 Read/Grep/Glob 专用工具 |
| PowerShell 返回 `exit 0` 却**没有 stdout**（ConPTY 吞输出）；`cmd /c ... > file` 也被拦 | **可靠姿势**：逻辑写成 Python 脚本 → 用 venv python 执行 → 结果写入文件 → 用 Read 工具读 |
| 同一条命令**偶发执行两次** | 删除/写入类脚本**必须幂等**（`absent` 视为正常） |
| 脚本自删常失败 | 末尾用 `python -c "import os; [os.remove(p) for p in [...]]"` 以**相对路径**补刀 |
| `F:\`、`D:\` 根目录写入被拒（UAC 过滤令牌） | 只写项目目录内；`D:` 下需用户手动加 `Authenticated Users: 修改` 权限 |
| **沙箱黑名单拦截 `wsl.exe` 与 `reg.exe`** | `wsl.exe` → 改用**端口探测 + HTTP 探针**间接判断 Docker/WSL 状态；`reg.exe` → openclaw/gateway 无法在沙箱启动，端到端测试只能交给用户实机 |
| 中文路径不要直接拼进 shell 命令行 | 交给 Python 脚本内的原始字符串 |
| `npm` 会拉起被拉黑的 `wsl.exe`（PROGRAM BLOCKED） | 前端构建改用 `node node_modules/typescript/bin/tsc -b` + `node node_modules/vite/bin/vite.js build`；托管 Node 在 `C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3` |
| 直连 `git clone` GitHub 可能被拒（Empty reply from server） | 改用 GitHub API（`api.github.com/repos/{o}/{r}/git/trees/main?recursive=1`）或 raw 下载；对 `ZJU-REAL/Easel` 的 `git fetch`/`ls-remote` 正常 |

### 6.2 项目专属坑（血泪，都是真实踩过的）

- **问答卡 scope**：请求 `operator.admin` 会被拒；`question.*` 方法真正需要的是 `operator.questions`。别盲目升级到 admin。
- **FastAPI 新版陷阱**：`include_router` 进来的子路由被包成 `_IncludedRouter`，用 `app.routes` 只取顶层会**误判"路由缺失"**。用 `TestClient` + OpenAPI 路径表验证才可靠。
- **`TestClient` 默认 peer 是字面量 `'testclient'`（不是 IP）** → 测回环分支必须显式传 `client=('127.0.0.1', <port>)`。
- **`TestClient` 必须传 `base_url="http://127.0.0.1:7860"`**，否则被 TrustedHost 中间件拦成 400 `Invalid host header`（不是代码问题）。
- **gateway 冷启动 26.5s**（13 个插件）——任何「等 25s 判失败」的逻辑都会误报。
- **`localhost` 在 Windows 上先试 `::1`**：服务只监听 IPv4 时连接阶段耗 ~4.1s（与全局代理无关）。探测地址**归一为 `127.0.0.1`** + **先做 TCP 预检**（`socket.create_connection`，超时 0.35s）。
- **探测超时必须大于目标服务冷启动实测值**：Postiz 冷请求 ~2.1s，原超时 1.2s → 误判"服务未就绪"。
- **HTTP 探测要先 `session.trust_env=False`** 绕开全局代理（`easel.postiz.client()` 已如此）；TCP 预检的 `except` 要**捕所有异常**——非法主机名抛的是 `UnicodeError`（idna 层），只捕 `OSError` 会让接口 500。
- **本机存在全局代理** `http_proxy=http://127.0.0.1:52183`（urllib 会自动套用）：访问 `127.0.0.1` 的本地服务**必须显式绕过**，否则报 `Tunnel connection failed: 502`。部分海外站点经该隧道也 502。
- **Windows 日志轮转**：目标文件被占用时 `rename` 抛 `WinError 32`，必须容错。
- **Windows 瞬时文件锁**：刚被替换的文件立刻读会 `PermissionError`，1.5s 后正常 → 需要重试（`_open_with_retry` / `_replace_with_retry`，3 次 / 0.25s）。
- **超时/异常收尾不要杀共享进程**：曾把用户点"停止"放大成整个网关被杀。
- 后台任务必须写**终态事件**，否则前端会悬挂到 130 分钟才报错。
- **前端产物验证两坑**：① `dist/index.html` 里资源是**相对路径 `./assets/...`**（vite `base: './'`），按 `/assets/` 绝对路径 grep 会得到**假阴性**；② 必须核对**产物 mtime ≥ 最新源码 mtime**。

### 6.3 方法论教训

- **不要用静态检查冒充运行验证**；沙箱拿不到的部分要**明写"需实机验证"**。
- 探测脚本的结论**要先自证**（`_IncludedRouter` 误判就是教训）。
- **删除任何文件前先查全项目引用。**
- **一个"服务挂了"的结论可能在几十分钟后就不成立**：本轮两次把「Docker 守护进程没跑（npipe 失败）」当成 Postiz 挂了，实际 Postiz 跑在 WSL 内、端口一直 200；而 22:44 之后又因为**用户退出应用**真的全停了。**观察值必须带时间戳 + 交叉验证（端口 + HTTP + 日志），单点现象不足以定性。**
- **同一份信息不要由两个组件各表达一次**（平台总览页重复的根因）——这已被写进项目约定（§3.3(d)）。

---

## 7. 关键路径与命令速查

| 用途 | 路径/命令 |
|---|---|
| 项目根 | `F:\科研大师兄\自媒体工作台\Easel` |
| **规则真源** | `F:\科研大师兄\自媒体工作台\AGENTS.md` |
| 工具复用台账 | `F:\科研大师兄\自媒体工作台\工具复用台账.md` |
| 当日工作日志 | `F:\科研大师兄\自媒体工作台\.workbuddy\memory\2026-09-14.md` |
| 项目长期约定 | `F:\科研大师兄\自媒体工作台\.workbuddy\memory\MEMORY.md` |
| Python | `.venv\Scripts\python.exe`（**3.12.12**） |
| 服务管理 | `python -m easel.services start\|stop\|restart\|status [web gateway ...]` |
| 全量测试 | `.venv\Scripts\python.exe -X utf8 -m pytest tests/ -q`（当前 **217 passed**） |
| 日志 | `.runtime\logs\web.log`、`gateway.log`、`platforms.log`、`desktop.log`、`platform-proxy.log` |
| 网关健康 | `http://127.0.0.1:18789/healthz`；web：`http://127.0.0.1:7860` |
| 网关数据库 | `C:\Users\Administrator\.openclaw-easel-studio\state\openclaw.sqlite` |
| 账号备份脚本 | `.venv\Scripts\python.exe scripts\backup_accounts.py status\|backup\|list\|verify\|restore` |
| 前端构建 | `node node_modules/typescript/bin/tsc -b --force` + `node node_modules/vite/bin/vite.js build`（cwd = `web/frontend`） |
| 托管 Node | `C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node.exe` |
| 09-13 全部报告 | `.runtime/review/`（`final-acceptance.md` / `diff-report.md` / `audit1.md` / `runtime-test.md`） |
| 设计稿 | `.runtime/design/`（`platform-framework.md` / `easel-reuse-optimization.md`） |

**端口**（09-14 22:37 实测全开，22:44 后随应用退出全停）：web 7860、gateway 18789、Postiz 4007、队列 8088、FreshRSS 8089、8090、cloak 9344。

---

## 8. 建议新会话调用的 skills

- **`task-navigation`** —— 恢复进度与下一步（**首选**；`handoff` 技能的职责由它承接）
- **`neat-freak`** —— 若用户再次要求清理收尾（注意 §4.4 的待清理清单）
- **`frontend-design`** —— 若改动 `web/frontend`
- **`find-repo`** / **`find-skills`** —— 若要按 `AGENTS.md §1` 做复用调研
- ⚠️ **注意**：`handoff` 技能在本机现役技能库中**已不存在**（仅存于 `.codex-shared/backups/`），本文件是按它的原始规范（建议 skills 章节、不重复既有产物、脱敏）手写的。`win-python-verify` 也**已于 09-14 退役**（知识要点已并入 `.workbuddy/memory/MEMORY.md`）。

**本次交接实际加载的 skill**：仅 `task-navigation`。

---

## 9. 交接清单

**Do**
- 先读 `F:\科研大师兄\自媒体工作台\AGENTS.md`（规则真源）→ `.runtime\review\final-acceptance.md` → `.workbuddy\memory\2026-09-14.md`。
- 动代码前先确认 gateway / web 是否正在运行（避免与用户正在用的实例冲突）。
- 改完必须跑 `py_compile` + `import` + `tests/` 全量测试（当前 217 passed 是基线）。
- 相对复杂任务（≥3 文件 / 跨前后端 / 涉数据模型或导航 / >200 行）完成后，按 §2.4 起**三个独立 Agent** 做对抗性审查。
- 任何工具/方案选型前，按 `AGENTS.md §1.5` 输出**复用调研清单**并追加到 `工具复用台账.md` C 区。

**Don't**
- **不要在用户没确认的情况下重启或停止用户正在使用的工作台**（当前已停机，拉起前最好问一句）。
- **不要删 `.runtime/before-auth-migration.json.bak`**（授权迁移前唯一快照 = 回滚材料）。
- **不要删** `_build_fe.py` / `_qna_e2e.py` 等 9 个根目录调试脚本（§4.4，可能是缺陷复现证据）——要清理先问用户。
- **不要把问答卡问题简单归因为"代码 bug"**——它本质是授权/配对链路。
- **不要用「静态检查通过」当作「运行验证通过」**。
- **不要引入任何需要付费/订阅的服务**（§1.7 零成本红线）。
- **不要擅自创建 skill**（§2.2 第 10 条）。
- **不要为了换轮子而换轮子**（§1：先确认现有实现是否已够用；`AGENTS.md` 明确要求先查内部已有轮子）。

**敏感信息**：本文档已脱敏——不含任何 API key、token、私钥、密码或完整设备标识。网关授权范围（`operator.*`）是权限名称而非凭据，故保留。
