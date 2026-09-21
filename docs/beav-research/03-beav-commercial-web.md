# Beav（原 RedBox）商业版调研报告 · 网络侧

> 调研日期：2026-09-21（本报告全部为公开网络资料 + GitHub 公开仓库/代码 + 本机已有的 2.7.18 插件副本反向阅读；未安装或运行商业桌面端）
> 用途：为 Easel「本地素材库 + 采集插件」复刻 Beav 商业版功能（尤其知识库板块）提供事实基线
> 证据标记：**[已核实]**＝有一手来源；**[推断]**＝由多处旁证推出；**[未核实]**＝公开渠道找不到，禁止当作结论使用

---

## 0. 结论速览（先看这 8 条）

1. **[已核实] 产品身份成立**：`Jamailar/Beav` 是真实仓库（1,687 star / 228 fork，创建于 2025-06-04，最近 push 2026-09-19），README 自述「AI 自媒体工作台」，主页 `https://getbeav.com/`，下载 CDN 就是插件里那个 `redbox.ziz.hk`。来源：https://github.com/Jamailar/Beav 、`gh api repos/Jamailar/Beav`
2. **[已核实] 「商业版」不是一个独立分支，而是同一产品的官方发布线**：桌面端 + 浏览器插件 + 官网 + 支付/积分体系；开源仓库 MIT-NC，README 明说「生产安装包与本仓库并非同步版本……开源版本通常会有一定滞后」。来源：https://github.com/Jamailar/Beav/blob/main/README.md#%E5%BC%80%E6%BA%90%E7%89%88%E6%9C%AC%E8%AF%B4%E6%98%8E
3. **[已核实] 版本对应关系**：当前生产 App = `2.8.4`（2026-09-17），浏览器插件 = `2.7.18`（2026-09-18 上架 Chrome 商店，500KiB，333 用户，无评分）。我们本地副本 `2.7.18.65535 / version_name 2.7.18` 与之对齐。来源：https://www.getbeav.com/download 、https://chromewebstore.google.com/detail/dhfphfekcjahljnefpdjoidehnhhoeie
4. **[已核实] Native Host 归属确认**：插件更新/上报域为 `redbox.ziz.hk`（`/api/updates/plugin`、`/download`）、`api.ziz.hk`（`/beav/v1/public-feedback`）；`com.redbox.browser_control` 即这条产品线的宿主名。来源：本机 `<仓库根目录>\extensions\beav-capture\manifest.json` + `background.js` 内 `native://beav/knowledge`
5. **[已核实] 知识库不是云盘，是本地文件库 + 索引层**：隐私政策原文「本地工作区、素材、稿件、知识库、配置、日志等默认保存在您的设备上」「仅当您使用官方 AI、云端处理、联网模型或反馈上传时，这些内容才会离开本地设备」。来源：https://www.getbeav.com/privacy
6. **[已核实] 知识库检索已从向量转向「Agentic Search（文件系统 + grep/FTS）」**：仓库 ROADMAP 里程碑「2026-01-30 - Agentic Search 与知识库聊天：**移除向量检索**，转向 Agentic Search」；技术债条目「Embedding 检索残留 / 已清理完毕」。来源：https://github.com/Jamailar/Beav/blob/main/ROADMAP.md
7. **[已核实] 收费边界是「授权 + 积分」两条线，且互相独立**：用户协议原文「会员身份与积分账户相互独立。购买、持有或升级会员**不代表**获得免费 AI 调用额度，不免除积分消耗」。来源：https://github.com/Jamailar/Beav/blob/main/desktop/src/features/legal/legalDocuments.ts（与官网 https://www.getbeav.com/privacy 同源条款）
8. **[已核实] 「红宝盒」是噪音**：搜到的「红宝盒创业网」是 `xm.hongbaohe.com`（网创课程站），Google Play「红盒智能」是 `com.redbox.iot.app`（IoT 硬件 App），都与本产品无关。产品中文名只有 **RedBox → Beav**，无官方中文名。来源：https://xm.hongbaohe.com/ 、https://play.google.com/store/apps/details?id=com.redbox.iot.app.redbox&hl=zh_CN

---

## 1. 产品身份与关系链 [已核实]

### 1.1 仓库事实（`gh api repos/Jamailar/Beav`）

| 项 | 值 |
| --- | --- |
| 全名 / 地址 | `Jamailar/Beav` · https://github.com/Jamailar/Beav |
| 定位（repo description） | 「小红书 AI 工作台｜小红书采集、评论区下载、素材库、选题、AI写作、自媒体素材库、AI写作+图片自动编排、小红书版OpenClaw……支持小红书图文+评论区下载、抖音、小红书爬虫数据采集」 |
| Star / Fork / Watch | 1,687 / 228 / 1,687 |
| 语言 / 议题 | TypeScript；open_issues 18；**无 Discussions**（`has_discussions:false`）→ 需求只集中在 Issues |
| 许可证 | GitHub API 返回 `spdx_id: NOASSERTION`；README 与 LICENSE 写明 **MIT License – Non-Commercial Use Only**，「商业使用需事先获得作者书面许可」 |
| Homepage | `https://getbeav.com/` |
|  Releases | README 徽章自述「已发布 76 个 Release、累计 601 个安装包」；最新 `v2.8.4`（2026-09-17） |
| topics | ai / ai-agents / content-creation / hermes / openclaw / xhs / xiaohongshu / xiaohongshu-scraper |
| 开发者 | 独立开发者 `JambaHailar`（X: https://x.com/JambaHailar ；B站 UP「花无缺Jamba」https://www.bilibili.com/video/BV12LNn6nEem/ ）；商店/合作邮箱 `huaqiang1121@gmail.com`；商务合作同邮箱 + 飞书经销商申请表 |

