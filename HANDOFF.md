# HANDOFF 指针 · 本目录是 `Easel-official`（现役，Web 7870）

> 更新于 2026-09-22 上午。文末四节是这一轮的新内容：《Chrome Native Host 的脚本在 AppData 里》《账号采集会话 → 画像》是 09-21 夜至 09-22 的实测与新增链路，《冒烟三件套跑到哪了》《待用户拍板》是现状对账与下一步清单——**接手直接从最后一节挑活，不用重新推**。上一版写于 09-20，里面提到的 `Easel-merge-wip` 工作树已经不存在了，别按那份找。

## 现在有几棵树

| 目录 | 分支 / HEAD | 是什么 |
|---|---|---|
| `Easel-official`（本目录） | 现检出 `feat/account-profile-import` = `89ef6c5`；`main` = `c68624e`（跟踪 `fork/main`，未推送新东西） | **唯一的开发树**。2026-09-21 晚从 `21c8e8d` 切过来，旧状态留了标签 `pre-cutover-20260921`；09-22 在其上开 `feat/account-profile-import`（`ecb0cec`+`89ef6c5`）做账号画像复刻 |
| `Easel`（旧树） | 独立仓库，main = `0b22a04` | 不是现役、不归档。它的 `.runtime\node_modules` 是在用基础设施（见下一节） |

`Easel-integrate` 工作树已在 2026-09-21 夜用 `git worktree remove` 正规摘除（当时与 `main` 逐字节同内容，
无未提交改动）。它的分支全在本树 `.git` 里：`release/main-candidate` = `c68624e`（发布用的压缩历史，
已快进推上公开 main）、`integrate/20260921` = `659eb84`（108 个过程提交那条线）。
要用时重新 `git worktree add ../Easel-integrate integrate/20260921` 就回来了。

`Easel-beav-kb`、`Easel-merge-wip` 两棵隔离工作树已在 09-21 收尾时删除。它们的分支 `research/beav-kb-parity`、`merge/easel-into-official` 仍在本树仓库里，且都已包含在 `integrate/20260921`；合并前的三条分支 tip 另存在 `merge-backup-20260921/three-branches.bundle`。

## 接手该读哪份

- 合并结果、验收事实、清理台账：本树 `docs/ACCEPTANCE.md`（末尾两节是 09-21 的合并与收尾）
- 发布与切换的完整台账（含复核命令）：`F:\科研大师兄\自媒体工作台\发布候选-2026-09-21.md`
- 本目录这棵树的现状与前提：就是本文件
- 知识库复刻线的七份调研与验收日志：本树 `docs/beav-research/`（先读 `README.md`，里面写明哪些结论已过期）
- 上一版长交接 `HANDOFF.md`（集成树那份）已从发布分支里删掉，要看用 `git show aee563f:HANDOFF.md`；
  旧树历史在 `Easel/HANDOFF.md`

## 本目录当前的真实状态

| 项 | 值 |
|---|---|
| 运行中 | Web **7870 在听**：09-22 09:10:07 用当前代码重启过，父进程 pid 31464（`.venv` 启动器）+ 真正持 socket 的子进程 pid 107716，**要杀连父带子**。网关 **18789 在听**：pid 仍是 108416，即 09-21 夜 23:28 经用户同意重启的那个，由**本树** `.runtime\node_modules\...`（联接）以 `--profile easel gateway run --allow-unconfigured --bind loopback` 启动，带 `OPENCLAW_RAW_STREAM=1` / `OPENCLAW_RAW_STREAM_PATH=本树 .runtime\easel-raw-stream.jsonl` |
| 工作区 | `git status` 只剩本指针 `HANDOFF.md` 未跟踪；`.venv/`、`.runtime/` 已被本树 `.gitignore` 覆盖。`extensions/beav-capture/` 是**只存在于本机的目录**，靠 `.git/info/exclude` 隐形（上游 MIT-NC，不入库也不分发）。09-22 从旧树迁入两份已完成的账号画像 `profiles/做科研的Meta师兄/`、`profiles/做科研的Meta师兄·账号档案/`（生效版本 v1/v2）与 7 个 `.runtime/account-profile-jobs/*.json`；素材库现有 4 条 saved，其中 `d7b08996…`「【冒烟测试·可删】」是我造的冒烟数据，等用户决定是否删 |
| 测试 | 09-22 在本树实跑全量：`PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest -q -p no:randomly` → **475 passed, 5 skipped**。加 `-rs` 看清：5 条跳过全是 `skills/openclaw/skill-wechat-publisher/tests/test_config_integration.py` 报 `bun is not installed`，本机没装 bun，不是功能缺失。跑测试会真写 `.runtime/research.sqlite`，在意现网数据就先备份再跑 |
| 安全边界 | **已生效**：`web/app.py` 默认 `EASEL_HOST` 空 → 只听 `127.0.0.1`；跨源写操作返回 403「仅允许从本机工作台操作。」，伪造 Host 返回 400 |
| 产品合同 | 端口 **7870**；profile 随上游变成 **`easel-studio`**（旧树这一版是 `easel`，两个 profile 的 `openclaw.json` 都把 gateway 端口指向 18789）；模型设置走本树 `.runtime/model-settings.json`；扫码不要 `--headed` |

