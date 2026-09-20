# Beav 商业插件功能模型还原（源码侧）

> 调研对象：`extensions/beav-capture/`（GitHub Jamailar/Beav，MIT-NC 的落地副本，本仓库已改名 Easel）
> 调研方式：只读源码。小文件整读，打包文件（`background.js` 1.2MB / 26511 行、`genericCaptureContent.js` 588KB / 9736 行、`browserControlContent.js` 155KB / 3563 行）用 Grep 抽字符串字面量 + 按行号定点读。
> 行号均为本仓库当前 HEAD 的行号；`background.js` 是 esbuild 非压缩产物，保留了 `// src/**.js` 模块标记，可据此定位原始模块。
> 标注约定：**【推断】** = 由代码结构/命名推导，无直接文案；**【未核实】** = 证据不足，需再看真机或运行验证。

---

## 0. 一句话结论

这份"开源版"实际是**两个子系统强行融合在同一个扩展里**：

| 子系统 | 血统 | 内部命名前缀 | 状态 |
|---|---|---|---|
| A. 浏览器自动化 / AI 控制运行时 | OpenAI ChatGPT-Codex Chrome 扩展的分叉 | `codex` / `xwow` / `browserControl` / `target*` | 代码全在，但**manifest 缺 `debugger`/`history`/`bookmarks`/`topSites`/`webNavigation` 权限**，CDP 链路实际跑不起来 |
| B. 采集 + 知识库写入 | Beav / RedBox | `redbox*` / `xhs*` / `knowledge.*` / `REDBOX_*` | 功能完整，只是把"上报 Beav 云 HTTP"改成了"JSON-RPC over Native Messaging 到本地 Desktop" |

证据（A 的血统）：`background.js:522` `referenceId: "chatgpt-chrome-extension-1.2.27236.6274"`；`background.js:3172-3177` 声明原生宿主名 `com.openai.codexextension{,.internal,.dev}` 与 `xwowNativeHostDefault: "com.xwow.browser_data_ai"`；`browserControlContent.js` 里注入的浮层根节点 id 是 `codex-agent-overlay-root`、徽标 `xwow-browser-data-ai-control-badge`。

对我们的价值：**B 是"知识库板块"的真实数据模型与交互面**，可以直接照着复刻；**A 是"AI 自动做内容"的能力面**，接口清单（61 个 MCP 工具 + 能力契约）是可接管的最大一块。

---

## 1. UI 功能面

### 1.1 manifest 权限与域名白名单

`extensions/beav-capture/manifest.json`：

- **名称/描述**：`name: "Beav采集 → Easel（个人非商用）"`（第 3 行）、`description: "将网页、链接、选中文字、图片、视频和评论保存到本机 Easel 素材库（个人非商用）。"`（第 4 行）→ 开源版协议边界直接写进 manifest。
- **版本**：`version: "2.7.18.65535"` / `version_name: "2.7.18"`（第 5-6 行）。末段 `65535` 是本地构建占位【推断：Chrome 要求 version 四段，作者填了哨兵值】。
- **permissions**（13-25 行）：`activeTab, alarms, contextMenus, clipboardWrite, downloads, nativeMessaging, notifications, scripting, sidePanel, storage, tabs`。
  - **关键缺失**：没有 `debugger`、`history`、`bookmarks`、`topSites`、`webNavigation`、`sessions`、`readingList`、`downloads.ui`、`optional_permissions`。但代码里大量使用：`chrome.debugger.attach` `background.js:4643/4670`、`chrome.debugger.sendCommand` `:4819`、`chrome.debugger.onEvent/onDetach` `:14029/14035`、`chrome.history.search` `:12430`、`chrome.bookmarks` `:12445`、`chrome.topSites.get` `:12454`、`chrome.webNavigation.getAllFrames` `:7132/14704`。history/bookmarks/topSites/readingList 都有 `if (!chrome.X?.y) return {success:true, unavailable:true,...}` 的优雅降级（`:12427-12429`、`:12444`、`:12453`、`:12464`），**但 `chrome.debugger` 的调用点没有守卫** → CDP 自动化在开源版会直接抛错。
  - 能力自检块 `background.js:3218-3238` 明确把 `downloads.ui`、`notifications`、`history`、`bookmarks`、`topSites`、`readingList`、`sessions` 当作"按权限推导的能力"来上报 → 说明商业版清单里这些权限是有的。**【推断】**
- **host_permissions**（26-47 行）：
  - 小红书：`www.xiaohongshu.com`、`www.rednote.com`（海外域名）、**`edith.xiaohongshu.com`**（API 签名域名）、**`pgy.xiaohongshu.com`**（蒲公英/创作者平台）、CDN `*.xhscdn.com`、`*.rednotecdn.com`
  - 视频：`www.douyin.com`、`www.kuaishou.com`、`live.kuaishou.com`、`www.tiktok.com`、`www.bilibili.com`、`space.bilibili.com`、`search.bilibili.com`、`b23.tv`
  - 图文：`mp.weixin.qq.com`、`zhihu.com`、`www.zhihu.com`、`zhuanlan.zhihu.com`
  - **商业云端**：`https://redbox.ziz.hk/*`、`https://api.ziz.hk/*`（45-46 行）→ 更新通道 + 反馈/遥测仍保留白名单，见 §3.3
- **content_scripts**（51-74 行）：
  - 小红书/rednote：`vendor/md5.min.js` + `xhsBridge.js`，`run_at: document_start`，**`world: "MAIN"`** → 注入到页面主世界，才能拿到页面自带的 `window.md5` / `window.mnsv2` 做签名（§2.3）
  - 7 个站点注入 `pageObserver.js`（小红书/rednote/公众号/知乎/专栏/抖音/B站），`document_end` → 页面内采集按钮（§2.5）
- **commands**（81-92 行）：`open-redbox-side-panel` = `Ctrl+Shift+Y`（"Open Easel capture side panel"）、`open-codex-side-panel`（无快捷键，"Open Codex-compatible browser control side panel"）→ **两个侧栏入口 = 两个子系统各一个**，但 `side_panel.default_path` 只有一个（第 103-105 行），codex 侧栏靠 `chrome.sidePanel` 动态切换【`background.js:9495` `TOGGLE_SIDE_PANEL_COMMANDS = new Set(["open-redbox-side-panel","open-codex-side-panel"])`；`:5803-5843` commandRouter 别名含 `open-xwow-side-panel`/`open-codex-side-panel`】。
- **web_accessible_resources**（75-80 行）：`pageRouteBridge.js`、`images/cursor-chat.png`（仅小红书）→ 前者用于 MAIN 世界广播 SPA 路由变化，后者是 AI 接管时的"虚拟光标"图片【推断】。

### 1.2 Popup（`popup.html` + `popup.js`）