### 1.2 域名矩阵（采集插件与产品体系的对应关系）

| 域名 | 角色 | 证据 |
| --- | --- | --- |
| `getbeav.com` / `www.getbeav.com` | 品牌官网（中文主站，含 `/docs` `/pricing` `/changelog` `/skills` `/templates` `/download` `/about` `/privacy` `/agent` `/workbuddy` `/xiaohongshu-downloader` `/douyin-downloader`） | 官网 + https://www.getbeav.com/sitemap.xml |
| `beav.me` | Chrome 商店里登记的发布者站点 | https://chromewebstore.google.com/detail/dhfphfekcjahljnefpdjoidehnhhoeie |
| `beav.ziz.hk` | 国内网络镜像站（`/about`、`/download`、`/changelog`、`/agent`、`/workbuddy`） | https://beav.ziz.hk/about |
| `redbox.ziz.hk` | 历史/下载 + 插件更新接口（`/download`、`/api/updates/plugin`），README 主下载按钮仍指向它 | 仓库 README；本机插件 `background.js` |
| `api.ziz.hk` | 反馈上报（`/beav/v1/public-feedback`） | 本机插件 `background.js` |
| `com.redbox.browser_control` | Native Messaging Host 名（保留 RedBox 旧名，兼容命名） | 本机 `manifest.json`/`scripts/install_beav_native_host.ps1`；开源文档「兼容命名：开源 Electron 版继续保留 RedBox 包名和路径，ACP discovery 也继续写 `RedBox/acp-gateway.json`」https://github.com/Jamailar/Beav/blob/main/desktop/Docs/electron-open-source-2.5.0-parity-plan.md |
| `redbox.local` | 本机回退标识 | 本机插件代码 |

品牌沿革：`RedBox / RedConvert → Beav`（更名说明 https://www.getbeav.com/about ：「RedBox 已正式更名为 Beav。原有桌面端、浏览器插件、GitHub 仓库、下载页和更新日志会继续围绕 Beav 维护……已有用户仍可继续使用原来的本地工作区、知识库、素材库和浏览器插件」）。

### 1.3 开源版 ↔ 商业版关系 [已核实]

- 开源仓库**不是阉割版 demo，而是完整产品架构**：README「保留了完整的产品架构与核心实现」，但同时声明生产包独立迭代、含「尚未公开的功能、优化和适配」。https://github.com/Jamailar/Beav/blob/main/README.md
- 同步机制（内部口径）：`desktop/` 由私有维护面 `archive/desktop-electron` 经 `.github/workflows/sync-public-assets.yml` 用 `rsync --delete` 推到公开仓库，**排除** `dist/`、`release/`、`.private-runtime/`、`.plugin-runtime/`。来源：https://github.com/Jamailar/Beav/blob/main/desktop/Docs/electron-open-source-2.5.0-parity-plan.md → **私有面存在，公开面是同步产物**。
- 版本不同步举例：App 已到 2.8.4，插件 2.7.18，而 `CHANGELOG.md` 里仍保留 2.4.0/2.5.1 等旧条目（开源节奏滞后）。https://github.com/Jamailar/Beav/blob/main/CHANGELOG.md
- 商业限制：**MIT-NC** ⇒ 我们若把 Beav 代码或其派生逻辑用于对外商用，必须先取得作者书面许可；仅"读源码→自建本地等价物"是另一回事（法务口径，不在本报告结论内）。

### 1.4 需要排除的同名噪音 [已核实]

| 噪音 | 为什么不是它 |
| --- | --- |
| 红宝盒创业网 `xm.hongbaohe.com` | 网创课程/项目售卖站，无插件无产品 |
| Google Play「红盒智能」`com.redbox.iot.app.redbox` | 智能硬件（门锁类）App |
| Redbox mv `mv.com.redboxapp` | 无关娱乐 App |
| CSDN 通用「知识库」文章、知乎「企业知识库」问答 | 与 Beav 无提及 |
| beaver/海狸（GNSS SDR、Beaver Storm、Gradle build scan 等） | 名称巧合，无 `com.redbox.browser_control` / 2.7.x / 小红书采集特征 |

判据复核：能同时对上 `com.redbox.browser_control` + 版本 2.7.18 + 小红书/B站/公众号采集 + `redbox.ziz.hk` 的，只有 Jamailar/Beav 这一条产品线。

---

## 2. 商业版功能全景

### 2.1 形态矩阵（多端）[已核实]