## 本机跑起来的三个非显性前提（切分支/重装后先自检）

1. **`.runtime\node_modules` 是指向旧树 `Easel\.runtime\node_modules` 的目录联接。**
   合并进来的 `easel/runtime.py:openclaw_command()` 在 Windows 上只认本树这一条路径，也不回退 PATH；
   联接没了 → 对话直接报「未找到 Easel 的独立 OpenClaw，请运行安装脚本」。
   **不要**为此跑 `setup.ps1` 或 `npm i -g openclaw`。自检：
   `./.venv/Scripts/python.exe -c "import sys;sys.path.insert(0,'.');from easel.runtime import openclaw_command;print(openclaw_command())"`
2. **`extensions/beav-capture/` 会在 checkout 时被删。** 它在旧快照 `21c8e8d` 上是被跟踪的 35 个文件，
   而公开 main 刻意不含它，所以任何朝 main 的切换都会顺手删掉磁盘目录，连带打断 Chrome 里"加载未打包"的扩展。
   丢了从 `integrate/20260921` 取回，再 `git rm -r --cached` + 确认 `.git/info/exclude` 那条还在。
3. **重启 7870 必须带 `PYTHONUTF8=1`。** 启动命令 `.venv\Scripts\python.exe web\app.py`；
   不带 UTF-8 会在 `web/app.py` 那句 `print("✦ Easel Web")` 处被 GBK 控制台崩掉。
   venv 启动器还会再 spawn 一个 uv base python 真正持有监听 socket，**杀进程要连父带子**。

细节与可复制的复核命令：`F:\科研大师兄\自媒体工作台\发布候选-2026-09-21.md` 文末《现役树已切换》。

## 模型凭据有两个存放点（09-21 夜冒烟实测）

对话走 ChatGPT 订阅时，`~/.codex`（本机 junction → `F:\CodexData\.codex`）的 `auth.json` **不是**网关用的那份。
OpenClaw 的 agent 用自己那份 OAuth 库：`~\.openclaw-easel\state\openclaw.sqlite`。两者同账号、互相独立，
一边能刷新不代表另一边可用。判"订阅到底掉没掉"用这条（只读、不花额度）：

```powershell
cd 'F:\科研大师兄\自媒体工作台\Easel-official'
.\.runtime\node_modules\node\bin\node.exe .\.runtime\node_modules\openclaw\openclaw.mjs --profile easel models status --agent main
```

看 `Auth store` 指向哪个文件、末尾 `OAuth/token status` 是 `ok expires in Nd` 还是 `expired`。
失效的表现为对话约 40 秒后报 `auth refresh request failed: code=-32603`，网关日志里是
`reason":"token_invalidated"` + `Your session has ended. Please log in again.`。
修法是重新授权（**要真终端**，非交互 shell 会直接拒绝；`--force` 就是为"缓存 profile 卡住"准备的）：

```
openclaw --profile easel models auth login --provider openai --agent main --force
```

09-21 23:2x 已按此重授权，之后真实一轮对话通过：`/api/chat/last/smoke-20260921-d` 返回
`text:"好"`、`clean_end:true`、`stop_reason:"completed"`，19 秒。**别用设置页那个「登录」按钮判这件事**——
它查的是 `refreshToken:false`，access token 还剩几天时它会回「已使用 ChatGPT 订阅登录」，什么都不做。

## 逐字流式目前仍不通（不是本次切换引入的）

`easel/services.py` 给网关注入 `OPENCLAW_RAW_STREAM=1` + `OPENCLAW_RAW_STREAM_PATH`，网关日志确认两条都被接受，
但整轮跑完本树 `.runtime\easel-raw-stream.jsonl` 仍是 0 字节，全机也找不到回退路径 `<stateDir>/logs/raw-stream.jsonl`。
写这个文件的是 openclaw 的 `embedded-agent-subscribe` 模块，而我们的模型事件是从 codex app-server 那条路回来的——
怀疑它不经过那个 hook，**未证实**。表现：回答整块出现、「💭 思考过程」面板空。切换前也一样（这台机器上那个文件从来没存在过）。

## Chrome Native Host 的脚本在 AppData 里，合并后会悄悄过期（09-21 冒烟② 实测）

