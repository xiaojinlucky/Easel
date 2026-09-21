# 本机交付与验收记录

验收日期：2026-09-10。项目：`F:\科研大师兄\Easel`。结论：本机创作、素材、订阅、媒体交接和运行恢复闭环通过；三路独立审查发现的实际缺陷已修复并复核。没有对外发布，也没有把未登录的平台写成已验收。

## 2026-09-10 午后账号档案与商业版实测（最新）

“从本人主页建档→诊断→确认采用→新对话创作→桌面内容库打开”已通过真实流程。商业版身份、机制、逐项差异和未通过事项统一见 [当前对比报告](BEAV_COMPARISON_20260910.md)，下方旧部署记录保留其各自阶段范围。

- 商业版 D 盘2.7.20真实完成账号建档、定位、风格和本地创作；会话路由确认是 `redbox_official_auto / officialAccount`，没有使用旧订阅桥。底层实际模型仍未知。
- Easel 复用用户原 CloakBrowser profile 和本机9345端口；自己的12卡片单页快照形成“做科研的Meta师兄”档案，真实诊断59.03秒，GUI采用v1。未把卡片写成逐篇全文。
- 真实GUI创作保存了采用的账号名、v1和内容哈希；草稿、独立创作依据、预览API、原始下载、原生桌面预览全部读回。成品：`outputs/账号画像联动验收-20260910/基于主页档案的科研组图草稿.md`。
- 修复采集器误删标题、主代理工作目录漂移、旧异步响应回填和旧编辑接口绕过版本；重新分析不会覆盖已采用档案。
- 最终受影响Python回归 **79 passed**（2条依赖弃用提示）；3项真实前端竞态测试与生产构建通过。Astra low独立审查已复核相关机制与实际问题；不与历史测试总数相加。
- 本次通过的是账号建档与本地创作链路。平台发布会话仍需打通；小红书平台草稿、公众号真实权限、连续同行监测和发布后指标闭环没有被算成通过。原生商业版的本次文件预览也发现路径交接失败，详见对比报告。
- 清理中，自动审批拒绝删除本轮8个采集调试文件，返回 `blocked by policy`。这些文件保留在 `.runtime/acceptance-20260910/onboarding/`，包括 `xhs-reader-diagnostic/`；原始网络记录不对外分享。必要证据、生产服务、用户浏览器状态及正式输出保留。

## 用户入口