| 端 | 事实 | 来源 |
| --- | --- | --- |
| 桌面端 | macOS 12+（x64/aarch64）、Windows 10+（x64/x86/arm64）、Linux（AppImage/DEB），v2.8.4，156–252MB；macOS 过 Apple 公证；官网自报**累计下载 64,648 次** | https://www.getbeav.com/download |
| 浏览器插件 | Chrome / Edge，官方推荐 Chrome 商店安装（ID `dhfphfekcjahljnefpdjoidehnhhoeie`）；另提供 `Beav_Browser_Extension_2.7.18.zip` 手动加载 | https://www.getbeav.com/docs/browser-extension/install 、https://www.getbeav.com/changelog |
| CLI | `Beav_CLI_2.8.4_*` 各平台包 + `Beav_CLI_Install_*.sh/.ps1` + `beav open` | https://github.com/Jamailar/Beav/releases 、https://www.getbeav.com/docs/getting-started/cli |
| 网页访问 | 桌面端「设置→远程接入→网页访问模式」，管理员账号 + 12–256 位密码，手机扫码（二维码 5 分钟一次性） | https://www.getbeav.com/docs/remote-access |
| Linux 服务器自托管 | `curl -fsSL https://www.getbeav.com/install.sh \| bash`（Debian/Ubuntu x86_64 + systemd，装 Beav+Xvfb+FFmpeg，`beav-web.service`，`http://127.0.0.1:31938/health/ready`）；数据在 `/var/lib/beav`，主密钥 `/etc/beav/server-master.key`；`beavctl status/url/logs/update/reset-admin`；有 `Beav_Server_2.8.4_x86_64.tar.gz` | https://www.getbeav.com/docs/remote-access 、https://www.getbeav.com/changelog |
| 外部 Agent | Beav Creator 插件（MCP）连本机 Beav：Codex `/goal Read https://beav.ziz.hk/agent …`、WorkBuddy `https://beav.ziz.hk/workbuddy`；另有 ACP Agent Gateway（本机 31937 系） | https://github.com/Jamailar/Beav/blob/main/README.md#agent-%E6%8F%92%E4%BB%B6 、https://www.getbeav.com/docs/agent/connect |
| 小工具（Mini App） | 装在 Beav 里的本地沙箱 App，`window.redbox` SDK + manifest capabilities；沙箱禁 `fetch`/Node/Tauri/绝对路径 | https://www.getbeav.com/docs/mini-app-development |

### 2.2 采集（插件侧）[已核实]

官方文档口径（https://www.getbeav.com/docs/browser-extension 与 /docs/browser-extension/use ）：

- 可保存：普通网页链接与正文、**小红书笔记/图片/视频/评论区/博主页**、YouTube 视频页与 Shorts、微信公众号文章、知乎内容、其他可读网页、网页图片、视频链接、选中文字。
- 入口：工具栏图标 → 侧边栏（当前页识别结果、采集任务、历史、设置、连接状态）；平台页内注入的 Beav 按钮；右键菜单。
- 批量：搜索页/信息流/博主主页可「保存单条」或「发起批量采集」，**批量任务进同一后台队列**；官方明确风险提示「建议保持合理数量和间隔；遇到验证页或站点限制时停止任务」。
- 采集结果**默认进入当前工作空间（=本地桌面端）**，不要求把网页账号密码交给 Beav。
- 验证成功的定义就是「回到 Beav 知识库确认内容已经出现」。

2.7.18 插件代码实测（本机副本 + 开源 `Plugin/docs/xhs-sidepanel-collector-upgrade-plan.md`）：

- 侧栏/面板动作字符串：采集当前笔记、采集当前笔记评论、采集当前博主资料、采集当前博主笔记、采集当前页可见笔记、按关键词采集、链接批量采集、评论快照、视频采集、文章采集、导出 JSON、采集间隔、任务队列（串行）、「请先确认已登录小号 / 降低主号受限风险」。
- 采集能力矩阵（设计文档）：笔记 / 素材下载 / 评论 / **子评论** / 博主 / 博主笔记列表 / 关键词笔记 / 关键词博主 / 专辑笔记；数据策略四级 `page_state → captured_api → active_api → rpa`（页面状态 → 捕获接口响应 → 主动调 API → 滚动点击降级）。
- 任务模型：`taskType: note|comment|user|user_notes|search_notes|search_users|board_notes`；`outputTargets: redbox_knowledge | redbox_assets | download | xlsx | csv | json`。
  **[未核实]** `xlsx/csv` 导出在当前 2.7.18 生产插件里是否真的可用：`ExportField`/`SheetJS` 关键字在公开仓库里只出现在该 plan 文档，未见于 `Plugin/src`；本机 2.7.18 副本只有「导出 JSON / 已导出 JSON」。→ 复刻时按"JSON 已具备、Excel 属规划"处理。
- 存储位置：小型配置 `chrome.storage.local`，任务历史与采集结果 **IndexedDB**。
- 定时/订阅：插件带 `alarms` 权限并有 `redbox.subscriptionScan.v1` / `subscriptionCaptureReceipt.v1` 消息；真正的"每日刷新"跑在桌面端（见 2.3）。插件内实测文案「当前仅支持小红书浏览器订阅」「博主主页身份与订阅不一致，已停止保存」→ 订阅采集带**归属一致性校验**（防串号/防错存），这是我们复刻时值得照抄的约束。

### 2.3 知识库板块（重点）[已核实，除标注外]