扩展 → 后端这一段不经过 7870：Chrome 按注册表拉起
`C:\Users\Administrator\AppData\Local\easel-native-host\host.exe`，它读同目录 `python-path.txt` 解释
`beav_native_host.py`，该脚本再用 `easel-root.txt` 里的树路径直接 `import easel.research` 写库。
所以**每次合并改了 `scripts/beav_native_host.py`，AppData 那份不会自动跟上**，测试全绿但真机跑的是旧宿主。
09-21 现场：AppData 那份是 09-20 23:06 的 11,621 字节，树里已是 16,604 字节，缺了帧长上限、回执复放对账、
转写任务投递、`readBack` 回读、SSRF 判定、kind 规范化。已用备份后覆盖的方式对齐
（旧文件留在 `beav_native_host.py.bak-20260921`）；只需覆盖 `.py`，不必重跑 `scripts\install_beav_native_host.ps1`
（那个还要 `go build` 和改 HKCU 注册表，只有在 host.exe/注册项本身坏了时才需要）。

自检（两条都应成立）：

```powershell
$d="$env:LOCALAPPDATA\easel-native-host"
(Get-Content "$d\beav_native_host.py" -Raw) -eq (Get-Content 'F:\科研大师兄\自媒体工作台\Easel-official\scripts\beav_native_host.py' -Raw)
Get-Content "$d\easel-root.txt"      # 期望：F:\科研大师兄\自媒体工作台\Easel-official
```

不依赖 Chrome 的链路测法：直接向 `host.exe` 的 stdin 写「4 字节小端长度 + UTF-8 JSON」帧，读它的 stdout 回帧，
`ping` / `desktop.health` / `knowledge.ingestEntry` 都能这样打，入库后 `GET /api/research/sources?query=…` 能查到。
**仍未验证**：Chrome 里真点一次采集（扩展 ↔ 宿主握手那一段只能由用户在浏览器里做）。

## 在本目录里绝对不要做的事

- 不要停 / 抢 18789；不要顺手重启网关
- 不要改正在跑的文件、不要重建 `web/frontend/dist`。这条红线到今天为止只有两次例外，都经用户明确点头：
  09-21 切换后重建过一次，09-22 加「账号采集会话」面板又重建过一次，最终产物是 `dist/assets/index-BDz5ll2t.js`。
  `web/frontend/.gitignore:11` 把 `dist` 排除了，所以**产物只存在于本机、仓库里没有**，别人 clone 出来是空的；
  7870 直接读磁盘上的 `dist`，改完前端源码重建后**不用重启**就能生效（我是靠比对页面引用的 js 文件名确认的）。
  以后还要重建，先拿用户同意。
- 不要跑官方 `setup.ps1`，不要 `npm i -g openclaw`
- 不要修改 git config（提交身份用 `git -c user.name=… -c user.email=…` 单次传参）
- 不要提交 `_*.py`、`.env`、真实 cookie、`.runtime`；token/key/密码不进文档与日志
- 未经用户明确同意不要 merge、推送、对 ZJU-REAL/Easel 开 PR
- **不要把本目录退役改去用 7860** —— 用户已经否定这条路线

## 账号采集会话 → 画像（09-22 建，分支 `feat/account-profile-import`）

分支上有两个提交：`ecb0cec`（宿主 + 数据层 + 接口）、`89ef6c5`（素材库页面板）。公开 `main` 仍在 `c68624e`，未推送。

- 事实：Chrome 扩展的 5 个 `accounts.*` 方法已从"直接拒绝"改为落 `account_sessions` / `account_items` 两张表；帖子按扩展带的 `knowledgeEntryId` 挂回素材库条目；`operationId` 命中缓存回放同一回执，重投不翻倍。`/api/account-profile/{sessions,sessions/{id},from-session}` 已在线。素材库页（`AccountImportPanel`）能列批次、生成待确认建议、确认生效；`web/frontend/dist` 在 `.gitignore` 里，所以前端产物只存在于本机。
- 事实（复核）：`PYTHONUTF8=1 ./.venv/Scripts/python.exe -m pytest -q -p no:randomly` → 期望 `475 passed, 5 skipped`；`curl -s http://127.0.0.1:7870/api/account-profile/sessions` → 期望 `{"items":[]}`（我种的两次复验数据已删干净，`account_sessions`/`account_items` 均 0 行，素材库仍 4 条 saved）。
- 推断：商业版把画像聚合放在宿主/云端，扩展只做采集；所以我们这套的聚合与审批必须自己做，不能指望插件升级带来。
- 事实：AppData 那份宿主脚本 09-22 已覆盖为本树的 21,232 字节并逐字节比对相同，`easel-root.txt` 指向本树。所以下一条"没真跑扩展"不是宿主副本过期造成的，纯粹是没人替我在浏览器里点。以后每次改 `scripts/beav_native_host.py` 仍要按上一节再覆盖一次。
- 未做：没有真用 Chrome + 扩展跑一次整账号采集（我是按帧协议直接喂 `host.exe` 验的）；`from-session` 的真实模型生成一次没跑过（省订阅额度），只验到选证据与参数传递；两套画像机制（`/api/profile/build` 表单抓取 vs 这条证据审批）还没收敛，首屏提示仍指向老的那套。