- [工作台](http://127.0.0.1:7860/)、[Postiz](http://localhost:4007/)、[FreshRSS](http://localhost:8089/)。
- 桌面快捷方式：`D:\Desktop\Easel 自媒体工作台.lnk`。
- [部署说明](LOCAL_DEPLOYMENT.md)、[复用与社区研究](REUSE_AND_RESEARCH.md)、[备份恢复](BACKUP_RESTORE.md)。

后续桌面交付：已增加 Electron 独立 Windows 程序，桌面与开始菜单快捷方式直接指向 `Easel.exe`。冷启动、三页实际渲染、标签状态保留、关闭后后台继续、重复启动单实例通过；两路独立审查通过。详见 [桌面版说明](DESKTOP.md)。原版浏览器对话列表和浏览器登录态不自动迁移，业务数据与后端配置继续共用。

## 真实闭环

### 2026-09-10 后续对抗审查（当前增量）

三位 Luna Max 子代理分别检查热点链路、桌面部署、采集与新增功能。发现并关闭以下问题：

- 头条仅有单一聚合源；已增加实测可用的官方热榜备用源，兼容 `Title/HotValue/Url`。B站备用的字符串标题列表继续可用。
- 热点失败被显示成空数据，旧缓存被标成当前更新；接口现返回各平台真实获取时间、缓存和错误状态，界面明确提示。平台切换使用请求序号，旧响应不覆盖新选择。
- 平台状态原来只探测 FreshRSS；现同时检查 Postiz 4007、Temporal UI 8088、FreshRSS 8089，避免部分掉线仍整体正常。
- 内容树隐藏的系统项未被所有读取/删除/媒体交接接口保护；现统一保护顶层 `_`、`.` 和 `analytics`，正常成品链路保持可用。
- 浏览器选区可能覆盖同 URL 完整正文；现按采集方式与选区内容区分身份，相同选区去重，不迁移或删除已有数据。

当前验证：Python **149 passed、5 skipped**（2 条依赖弃用提示）；热点 6 项、系统文件接口 8 项、平台状态 2 项、选区保留 2 项回归包含在其中。前端生产构建通过。打包 Electron 的 7 项检查通过，真实热点页面微博、抖音、知乎、B站、头条各 15 条；模型设置未调用模型测试。最终后台重启后 B站/头条各 15 条、`stale=false`，系统路径读取返回 403，三平台端口均健康。

桌面验证记录沿用 `.runtime/desktop-check/result.json`，测试进程已自行退出，生产桌面及服务保留。未执行公开发布、模型调用或修改已有素材。审查限定于上述代码、接口和真实部署；社交账号正式发布、未登录商业服务等原有限制仍见本文末节。平台停止失败时保留运行时供诊断重试，不通过无条件清理制造已停止的假象。

| 检查 | 结果与证据 |
|---|---|
| 完整技能 | 112 个上游技能保留；8 个选定扩展，源文件哈希核验通过，共 120 个 |
| 订阅模型 | 官方 ChatGPT Pro 登录；六个实时模型及精确推理档位。gpt-6-astra/high 保存、启用、调用通过；重启后 UI 再次测试成功，22.98 秒 |
| 来源化写作 | 素材页发起小红书、公众号、知乎、短视频四份适配稿；有原始来源和质量门报告，后台 clean_end=true |
| 图文制作 | 三张 1080×1440 PNG 通过 card_audit；公众号 HTML 真实生成并检查手机宽度；原生图片工具生成 1536×1024 PNG |
| 视频制作 | 61 秒、1080×1920、H.264/AAC、中文 Edge TTS 配音、20 条硬字幕；完整解码 rc=0、实际播放推进、8 个抽帧检查通过 |
| Postiz 交接 | 从内容库分别点击上传 PNG 和 MP4；服务返回媒体回执，远端文件 SHA-256 与本地原件相同 |
| 订阅素材 | FreshRSS 登录/API/真实订阅通过，导入宝玉博客最近 20 条；重启后同步返回 read=20/imported=0/skipped=20，没有重复入库 |
| 社区研究 | 38 条已保存素材（含 RSS 摘录），公开维护讨论、Beav、B站页面等；四个受限社区仍暂停，范围和未验证之处已记录 |
| 重启恢复 | 启动入口重启网关、Web、平台服务；会话最近结果仍为 done/clean_end=true，图片再次读回哈希一致 |
| 发布后台 | 9 个容器运行；有健康检查的服务均 healthy。Temporal main 队列 workflow/activity poller 均有新鲜访问时间，积压为 0 |
| 备份恢复 | 8 个平台卷归档通过 SHA-256、ZIP CRC、TAR 全读取与路径检查；隔离 Postgres 卷真实启动，User/Organization/Media 均恢复为 1；演练容器/卷已清理 |

成品目录：`outputs/独立创作者素材到发布的可复用流程/`。主要成品为四份 `*适配稿.md`、`card_1.png` 至 `card_3.png`、`公众号成品.html`、`创作者书桌.png`、`创作者素材到发布_竖屏短视频.mp4`、`创作者素材到发布_字幕.srt`。视频复用了已安装的 slideshow、tts、subtitle、video/audio editing 脚本；属于知识卡讲解式成片，没有冒充真人实拍。

MP4：3,323,477 字节；SHA-256：`8ba1638a368b0fd753f92cfac2102b17d12a435ba65a2dd15ae0a56bd600857d`。PNG 回读哈希：`7adea9430634bd383d9021a1ce59010a41783d53bf3ac3da5fa4e739eafdf684`。媒体读回记录在 `.runtime/postiz-video-readback.json` 和 `.runtime/postiz-media-readback.json`。

备份完成目录：`.runtime/backups/20260910-045203/`。其中 manifest 记录快照，restore-drill.json 记录隔离恢复结果。该快照创建于视频上传 Postiz 之前，所以数据库演练为 1 条媒体；当前服务已有 PNG 和 MP4 两条。视频文件本身已包含在项目数据快照中。未宣称完成整台新机器的迁移恢复。

## 自动检查

- Python 全量：**126 passed，5 skipped**，2 条依赖弃用提示；跳过项未被记成通过。
- Bun：**4 passed，18 assertions**，包括正文验证码误判、真实验证码仍暂停、公私网校验、真实 CloakBrowser 302 私网重定向阻断。
- 前端：TypeScript 编译和 Vite 生产构建通过，46 个模块；刷新最终构建后，竖屏视频预览完整显示，标题、播放控件和媒体交接按钮均在视窗内。
- doctor：Python、Node、FFmpeg、OpenClaw、生产前端、Playwright、订阅、额度保护、网关和技能同步均通过。
- 源码：8 扩展完整源文件哈希核验通过，Git diff 无空白错误。

## 三路对抗审查与修复

| 独立审查 | 实际问题与处置 | 最终结果 |
|---|---|---|
| runtime | 非流式对话未登记取消；会话 ID 清洗碰撞；修复中释放锁与后继登记存在竞态。统一登记取消、UUID5 文件键、清理后释放锁，补并发回归 | PASS，限定测试 26 passed |
| services | 备份缺恢复路径、生成期间快照不一致、半成品/归档校验不足、Windows SQLite 句柄阻止改名。采用离线备份、incomplete 目录、关闭连接、归档完整读回、恢复说明及隔离数据库演练 | 原问题全部关闭 |
| product | 初始 URL 白名单没有覆盖重定向；可选远端阅读 fallback 未披露。导航前安装逐请求 CDP 守卫并复验最终 URL，关闭远端 fallback，真实浏览器回归通过 | 未发现残余 P0/P1；本文件落盘关闭验收链接缺口 |

素材现在以 UNTRUSTED_REFERENCE JSON 引用数据送入创作，并在资料后重申禁止执行来源指令、泄露私有数据或发布。它是提示层防护，不是工具权限沙箱；没有声称从模型层面完全消除提示注入，也没有实测到来源成功驱动工具越权。

## 额度与剩余边界

后续变更：用户明确要求将额度阈值限定于开发阶段。工作台运行时现已移除 15% / 95% 本地拦截、运行中检查及旧停止标记锁定，下面的阈值记录仅描述历史开发验收。

Luna 监测主 Codex 周窗口。最终读取时间为北京时间 2026-09-10 05:16，已用 53%，剩余 47%；≤15% 或 ≥95% 均触发停止，未知额度拒绝继续，停止标记不会自动清除。模型任务在执行前与执行中检查，后台 AI 心跳/Cron/dreaming 关闭。不兑换重置、不购买额度。本轮监测已收尾，既有自动任务保持暂停；本机保护不能控制其他设备或其他任务的账号级执行。

该次历史验收时，Easel 国内账号检测均未登录，Postiz 频道数为0。午后已复用用户登录过的原 CloakBrowser 进行主页采集，但研究会话接入不等于发布会话登录，桌面发布账号仍显示0/6。浏览器摘录扩展已打包、配对及入库检查通过，尚未加载到用户常用 Chrome/Edge。午前自行复刻版记录已降为历史；午后新装商业版的账号建档与创作完成实测，真实平台草稿仍未完成。最新证据与边界见 [BEAV_COMPARISON_20260910.md](BEAV_COMPARISON_20260910.md)。受限社区没有绕过验证，外部生成式视频、音乐 API 未采购。

清理：生产服务、源代码、许可、备份、成品与复现脚本保留。自动审批拒绝了本次下载层缓存与首次失败备份的删除，仅返回 `blocked by policy`；约 2.34 GB 保留在 `.runtime/images/layers` 和 `.runtime/backups/20260910-044220`，不影响运行，不应把后者当成完成备份。未绕过该拒绝，也未触碰先前被拒绝清理的 Docker Desktop 文件。

## 2026-09-10 公众号与账号诊断增量

- Python 全量回归：172 passed、5 skipped；前端生产构建通过（index-CnbJV7XP.js）。公众号接口测试使用 mock，不能替代真实微信权限验收。
- `/api/wechat` 实际返回 200、账号为空；`/api/wechat-monitor` 返回在线与本地管理配置就绪。
- WeRSS 本地管理员登录、鉴权、空订阅列表已验证；未扫码授权微信，未创建同行采集任务。
- 微信官方草稿上传、账号真实统计、绑定后的 GPT 诊断准确度仍待真实账号接入；当前未为验证调用模型或发布内容。
- Astra Low 子代理分别负责后端、前端、部署和参考资料核验；修复了预览不应依赖凭据、密钥变化后的令牌失效、本地正文图片和上游令牌泄露等实际问题。
- Grok 文档的复用结论见 REUSE_AND_RESEARCH.md，使用流程和升级边界见 WECHAT.md。没有再安装重复的工作台。
- 已清理本轮未启动的镜像检查容器和已导入的 WeRSS tar；保留生产镜像、源补丁、部署、用户输出和既有备份。未触碰历史被拒绝清理的目录。

桌面增量最终复验：10 项全部通过，包含无需账号的本地排版、切页保留正文、WeRSS 内嵌管理真实渲染及既有模型设置/热点/Postiz/FreshRSS。结果见 `.runtime/desktop-check/result.json`，启动时间 2026-09-10T04:46:46.518Z；原生窗口截图 `wechat.png` 已查看。早期失败为测试脚本的转义、文案匹配及就绪等待问题，修正后通过。

## 2026-09-21 三条线合并与上游欠账回收（集成树 `integrate/20260921`）

工作目录：`F:\科研大师兄\自媒体工作台\Easel-integrate`（从 `snapshot/official-active-0919` 切出）。现役 7870 进程、`Easel-official`、`Easel-beav-kb`、`Easel-merge-wip` 全程未被写入，未做任何推送。

### 事实（可复核）

- 提交链：`aa4f7f5` 合入 Beav 知识库线 13 个提交 → `36c1fbd` 合入两树吸收线 → `efeb1dd` 还原 29 个纯上游文件 + 三方合并 `weixin_mp_stats.py` + 补声明依赖 → `eecd31d` 前向合并 `web/app.py`（22 处冲突）与 `easel/persona.py`。
- 全量测试：**472 passed / 5 skipped / 0 failed**。本轮起点是 `90 failed / 352 passed / 17 errors`。
  复核：`cd 'F:/科研大师兄/自媒体工作台/Easel-integrate'; & 'F:/科研大师兄/自媒体工作台/Easel-official/.venv/Scripts/python.exe' -m pytest -q`
- 那 90 条红测试不是合并造成的：同一 venv 在 `Easel-merge-wip` 自己分支上按同批文件跑，得到 `90 failed / 77 passed / 17 errors`。它们是 `22878d5` 那次"保留文件、丢内容"的报警器——上游 `web/app.py` 少 44 个函数 / 10 个接口和整套本机边界。（该工作树已于同日收尾时删除，分支 `merge/easel-into-official` 仍在；要复现这条结论，重新 `git worktree add` 那个分支再按文件跑一遍。）
- 监听收紧已在分支上生效（默认 `127.0.0.1` + Origin 白名单 + `TrustedHostMiddleware` + 写请求 `local_write_guard`）。真机复核（备用端口，不碰 7870/18789）：
  `& '...Easel-official/.venv/Scripts/python.exe' -m uvicorn web.app:app --host 127.0.0.1 --port 7999`
  期望：`netstat -ano | Select-String ':7999'` 只有 `127.0.0.1`；GET `/api/research/sources` → 200；`POST /api/research/beav-host` 带 `Origin: https://evil.example` → 403；带 `Host: 192.168.1.5:7999` → 400；带 `Origin: http://127.0.0.1:7870` 的 POST → 200。实测结果与期望逐条一致。
- 收敛性：`git merge-base --is-ancestor 0b22a04 HEAD` 为真；相对 fork main `0 behind / 43 ahead`（本轮后 ahead 增加），相对 09-19 快照 `0 behind / 91 ahead`。回 main 是快进，不需要改写历史。
- 备份：`F:\科研大师兄\自媒体工作台\merge-backup-20260921\three-branches.bundle`（合并前三条分支 tip）。

### 三处同名实现，这次明确选了一边

1. `/api/model-settings` 用 `easel.model_settings_api`（`determined_models()`：换型号才重新验证，只改推理强度沿用上次结果）。上游 `web/settings_api.py` 那份没有这个行为，已停止在 `app.py` 中段覆盖同名 router。
2. `agent_options` 用 `easel.model_runtime`（认 `EASEL_THINKING_LEVEL`）；`easel.runtime` 那份不认。
3. `OPENCLAW_PROFILE` 随上游变成 `easel-studio`（会话目录 `~/.openclaw-easel-studio`）。本机两个 profile 目录都没有 transcript，切换不影响历史数据，但这条会改变运行时读写哪个 profile 目录。

### 推断

- 余下的 `web/settings_api.py` 与 `easel/model_settings_api.py`、`easel/runtime.py` 与 `easel/model_runtime.py` 属于同一功能两份实现。本次只保证被引用那份的行为正确，没有删另一份；真正收敛需要一次专门的取舍。

### 未验证

- 真机 Chrome 采集扩展 → Native Host → 本分支后端的端到端（本轮只跑了 pytest 与本机 HTTP 探针）。
- 真实 OpenClaw 对话一轮（`--json` / `agent_reply` / 停止生成整链）、真实 yt-dlp 下载与转写、真实公众号发布。
- 前端 `vite build` 在本轮 app.py 合并后未重跑（改动全在后端与 Python 侧，产物无输入变化）。
- 现役 7870 进程仍是合并前的 `0.0.0.0` + `allow_origins=["*"]`，收紧要等这条分支合并后重启才生效。

## 2026-09-21 深度收尾：工作树、死文件与缓存清点

合并线收口后对全部 Easel 树做了一次清理，目标是留下"一个现役答案"。

### 已经清掉的（都有复核方式）

- 工作树 `Easel-beav-kb`（549M）与 `Easel-merge-wip`（459M）已删除。删除前逐条验证：两条分支 `research/beav-kb-parity`、`merge/easel-into-official` 都已包含在本分支（`git merge-base --is-ancestor <分支> HEAD` 为真）、`git status --short` 为空、`git stash list` 为 0。分支本身和合并前备份 `merge-backup-20260921/three-branches.bundle` 都保留，要恢复目录只需 `git worktree add`。
  复核：`git -C 'F:/科研大师兄/自媒体工作台/Easel-integrate' worktree list` → 只剩 `Easel-official` 和 `Easel-integrate` 两棵。
- 吸收线带进来的 10 个前端死文件已删（`6421a2e`）：`WechatPage/SettingsPanel/AccountProfilePanel/AuthGuide/EnvBoard/CapabilitiesPage/BrushEntry/settingsIcons.tsx` + `lib/capabilityMenu.ts` + `lib/skillDisplayNames.ts`。判据是零外部 import、`tsc -b` 的 85 个错全部落在这批文件内、`vite build` 产物哈希与删除前一致；删后 `tsc -b` 归零。
- 三棵树的 `__pycache__` 与 `.pytest_cache` 共 30 个目录已清空（约 5M，Python 会自动重建）。
- 现役树里 6 个调试脚本（`_build_fe.py`、`_cleanup.py`、`_find_node.py`、`_qna_e2e.py`、`_restart_web.py`、`_shot_guide.py`）与 `Easel/.runtime/_cleanup_tmp.txt`（早期清理循环的一次性清单）已删除。
- `.gitignore` 补了 `.venv/`（`6983313`）。这是 `git status` 被两万个文件淹掉的根因，四棵树的 `.gitignore` 原本都没有这条。只在本分支改，等回 main 后自然覆盖，不去单独动现役树以免制造分叉。

### 扫过但确认不是死代码的

- 后端 `easel/` + `web/` 共 36 个模块，零引用模块 **0 个**。
- 零引用函数只有 2 个，且都在本轮刚从上游还原回来的文件里：`easel/gateway_questions.py:423 pending_questions_for_session`、`easel/commands/doctor.py:132 _env_key_valid`。删了下次合上游还会回来，所以留着。
- `web/settings_api.py` 与 `easel/runtime.py` 被 `easel/commands/ping.py` 等入口引用，不是死的；它们和 `model_settings_api.py` / `model_runtime.py` 是同一功能两份实现，属于待收敛而不是待删除。

### 明确保留的（含原因）

- 旧树 `F:\科研大师兄\自媒体工作台\Easel`（7.7G）整体不动，用户要求不归档。它的 `.runtime`（5.5G）里有真实浏览器 profile、登录态和 `images/`（3.8G）素材，`.runtime` 内的 `_old_app.py`、`before-auth-migration.json.bak` 属迁移期回滚件，按回滚材料保留。
  收尾时按命令行查过进程：当前监听 18789 的 openclaw 网关（pid 46380）**就是从 `Easel\.runtime\node_modules\...` 启动的**，所以旧树 `.runtime/node_modules`（669M）是在用资源，不是可回收缓存，不能删。
- 根目录 `AGENTS.md`、`CLAUDE.md`、`工具复用台账.md`（AGENTS 明确把它钉在根目录）留在原地。
- 5 份已完成使命的历史交付物移到了 `F:\科研大师兄\自媒体工作台\archive\2026-09-合并与调研\`（4 份 show-me HTML + `两树合并方案-2026-09-19.md`），内容未改，旁边放了一份 `README.md` 说明各自作用和被谁取代。
- 根目录其余同级项目目录（`RedBox`、`beav-appdata`、`beav-workspace`、`inspiration_collector_v0`、`publisher-assistant`、`workbuddy-studio`、`xhs_content_workbench`、`炉子`）不属于本次"工作台各版本"范围，只读了大小和内容，未做任何修改。

### 收尾后仍挂着的事

- 现役 `Easel-official` 的 `.gitignore` 没有 `.venv/` 这条，它的 `git status` 会一直显示 `?? .venv/`；按上面的策略等合并统一解决。
- `Easel-official/HANDOFF.md`（未跟踪的接手指针）里写的 HEAD 和隔离工作树路径已过期，本分支更新为当前事实。
- `OPENCLAW_PROFILE` 是否统一成上游的 `easel-studio`、两份同名实现是否合并、AI 加工队列是否继续自动排干，仍待拍板。