popup 是"轻量识别 + 单键保存 + 更新检查"，没有列表、没有素材浏览。分区（`popup.html`）：

1. **更新区**：版本、检查更新按钮、"发现新版本"提示、跳转下载。
2. **页面识别区**：`未检测到内容` / 识别到的 `pageInfo.label` + `description`。
3. **采集操作区**：主按钮 + 备用"保存链接"。`popup.js` 按 hostname 推断，动作只有 `save-page-link` / `save-youtube` 等少量直连项。
4. **连接/宿主状态区**：`popup.js` 内置一张**原生宿主错误码 → 中文提示**表：`NATIVE_HOST_NOT_REGISTERED`、`NATIVE_HOST_DISCONNECTED`、`NATIVE_REQUEST_TIMEOUT`、`DESKTOP_BRIDGE_ERROR` 等，统一话术 **"请先在调研页注册宿主"**（→ 这就是开源版的"登录墙替代品"：**必须先启动本地 Easel Desktop 并注册 Native Host，否则任何保存都失败**）。
5. **`<dialog>` 风控提示**：`请先确认已登录小号` / `频繁保存内容可能触发平台风控…请先在当前浏览器登录专门用于采集的小号，再继续保存。` / 按钮 `我已登录小号，继续保存` / `暂不保存`。文案与 `background.js:18204-18221` `PLATFORM_SAVE_SAFETY_NOTICES`（仅 `xiaohongshu`、`douyin` 两个平台）严格一致。

### 1.3 侧栏（`sidepanel.html` + `sidepanel.js`）

**用户问："侧栏有哪些 tab？知识库在侧栏里长什么样？"**

答：**没有 tab，没有知识库浏览界面。** `sidepanel.html` 从上到下单列排布 5 个 section（无导航条、无 `role=tablist`、无路由）：

| 区块 | 内容 | 证据 |
|---|---|---|
| ① 状态头 | 页面识别卡片（标题/副标题/识别状态）+ 宿主连接行 | `sidepanel.js:706-711` `"未连接，请先在调研页注册宿主"` |
| ② 采集操作 | 按平台变化的 1 个主按钮（下表） | `sidepanel.js:728-850` `getCaptureActionConfig` |
| ③ 博主笔记采集面板 | 模式/抓取数量/间隔 + 进度条 + 开始按钮 | `renderBloggerNotesPanel`、`sidepanel.js:690-727` |
| ④ 任务队列 | `执行中 / 排队 N / 空闲` 徽标、当前任务名、`暂停/继续/停止任务`、`进度 x/y`、`最近完成：…` | `sidepanel.js:911-951` |
| ⑤ 执行日志 | 最近 12 条，`log-empty` = `暂无执行日志` | `sidepanel.js:952-959` |

侧栏**动作元数据表**（`sidepanel.js:851-872` `getCaptureActionMeta`，17 项，其中 3 项不在侧栏按钮里而在页面浮层里）：

```
save          -> save-xhs                            "已保存到 Easel"
download      -> xhs:download-current-note           "已创建下载任务"   （UI 隐藏，页面浮层用）
comments      -> xhs:collect-current-comments        "评论已写入 Easel 素材库"（UI 隐藏，页面浮层用）
bloggerNotes  -> xhs:collect-blogger-notes           "已采集主页笔记"
exportJson    -> xhs:export-current-note-json        "已导出 JSON"      （UI 隐藏）
savePageAuto / savePageLink / saveYoutube / saveDouyin / saveZhihuAnswer / saveZhihuArticle
saveBilibili / saveKuaishou / saveTiktok / saveReddit / saveX / saveInstagram
```

侧栏**按平台渲染的按钮**（`sidepanel.js:743-849`）：

| 平台 × 页型 | variant | 按钮 |
|---|---|---|
| 小红书 主页 | `xhs-profile` | `采集博主笔记` |
| 小红书 笔记 | `xhs-note` | `保存笔记` |
| 小红书 其他 | `xhs-page` | `保存网页`（链接） |
| YouTube | `youtube` | `保存视频` |
| 抖音 | `douyin` | `保存视频` |
| 公众号文章 | `wechat` | `保存文章`（走 `savePageLink`） |
| 知乎回答 | `zhihu` | `保存回答` |
| 知乎专栏 | `zhihu` | `保存文章` |
| B站/快手/TikTok/Reddit/X/Instagram | 同名 | `保存视频/帖子/推文/内容/页面` |
| 其他 | `generic` | `保存网页` |
| 无 URL | `empty` | 无按钮，`打开网页后自动识别` |

结果反馈话术（`sidepanel.js:873-890`）：`Easel 素材库中已存在`（去重命中）、`博主笔记 N 条，失败 M 条`、`下载 N 个素材`、`评论 N 条`。

**知识库在哪**：不在扩展里。`pageObserver.js` 保存成功后的提示文案是 **"已保存到 Easel。打开工作台「调研与素材」即可仿写"** → 明确把"浏览/检索/仿写"推给桌面工作台。扩展端只做"识别 + 采集 + 队列 + 日志"，是一个**纯输入设备**。这是复刻时最重要的产品分工判断。

浏览器控制侧栏（子系统 A）另有一条状态行 **"可保存 · AI控制可用"**（`sidepanel.js` browserControl 健康行）。

### 1.4 设置页（`settings.html` + `settings.js`）

`DEFAULT_SETTINGS`（`settings.js`）：

```js
{ actionLaunchMode: "popup",        // popup | sidepanel  —— 采集入口形态
  xhsSaveCommentsWithNote: false,   // 保存笔记时连带评论
  saveToRedboxByDefault: true,      // 默认写入知识库（残留商业命名）
  autoUpdateCheck: true }           // 自动检查更新
```

加上 `background.js:18249-18260` `DEFAULT_PLUGIN_SETTINGS` 的采集参数默认值：
`xhsIntervalMinSeconds:3`、`xhsIntervalMaxSeconds:6`、`xhsBloggerNoteLimit:50`、`xhsKeywordNoteLimit:20`、`xhsLinkBatchLimit:50`、`xhsBloggerCollectionMode:"api"`。

设置页还有一个"连接 Knowledge API"测试按钮，成功文案 `连接成功：${response.endpoint || "Knowledge API"}` —— **残留字段名 `endpoint`，证明这里原本是 HTTP 打到 Beav 云，现在被改写到 Native Host。**

---

## 2. 采集能力

### 2.1 内容类型全集（消息动作清单）

`background.js:18222-18248` `PLUGIN_CAPTURE_MESSAGE_TYPES`（25 个动作，权威清单）：