**（a）产品结构：三个库分工，不是一张大杂烩**（官方文档原文归纳，来源 https://www.getbeav.com/docs 、https://www.getbeav.com/docs/workflows ）

| 库 | 装什么 | 谁写入 |
| --- | --- | --- |
| 知识库 Knowledge | 文本型知识：笔记、文章、评论、文档源正文 | 插件采集、本地导入、AI 沉淀 |
| 媒体库 / 资产库 Assets | 图片、视频、音频、封面等可复用媒体 | 采集下载、生成结果回流 |
| 主体库 Subjects | 人物、商品、品牌、场景 | 手工/批量创建（`assets.generateCharacterCard`） |
| 选题中心 / Task Brief / 稿件 Manuscripts | 把素材变成任务与可编辑产物 | 灵感漫步、对话、外部 Agent |

**（b）条目类型（kind）实测清单**：`redbook-note`（小红书图文/视频/博主/评论）、`wechat-article`（公众号）、`link-article`（链接文章）、`zhihu-answer`、`zhihu-article`、`youtube-video`、`document-source`（文档源）。来源：`desktop/src/bridge/domains/knowledgeBridge.ts`、`Plugin/src/capture/knowledgeEntryMapper.js`；UI 分类标签见 `desktop/src/pages/Knowledge.tsx`（含「抖音视频」「快手」「文本摘录」「手动导入」）。

**（c）磁盘形态（Agent 提示词里写死的目录约定）**：
```
<workspace>/knowledge/
├── redbook/note_xxx/    meta.json(title/author/stats{likes,comments}/createdAt) + content.md
└── youtube/youtube_xxx/ meta.json(title/description/videoUrl/videoId/hasSubtitle) + {videoId}.txt(字幕纯文本)
```
另有 `advisors/{id}/knowledge/`（智囊团成员私有库）。来源：https://github.com/Jamailar/Beav/blob/main/desktop/electron/core/prompts/systemPrompt.ts
→ **复刻要点**：一条素材 = 一个文件夹，`meta.json + content.md`，纯可读文本；触发检索的关键词是「我的笔记/我保存的/知识库/我收藏的」。

**（d）检索与"智能问答"的实现路线**：
- 里程碑：「2026-01-30 **移除向量检索，转向 Agentic Search**」+ 技术债「Embedding 检索残留：已清理完毕」（https://github.com/Jamailar/Beav/blob/main/ROADMAP.md ）。
- 但索引层并未消失，而是变成**目录/FTS/可视索引**：`knowledge:list-page`（带 `kindCounts`、`nextCursor`、`total`）、`knowledge:get-index-status`（`indexedCount/pendingCount/failedCount/visualIndex{totalUnits,indexedUnits,metadataOnlyUnits,failedUnits,retryDeferredUnits,retryReadyUnits}`）、`knowledge:get-file-index-dashboard`（`overall + lanes[] + scopes[]`）、`knowledge:rebuild-catalog` 支持 `mode: full | fts | canonicalBlocks | canonicalReparse`。来源：`desktop/src/bridge/domains/knowledgeBridge.ts`
- 入口：知识库页顶栏「搜索知识库…」、`#` 调用知识库 / `@` 召唤团队成员（CHANGELOG v2.5.1 前后：https://github.com/Jamailar/Beav/blob/main/CHANGELOG.md ）、聊天输入区「按来源切换知识内容 + 已选资料卡片」（v2.8.4）、把知识/素材**拖进输入框**作为引用。
- Mini App 侧稳定能力名：`knowledge.search / list / read / create / update / delete / attach / inspectVisual`（https://www.getbeav.com/docs/mini-app-development ）→ 这就是官方给第三方开发者的知识库 API 面，可直接当作我们本地 API 的设计蓝本。

**（e）组织方式（有没有文件夹/标签？）[已核实]**
- **标签**：知识库页有标签体系与「全部标签抽屉」（`allTags / selectedTag / inlineTagItems / handleAllTagsClick / 收起标签抽屉`），小红书标签透传（`getXhsTags`）；条目 payload 里带 `tags[]`（`knowledgeEntryMapper.js`）。→ 标签是**扁平筛选**，不是层级目录。
- **文件夹**：知识库的"文件夹语义"由 **文档源（document-source）** 提供——可「添加文件 / 添加文件夹 / 添加 Obsidian 仓库」，保留原目录结构、**不复制原始笔记**（v2.7.20 更新日志原文：「直接绑定 Obsidian Vault……自动跳过 `.obsidian`、`.trash`、`.git` 与 Beav 自身目录」https://github.com/Jamailar/Beav/releases/tag/v2.7.20 ）。
- **资产库**才是真文件夹树：`assets.createFolder / move / rename / categories.* / trash / restore`。
- **隔离边界**：一个空间对应一个账号；空间、素材、知识库与任务上下文互相隔离（v2.5.1 onboarding 说明）；`knowledge:delete-batch` 按 kind 批量删除。

