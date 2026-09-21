# 06 · 复刻方案：Easel「知识库」板块分阶段落地（结合开源件，最小自研）

> **进度（2026-09-21）**：阶段 0、1A、1B+1C、2 已在本 worktree 落地，一阶段一提交；
> 交付内容、已验证事实与未验证项见 `07-acceptance-log.md`。阶段 3+ 未启动。

> 原则（对齐 04·§9 工具取用阶梯）：能直接用的开源件直接用；只抄设计不引代码（AGPL/MIT-NC 边界）；
> 必须自研的只有三块：**宿主协议、素材库治理层、采集 UI**（后者仅分发场景需要）。
> 架构照抄 Beav 的产品分工（02·§7-1）：**扩展=纯输入设备，知识库/检索/AI/编排全在 Easel 桌面端（Web 后端）**。
> 所有改动发生在本 worktree（`research/beav-kb-parity`），验证通过并经用户点头后才谈合回 `Easel-official`。

## 阶段 0 · 止血（半天，全部是低风险小改动）

| # | 任务 | 落点 | 验收 |
|---|---|---|---|
| 0.1 | `.runtime/` 加进 `.gitignore` | `.gitignore` | `git status` 不再显示 `.runtime/`；新增守门测试 |
| 0.2 | **摘除 Beav 云回连**：更新检查 `redbox.ziz.hk/api/updates/plugin`、下载页、`api.ziz.hk/beav/v1/public-feedback` 遥测（含 `installationIdHash`）→ 常量改本地 no-op 或 127.0.0.1，manifest 删两条 host_permissions | `extensions/beav-capture/background.js`（`:18180-18181, :7440`），`manifest.json:45-46` | 全库 grep 无 `ziz.hk` 出站点；`test_beav_capture_safety.py` 加断言：manifest 不含 ziz.hk、telemetry 端点为空操作 |
| 0.3 | OCR 依赖落地：`rapidocr_onnxruntime` 进 `pyproject.toml`（optional extra `[ocr]`）+ setup 脚本提示；未安装时状态接口亮黄灯而非静默 | `pyproject.toml`, `setup.ps1/sh`, `research.py:200-203` | `/api/research/status` 返回 `ocr_available: bool`，前端采集页显示 |
| 0.4 | 端口口径统一：后端默认端口与扩展硬编码 7870 对齐（或读配对文件） | `web/app.py:3213`, clipper 配置 | 默认 `easel web` 启动后简易扩展可连通 |
| 0.5 | 重写 `NOTICE.Easel.txt`（如实列改动：宿主名/文案/stub 云桥/console shim/摘遥测），补 `docs/ACKNOWLEDGMENTS.md` | 两处文档 | 与 `git diff` 实际改动一致 |

## 阶段 1 · 协议与数据底座（核心，约 2~3 天）——"存得进、管得动、找得到"

**1A. 宿主协议补齐（对齐 02·§7-2 四件事 + 回执）** — `scripts/beav_native_host.py`
- `extract_entry()` 读取 `assets.videoUrl` / `note.assets.videoUrl` / `options.{transcribe,summarize,dedupeKey,allowUpdate}` → 落 `extra.video_url`、`extra.pending_tasks`。
- 回执协议：实现 `operationId` 幂等；返回 `{entryId, duplicate, updated, storageStatus:'stored', readBack:true}`（`readBack`= 重查 sqlite 确认行存在且 asset 文件在）。修掉订阅式采集必失败问题（01·G1-10）。
- `data:` 图片在宿主侧解码落盘，不再进正文（修 01·G1-7/8）。落地口径为 `easel/research.py` 的 `materialize_data_images()`：**解码后**单张 ≤ 2,000,000 字节、每条素材最多落 8 张，与远程图片 `materialize_images()` 同级；不是本节初稿写的"沿用 Beav ≤6MB"。
- `desktop.context` 返回契约对齐扩展的 `initialization.state` 归一化（01·G5-30），补 `counts`（03·§6 行4）。
- kind/platform 归一化：建 `PLATFORM_BY_DOMAIN` 与 `KIND_ENUM`（照 03·§2.3b 的 7+2 种），宿主侧映射，旧行迁移脚本。
- 端到端测试：`handle() → save_source → sqlite+md+本地图 → readBack`（补 01·G6-33 缺的 E2E）。

**1B. 素材库治理 CRUD** — `easel/research.py`, `web/research_api.py`
- 迁移：`sources` 加 `tags TEXT`、`summary TEXT`、`pinned INT`、`deleted_at TEXT`（回收站）。
- 路由补齐：`DELETE /sources/{id}`（软删）、`POST /sources/batch-delete`、`PATCH /sources/{id}`（编辑正文/主题/标签）、`POST /sources/{id}/tags`、`GET /trash` + restore、30 天自动清理（照 Beav 口径，03·§2.5）。
- 分页：`?limit=&offset=&sort=&kind=&platform=&state=&tag=`，`kindCounts` 随列表返回（照 `knowledge:list-page`）；前端 200 条硬上限移除。
- 搜索升级：**jieba 预切词 + SQLite FTS5** 虚表（内容+标题+评论+tags+url），与 LIKE 并行一版做回归对照；不引入 Meilisearch（04·§5.1 判断：量级不需要）。
- 评论拆分：`comments_text` 同时写 FTS 专属列，评论可被单独搜到（对标 xhs-comment-insight 前置条件）。