```
save-xhs · xhs:download-current-note · xhs:download-current-note-zip · xhs:collect-current-comments
xhs:collect-current-blogger · xhs:collect-blogger-notes · account:bind-current-platform
xhs:collect-note-links · xhs:collect-visible-note-links · xhs:collect-keyword
xhs:export-current-note-json
save-douyin · save-youtube · save-zhihu-answer · save-zhihu-article
save-bilibili · save-kuaishou · save-tiktok · save-reddit · save-x · save-instagram
save-selection · save-page-auto · save-page-link · save-drag-image
```

分类：

- **整页/正文**：`save-page-auto`（自动判定）、`save-page-link`（仅链接）、`save-selection`（选中文字）、`save-drag-image`（拖图落盘）
- **图片/视频**：`save-drag-image`、右键菜单 image/video（§2.2）、`xhs:download-current-note`（单笔记素材批量下载）、`xhs:download-current-note-zip`（打包 ZIP）
- **评论**：`xhs:collect-current-comments`
- **博主维度**：`xhs:collect-current-blogger`、`xhs:collect-blogger-notes`、`account:bind-current-platform`（**被 `ACCOUNT_BINDING_FEATURE_ENABLED=false` 关掉**，见 §6）
- **批量**：`xhs:collect-note-links`（给定 URL 列表）、`xhs:collect-visible-note-links`（当前可见卡片）、`xhs:collect-keyword`（关键词搜索批量）
- **导出**：`xhs:export-current-note-json`
- **社交通用**：`save-bilibili/kuaishou/tiktok/reddit/x/instagram` 六个共用一条实现 `saveSocialPlatformFromTab(tabId, platform)`（`background.js:18673-18684`）

### 2.2 右键菜单

`background.js:18324-18368` `ensureContextMenus()`：根菜单 `保存到 Easel`，`contexts: ["page","selection","link","image","video"]`（第 18335 行）；子项 `redbox-save-page-auto`（"保存当前页面内容到 Easel 素材库"）、`redbox-save-selection`、`redbox-save-link`、`redbox-save-image`、`redbox-save-video`（id 常量 18198-18203）。

### 2.3 站点适配器矩阵（`detectCaptureTargetFromUrl` `background.js:18743-18924`）

这是"识别面"的权威表。逐条：

| 站点 | URL 判定 | kind | action | 文案 |
|---|---|---|---|---|
| 公众号 | `mp.weixin.qq.com`（任意路径） | `wechat-article` | `save-page-link` | "当前页面已识别为公众号文章，将完整保存正文、图片和排版。" |
| 知乎专栏 | `zhuanlan.zhihu.com` + `/^\/p\/\d+/` | `zhihu-article` | `save-zhihu-article` | "将保存正文和专栏信息。" |
| 知乎回答 | `*.zhihu.com` + `/^\/question\/\d+\/answer\/\d+/` | `zhihu-answer` | `save-zhihu-answer` | **"将保存问题和最高赞回答。"** |
| YouTube | `/watch`、`/shorts/`、`youtu.be` | `youtube` | `save-youtube` | "保存YouTube视频到 Easel 素材库" |
| 小红书笔记 | `/explore/{id}` 或 `/discovery/item/{id}` | `xhs-note` | `save-xhs` | — |
| 小红书博主 | `/user/profile/{id}` | `xhs-profile` | `xhs:collect-current-blogger` | 受 `USER_PROFILE_FEATURE_ENABLED` 控制（18815） |
| 抖音视频 | `/video/` 或 `/note/` | `douyin-video` | `save-douyin` | — |
| B站 | `/video/`、`/bangumi/play/`；`space.bilibili.com`/`/space/`；`search.bilibili.com`；`b23.tv` | `bilibili-video` / `-profile` / `-search` / `-page` | `save-bilibili` | — |
| 快手 | `/short-video/`、`/fw/photo/`；`kwai.com` | `kuaishou-video` / `-page` | `save-kuaishou` | — |
| TikTok | 含 `/video/` | `tiktok-video` / `-page` | `save-tiktok` | — |
| Reddit | 含 `/comments/` | `reddit-post` / `-page` | `save-reddit` | — |
| X/Twitter | 含 `/status/` | `x-post` / `-page` | `save-x` | — |
| Instagram | `/p/`、`/reel/` | `instagram-post` / `-page` | `save-instagram` | — |
| 兜底 | — | `generic` | `save-page-link` | `statusText: "未检测到内容"`（18312-18322） |

**注意 B站没有"下载视频"实现**——`save-bilibili` 走通用社交通路（`saveSocialPlatformFromTab`），只存页面数据不抓流。**抖音是唯一有专门视频流解析适配器的站点**：`background.js:17368` 起 `// src/capture/douyinCapture.js`，`:17407` 反构造 `https://www.douyin.com/video/{id}`，`:17536` 视频地址判定（`.mp4` / `mime_type=video_mp4` / `*.douyinvod.com` / `/aweme/v1/play/`），`:17801` 作者主页 `https://www.douyin.com/user/{secUid}`。

识别的三级降级（`inspectPage` `background.js:18700-18742`）：URL 静态判定 → 页面缓存（`pageStateCache`，负缓存 TTL `350ms`，18173）→ `content page-state:get` → `runExtraction(detectCaptureTarget)` 注入提取。

### 2.4 小红书"API 模式"采集（核心技术资产）

这是 Beav 最硬的差异化能力，开源版**完整保留**：

- **拦截层**：`xhsBridge.js`（manifest 以 `world:"MAIN"` + `document_start` 注入）hook `fetch`/`XMLHttpRequest`，把小红书自己的响应缓存进 `window.__REDBOX_XHS_RESPONSES__`（上限 120 条），并向 ISOLATED 世界 `postMessage({source:"redbox-xhs-bridge", type:"api-response"})`。
- **签名层**：`background.js:25860-26019`
  - `getXSCommon()` 拼 `x-s-common`；`seccoreSign()` 生成 `XYS_…` 前缀签名；用 `window.md5`（`vendor/md5.min.js`）+ `window.mnsv2`（页面自带）
  - 自定义 base64 字母表 + crc32 + `a1`/`b1`/`b1b1` cookie 参与签名
  - `requestFeed()` 直调 **`https://edith.xiaohongshu.com/api/sns/web/v1/feed`**（笔记详情）、**`/api/sns/web/v1/user_posted`**（博主笔记列表），带 `x-s`、`x-s-common`、`x-t`、`xsec_token`、`xsec_source`
  - 因此 manifest 才需要 `edith.xiaohongshu.com` + `*.xhscdn.com` host 权限
- **调度层**：`background.js:18194-18197` 间隔参数 `XHS_COLLECT_INTERVAL_DEFAULT 1500/3500ms`，可配范围 `[500, 60000]ms`；侧栏 UI 暴露 `抓取数量 1-200`、`最大间隔 3-60s`。
- **反风控**：`captureRuntime.js` `isChallengePage()` 检测 `人机验证`/`安全验证`；`scrollAndTrackContentChange()` 模拟滚动直到内容不再变化；`clickVisibleButtons(/展开|全部回复|条回复|查看更多|更多回复/)` 自动展开评论区；`parseCountText()` 解析 `万`/`亿`。
- **去重**：`xhsBloggerCollectedNotes`（`background.js:18186`，上限 200 个博主 / 5000 条笔记 URL，`:18191-18192`）。