**（f）知识库的 AI 加工**
- 视频/音频转写：`knowledge:transcribe`、YouTube 字幕重试 `knowledge:retry-youtube-subtitle`、批量刷新摘要 `youtube-regenerate-summaries`；UI 状态「等待转录/转录中/转录完成/转录失败/字幕生成中」。
- **图像理解索引（视觉索引）**：UI 开关两档文案「开启 · 会产生额外消耗」「关闭 · 不调用视觉模型」，索引单元 `VisualSemanticBlock`、`showVisualBboxPreview`；**这是唯一明确"要额外花积分"的知识库索引能力**（来源 `desktop/src/pages/Knowledge.tsx`；结合 pricing「AI 按量收费」）。→ 复刻时我们可做本地 OCR/VLM 等价物（零云成本），且它正是开源 Issues 里呼声最高的点（见 §5）。
- 评论洞察：`xhs-comment-insight` 内置技能 + 「评论区适合提取高频问题、反驳、购买顾虑和用户原话；保存后可以把评论与原笔记**分开检索和分析**」。
- 灵感漫步（Wander，`desktop/src/pages/Wander.tsx`）：从知识库抽内容做跨素材关联，产出「目标读者/核心矛盾/叙事角度/素材切口」，再走 web.search → 事实 brief → articleStrategy → xhs-title → writing-style → 稿件工程；对文档源的指令是「先列目录，再根据文件名和样例文件自行判断该读什么正文」——即 **agentic 读取**而非向量召回。
- 知识库→封面模板：可「为小红书笔记生成封面图」并「已保存为封面模板，可在『封面』页直接套用」。

**（g）自动入库（定时/批量）**
- 跨平台博主订阅：「订阅受支持平台的博主或创作者主页，Beav 可每日自动刷新最新内容，并保存到知识库」（README，配图 `creator-subscription-daily-sync.jpg`）。
- 自动社媒调研：「自主检索多个社交平台的公开内容，先筛选候选素材，再深读高价值内容。调研结果可直接沉淀到知识库」。
- 运营日历 / 自动化（`Automation.tsx`、`automations.preview/create/list/update/disable/runs/retry`）：后台任务需"定义、版本、能力、预算和并发限制都匹配已批准范围"才能常驻执行；Mini App JS 本身不能后台常驻。

**（h）导出 [部分未核实]**
- 插件侧：JSON（实测）、xlsx/CSV/剪贴板 TSV（仅见设计文档，**未核实生产可用**）。
- 桌面端侧：`ui.exportResource`、交付包 ZIP、历史交付包打开（v2.8.2「旧交付包可直接打开」）、成片/SRT/WebVTT/便携工程导出、手机取件二维码；**没有看到"知识库整体导出为 Markdown/Obsidian"的官方承诺**——方向是「绑定 Obsidian 作为文档源」而非「导出到 Obsidian」。**[未核实]**

### 2.4 AI 功能清单 [已核实]

- 对话（Chat/RedClaw Agent）、Task Brief（目标/待办/关键事实/阶段结论/决策/验证要求 + 完成度与上下文余量估算）、稿件与多风格标题（`manuscripts.*`、`xhs-title`）、文案风格与"去 AI 味/仿写"类能力主要走**技能市场**：`writing-dna`（提炼品牌语气并复用）、`human-writing`、`renhua`、`member-skill-distiller`、`dbs-*`（dontbesilent 商业诊断 14 个）、Baoyu 16 个创作 Skills、`xhs-visual-director`、`high-retention-video-script`、`wwud`、`image-director` 等；官网 `/skills` 共 **36 个 Skill**，分类为「内容创作 16 / 调研与选题 14 / 内容诊断 14 / 任务推进 14 / 商业决策 14 / 商业诊断 14 / 图片制作 9 / 脚本优化 / 文案风格」，来源 https://www.getbeav.com/skills 、`desktop/builtin-skills/`。
- 图片：模板变量 + 参考图 + 从图片反推模板；视频：媒体工坊 + 智能剪口播（逐词转录 + 停顿/声音接缝分析、DeepFilterNet 人声降噪、画中画、动画预设、独立特效轨、关键帧、SRT/VTT 导出）；语音：TTS/配音/音色克隆（`voice.*`）；账号运营规划小工具；运营日报。
- 「洗稿」这类说法官方不用；对应物是「把同一内容改写为 X/LinkedIn/Threads/Bluesky 平台化版本」（Crosspost 4.7）与「提取样本文风规则，沉淀可复用的写作风格复刻流程」（写作蒸馏器 4.4）。来源 https://www.getbeav.com/skills

### 2.5 数据同步 [已核实口径]

- 主同步 = **同一工作空间在多台设备/网页端复用**：付费权益含「最多登录 10 台设备」；跨设备方式有 桌面端网页访问（本机/可信局域网）、Linux 服务器自托管、手机扫码。来源 https://www.getbeav.com/pricing 、https://www.getbeav.com/docs/remote-access
- **[未核实] 知识库的云端增量同步（多机自动合并）**：公开资料未出现"知识库云同步/账号云端备份"承诺；隐私政策只写「同步配置」会上传信息，且反复强调素材/稿件/知识库默认在本地。→ 结论：应按「本地库 + 自托管/局域网访问」理解，不要假设它有云数据库。
- 素材库自身维护：删除后资产索引同步、**废纸篓内容 30 天后自动清理**（v2.8.4）。

---

## 3. 商业化边界：免费版 vs 付费版

### 3.1 价格表（逐字，来源 https://www.getbeav.com/pricing ，抓取于 2026-09-21）