**1C. 知识库前端最小面** — `ResearchPage.tsx`
- 卡片/详情加：标签芯片+抽屉、删除/恢复、编辑、置顶；侧栏式筛选（kind/平台/标签/状态）走服务端参数。
- 新增「索引状态」卡：OCR 可用性、转写待办数、FTS 索引数——照 `get-index-status` 的形状（03·§2.3d）。

阶段验收：装副本扩展→保存小红书图文（含 data: 封面）、抖音视频页、公众号→ 库里 kind/platform/标签正确，视频地址不丢，UI 显示"新增/已更新/重复"三种回执，删除可恢复，FTS 能搜到评论内容。

## 阶段 2 · AI 加工本地等价（约 2~3 天）——把"☁️积分项"变成"本地零成本"

| 任务 | 开源件（许可） | 落点 |
|---|---|---|
| 2.1 自动标签+摘要（入库异步队列，可重跑） | 设计照 Karakeep（AGPL，只抄不引）；模型走 Easel 现有网关 | 宿主 ingest 后投递任务 → 新表 `enrich_tasks`；失败可见可重试 |
| 2.2 批量 OCR 回填 | RapidOCR（已选） | `POST /sources/refresh-ocr`（复用现成 `refresh_ocr`）+ 前端"批量识别图片"按钮（直接回应 Beav Issue #27 诉求） |
| 2.3 视频入库：下载+字幕 | yt-dlp（Unlicense） | 宿主收 `videoUrl` → 后端队列 `yt-dlp -o outputs/研究素材/<id>/media`；B站/YouTube 优先拉现成字幕 |
| 2.4 音频/无字幕转写 | faster-whisper（BSD，CPU 可跑；先可选装 extra） | 同上队列；`transcribe` 选项从"被丢弃"变"待办状态" |
| 2.5 导出 | 无依赖 | `GET /sources/{id}/export-folder` → `knowledge/<site>/<id>/meta.json+content.md`（照 03·§2.3c 目录约定，Obsidian 可直接吃）+ JSON/CSV 批量 |

## 阶段 3 · 检索与写作引用升级（约 2 天）

- 3.1 语义层（可选步）：Qwen3-Embedding-0.6B / bge-small-zh + **sqlite-vec**（Windows wheel 先实测，04·§8-1；不行则 numpy 暴力，几千条量级完全够）→ 详情页"相似素材"、列表"语义"开关。FTS 仍是主，向量只做混排（RRF）。
- 3.2 素材问答：不给 Beav 式"聊天"另起炉灶——复用现有对话通道，把检索（FTS+可选向量）包成一个工具：`search_knowledge(query)→带出处的摘录`，引用格式照 chubbyskills"摘录+行号+来源"（04·§0a）。
- 3.3 引用管线升级：详情→创作的注入块保留 `#N`，但每条附行号锚点与 OCR 段标记；MAX_PICK 提到可配。
- 3.4 选做：灵感漫步（随机 K 条素材→关联提问），一个 prompt 节点的事，放最后。

## 阶段 4 · 自动化与运营（需求确认后再做）

- 4.1 博主订阅每日刷新：本地 APScheduler/cron 任务 + 扩展侧现成的 `__redboxSubscriptionCapture`（依赖 1A 的回执才可能通过校验）；沿用 Easel 现有冷却/小时上限做风控面。
- 4.2 关键词定时采集、`accounts.*` 账号档案（依赖运营需求）。
- 4.3 browser-control/MCP 自动化面：**单独立项评估**（涉及 `debugger` 权限与竞品页注入伦理，不混在本线）。

## 阶段 5 · 分发形态（仅当 Easel 要对外）

- 用 fork Obsidian Web Clipper（MIT）+ 自研站点适配器替换 beav-capture（MIT-NC 只能留在个人本机）。当前不启动。

## 决策点（需要用户拍板的才问，其余按推荐默认执行）

1. **开工范围**：阶段 0+1 直接开工（推荐）；阶段 2 的 whisper/yt-dlp 是否要（涉及装重依赖）。
2. 语义检索（3.1）先不做，等 FTS 上线后看真实检索满意度——推荐默认。
3. 合并回主树的时机：全部阶段验收后一次性 cherry-pick，或按阶段合——需与 grok 在主树的改动错峰，**由用户定**。

## 明确不做

- 不引入 Karakeep/SiYuan/open-notebook 整块后端（04·§0 方案丙否决）；不上 Qdrant/RAGFlow/Meilisearch 服务。
- 不把 MIT-NC/AGPL 代码并入将分发的产物；不给个人库上设备数/席位体系。
- 不主动触碰 `Easel-official` 主树、7870、18789（HANDOFF 红线）。