**公众号显式排除在通用正文提取之外**：`genericCaptureCoordinator` 里 `isWechatUrl()` 会强制返回 `"legacy-required"`（`background.js` 约 18000-18069 区段），即公众号不走 Defuddle，而走传统 DOM 提取路径。**【推断：因为 `#js_content` 有懒加载与内联样式，Defuddle 会丢排版。】**

### 2.5 页面内注入 UI（`pageObserver.js`，1731 行）

Beav 把大量操作放在了**页面里**而不是扩展弹窗里——这是它交互模型的关键：

- Shadow DOM 宿主 `redbox-xhs-explore`；容器 id `redbox-xhs-detail-actions`（笔记详情浮层）、`redbox-xhs-profile-actions`（博主主页浮层）
- 详情浮层按钮：`保存笔记`、`下载压缩包`（`pageObserver.js:1305-1328`）
- 博主主页浮层按钮：`采集博主笔记`；`保存博主` 按钮受 `ACCOUNT_BINDING_FEATURE_ENABLED` 控制（`:36-37`、`:1406-1410`，当前 `false` → 隐藏）
- 信息流每张卡片注入 `采集` 按钮 → 发 `xhs:collect-note-links` + `{saveToRedBox:true, limit:1}`
- 拖拽保存遮罩文案：`松手后会直接保存到素材库。`
- SPA 路由感知：注入 `pageRouteBridge.js`（`web_accessible_resources`），MAIN 世界 hook `history.pushState/replaceState`、`popstate`、`hashchange`、`pageshow` → `postMessage({type:"redbox:locationchange"})`，配合 `MutationObserver` + 快轮询重挂按钮

### 2.6 定时任务（alarms，共 5 个）

| alarm 名 | 位置 | 用途 |
|---|---|---|
| `redbox-browser-control-native-reconnect` | `:1277`，创建于 `:1930` | Native Host 断线重连（带 jitter/backoff） |
| `redbox-plugin-auto-update-check` | `:18178`，创建于 `:19187` | 自动检查插件更新，`UPDATE_CHECK_INTERVAL_MINUTES = 360`（`:18179`，6 小时） |
| `redbox-plugin-diagnostics-retry` | `:7439`，创建于 `:7847` | 错误上报失败重试 |
| `xwow-browser-data-ai-client-heartbeat` | `:7216`，创建于 `:7255` | 子系统 A 心跳，`periodInMinutes = HEARTBEAT_PERIOD_MINUTES` |
| `client-heartbeat-alarm` | `:7217`，创建于 `:7257` | 上游 codex/target 版心跳别名（原样保留） |

注意：**采集任务本身不用 alarms**，而是内存队列 + 可中断 sleep（`sleepXhsTaskInterruptibly` `:19711`、`waitIfXhsTaskPaused` `:19700`、`ensureXhsTaskNotCancelled` `:19691` 抛 `采集任务已取消` / code `OPERATION_CANCELLED`）。状态持久化到 `chrome.storage.local` 以便 SW 被杀后恢复（`hydrateXhsTaskState`/`hydrateXhsTaskLogs` `:18273-18274`）。

### 2.7 下载（downloads）

- `background.js:22604-22677`：`chrome.downloads.download({ url, filename: \`Beav/xhs/${noteId}-${title}-${序号}.${ext}\`, conflictAction: "uniquify", saveAs: false })`
  → **下载目录名仍是 `Beav/`，没改名**（改名不彻底的硬证据）。
- ZIP 打包：**自己实现的 ZIP writer**（`background.js:22678-22820`，本地文件头/中央目录/CRC32 手写），用于 `xhs:download-current-note-zip`（笔记全部图/视频一键 zip）。
- 子系统 A 另有下载能力面：`:3163` `xwowDownloadEnhancements: ["downloadStateSnapshot","downloadEventReplay","downloadContextBinding","downloadArtifactBinding","downloadSearch","downloadWaitById"]`，事件源 `chrome.downloads.onCreated/onChanged`（`:3211`），以及 `"downloadState":"in_progress_internal_only"`、`interrupted_other→failed` 等状态映射（`:3155-3161`）。

---

## 3. 数据模型与云

### 3.1 `chrome.storage.local` 键清单

| key | 位置 | 内容 | 上限 |
|---|---|---|---|
| `redboxPluginSettings` | `:18182` | 插件设置（合并 `DEFAULT_PLUGIN_SETTINGS`） | — |
| `pluginUpdateState` | `:18177` | 更新检查结果/已下载版本 | — |
| `xhsCollectorTaskHistory` | `:18183` | 采集任务历史 | 80 条 `:18189` |
| `xhsCollectorTaskQueueState` | `:18184` | 队列快照（active/queued/last/logs） | — |
| `xhsCollectorTaskLogs` | `:18185` | 执行日志 | 80 条 `:18190` |
| `xhsBloggerCollectedNotes` | `:18186` | 博主→已采 URL 去重表 | 200 博主 / 5000 笔记 `:18191-18192` |
| `redboxCaptureCheckpoints` | `:18187` | 采集断点（恢复用） | 120 条 `:18193` |
| `platformSaveSafetyNoticeAcknowledgements` | `:18188` | 已确认风控提示的平台集合 | — |
| `redboxBrowserControlSettings` | `:13448` `SETTINGS_KEY` | 子系统 A 设置（含 `autoPoll:false`、`nativeHostName` 覆盖） | — |
| `redboxBrowserControlScrapers` | `:13449` `SCRAPERS_KEY` | 抓取模板（最多 100 条，`:16817`） | 100 |
| `xwowBrowserDataAiNativeHostStatus` | `:3202` | 原生宿主状态快照（codex 血统） | — |

任务对象结构（`sanitizeXhsTaskForState` + `sanitizeXhsTaskContextForState` `:19560-19622`）：

```
task { id, type, title, status, tabId, startedAt, updatedAt, summary,
       capabilities: {pause,resume,cancel},            // createXhsTaskCapabilities(type)
       progress: {current,total,message,mode},
       context: { blogger:{userId,source,nickname,noteCount,collectedUrlCount,collectionMode},
                  options:{ mode:"api"|"tab", limit(默认50), interval:{minMs,maxMs} } } }
log  { id, taskId, type, status(默认success), title(默认"采集任务"),
       message(默认"任务执行完成"), createdAt ISO }
```

抓取模板结构（`saveScraper` `:16799-16818`）：

