# 04 · 开源组件调研：复刻 Beav「采集 + 知识库」板块的可复用件清单

> 调研日期：2026-09-21。星数 / 许可证 / 最近活动均为当日 `gh api`（GitHub REST）实测值，非记忆值。
> 判断口径：**个人本地使用**（用户当前场景）是否合法可行 → 几乎全部可行；一旦涉及**再分发或商用**，AGPL/BUSL/MIT-NC/无许可证 四类会立刻变成坑。
> 匹配度 = 与「自媒体素材库（网页/小红书/B站/公众号 + 仿写）」场景的贴合程度：★★★ 直接可用 / ★★ 需适配 / ★ 只作参考。

---

## 0. 结论先行（两个必答问题）

### a) 最小代价覆盖 Beav 知识库核心体验的组合

Beav 知识库的四个核心体验：**收藏即入库 → 自动标签 → 全文+语义搜索 → 素材被写作引用**。对应最省事的开源件搭配（方案甲，推荐）：

| 体验 | 复用件（许可证） | 集成方式 | 我们要写的胶水 |
|---|---|---|---|
| 收藏即入库（正文+存档） | Defuddle（MIT）或已有 Readability（Apache-2.0）在浏览器侧抽取；服务端兜底 trafilatura（Apache-2.0）；整页存档 monolith（CC0，公共领域） | 直接嵌插件 content script / 后端子进程 | 只加「抽取器二选一」开关 + 落库字段 |
| 自动标签 + 摘要 + 规则 | **照抄 Karakeep 的设计**（AGPL-3.0，只读参考）：LLM 打标/摘要（可走 Ollama 本地）+ 规则引擎（按域名/关键词/列表强制打标） | 只做参考设计（不引入其代码，避免 AGPL 传染） | 一个 prompt + 一张 rules 表（几十行） |
| 全文 + 语义搜索 | 全文：SQLite FTS5 + jieba 预切词（零新增服务）或 Meilisearch sidecar（核心 MIT，自带中文分词 charabia）；语义：**bge-small-zh-v1.5 / Qwen3-Embedding-0.6B（均 MIT/Apache-2.0）+ sqlite-vec（Apache-2.0）**，量小直接 numpy 暴力 | 后端进程内（FTS5/sqlite-vec）或 Docker sidecar（Meilisearch） | 建索引 + 混合排序（RRF）约 200 行 |
| 素材 → 写作引用 | 检索层复用上一行；引用格式照抄 **chubbyskills（MIT）** 的「资料包：原文摘录 + 行号 + 来源 + 文件摘要」 | 直接读其 schema/CLI 设计；或调 Karakeep REST 语义搜索 | 把检索结果注入现有仿写 prompt（已有管线，改动小） |

**关键判断（推断，非搜索事实）**：个人素材库量级（数千～数万条）不需要独立向量数据库；`sqlite-vec` 或纯 numpy 余弦即可，别为 Qdrant/RAGFlow 增加一套 Docker 运维。

**方案乙（更快但更重）**：直接 Docker 起 **Karakeep**（web + chrome + meilisearch 三容器，v0.33.2）承担「抓取-打标-全文/语义搜索-OCR-全文存档-视频存档」，Easel 通过它的 REST API 读写，本地 `sources` 表只存 Karakeep ID 与 URL。个人本地用 AGPL 无问题；**代价**：多一套服务 + 账号体系 + 数据在两个库里，商用分发时 AGPL 网络传染性必须评估。
**方案丙（不建议）**：把 SiYuan / Logseq / AFFiNE / Outline 整块当后端 —— 它们是「另一套完整工作台」，UI 不可嵌、数据模型与自媒体素材字段不匹配，集成成本高于自研薄层。

### b) 必须自研的部分（以及成熟参照项目）

1. **浏览器侧采集 UI**（sidepanel / popup / 高亮选取 / 站点模板选择 / 与本地后端握手）：没有「许可友好 + 现成可嵌」的第三方件。可 **fork 的只有 Obsidian Web Clipper（MIT，TS，含模板引擎与高亮）**；其余同类（Karakeep、Linkwarden、简悦）都是 AGPL/GPL，只能读不能闭源复用。
2. **站点适配器（小红书 / B站 / 公众号选择器与登录态处理）**：无跨站通用开源件（平台反爬与改版使适配器天然易腐）。参照优先级：RSSHub 路由库（AGPL，站点覆盖面最大）> Bilibili-Evolved（MIT + 再分发限制，B站 DOM 适配最细）> 简悦站点模式（数百站适配数据，2.x 闭源）> MediaCrawler / xiaohongshu-mcp（登录态复用思路）。
3. **素材 schema 与「选题-素材-成稿-复盘」语义、平台标签体系**：无现成件；但要做薄（一张表 + 几个枚举），不要自研数据库层。
4. **现有 `extensions/beav-capture` 必须替换**：它来自 Jamailar/Beav（MIT — Non-Commercial Use Only，见仓库内 `LICENSE.Beav-MIT-NC.txt`），当前 NOTICE 已自我限定「仅供本机个人非商用」。**只要 Easel 有商用/开源分发打算，这个采集器不能进发布物**，须用上面 (1)(2) 自研件替掉。

---

## 1. 本地基线（为什么上面这些是缺口）