## 冒烟三件套跑到哪了（09-22 上午对账）

这三件事是用户当时点头要跑的真机冒烟（一轮真对话、一次真采集入库、一条视频下载转写）。目前两项已过，第三项卡在缺一条能用的链接，不是我拖着没做。

- **① 真实一轮对话：通过。** 09-21 23:2x 重授权后 `/api/chat/last/smoke-20260921-d` 返回 `text:"好"`、`clean_end:true`、`stop_reason:"completed"`，19 秒。前置条件见《模型凭据有两个存放点》。
- **② 真机采集入库：通过。** 既验过 7870 侧的采集接口，也绕过 Chrome 直接按帧协议喂安装版 `host.exe`（`ping` / `desktop.health` / `knowledge.ingestEntry` / 5 个 `accounts.*`）走完落库。**只能由用户在浏览器里点的那一步仍没替谁做过**——扩展 ↔ 宿主的握手只有 Chrome 能验。
- **③ 一条视频下载 + 转写：未做。** 缺一条我能真用的公开视频链接（B 站/抖音工作日还有时段禁令）。用户给了链接就能跑，跑法是把链接走采集接口入库，再看 `GET /api/research/index-status` 的 `transcribe_pending` / `transcribe_failed` 是否归零、素材 `extra.video_url` 与转写文本是否出现。
- 复核（09-22 上午实跑值，别再按文档旧数对账）：
  `curl -s http://127.0.0.1:7870/api/research/index-status`
  → `total:4`、`fts_indexed:2`、`trash:0`、`pending_transcribe:0`、`ocr_available:true`、`enrich_pending:0`、`enrich_failed:0`、`transcribe_failed:0`、`enrich_cooldown:0.0`。
  **`fts_indexed` 只有 2/4 这件事我没查原因**，只记录观察，别当成"索引坏了"或"没问题"的结论。

## 待用户拍板（下次接手直接从这里挑，不用重新推）

1. **素材库那条冒烟数据删不删**：id 前缀 `d7b08996`，标题「【冒烟测试·可删】Easel 采集入库 2026-09-…」，kind `webpage`。是我造的，回收站 30 天可恢复。
2. **两套账号画像机制怎么收敛**：老的那套（`/api/profile/build` 表单 + 后台 agent 抓链接）还是首屏提示指向的入口；新复刻的是采集会话 → 证据 → 人工确认生效。要么把提示改指新的，要么明确保留两套并说明分工。**涉及首屏文案与产品主线，我不替你定。**
3. **旧树素材库 48 条要不要迁进现役库**：`Easel/.runtime/research.sqlite` 实测 48 行、其中 `state='saved'` 46 行，表结构是旧的 11 列（缺现在这版的治理列）。迁的话得按"导入不覆盖"写迁移脚本，且要先定哪些还活着。
4. **openclaw profile 名收敛**：本机网关现在用 `--profile easel` 跑着，上游这版默认已经是 `easel-studio`，两份 `openclaw.json` 都把 gateway 端口指向 18789。统一成一个要重启网关，而"不动 18789"是硬红线，所以只能等你点头。
5. **逐字流式**（详见上面同名一节）：现象与怀疑都记着了，怀疑那条**未证实**，要不要继续查由你定。
6. **加工失败原因的占位文案**：`easel/research_enrich.py:179` 是 `reason = str(error or '').strip() or '加工失败（模型通道未给出原因）。'`。模型通道不给原因时前端只显示这句空话。改成可诊断的文案（带任务 id / 通道状态）算体验优化，等你说做不做。
7. **画像选择器里两份画像的描述都是空的**：`curl -s http://127.0.0.1:7870/api/personas` → `[{"name":"做科研的Meta师兄","description":""},{"name":"做科研的Meta师兄·账号档案","description":""}]`。下拉里看不出差别，而且"·账号档案"这份就是第 2 条那套新机制产物。**描述从哪来、为什么空，我没查**，只记观察。
8. **`docs/beav-research/05-comparison-matrix.md` 已过期**：那张矩阵写于账号画像复刻之前，现在"账号采集 → 画像"这条线我们已经落地了，矩阵还标着缺项。要刷就得连带复核 `06-replica-plan.md` 的勾选状态。