```
scraper { id, name, urlPattern,
          mode: "NO_PAGINATION" | 分页模式【未核实：未见枚举全集】,
          columns: [{id,name,type,source,prompt}],     // type: text|url|image|email|phone
          aiInstruction,          // ← 交给云端的自然语言抽取指令
          bulkUrls: [], maxPages, nextButtonSelector, createdAt, updatedAt }
```

列建议来源（`buildSuggestedColumns` `:16838-16848`）：站点适配器 `extractedData.adapter.suggestedFields` + 启发式 `email/phone/image/sourceUrl` + 默认 `title/url`，最多 12 列。捕获帧的 `extractedData` 形状（`summarizeCapture` `:16824-16836`）：`{adapter:{id,label,suggestedFields,data}, emails[], phones[], images[], links[], primaryListCandidates[]}`；正文三件套：`websiteTextContent` / `websiteMarkdownContent` / `frameCount`（多帧合并 `mergeExtractedData` `:16891+`）。

通用正文捕获 schema（`genericCaptureContent.js` 尾部 `src/capture/captureDocument.js`）：**capture-document schema v1**；`MAX_CAPTURE_TEXT_LENGTH = 24000`、`MAX_CAPTURE_IMAGE_COUNT = 8`；源码注释解释 `markdown:""` 留空是为了不超 `600KiB` 消息上限。质量门槛（`captureQuality.js`）：`complete` / `partial` / `link-only` / `blocked` 四档 + `BLOCKED_PATTERNS`，报错文案 `网页正文提取没有返回内容` / `页面需要登录或安全验证` / `网页正文不足` / `网页正文提取 超时`（`background.js` `genericCaptureCoordinator` 段，约 17990-18069）。消息类型 `redbox:generic-capture`（`genericCaptureProtocol.js`），监听器去重键 `__redboxGenericCaptureListenerV1__`，注入世界 `chrome.scripting.executeScript({world:"ISOLATED"})`，结果缓存 5s。第三方：Defuddle 0.19.2 (MIT) + DOMPurify 3.4.12（见 `THIRD_PARTY_NOTICES.txt`）。

### 3.2 素材（knowledge entry）对象结构

`createKnowledgeSourceInput` `background.js:20785-20797`：

```js
{ appId: "redbox-capture",
  pluginId: "redbox-browser-extension",
  sourceDomain, sourceLink, sourceUrl, externalId, capturedAt }
```

→ **完整 entry 载荷 = `{ entryId/kind, source:{…上面}, content:{…}, assets:[…], options:{…} }`**，构建器分布：

| 构建器 | 行号 | kind / 路径 |
|---|---|---|
| XHS 笔记 entry | 21085+ | `POST /entries` |
| XHS entry v2 | 21085-21292 | `POST /xhs/v2/entries` |
| XHS 评论 | 同上区段 | `POST /comments`（仅本地宿主支持） |
| XHS 博主档案 | 21085-21292 | 走 blogger 专用 builder |
| 知乎回答 / 文章 | 21085+ | `POST /zhihu/answers`、`/zhihu/articles` |
| 文档型来源（公众号/网页正文） | 21085+ | `POST /document-sources` |
| 媒体资产（图/视频） | 21085+ | `POST /media-assets` |
| 账号档案导入 | 21293-21435 | `accounts.createImportSession` → `upsertPostsBatch/upsertCommentsBatch/upsertMediaBatch` → `completeImportSession` |

`options` 里可见 `summarize:false`、`transcribe:true`（视频）等开关 —— 见 §5、§6。
`operationId` 指纹（`bridgeOperationId` `:20631-20637`）：`{scope}:{hash(operationId|id|entryId|note.noteId|source.externalId|sourceLink|sourceUrl)}` → **幂等键，服务端用它做 duplicate 判定**（响应字段 `entryId` / `duplicate` / `updated`，`:20649-20654`）。

### 3.3 云端：域名与端点

**保留的商业云端（host_permissions 里就写着）**

| 端点 | 位置 | 用途 |
|---|---|---|
| `https://redbox.ziz.hk/api/updates/plugin` | `:18180` | 插件更新源（JSON） |
| `https://redbox.ziz.hk/download` | `:18181` | 更新下载页 |
| `https://api.ziz.hk/beav/v1/public-feedback` | `:7440` `PLUGIN_FEEDBACK_ENDPOINT` | **自动错误/遥测上报** |

遥测细节（`queuePluginDiagnostic2` `:18297-18301` → `reportPluginError` → `:7605-7630`）：
`payload.category` 含 `connection` 时会附带 `diagnosticVersion: 2` 和 `payload.fields.environment = await connectionEnvironment()`（`:7613-7616`）；`payload.fields.installationIdHash = await resolveInstallationFingerprint()`（`:7617-7618`）；同因冷却 `SAME_INCIDENT_COOLDOWN_MS` + `dedupeKey`（`:7619-7630`）；权限探针 `feedbackOriginGranted` 检查是否授予 `<all_urls>` 或 `https://api.ziz.hk/*`（`:7578`）。→ **开源版仍在往 Beav 云端发匿名遥测。复刻时应删除。**

**被砍掉的 HTTP 桥（最重要的功能差异证据）**

`background.js:14257-14261`：

```js
async function resolveApiBase(force = false) {
  void force;
  cachedBaseUrl = null;
  throw new Error("Easel capture HTTP bridge has been retired; use Native Messaging");
}
```

但**调用者全都还在**，且拼的是明确的 HTTP 路径：

- `:16758-16767` `sendCapture()` → `POST {base}/captures`，body `{pluginId, commandId, captureKind, data, metadata}`
- `:16788-16791` `listCaptures()` → `GET {base}/captures?pluginId=…&limit=…`
- `:16793-16797` `listCommands()` → `GET {base}/commands?pluginId=…&status=…&limit=…`
- `:14689-14695` AI 抽取 → `POST {base}/ai/extract`，body `{captureId, instruction, schema}`
- `:14250-14255` `getSettings()` 里 `autoPoll: false` → 原本有"轮询云端下发的指令"

→ **这四项构成商业版的"云侧闭环"：账号绑定 → 云端下发 command（`/commands`）→ 扩展执行 capture → 回传 `/captures` → 服务端 `/ai/extract` 做结构化抽取。** 开源版把它整条切断了，只留一个必然抛错的 stub。

**替代方案（开源版走的本地路）**

`background.js:18168-18171`：

```js
var NATIVE_KNOWLEDGE_ENDPOINT = Object.freeze({ baseUrl: "native://beav", endpointPath: "/knowledge" });
```

一个**假 URL 方案** `native://beav` 复用原有 HTTP 风格的 path 与 method，`fetchKnowledgeJson(endpoint, path, {method, body})` 再把 `METHOD path` 映射成原生方法名（见 §4.2）。→ 商业版知识库**原本大概率是 `https://…/knowledge/…` 的 HTTP REST**，被机械改写成 JSON-RPC over Native Messaging。这一点从 `:20619` 的错误文案还写着 `不支持的 Beav Desktop action: ${key}` 就能反证。