主标题：**「终身授权，永久免费更新」/「一次购买，长期拥有。AI 无需订阅，按量收费。」**

| 版本 | 价格 | 权益（原文要点） |
| --- | --- | --- |
| 个人免费版 | **¥0** | 基础创作能力；一个个人空间 |
| 个人终身版（推荐） | **¥238** | 一次购买终身授权；**开通赠送 22,000 积分**；个人空间**不限**；最多登录 **10 台设备**；**支持接入任意第三方 AI**；**官方 AI 调用 6 折** |
| 团队永久版 | **¥499 起** | 含 **2 个永久席位**；**团队空间与成员协作**；团队积分统一管理；**每位成员最多登录 2 台设备**；官方 AI 调用 6 折；**新增席位 ¥99 / 个** |
| 脚注 | — | 「官方 AI 能力按实际调用的积分另行计费。」 |

**[未核实]** 积分充值套餐单价（¥X = N 积分）、每个模型/分辨率/时长的具体积分费率：官网无公开页；代码里费率由服务端 catalog 下发（`pricingEstimate.ts` 读 `image_quality_resolution_rates` / `video_resolution_rates` 并显示「预计消耗 N 积分」，来源 https://github.com/Jamailar/Beav/blob/main/desktop/src/features/media-generation/pricingEstimate.ts ）。**[未核实]** 免费版设备数上限、条数/空间配额（未见任何公开数字）。

### 3.2 条款级边界（来源 `desktop/src/features/legal/legalDocuments.ts`，协议生效 2026-06-24；与 https://www.getbeav.com/privacy 同口径）

- 会员 ≠ AI 额度：「会员身份与积分账户相互独立……不免除积分消耗，也不改变官方 AI、图片、视频、语音、**云端处理**等按量计费能力的扣费规则。」
- 积分即时到账、不退不换（异常交易除外）；「创始赞助会员」（早期名称）权益含「特权功能入口、身份标识、优先体验、客服支持、**设备或空间相关权益**等非积分型权益」，且「永久有效」仅指身份标识保留。
- 登录方式：手机号 + 短信验证码、微信扫码；生产版存在**登录门槛**——v2.5.1 修复「配置自定义 API 或本地模型后，仍被官方账号登录页拦住的问题」，v2.8.3「移除国际账号入口」（https://github.com/Jamailar/Beav/blob/main/CHANGELOG.md ）。
- 采集与知识库属本地能力：「扩展默认把用户主动采集的内容发送到本机运行的 Beav 桌面端服务。除非您主动使用官方云端能力、第三方模型、反馈上传、支付登录或同步功能，我们不会主动上传您的本地文件内容。」
- 扩展权限自述：当前标签页、侧边栏、右键菜单、本地存储、脚本注入、宿主权限、**原生通信**、**浏览器调试**、下载、剪贴板、书签、历史、标签组、通知等。

### 3.3 复刻时"只能做本地等价物"的云端专有清单 [推断，基于 3.1/3.2 证据]

| 对方云端专有 | 我们的本地等价物建议 |
| --- | --- |
| 官方 AI 网关 + 积分计费 + 6 折权益 | 不做计费层；直接走用户自带 API Key / 本地模型（开源版本身就支持 OpenAI-compatible + 本地模型） |
| 图像理解索引（会产生额外消耗） | 本地 OCR（PaddleOCR/Tesseract/RapidOCR）+ 可选本地 VLM，按"是否产生成本"提示；**这正是 §5 的最高呼声** |
| 视频转写、YouTube 字幕拉取与摘要批刷 | 本地 whisper.cpp + yt-dlp 字幕，保留"失败可重试"状态机 |
| 账号/登录/设备数（10 台）与席位（团队） | 本地不做设备数；团队共享改为"共享文件夹 + 只读挂载 + 冲突可见" |
| 支付归因、首次来源问卷、崩溃/诊断上报（`api.ziz.hk/public-feedback`） | 全部去掉或改本地日志（我们副本已改为本地 `beav-native-host.log`） |
| 插件自动更新（`redbox.ziz.hk/api/updates/plugin`） | 本地版本检查 + 手动加载；不要回连对方域 |
| 博主订阅每日刷新（云端调度） | 本地调度器（定时任务）+ 明确"合理数量与间隔"风控 |

---

## 4. 用户口碑与高频使用场景

**总体判断：公开可核实的第三方口碑非常薄。** 知乎、小红书站内搜索**未出现**可归因于 Beav/RedBox 知识库的测评正文（搜索命中均为无关企业知识库文章）；B 站官方教程系列首集（UP 花无缺Jamba，BV12LNn6nEem「（1）安装浏览器插件」）播放仅 797、点赞 4、回复 0。Chrome 商店 **0 星 / 无评分**、333 用户。→ **[未核实] 不存在可引用的"真实用户口碑样本"**，下面的引用以工具站/拆解站为主。

可引用的旁证（按证据强度）：