- `easel/research.py`：素材库是单表 `sources(id,url,title,platform,topic,content,state,captured_at,asset_path,method,author,kind,cover_url,extra_json)`，搜索是 `WHERE title LIKE ? OR topic LIKE ? OR content LIKE ? ...` + `LIMIT 200`（`easel/research.py:90`）。→ **无分词全文、无标签体系、无向量、无排序质量**，正是 Beav 知识库体验差距所在。
- `extensions/easel-clipper`：已内置 `Readability.js`（Apache-2.0，附 `LICENSE.Readability.md`）。→ 正文抽取已解决，别重复造。
- `web/clipper_api.py`：已有 `clipper-pair` / `clipper-download` 端点，即插件↔本地后端通道已存在。→ 采集 UI 自研成本主要在浏览器侧，不在协议侧。

---

## 2. 功能块 1 · 网页正文抽取 / 剪藏

| 项目 | 许可证 | 星数 / 最近活动 | 匹配度 | 集成方式 |
|---|---|---|---|---|
| [mozilla/readability](https://github.com/mozilla/readability) | Apache-2.0 | 11,451 / 2026-08-04 | ★★★（已在用） | content script 直接嵌（现状保持） |
| [kepano/defuddle](https://github.com/kepano/defuddle) | **MIT** | 9,463 / 2026-09-20，v0.19.4 | ★★★ | npm 包，浏览器 + Node 双端；「抽正文 → Markdown」一步到位 |
| [obsidianmd/obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper) | MIT（商标/素材除外） | 5,217 / 2026-09-20，release 1.7.1（2026-07-22） | ★★★（采集 UI + 模板引擎参照，可 fork） | 直接 fork；其 package.json 依赖 `defuddle ^0.19.2`，即抽取层与我们同源 |
| [gildas-lormeau/SingleFile](https://github.com/gildas-lormeau/SingleFile) | **AGPL-3.0** | 22,439 / 2026-09-20 | ★★（整页存档，抗链接腐烂；对小红书/公众号这类强样式站特别有用） | 独立扩展使用（其「upload to REST Form API」目标端点即可对接我们后端）；不要并入我们代码 |
| [Y2Z/monolith](https://github.com/Y2Z/monolith) | **CC0-1.0（公共领域）** | 15,487 / 2026-05-25 | ★★（服务端单文件存档，零许可风险） | 后端子进程调用（Karakeep 就是这么做的） |
| [adbar/trafilatura](https://github.com/adbar/trafilatura) | Apache-2.0 | 6,842 / 2026-09-11 | ★★★（服务端 Python 兜底：插件没抽干净时二次抽取） | `pip install` 进程内，与 Easel 技术栈完全吻合 |
| [buriy/python-readability](https://github.com/buriy/python-readability) / [goose3/goose3](https://github.com/goose3/goose3) | Apache-2.0 | 2,894 / 2026-08-27；914 / 2026-07-23 | ★★ | trafilatura 的下位替代 |
| [postlight/parser（Mercury Parser）](https://github.com/postlight/parser) | Apache-2.0 | 5,791 / **最后 push 2024-07-10（事实停更）** | ★（仅参考其「站点规则 + 自定义 extractor」设计） | 只作参考设计；不建议新增依赖 |
| [Kenshin/simpread（简悦）](https://github.com/Kenshin/simpread) | GPL-3.0（**README 明示：1.x 开源，2.x 闭源了「标注」与「稍后读」**） | 8,711 / 2026-09-05 | ★★（参考设计：数百站点适配 + 用户可编辑「模式」= 站点适配器产品化） | 只作设计参照；代码 GPL 且核心功能闭源 |

要点：
- Obsidian Web Clipper 的**模板机制**是本次最值得抄的一块：变量 / filters / 模板内 if-for 逻辑 / 站点专属模板 / 高亮（highlighting）分层，README 有明确的 checklist 与文档链接（[help.obsidian.md/web-clipper/templates](https://help.obsidian.md/web-clipper/templates)、[variables](https://help.obsidian.md/web-clipper/variables)、[filters](https://help.obsidian.md/web-clipper/filters)）。社区模板集 [web-clipper-templates](https://github.com/community-archive/web-clipper-templates)（MIT，848★，2026-04-11）可直接改造成我们的「站点 → 素材字段」映射表。⚠️ 该仓库现位于 `community-archive` 组织下，是否已停止维护**未核实**。
- **建议动作**：抽取层保持 Readability，另接 Defuddle 作为可切换的第二抽取器（MIT、更强调 Markdown、且是 Obsidian 官方剪藏器的当前底座）。

---

## 3. 功能块 2 · 社交 / 视频素材采集（含合规红线）

| 项目 | 许可证 | 星数 / 最近活动 | 匹配度 | 说明与集成方式 |
|---|---|---|---|---|
| [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) | Unlicense（公共领域级） | 192,298 / 2026-09-16 | ★★★ | 官方支持站列表含 BiliBili 多个 extractor（视频/番剧/音频/课堂），**无小红书**（[supportedsites.md](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)）。后端子进程直接调；B站素材的「下载 + 字幕」应完全外包给它 |
| [mikf/gallery-dl](https://github.com/mikf/gallery-dl) | GPL-2.0 | 19,776 / 2026-09-19 | ★ | 其 supported_domains 中 grep 不到 xiaohongshu / bilibili / wechat / weibo / douyin / zhihu —— **对中文社媒无用**，只适合 Pixiv/Twitter 类图库 |
| [NanmiCoder/MediaCrawler](https://github.com/NanmiCoder/MediaCrawler) | **NON-COMMERCIAL LEARNING LICENSE 1.1**（GitHub 识别为 NOASSERTION） | 65,359 / 2026-09-19 | ★★ | 小红书/抖音/快手/B站/微博/贴吧/知乎，思路是 Playwright 复用登录态、不逆向签名；README 自带免责声明「仅供学习，禁止商业用途」并列了[国内爬虫违法案例集](https://github.com/hiddendevj/Crawler_Illegal_Cases_In_China)（4,739★，无许可证）。→ **只读代码/学架构，不进产品**；另有付费 Pro 仓库 [MediaCrawlerPro](https://github.com/MediaCrawlerPro) |
| [xpzouying/xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) | **Apache-2.0** | 15,892 / 2026-09-14 | ★★★（小红书侧最活跃的许可友好件） | 以 MCP server 形式暴露（本地浏览器登录态），可被 Easel 后端或 Agent 直接调；其插件版 [x-mcp](https://github.com/xpzouying/x-mcp)（460★，2026-09-10）**未标许可证** → 不可复用代码，未核实 |
| [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | MIT | 83,749 / 2026-09-15 | ★★ | 声称给 Agent 一键接入 Twitter/Reddit/YouTube/GitHub/B站/小红书，并强调「接入方式会换代，我们替你维护」；README 顶部为大量第三方抓取服务赞助商（BrowserAct/CoreClaw 等）——**是否依赖付费第三方 API 未核实**，隐私敏感场景先本地验证 |
| [chubbyguan/chubbyskills](https://github.com/chubbyguan/chubbyskills) | MIT | 688 / 2026-09-17，v0.13.0 | ★★★（**场景最贴合**） | 14 个 Agent Skill + CLI：把视频字幕/播客转录/文章/图文采集 → 本地 Markdown 素材库 → 关键词搜索 + 可选语义检索 → 导出「带出处资料包（摘录+行号+来源）」→ 交给 Agent 选题。Python 3.11/3.12，README 写明 macOS/Linux（**Windows 支持未核实，需实测**） |
| [wechat-article/wechat-article-exporter](https://github.com/wechat-article/wechat-article-exporter) | MIT | 12,929 / 2026-08-07 | ★（**路线已死**） | README 顶部 WARNING：**2026-07-30 起停止维护**，因「微信上游核心接口被官方关闭且大概率不再开放」；在线站域名 2026-10-30 到期；公开 API 已下线。→ 公众号**批量历史导出**不要再当作产品假设；同组织 [mprss](https://github.com/wechat-article/mprss)/[wxdown-service](https://github.com/wechat-article/wxdown-service) 受同样影响（未逐一核实） |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | AGPL-3.0 | 46,271 / 2026-09-20 | ★★ | 仓库 `lib/routes/` 实测含 `xiaohongshu`、`bilibili`、`wechat`、`zhihu` 路由目录。作为「订阅式自动入库」引擎本地自托管最省事；AGPL → 只能进程外调用，不可把其代码并入 Easel |
| [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) | 无 SPDX 许可证（文档集） | 20,212 / 2026-01-30 | ★★ | B站接口/签名/风控的权威文档，写适配器前必读；[Nemo2011/bilibili-api](https://github.com/Nemo2011/bilibili-api)（4,174★，2026-07-06，许可证字段空 → 未核实）与 [the1812/Bilibili-Evolved](https://github.com/the1812/Bilibili-Evolved)（30,540★，MIT + 再分发限制：转载须保留 README 安装入口或自建支持渠道）是两条可参考实现 |
| [ReaJason/xhs](https://github.com/ReaJason/xhs) | MIT | 2,210 / **2025-07-01** | ★ | 逆向 Web API 的小红书客户端，已明显滞后，只作签名细节参考 |
| [3441293738/creatorhub](https://github.com/3441293738/creatorhub) | **无许可证** | 2,110 / 2026-09-20 | ★ | 多平台内容监控/采集 Web 面板；无许可证 = 默认保留所有权利，**只能看思路** |

合规红线（事实 + 常识判断，非法律意见）：
1. 走「**用户自己浏览器里点一下采集**」（我们现状）风险最低：不绕过登录、不破签名、单条、个人使用。
2. 一旦做「批量抓取他人主页/搜索页、绕过签名或风控、把采集结果对外分发」，风险等级跳变；MediaCrawler README 直接列了国内判例集（见上表），且其许可证本身禁止商用。
3. 公众号侧：微信官方接口关闭使「批量导出」不可持续（wechat-article-exporter 停维护即证据）。可行替代只有：(a) 用户在自己已登录的浏览器/微信里逐篇采集（我们的插件路线）；(b) 自己是运营者时用**微信公众平台官方 API**（Easel 已有 `WECHAT_OA_INTEGRATION.md`）；(c) RSSHub 类第三方中转（AGPL + 稳定性看脸）。

---

## 4. 功能块 3 · 本地知识库 / 素材管理后端

| 项目 | 许可证 | 星数 / 最近活动 | 匹配度 | 集成方式与关键事实 |
|---|---|---|---|---|
| [karakeep-app/karakeep](https://github.com/karakeep-app/karakeep)（原 Hoarder） | AGPL-3.0 | 29,168 / 2026-09-19，v0.33.2（2026-08-11） | ★★★（功能块命中最高） | 官方 README 特性：链接标题/描述/图片自动抓取、**全文 + 语义搜索**、**LLM 自动打标与摘要（支持 Ollama 本地模型）**、**规则引擎**、图片 OCR、monolith 整页存档、yt-dlp 视频存档、RSS 自动入库、REST API + 多客户端、Chrome/Firefox/Safari 扩展、CLI + MCP + 官方 agentic skills、Pocket/Omnivore/Linkwarden 导入器。部署 = compose 三容器（web / chrome / meilisearch v1.41.0）；裁剪版可去 chrome+meilisearch，但会失去截图/JS 站抓取与全部搜索能力。有**专门给 SingleFile 扩展的入库端点** `/api/v1/bookmarks/singlefile?ifexists=...`（含 skip/overwrite/append 语义）——这个幂等设计值得直接抄 |
| [siyuan-note/siyuan](https://github.com/siyuan-note/siyuan) | AGPL-3.0 | 46,440 / 2026-09-20，v3.8.4（2026-09-17） | ★★ | `docs/API.md` 实测覆盖：Notebooks / Documents / **Assets 上传** / Blocks 全套 CRUD（kramdown、子块、引用迁移）/ 块属性 / **任意 SQL 查询** / Templates（**Sprig 模板渲染**）/ File 读写 / 导出 / Pandoc / **Database（属性视图：字段增删、行增删、视图/分组/筛选/排序、行搜索）** / Search（含保存检索条件）。认证 = `Settings → Authentication → API token` + `Authorization: Token xxx`；文档明确「只有单列成节的接口才是公开 API，其余内核路由不保证兼容」。→ 想抄「块级 + 双链 + 属性视图 + 本地 API」的设计，抄它最划算；想把它当 Easel 的后端，收益低于成本（Electron 整应用 + AGPL） |
| [usememos/memos](https://github.com/usememos/memos) | **MIT** | 63,188 / 2026-09-20，v0.31.0（2026-09-19） | ★★ | 单 Go 二进制轻后端，Markdown 原生、快捕获、有 API；但**无正文抽取、无 LLM 打标**（README 未列 → 以「未核实」为准则），只能当「素材备注/碎片」侧 |
| [wallabag/wallabag](https://github.com/wallabag/wallabag) | MIT | 12,974 / 2026-09-14 | ★★ | 老牌稍后读（PHP/MySQL）：抽取-清洗-打标-REST API 齐全，但技术栈与 Easel 不搭，AI 能力缺位 |
| [linkwarden/linkwarden](https://github.com/linkwarden/linkwarden) | AGPL-3.0 | 19,814 / 2026-09-10 | ★★ | 协同书签 + 完整存档 + 浏览器扩展；同样只宜参考或旁挂 |
| [go-shiori/shiori](https://github.com/go-shiori/shiori) | MIT | 11,643 / 2026-07-10 | ★★ | 极简「稍后读」单二进制 + 全文搜索，许可干净，适合当「最小自托管后端」对照样本 |
| [TriliumNext/Trilium](https://github.com/TriliumNext/Trilium) | AGPL-3.0 | 37,914 / 2026-09-20 | ★ | 层级笔记 + ETAPI（REST）；注意旧仓库名 TriliumNext/Notes 已 archived（2,926★） |
| [logseq/logseq](https://github.com/logseq/logseq) | AGPL-3.0 | 44,984 / 2026-09-20 | ★ | 双链大纲；正处于 DB 版本迁移期，插件生态强但不适合作 Easel 后端 |
| [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE) | 混合（`packages/backend`、`packages/common/native` 走单独 LICENSE，其余按文件声明） | 72,787 / 2026-09-20 | ★ | 商用前必须逐目录核许可，成本高 |
| [outline/outline](https://github.com/outline/outline) | **BUSL-1.1**（Additional Use Grant：不得用作「Document Service」；到期转开源） | 40,635 / 2026-09-20 | ★ | 团队 Wiki 定位，许可对「做成对外服务」有限制；不适合 |
| [omnivore-app/omnivore](https://github.com/omnivore-app/omnivore) | AGPL-3.0 | 16,259 / 2026-09-19，最新 release android-0.229.0（2026-08-28） | ★（参考设计） | 托管服务 2024-11 随团队并入 ElevenLabs 关停（[公告讨论 #4538](https://github.com/omnivore-app/omnivore/issues/4538)、多方[停服报道](https://molodtsov.me/2024/10/omnivore-is-dead-where-to-go-next/)）；仓库仍在提交，但**自托管可维护性存疑（未核实）**。它的「高亮/批注 + 队列式解析（parser+worker）」架构很值得看 |

---

## 5. 功能块 4 · 语义检索 / RAG（素材库问答、相似素材推荐）

### 5.1 向量与全文底座（按「Easel = Python + SQLite + React」排序）

| 组件 | 许可证 | 星数 / 最近活动 | 匹配度 | 用法 |
|---|---|---|---|---|
| [asg017/sqlite-vec](https://github.com/asg017/sqlite-vec) | Apache-2.0 | 8,121 / 2026-05-18，v0.1.9（2026-03-31） | ★★★（**最省事**，但 README 顶部 IMPORTANT 声明 pre-v1 会有破坏性变更；Mozilla Builders 项目） | `SELECT load_extension` 即在现有 sqlite 库里加 `vec0` 虚表；与 `sources` 表同库同事务，无需新服务。⚠️ Windows 下需预编译扩展（该扩展官方以 C 实现、跨平台可编，但**Windows wheel 可用性未实测**） |
| [lancedb/lancedb](https://github.com/lancedb/lancedb) | Apache-2.0 | 11,476 / 2026-09-20 | ★★ | 嵌入式（进程内）列存向量库，数据量长大后的升级路径；AnythingLLM 默认就用它 |
| [neuml/txtai](https://github.com/neuml/txtai) | Apache-2.0 | 12,964 / 2026-09-15 | ★★ | 一个 Python 库同时给 **BM25 + 向量 + 混合检索**，不想自己拼 FTS5+vec 时的备选；依赖相对重（transformers/annoy 系） |
| [meilisearch/meilisearch](https://github.com/meilisearch/meilisearch) | **核心 MIT + 部分 EE BUSL-1.1**（LICENSE 明示 `MIT AND BUSL-1.1`） | 59,345 / 2026-09-17 | ★★★（中文全文体验最好） | Docker sidecar；中文分词由其 [charabia](https://github.com/meilisearch/charabia)（MIT，358★）提供，另带容错/前缀/属性过滤。若不想自己实现分词与 ranking，这是最短路径 |
| [Typesense/typesense](https://github.com/typesense/typesense) | **GPL-3.0** | 26,575 / 2026-09-20 | ★★ | Meilisearch 的替代；GPL → 只能进程外 |
| [chroma-core/chroma](https://github.com/chroma-core/chroma) / [qdrant/qdrant](https://github.com/qdrant/qdrant) / [unum-cloud/USearch](https://github.com/unum-cloud/USearch) | Apache-2.0 ×3 | 29,337 / 2026-09-18；34,710 / 2026-09-19；4,309 / 2026-08-31 | ★（对个人素材库偏重） | Qdrant/Chroma 引入独立服务与运维心智；USearch 适合自己做 ANN |
| [lucaong/minisearch](https://github.com/lucaong/minisearch) | MIT | 6,139 / 2025-09-16（**已一年多没动，未核实是否停维护**） | ★★ | 纯前端 JS 内存索引：把标题/标签/摘要下发给 React 做「即时搜索 + 高亮」，与后端 FTS 分工；中文需自建 tokenizer |
| [fxsjy/jieba](https://github.com/fxsjy/jieba) | MIT | 35,162 / **2024-08-21**（稳定但停滞） | ★★★（中文切词，服务 FTS5） | SQLite FTS5 的 `unicode61` 不分中文词（[官方文档](https://sqlite.org/fts5.html#unicode61_tokenizer)）→ 入库前用 jieba 预切词、空格连接，是最便宜的中文全文方案 |

**嵌入模型（Hugging Face API 当日实测 license 字段）**：
- [BAAI/bge-small-zh-v1.5](https://huggingface.co/BAAI/bge-small-zh-v1.5) `mit`，5.0M 下载 —— 中文轻量首选，CPU 可跑。
- [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3) `mit`，37.6M 下载 —— 长文/混合检索（最后更新 2024-07，属成熟稳定而非活跃）。
- [Qwen/Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) `apache-2.0`，8.6M 下载，2026-04 仍在更新 —— **中文效果与活跃度综合最优**。
- [google/embeddinggemma-300m](https://huggingface.co/google/embeddinggemma-300m) license 为 `gemma`（非纯 OSI 开源，附使用政策），本地端侧小模型可考虑，但**商用分发需读 Gemma 条款（未核实细节）**。
- [shibing624/text2vec](https://github.com/shibing624/text2vec) Apache-2.0（4,975★ / 2026-02-14）：中文句向量取用方便的封装。
- 提醒：中文 embedding 生态里存在 CC-BY-NC 类模型，选型时逐模型看 license，不要只看「开源」标签。

### 5.2 现成 RAG 应用（若宁可旁挂一个完整产品）

| 项目 | 许可证 | 星数 / 最近活动 | 判断 |
|---|---|---|---|
| [lfnovo/open-notebook](https://github.com/lfnovo/open-notebook) | **MIT** | 39,266 / 2026-09-18 | 「本地版 NotebookLM」：多 Notebook/多源（PDF、视频、音频、网页）、**全文 + 向量搜索**、**带来源引用（citations）的对话**、可自定义 Content Transformation（摘要/洞察抽取）、**完整 REST API（:5055/docs）+ MCP 集成**、18+ provider 含 Ollama/LM Studio。栈 Python+FastAPI+Next.js+React+SurrealDB(v2)+LangChain，compose 起。**这是「素材→问答/引用」最省事的旁挂件**；代价是多一套 SurrealDB/FastAPI 服务 |
| [Mintplex-Labs/anything-llm](https://github.com/Mintplex-Labs/anything-llm) | MIT | 66,251 / 2026-09-19 | 桌面/Docker 双形态、默认内嵌 LanceDB、有 **Developer API**；浏览器扩展在独立仓库 [anythingllm-extension](https://github.com/Mintplex-Labs/anythingllm-extension)（MIT，221★，**最后 push 2024-09-12 → 扩展已滞后**） |
| [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | Apache-2.0 | 91,055 / 2026-09-20 | 深度文档解析（版面/表格）+ Agent，效果强但部署重（ES/MinIO/MySQL 全家桶），个人素材库属过度工程 |
| [khoj-ai/khoj](https://github.com/khoj-ai/khoj) | AGPL-3.0 | 37,427 / **2026-08-02（相对偏慢）** | 「第二大脑」问答 + 自动化，Obsidian/文档对接好，AGPL 限制分发 |
| [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG) / [microsoft/graphrag](https://github.com/microsoft/graphrag) | MIT ×2 | 39,774 / 2026-09-20；36,043 / 2026-09-19 | 想给素材做「人物/选题/IP 关系图谱」时再上；第一阶段不必 |

**给 Easel 的具体路线（推断+偏好，按代价从低到高）**
1. 第 1 周：`sources` 表加 `tags / summary / embedding_id` 字段；jieba 预切词 + FTS5 虚表 → 立刻甩开 `LIKE '%q%'`；LLM 打标（Easel 已有模型网关）+ 规则表 → 覆盖「自动标签」。
2. 第 2 周：Qwen3-Embedding-0.6B 或 bge-small-zh → 向量存 sqlite-vec（数据量小则 numpy 暴力即可）；前端做「相似素材」与「素材问答（带 URL 引用）」。
3. 只有当「文档/PDF/视频长文解析、跨库多用户」成为需求，才考虑 Open Notebook / RAGFlow 旁挂。
4. 若希望连打标与搜索都不自研：直接 Docker 起 Karakeep 承担入库+打标+搜索，Easel 只存 URL/ID 引用（AGPL 边界 = 进程外 API 调用）。

---

## 6. 功能块 5 · AI 写作 / 仿写管线

| 项目 | 许可证 | 星数 / 最近活动 | 匹配度 | 结论 |
|---|---|---|---|---|
| [stylellm/stylellm_models](https://github.com/stylellm/stylellm_models)（StyleLLM 文风大模型） | Apache-2.0 | 364 / **2024-06-10（停更）** | ★ | 微调 Yi-6B 得到「四大名著」四个风格模型，做 润色/风格模仿。学术性 PoC：风格域不匹配自媒体，且需自己跑 6B 模型 → **不进管线**，只证明「风格可被微调/检索式模仿」 |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | MIT | 25,307 / 2026-09-20 | ★★★（**仿写质量的回归测试**） | 声明式 prompt 测试/断言（含 LLM-as-judge、自定义指标）：把「仿写是否保住原稿结构/口吻/禁用词」变成 CI 可跑的用例，这是目前 Easel 仿写管线最缺的一块 |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | **核心 MIT**（`ee/`、`web/src/ee/`、`worker/src/ee/` 单独许可） | 34,853 / 2026-09-20 | ★★ | 若要追踪「哪类素材 → 哪版 prompt → 成稿采纳率」，这是自托管可观测/评估面板；本地用没问题，商用分发注意 ee/ 边界 |
| [Agenta-AI/agenta](https://github.com/Agenta-AI/agenta) | 核心 MIT（`ee/` 单独） | 4,769 / 2026-09-20 | ★★ | prompt 版本管理 + playground；比 Langfuse 更偏「Prompt 工作台」 |
| [microsoft/promptflow](https://github.com/microsoft/promptflow) | MIT | 11,245 / 2026-08-26 | ★ | LLM 流程编排；Easel 已有 `workflows/`，重复 |
| [langgenius/dify](https://github.com/langgenius/dify) | **Apache-2.0 修改版**（不得做多租户 SaaS、前端不得移除 LOGO/版权；贡献者须允许其商用） | 156,588 / 2026-09-20 | ★（许可陷阱样本） | 别把「Apache-2.0」标签直接当真；商用前逐条读 LICENSE 附加条件 |
| [open-webui/open-webui](https://github.com/open-webui/open-webui) | 非标准（NOASSERTION，含品牌限制） | 152,611 / 2026-09-19 | ★ | 具体条款**未核实**，如需复用须逐字读 |

**结论（重要，别到处找轮子）**：**开源世界没有成熟的「自媒体仿写/改写风格引擎」**。可复用的只有 ①风格语料的检索（第 5 节的向量+标签）与 ②风格回归评测（promptfoo）。仿写本体继续用 Easel 现有 `docs/prompt-stack.md` 管线，做法建议固定为「**检索式 few-shot 风格卡**」：
- 素材库按 作者/账号 + 题材 + 结构标签 检索 K 篇 → 生成「风格卡」（句式长度分布、口头禅、开头/结尾模板、禁忌词），存成可 diff 的资产；
- 成稿时用风格卡 + 素材引用（带 URL/行号）一起进 prompt；
- 用 promptfoo 断言：字数区间、是否保留原稿事实点、口吻相似度（LLM-judge）、禁用词；
- 素材→引用格式照 chubbyskills（MIT）的「摘录 + 行号 + 来源 + 摘要」结构，保证可回溯。

---

## 7. 许可速查（按我们的使用方式）

| 类别 | 本项目代表 | 个人本地用 | 再分发 / 商用 |
|---|---|---|---|
| 宽松（MIT/Apache-2.0/Unlicense/CC0） | Defuddle、Obsidian Clipper、Readability、trafilatura、monolith(CC0)、yt-dlp(Unlicense)、xiaohongshu-mcp、open-notebook、AnythingLLM、sqlite-vec、LanceDB、txtai、chubbyskills、Agent-Reach、promptfoo、Memos、Shiori、Wallabag、Meilisearch(核心) | ✅ | ✅（Meilisearch/Agenta/Langfuse/AFFiNE 要看 `ee/`、`backend/` 分区） |
| Copyleft 强（AGPL/GPL） | **Karakeep、SiYuan、Logseq、Linkwarden、Trilium、Omnivore、RSSHub、SingleFile、Khoj、Typesense、简悦**、gallery-dl | ✅（自托管/本地跑都合法） | ⚠️ 只能进程外调用；改动并对外提供网络服务需开放源码 |
| 非商业 / 附加条件 | **Beav（MIT-NC）、MediaCrawler（NC Learning License）、Dify（多租户/LOGO 限制）、Outline（BUSL，禁做 Document Service）、Open WebUI（品牌限制）**、部分 Gemma 系模型 | ✅（个人学习/非商用） | ❌ 或须取得商用授权 |
| 无许可证 = 保留所有权利 | creatorhub、x-mcp、bilibili-API-collect（文档）、Nemo2011/bilibili-api、爬虫判例集 | ⚠️ 阅读/学习 OK | ❌ 不可复制代码 |

**当前仓库里的现实风险**：`extensions/beav-capture/`（源自 Jamailar/Beav 1,687★、MIT-NC、2026-09-19 仍在维护，51 个 JS 文件 5 万+ 行，含 `background.js` 26,511 行）只能作为**个人本机参考实现**；任何对外形态必须换成自研采集器（参照 Obsidian Clipper，MIT，可 fork）。

---

## 8. 未核实清单（需要实测再定）

1. sqlite-vec 在 Windows 下的预编译扩展 / Python 端加载方式（本机 `setup.ps1` 环境未验证）。
2. chubbyskills 的 Windows 支持（README 明确写 macOS/Linux + Python 3.11/3.12）。
3. `community-archive/web-clipper-templates` 是否已停止维护（组织名含 archive，但仓库 2026-04 仍有 push）。
4. Omnivore 自托管链路的当前可部署性（仓库仍在提交，但托管服务 2024-11 已停）。
5. Agent-Reach 是否依赖付费第三方抓取服务（README 赞助商区与「接入方式换代」表述暗示有外部服务）。
6. x-mcp（小红书插件版）与 creatorhub 的许可证归属（GitHub API license 字段为空）。
7. MiniSearch 是否仍在维护（最后 push 2025-09-16）。
8. Open WebUI / Agenta / Langfuse 的 `ee/` 具体边界条款（未逐字读）。
9. RSSHub 的小红书/公众号路由在当前（2026-09）是否需要付费第三方 token 或自建 puppeteer（未实跑）。

---

## 9. 一页行动建议（与「工具取用阶梯」对齐）

- **直接用（零自研）**：Defuddle/Readability（抽取）、trafilatura（服务端兜底）、monolith（存档）、yt-dlp（B站视频/字幕）、sqlite-vec 或 Meilisearch（检索）、Qwen3-Embedding/bge-small-zh（向量）、jieba（切词）、promptfoo（仿写回归测试）、xiaohongshu-mcp（小红书侧 MCP 取数）、chubbyskills（素材→带出处资料包的 schema）。
- **只抄设计（不引代码）**：Karakeep（打标 + 规则引擎 + SingleFile 入库端点的 ifexists 幂等 + 全文&语义搜索并存）、SiYuan（本地 API 分区：公开/内部；块与属性视图；Sprig 模板）、Obsidian Clipper（模板/变量/filters/highlight 四层）、简悦与 RSSHub（站点适配器的组织方式）、Bilibili-Evolved（B站 DOM 适配细节）。
- **必须自研**：采集插件 UI 与站点适配器、素材 schema 与「选题-素材-成稿-复盘」状态机、风格卡生成与注入、替换 `beav-capture`。
- **不要做**：把 SiYuan/Logseq/AFFiNE/Outline 整块当后端；为个人素材库上 Qdrant/RAGFlow 全家桶；引入 MediaCrawler/Beav 代码到可分发发布物。

---

## 10. 来源汇总

正文抽取：[mozilla/readability](https://github.com/mozilla/readability) · [kepano/defuddle](https://github.com/kepano/defuddle) · [obsidianmd/obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper) · [Web Clipper 模板/变量/filters 文档](https://help.obsidian.md/web-clipper/templates) · [community-archive/web-clipper-templates](https://github.com/community-archive/web-clipper-templates) · [gildas-lormeau/SingleFile](https://github.com/gildas-lormeau/SingleFile) · [Y2Z/monolith](https://github.com/Y2Z/monolith) · [adbar/trafilatura](https://github.com/adbar/trafilatura) · [buriy/python-readability](https://github.com/buriy/python-readability) · [goose3](https://github.com/goose3/goose3) · [postlight/parser](https://github.com/postlight/parser) · [Kenshin/simpread](https://github.com/Kenshin/simpread)

采集：[yt-dlp supportedsites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md) · [mikf/gallery-dl supported_domains](https://github.com/mikf/gallery-dl/blob/master/docs/supported_domains.md) · [NanmiCoder/MediaCrawler](https://github.com/NanmiCoder/MediaCrawler) · [Crawler_Illegal_Cases_In_China](https://github.com/hiddendevj/Crawler_Illegal_Cases_In_China) · [xpzouying/xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) · [xpzouying/x-mcp](https://github.com/xpzouying/x-mcp) · [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) · [chubbyguan/chubbyskills](https://github.com/chubbyguan/chubbyskills) · [wechat-article-exporter 停维护说明](https://github.com/wechat-article/wechat-article-exporter) · [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) · [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) · [Nemo2011/bilibili-api](https://github.com/Nemo2011/bilibili-api) · [the1812/Bilibili-Evolved](https://github.com/the1812/Bilibili-Evolved) · [ReaJason/xhs](https://github.com/ReaJason/xhs) · [creatorhub](https://github.com/3441293738/creatorhub)

知识库后端：[karakeep 特性文档](https://github.com/karakeep-app/karakeep/blob/main/docs/docs/01-getting-started/01-intro.md) · [Karakeep × SingleFile 集成](https://github.com/karakeep-app/karakeep/blob/main/docs/docs/05-integrations/05-singlefile.md) · [Karakeep 部署依赖说明](https://github.com/karakeep-app/karakeep/blob/main/docs/docs/02-installation/07-minimal-install.md) · [SiYuan API.md](https://github.com/siyuan-note/siyuan/blob/master/docs/API.md) · [usememos/memos](https://github.com/usememos/memos) · [wallabag](https://github.com/wallabag/wallabag) · [linkwarden](https://github.com/linkwarden/linkwarden) · [shiori](https://github.com/go-shiori/shiori) · [TriliumNext/Trilium](https://github.com/TriliumNext/Trilium) · [logseq](https://github.com/logseq/logseq) · [AFFiNE](https://github.com/toeverything/AFFiNE) · [Outline LICENSE(BUSL-1.1)](https://github.com/outline/outline/blob/main/LICENSE) · [omnivore #4538](https://github.com/omnivore-app/omnivore/issues/4538) · [Omnivore 停服复盘](https://molodtsov.me/2024/10/omnivore-is-dead-where-to-go-next/)

检索/RAG：[asg017/sqlite-vec](https://github.com/asg017/sqlite-vec) · [lancedb](https://github.com/lancedb/lancedb) · [qdrant](https://github.com/qdrant/qdrant) · [chroma](https://github.com/chroma-core/chroma) · [USearch](https://github.com/unum-cloud/USearch) · [txtai](https://github.com/neuml/txtai) · [Meilisearch LICENSE(MIT+BUSL)](https://github.com/meilisearch/meilisearch/blob/main/LICENSE) · [charabia](https://github.com/meilisearch/charabia) · [Typesense](https://github.com/typesense/typesense) · [minisearch](https://github.com/lucaong/minisearch) · [jieba](https://github.com/fxsjy/jieba) · [SQLite FTS5 tokenizers](https://sqlite.org/fts5.html#unicode61_tokenizer) · [open-notebook](https://github.com/lfnovo/open-notebook) · [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) · [anythingllm-extension](https://github.com/Mintplex-Labs/anythingllm-extension) · [RAGFlow](https://github.com/infiniflow/ragflow) · [Khoj](https://github.com/khoj-ai/khoj) · [LightRAG](https://github.com/HKUDS/LightRAG) · [GraphRAG](https://github.com/microsoft/graphrag) · 模型卡：[bge-m3](https://huggingface.co/BAAI/bge-m3) · [bge-small-zh-v1.5](https://huggingface.co/BAAI/bge-small-zh-v1.5) · [Qwen3-Embedding-0.6B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) · [embeddinggemma-300m](https://huggingface.co/google/embeddinggemma-300m) · [text2vec](https://github.com/shibing624/text2vec)

写作/prompt：[StyleLLM](https://github.com/stylellm/stylellm_models) · [promptfoo](https://github.com/promptfoo/promptfoo) · [Langfuse LICENSE](https://github.com/langfuse/langfuse/blob/main/LICENSE) · [Agenta LICENSE](https://github.com/Agenta-AI/agenta) · [promptflow](https://github.com/microsoft/promptflow) · [Dify LICENSE 附加条件](https://github.com/langgenius/dify/blob/main/LICENSE) · [Open WebUI](https://github.com/open-webui/open-webui)

对标件与被替换件：[Jamailar/Beav](https://github.com/Jamailar/Beav)（MIT-NC）· 本地 `F:\科研大师兄\自媒体工作台\Easel-official\extensions\beav-capture\LICENSE.Beav-MIT-NC.txt`、`NOTICE.Easel.txt`