同时**本地方向多出一个宿主端点**：`com.easel.research_clipper`（`:1281` `NATIVE_HOST_DEFAULT`），并配套 `scripts/beav_native_host.py`、`scripts/install_beav_native_host.ps1`、`web/research_api.py`（本仓库自研，非 Beav 上游）。

---

## 4. Native Host 协议（可接管接口面）

### 4.1 传输信封

`background.js:1782` `buildNativeRequestEnvelope`：

```json
{ "jsonrpc": "2.0", "id": "native-host:<seq>", "method": "<method>", "params": {…} }
```

权威字段清单在 `:3186-3193`：`targetNativeRequestIdPrefix:"native-host:"`、`targetNativeJsonRpcVersion:"2.0"`、`targetNativeRequestEnvelopeFields:["jsonrpc","id","method","params"]`、`targetNativeResponseEnvelopeFields:["jsonrpc","id","result|error"]`、响应解析顺序 `["pending_id","error","result","invalid_response"]`。
错误：`Native transport is disconnected; reconnect is pending`（`:3190`）；未知 handler `code:-1`、handler 异常 `code:1`（`:3196-3197`）。
默认宿主名 `com.easel.research_clipper`（`:1281`），可被 `settings.nativeHostName` 覆盖（`:14275`）。上游宿主名保留在 `:3172-3177`。
握手与兼容：`ping` → `extension.register`；`assertNativeHostVersionCompatibility` `:1580` **强制 major 版本相等**，否则 `:1554` 报 `"当前 Beav 版本不支持 Desktop Bridge，请刷新扩展"` / `"Beav Desktop Bridge handshake failed: …"`。**复刻时这条 major 门槛是最大坑**，我们的宿主必须与插件 `version_name` major 对齐或去掉校验。
超时：`requestNativeHost2(method, params, timeoutMs = 12000)`（`:14278`）。
缓存：`KNOWLEDGE_API_CACHE_TTL_MS = 30000`、`DESKTOP_CONTEXT_CACHE_TTL_MS = 1500`（`:18174-18175`）。

### 4.2 方法清单（`METHOD path → native method`）

`knowledgeNativeMethod` `background.js:20605-20621`：

| HTTP 风格 | Native method |
|---|---|
| `GET /health` | `desktop.health` |
| `POST /entries` | `knowledge.ingestEntry` |
| `POST /xhs/v2/entries` | `knowledge.ingestXhsEntryV2` |
| `POST /zhihu/answers` | `knowledge.ingestZhihuAnswer` |
| `POST /zhihu/articles` | `knowledge.ingestZhihuArticle` |
| `POST /document-sources` | `knowledge.ingestDocumentSource` |
| `POST /media-assets` | `knowledge.ingestMediaAssets` |
| `POST /batch-ingest` | `knowledge.batchIngest` |

`accountNativeRoute` `background.js:23115-23148`（博主账号档案导入会话，未匹配时报 `不支持的账号档案 Desktop action`）：
`accounts.createImportSession` / `accounts.upsertPostsBatch` / `accounts.upsertCommentsBatch` / `accounts.upsertMediaBatch` / `accounts.completeImportSession`

上下文门禁（`desktop.context` / `desktop.health` 返回结构，`background.js:20596` 及 `:19xxx` 调用点）：

```
{ success, knowledge: {...}, space: {id, name}, initialization: {state}, ingest: {allowed, reason} }
```

`ingest.allowed === false` 且原因 `SPACE_INITIALIZING` 时，扩展把写入排队/拒绝并提示用户 —— **即"必须先在工作台选一个空间"的桌面端上下文协议**。

**我们已实现的对齐情况**：`scripts/beav_native_host.py` 的 `HOST_METHODS` 覆盖 `desktop.health`、`desktop.context`、`knowledge.ingestEntry/ingestXhsEntryV2/ingestZhihuAnswer/ingestZhihuArticle/ingestDocumentSource/ingestComments/ingestMediaAssets/batchIngest`、`accounts.*`。
→ 我们**多**实现了 `knowledge.ingestComments`（插件路由表里没有此 path，【未核实：可能只在 v1 老 path 或评论走 batch 里】）；
→ 我们**需要检查是否实现了** `extension.register` 握手、`desktop.context` 的 `space/initialization/ingest` 三段结构、以及 `operationId` 幂等 + `duplicate/updated` 响应字段。

### 4.3 扩展 ⇄ 内容脚本消息面（ISOLATED/MAIN）

- 采集侧：25 个 `PLUGIN_CAPTURE_MESSAGE_TYPES` + `page-state:get`、`page-state:update`（噪声类型，`:18306-18309`）、`redbox:generic-capture`、`redbox:locationchange`、`redbox-xhs-bridge/api-response`、`xhs:*`、`capture:get-checkpoints`、`capture:clear-checkpoints`（`background.js:18647-18659`）
- 控制侧：`browserControlContent.js:3345-3382` 一份 `xwow-data-ai:*` 类型清单（33+ 项），并给每项配 `TARGET_*` 的 ChatGPT 兼容别名；注入根 `codex-agent-overlay-root`、徽标 `xwow-browser-data-ai-control-badge`；`window.XWOW_SITE_ADAPTERS` 暴露 `youtube` / `google-maps` / `xiaohongshu` 三个适配器（含 `suggestedFields`）；`SITE_CARD_SELECTORS` / `SITE_SEARCH_UI` / `SITE_FILTER_UI` 是中文筛选标签映射；第 2 行有对 `grok.com`/`chatgpt.com`/`claude.ai` 的**主动 bail-out**（避免在竞品页里注入控制层）。

### 4.4 暴露给桌面 / LLM 的 MCP 工具面（61 个）

`background.js:13532-13895` `BROWSER_CONTROL_MCP_TOOLS`（每 5 行一项，完整清单）：