1. 营销通鉴拆解一条小红书爆款帖（原文被结构化转载，标注 2026-07-25；https://yingxiaoclub.com/viral/xiaohongshu-ai-creation-tool-redbox ）：
   - 高频卖点顺序＝**内置小红书浏览器边看边存 → 本地知识库（该文称"支持向量相似度搜索"）→ 灵感漫游（随机抽 3 条找关联）→ AI 智囊团开会 → 沉浸式写稿（左写作右查素材）→ RedClaw 自动化 → AI 配图**；原帖书签量 580。
   - 明确的批评/门槛：「**需要自己配 API（推荐 DeepSeek 或 OpenAI），不是开箱即用**」「104 星说明还很早期」「适合全职做小红书的内容创作者，偶尔发帖的可能用不上这么重的工具」。
   - ⚠️ 该文「向量相似度搜索」与后来官方「移除向量检索，转向 Agentic Search」矛盾 → 属**早期版本描述已过时**，复刻时不要按向量 RAG 理解它。
2. 工具站收录：格律诗的软件世界（2026-08-12，https://www.jamecling.com/archives/5231 ）关键词＝「小红书爆款采集、评论区洞察、智能选题」，评价「把保存、知识库、选题、稿件、媒体库和自动化串联，适合长期运营者」。
3. 社区清单：`awesome-ai-media-cn` 同时收录 RedBox（「内容采集入库、随机漫步选题、稿件管理、AI 生图/生视频、封面生成、RedClaw 自动化执行」）与 Beav 条目（「自媒体素材库、AI写作+图片自动编排、小红书版 OpenClaw、评论区下载｜你桌面盒子里的 AI 小河狸🦫」）。https://github.com/JuneYaooo/awesome-ai-media-cn
4. AI 情报局转发（2026-07-18，https://shenzjd.com/posts/5784 ）：一句话定位「面向自媒体创作者的 AI 资产工作台，核心功能覆盖素材采集、知识沉淀与内容生成」。
5. 官方生态位佐证：`/skills` 里存在由小红书博主署名的 RED skill（阿囤囤爆款封面、子圭时安视觉导演、花无缺Jamba 高留存视频脚本、躺在废墟里 写作蒸馏器），说明其"技能市场"在往**平台原生风格资产**方向走（https://www.getbeav.com/skills ）。

**→ 复刻时应优先支持的流程（从上述场景频次直接得出）**：
① 看到好笔记→一键入库（含图片/视频素材 + 评论快照 + 来源链接）；
② 积累一批同主题素材→让 AI 反推选题（要能指向真实素材）；
③ 评论区分开检索（提取高频问题/反驳/用户原话）；
④ 写作时右侧同时开知识库/素材，拖入即引用；
⑤ 图片型笔记可被检索（最大盲区，见 §5）；
⑥ 稿件/媒体结果回流到同一空间供下次复用（README「不要只保存聊天结果」）。

---

## 5. 开源版 Issues：用户最想要的功能（商业版差异方向的旁证）

仓库**无 Discussions**，Issue 共 34 条（open 18），反应数全为 0（社区讨论强度低，主要靠 QQ/微信群）。按与"商业版差异"的相关度归类：

**知识库相关（最有信号）**
- #27 **[Feature Request] 知识库图片内容识别——让"灵感漫步"不再遗漏图片中的知识**（closed，3 评论）：核心诉求＝OCR 模式 + 多模态模式双选、入库自动识别、批量识别按钮、结果以 Markdown 附在图片下方；金句：「没有图片识别能力，知识库只采到了"皮"，"肉"全丢了」→ 与商业版「图像理解索引（会产生额外消耗）」完全对应，是**云专有→本地可平替**的典型点。https://github.com/Jamailar/Beav/issues/27
- #19 无法在知识库中添加外来文件或文件夹（open，Windows 11 v1.9.3；1.9.0 可加但 Obsidian 源与文件夹源互相顶替）。
- #25 小红书笔记采集后无法显示在知识库（entries API 返回 0，open）、#14 知识库-小红书图文无法正确显示视频笔记。
**→ 采集→入库链路"看起来成功但库里没有"是最高频的可观测性缺陷**，我们复刻时应把"入库回执 + 计数校验"做成一等公民（对方插件里已有 `subscriptionCaptureReceipt` 概念）。

**AI 配置 / 账号门槛**
- #43 建议登录模块改为可选、支持仅用自定义 API 直接进入工作台（→ 生产版确有登录门槛）；#44 deepseek 接入、#12 百炼 coding plan 拉取失败、#17 minimax token plan、#21 openrouter 生图报错。
- #1 「AI改写不能用」——早期"改写"能力是真实需求点。

**部署与集成**
- #42 支持 docker 服务化部署吗？（官方给的是 self-host install.sh，非 docker）、#39 期望 MCP 支持自定义 header、#4 windows 客户端有计划开源吗？
**→ 用户想要"服务器化 + 可被外部 Agent 接"**，与商业版的 Linux 服务器/ACP/MCP 路线一致，但形态不满足（未容器化）。

**采集能力**
- #16 浏览器插件无法抓取视频笔记、#9 插件准备失败（4 评论，open 最热）、#23 无法上传文件和图片、#28 无法拖入图片 / image edit endpoint 卡 94%。

**平台/兼容**
- #20 求 Intel Mac 版本（已补，2.8.4 有 x64）、#41 Windows 桌面端没有侧边栏、#30/#33 深色模式、#40 「Malicious SW Detected on Apple M-series」（open，0 评论，**[未核实] 需人工跟进内容**）。