- **浏览器级**：`browser.capabilities`、`browser.info`、`research.run`、`browser.context`、`browser.events`、`browser.events.summary`、`browser.sessionEvents`、`browser.visibility.get`、`browser.visibility.set`、`browser.botDetect`、`browser.authHandoff`
- **窗口/历史**：`windows.list`、`history.search`
- **Tab 租约**：`tabs.list`、`tab.info`、`tabs.finalize`、`session.name`、`turn.ended`、`tab.claim`、`tab.create`、`tab.navigate`、`tab.back`、`tab.forward`、`tab.reload`、`tab.close`
- **Page/DOM**：`page.frames`、`page.waitForLoadState`、`page.waitForURL`、`page.waitForTimeout`、`page.evaluate`、`page.domSnapshot`、`page.waitForSelector`、`page.queryElements`、`page.click`、`page.doubleClick`、`page.hover`、`node.click`、`page.scroll`、`node.scroll`、`page.type`、`page.check`、`page.setChecked`、`page.isChecked`、`page.isVisible`、`page.getValue`、`page.getValues`、`page.getAttribute`、`page.select`、`page.consoleLogs`、`page.assets`、`page.screenshot`
- **剪贴板**：`clipboard.read`、`clipboard.readText`、`clipboard.write`、`clipboard.writeText`
- **像素输入**：`input.mouseMove`、`input.mouseClick`、`input.mouseDrag`、`input.mouseWheel`、`input.keyboardType`、`input.keyboardPress`、`input.keyboardCombo`
- **视口 / CDP / WebMCP**：`viewport.state`、`viewport.set`、`viewport.reset`、`cdp.send`；WebMCP 走 `webmcp_list_tools` / `webmcp_invoke_tool`（`navigator.modelContext`，`:2703/2716-2719`，且 `:2707` 注明 `webmcp` 仅在 `buildChannel !== prod` 时开启）

动作分级与审批（`:106-113`）：`BROWSER_ACTION_LEVELS.OBSERVE`（`page.waitForFileChooser`、`fileChooser.snapshot`、`webmcp.listTools`）、`LOCAL_FILTER`（`page.acceptFileChooser`、`fileChooser.accept`、`page.setInputFiles`）、`STATE_CHANGING`（`webmcp.invokeTool`）→ 配合 `approvalToken` 策略（`options.browserPolicy` `:3167`）。
能力契约 `CAPABILITY_CONTRACTS`（`:2222+`，`CAPABILITY_CONTRACT_SCHEMA_VERSION = 1`），`contractVersion: 6` 的站点研究契约在 `:9612-9686` `siteResearchCapabilities_default`（per-site `filters` / `hostPatterns` / `capabilityVersion`）。

### 4.5 commandRouter 别名

`background.js:5803-5843`：一大坨 action 别名到实现的映射（含 `open-xwow-side-panel`、`open-codex-side-panel`、`release_turn_leases` `:16155`、`release_tab_leases` `:16242`）。`ensureAppServerWithSidePanelGate`（`:14281-14302`）要求 `requireSidePanelOpen`，否则抛残留英文文案 **`"Beav side panel is not open."`**（`:14286`）。

---

## 5. AI / 自动化痕迹

1. **`research.run`（唯一的"研究型"工具）** `background.js:13544-13579`：
   - `description`（英文原文）：*"Execute one typed read-only site-research action. **Desktop owns** multi-step navigation, scrolling, item open/restore, retry, and cleanup orchestration. Xiaohongshu/Douyin items use originating-page UI clicks with no direct-URL fallback; macro mode remains for backward compatibility."*
   - → **架构分工铁证：扩展只做"一次原子动作"，多步编排/滚动/重试/清理全在桌面端（=大模型侧）。** 复刻时我们也应该把编排放在宿主/服务端，扩展保持无状态原子操作。
   - 输入：`site ∈ {xiaohongshu,xhs,douyin,youtube,web}`、`operation ∈ {search, author_scan, content_scan}`、`query,url,tabId`、`filters:{sort∈{relevance,latest,most_liked}, contentType∈{all,image_text,video}, publishTime∈{all,day,week,half_year}}`、`limit(1-100)`、`commentLimit(0-100)`、`depth ∈ {preview,standard,deep}`、`executionMode ∈ {macro, submit_search, extract, apply_filters, open_item, close_item, download_media}`、`item`、`openState`、`media(≤40)`、`maxScrolls(0-8)`、`downloadMedia`、`ocr`、`transcribeAudio`、`snapshot`、`timeoutMs`
   - 不支持时报错 `:10405` `research.run requires supported site: xiaohongshu, douyin, youtube, or web`
   - **`ocr` / `transcribeAudio` 只是布尔开关，扩展内没有任何实现** → 明确是把媒体扔给桌面端做 OCR / 语音转写。
2. **AI 结构化抽取**：`aiInstruction` 贯穿 scraper 模板（`:16808`、`:14495/14520`）、捕获选项（`:14633` `aiExtractionRequested: Boolean(options.aiInstruction)`）、以及 HTTP `POST {base}/ai/extract`（`:14691`，body `{captureId, instruction, schema}`）。列级 `columns[].prompt`（`:16856`）→ **逐列自然语言提示词**，这是"AI 表格抓取"的产品形态。此路径随 `resolveApiBase` 一起被切断。
3. **能力面注册表** `:2200-2220`（38 项，末尾 4 组直指 SaaS 化闭环）：`scraper.saveTemplate` / `scraper.preview` / `scraper.run` / `scraper.bulkUrls` / **`app.commandPoll` / `app.captureIngest` / `app.aiExtract`** —— 后三个就是"云端下发指令、回传采集、云端 AI 解析"，与 §3.3 的三个 HTTP 端点一一对应。
4. **未发现任何模型调用端点**：全仓库字符串里没有任何 `api.openai.com` / `chatgpt.com/backend-api` / `dashscope` / `model` 端点。**结论：AI 全部在宿主（桌面 App）侧，扩展永不调模型。** 这对我们是好消息——复刻不需要在插件里塞 key。
5. **兜底文案的 AI 味**：站点研究能力默认 `contractVersion: 6`（`:9612+`）+ 中文筛选标签映射（`browserControlContent.js` `SITE_FILTER_UI`），说明"筛选条件"这一层是给人看也给模型用的双通道。
6. **事件回放/会话**：`browserEventReplaySources: ["browserEventBridgeLog","browserSessionEvents","downloadEvents","cdpEvents"]`、`browserEventNativeMethods: ["onCDPEvent","onDownloadChange","onBrowserLifecycleEvent","onBrowserSessionEvent"]`（`:3209-3210`）→ 桌面端可以回放用户浏览轨迹作为上下文。**开源版没砍这部分代码。**

---

## 6. 开源版 vs 商业版：功能差异点清单

NOTICE 原文（`NOTICE.Easel.txt`）声称：**"未修改采集器业务逻辑；仅改 Native Host 名称与可见文案（Beav/知识库 → Easel 素材库），避免占用商业版 Beav 的 `com.redbox.browser_control`。"**

### 6.1 NOTICE 与实际不符之处（本仓库自己动的手）

1. **`background.js:1-13` 塞了一个 console shim**：`easelShortError()` + 覆写 `console.error` 输出 `[easel-sw]` + `unhandledrejection` 监听。这是**新增代码**，不是改名。
2. **`resolveApiBase` 被 stub 成必然抛错**（`:14257-14261`）→ 这是删功能，不是改文案。
3. **Native Host 名实际是 `com.easel.research_clipper`**（`:1281` `NATIVE_HOST_DEFAULT`）。整个 `extensions/beav-capture/` 源码里**不存在 `com.redbox.browser_control` 这个字面量**——它只出现在 `NOTICE.Easel.txt:3` 以及我们自己的 `scripts/beav_native_host.py:32`（`HOST_NAME = "com.easel.research_clipper"`，注释说明"不占用商业版宿主名"）、`scripts/install_beav_native_host.ps1:5/79/81/94-95`（注册 `com.easel.research_clipper.json` + HKCU Chrome/Edge 两支 key）和 `tests/test_beav_capture_safety.py:61`。也就是说：**宿主名早已被替换掉，NOTICE 用"避免占用商业版宿主名"来描述"只改名称与文案"，与实际改动范围（还含 stub 与 shim）不符。**

### 6.2 上游 Beav 自己（或本副本）留下的商业/开源分界线

| # | 差异点 | 证据 | 影响 |
|---|---|---|---|
| 1 | **HTTP 云桥整条砍断** | `:14257` stub；`:16758/16788/16793/14691` 调用者仍在 | 失去 `listCaptures`、云端 `commands` 轮询、`/ai/extract` 结构化抽取 |
| 2 | **AI 能力只剩开关** | `research.run` 的 `ocr/transcribeAudio/snapshot`；entry `options.summarize:false`、`transcribe:true`(视频) | 摘要/转写/OCR 全在云端或桌面端，插件内无实现 |
| 3 | **账号绑定被关** | `pageObserver.js:37` `ACCOUNT_BINDING_FEATURE_ENABLED = false` → `保存博主` 按钮隐藏（`:1406-1410`）；但 `account:bind-current-platform` 消息类型仍在（`background.js:18229`），实现 `bindCurrentPlatformAccountFromTab` 仍在（`:18621`） | 商业版的"多平台账号绑定"被 flag 关闭，代码路径完整可复用 |
| 4 | **用户档案功能有门闩** | `background.js:18261` `USER_PROFILE_FEATURE_ENABLED = true`，但 `:18593/18603/18614` 三处 gate 抛 `"账号档案功能暂未开放"` | 侧栏/浮层能进，一执行就报"暂未开放" → 典型会员墙位置 |
| 5 | **manifest 权限被裁** | 缺 `debugger`/`history`/`bookmarks`/`topSites`/`webNavigation`/`sessions`/`readingList`/`downloads.ui`，而 `:3218-3238` 的能力探针在检测它们 | 整个子系统 A（CDP 自动化、历史/书签读取）在开源版不可用；`chrome.debugger` 无守卫会抛错 |
| 6 | **侧栏 gate + 宿主墙** | `:14281-14302` `requireSidePanelOpen`；错误码表 → `"请先在调研页注册宿主"`（`popup.js`、`sidepanel.js:708`） | 开源版用"必须启动本地 Easel 并注册宿主"替代商业版登录墙；商业版应是登录 + 会员校验 |
| 7 | **遥测与更新通道未拆** | `:18180-18181` `redbox.ziz.hk`；`:7440` `api.ziz.hk/beav/v1/public-feedback`；`:7617` `installationIdHash` | 隐私/合规风险；也是"商业版运营面"的直接痕迹 |
| 8 | **改名不彻底（反向证据）** | 下载目录仍 `Beav/xhs/…`（`:22670+`）；`"Beav side panel is not open."`（`:14286`）；`"当前 Beav 版本不支持 Desktop Bridge"`（`:1554`）；`不支持的 Beav Desktop action`（`:20619`）；`appId:"redbox-capture"`、`pluginId:"redbox-browser-extension"`（`:20785-20797`）；`native://beav`（`:18169`）；`saveToRedboxByDefault`（`:18258`）；`window.__REDBOX_*__`；storage key 全部 `redbox*`/`xhs*` | 说明"Beav → Easel"是**表层文案替换**；数据模型/协议层的 `redbox`/`beav` 命名是识别上游实现的最好地图 |
| 9 | **`autoPoll:false` 硬编码** | `:14253` | 关掉云端指令轮询的总开关 |
| 10 | **WebMCP 受 buildChannel 门控** | `:2707` `target enables webmcp when buildChannel !== prod` | 商业正式版反而不开 WebMCP；开源/内部版开 |

### 6.3 商业版**独有**、开源版**没有对应代码**的东西（缺失即差异）

**【推断】**，依据是"有客户端 stub 但无实现体"：

- 登录 / token / 会员等级字段：全仓库 `grep` 未见 `token`/`membership`/`vip`/`plan` 之类的字段进入 knowledge payload 构建器 → 若商业版有账号体系，鉴权应在 `/captures`、`/commands` 的 HTTP header 层（已随 `resolveApiBase` 一起消失），**不在扩展里**。
- 云端知识库的**读接口**：开源版只有 `POST`（写入）+ `GET /health`。`listCaptures` 是唯一"读"，且已被 stub。→ **商业版的知识库检索/列表/仿写界面在服务端或桌面端，扩展从不做浏览。**（与 §1.3 "侧栏无 tab" 一致）
- 团队/协作、多设备同步、导出套餐：完全无痕迹。

---

## 7. 复刻要点（面向下一阶段的输入）

1. **产品分工照抄**：扩展 = 识别 + 采集 + 队列 + 日志 + 页面浮层；知识库/检索/仿写/AI 编排 = 桌面端。不要在侧栏做知识库浏览器。
2. **协议优先做四件事**：`ping` + `extension.register` 握手、major 版本兼容、`desktop.health`/`desktop.context` 返回 `{space, initialization, ingest}`、`knowledge.ingestEntry` 支持 `operationId` 幂等与 `{entryId,duplicate,updated}` 响应。
3. **最高价值资产 = 小红书签名采集**（`xhsBridge.js` MAIN 世界 + `edith.xiaohongshu.com` 签名 + `user_posted`/`feed` + 去重表 + 可暂停队列 + 风控提示），这块开源副本**没被砍**，直接可参考复刻。
4. **次高价值 = capture-document 质量分层**（complete/partial/link-only/blocked + 24K 文本/8 图上限 + Defuddle/DOMPurify + 公众号例外）。
5. **必须删的**：`redbox.ziz.hk` 更新通道、`api.ziz.hk` 遥测（含 `installationIdHash`）、`background.js:1-13` 的 console shim（如果不需要）。
6. **可以补权限的**：若要做 AI 自动操作，需要在 manifest 加 `debugger`、`history`、`bookmarks`、`topSites`、`webNavigation`，并给 `chrome.debugger.*` 调用点加可用性守卫。
7. **AI 层设计照 `research.run` 的原子动作切分**：`submit_search / apply_filters / extract / open_item / close_item / download_media / macro`，编排与模型调用全放宿主侧。