---

## 6. 与 Easel 现有副本的一致性核对（顺带产出）

| 项 | 商业 2.7.18 | 我们的副本 | 备注 |
| --- | --- | --- | --- |
| version / version_name | 2.7.18 / 2.7.18（CWS） | 2.7.18.65535 / 2.7.18 | 对齐，`.65535` 是我们的本地哨兵位 |
| 宿主 | `com.redbox.browser_control` | 同名（本地脚本注册） | 保留兼容命名是对的 |
| 更新/反馈域 | `redbox.ziz.hk`、`api.ziz.hk` | manifest 仍保留 host 权限声明 | 复刻版建议彻底摘除回连 |
| 知识库 RPC | `knowledge.ingestEntry / ingestXhsEntryV2 / ingestZhihuArticle / ingestZhihuAnswer / ingestDocumentSource / ingestMediaAssets / batchIngest`，健康检查 `native://beav/knowledge` 返回 `counts` | 同名方法（我们由 `scripts/beav_native_host.py` 承接） | **接口面即复刻契约**，本地侧要保持语义一致（尤其 `counts` 回执） |
| UI 文案 | Beav | 已改 Easel（如「评论已写入 Easel 素材库」） | 本报告引用的中文动作串（采集/订阅/间隔等）为官方代码原串，仅品牌词被本地化 |
| 许可证 | 上游 MIT-NC | 副本目录含 `LICENSE.Beav-MIT-NC.txt` + `NOTICE.Easel.txt` | 商用需书面许可；对外发布前须法务确认边界 |

---

## 7. 未核实清单（禁止当作结论）

1. 积分充值单价与模型费率表（服务端下发，无公开页）。
2. 免费版的设备数上限、素材条数/存储空间配额（任何数字都未见公开）。
3. 生产插件是否支持 Excel/CSV 导出（仅设计文档提及）。
4. 知识库是否具备跨设备云端同步/合并（政策只写"同步配置"）。
5. 团队空间的**知识库共享粒度**（成员/空间级权限矩阵）——只见「团队空间与成员协作」「团队积分统一管理」两句营销文案。
6. 「红宝盒」这一中文品牌与本产品的任何关联 → 已证伪为无关站。
7. #40 Malicious SW Detected 议题的实质内容与影响。
8. 知乎/小红书真实用户测评正文（未搜到）。

---

## 8. 来源清单

官方
- https://github.com/Jamailar/Beav （仓库与 README）
- https://github.com/Jamailar/Beav/blob/main/CHANGELOG.md
- https://github.com/Jamailar/Beav/blob/main/ROADMAP.md
- https://github.com/Jamailar/Beav/releases 、…/releases/tag/v2.7.20
- https://www.getbeav.com/ · /about · /download · /pricing · /privacy · /changelog · /skills · /docs · /docs/browser-extension · /docs/browser-extension/install · /docs/browser-extension/use · /docs/workflows · /docs/workflows/collect-to-create · /docs/remote-access · /docs/mini-app-development · /sitemap.xml
- https://beav.ziz.hk/ · https://beav.ziz.hk/about
- https://chromewebstore.google.com/detail/dhfphfekcjahljnefpdjoidehnhhoeie
- 仓库源码（结构事实）：`desktop/src/bridge/domains/knowledgeBridge.ts`、`desktop/src/pages/Knowledge.tsx`、`desktop/src/pages/Wander.tsx`、`desktop/src/features/knowledge/README.md`、`desktop/plan_knowledge_scope.md`、`desktop/electron/core/prompts/systemPrompt.ts`、`desktop/src/features/legal/legalDocuments.ts`、`desktop/src/features/media-generation/pricingEstimate.ts`、`desktop/src/features/official/README.md`、`desktop/Docs/electron-open-source-2.5.0-parity-plan.md`、`Plugin/docs/xhs-sidepanel-collector-upgrade-plan.md`、`Plugin/src/capture/knowledgeEntryMapper.js`、`desktop/builtin-skills/*`

Issues
- https://github.com/Jamailar/Beav/issues/27 · /issues/19 · /issues/25 · /issues/14 · /issues/43 · /issues/42 · /issues/39 · /issues/16 · /issues/9 · /issues/20 · /issues/41 · /issues/40 · /issues/1

第三方
- https://yingxiaoclub.com/viral/xiaohongshu-ai-creation-tool-redbox
- https://www.jamecling.com/archives/5231
- https://shenzjd.com/posts/5784
- https://github.com/JuneYaooo/awesome-ai-media-cn
- https://gitcode.com/glorius/Beav （镜像，未展开核对）
- https://www.bilibili.com/video/BV12LNn6nEem/

噪音（已排除）
- https://xm.hongbaohe.com/ · https://play.google.com/store/apps/details?id=com.redbox.iot.app.redbox&hl=zh_CN · https://play.google.com/store/apps/details?id=mv.com.redboxapp&hl=zh_CN

本机
- `<仓库根目录>\extensions\beav-capture\manifest.json` / `background.js` / `sidepanel.js`
- `<旧树目录>\docs\BEAV_COMPARISON_20260910.md`（未展开，属另一条调研线）
