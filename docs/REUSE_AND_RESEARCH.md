# 复用与社区调研

> 当前证据见 [BEAV_COMPARISON_20260910.md](BEAV_COMPARISON_20260910.md)。午前自行复刻版已与商业版证据分开；午后新装商业版2.7.20完成真实建档、风格生成与本地创作，并确认使用官方账号路由。Easel 自有主页建档、采用版本、创作及桌面成稿预览已通过；平台草稿与完整运营闭环仍未通过。

2026-09-10。围绕“素材 → 多平台创作 → 图文/视频 → 发布交接”选择成熟组件，比较公开行为、许可、维护代码和实际运行结果。

## 选型

| 候选 | 决定与落点 | 依据及限制 |
|---|---|---|
| [Easel](https://github.com/ZJU-REAL/Easel) | ADAPT：完整 UI、112 技能、画像、成品库、国内账号入口 | Apache-2.0，基于真实代码部署 |
| [Beav](https://beav.me) 与[浏览器插件](https://chromewebstore.google.com/detail/beav/dhfphfekcjahljnefpdjoidehnhhoeie) | LEARN：参考收集、账号档案、风格与后续创作的连贯组织 | 已实测用户新装商业客户端的官方账号路线；学习可观察行为和客户端契约，不复制商业代码；未声称全平台等效 |
| [Beav 公开仓库](https://github.com/Jamailar/Beav) | REFERENCE：公开架构及商业版区别 | MIT-NC，不当作普通 MIT；没有复制代码 |
| [Baoyu Skills](https://github.com/JimLiu/baoyu-skills) | COMPOSE / ADAPT：网页转 Markdown、格式化、公众号 HTML、微信/X 发布 | MIT，完整引入 5 技能，保留来源与许可 |
| [Postiz](https://github.com/gitroomhq/postiz-app)、[官方 Compose](https://docs.postiz.com/self-host/installation/docker-compose) | COMPOSE / ADAPT：媒体、日历、频道、排期、发布、CLI | AGPL-3.0，服务与媒体回读实测；实际社交频道待授权 |
| [FreshRSS](https://github.com/FreshRSS/FreshRSS)、[Google Reader API](https://freshrss.github.io/FreshRSS/en/developers/06_GoogleReader_API.html) | COMPOSE：订阅、增量更新、素材导入 | AGPL-3.0，真实订阅和 API 通过 |
| [xiaohongshu-ai-workbench](https://github.com/mengke-wang/xiaohongshu-ai-workbench) | COMPOSE：杂志图文、转化路径两个缺少的技能 | MIT，不重复引入标题等已有能力 |
| [xiaohongshu-ops-skill](https://github.com/Xiangyu-CAS/xiaohongshu-ops-skill) | REFERENCE：工作流组织 | 未发现明确许可，未复制 |
| [Readability](https://github.com/mozilla/readability) 与 [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) | COMPOSE：Chrome/Edge 用户点击摘录 | Apache-2.0，新代码只负责配对和入库 |

新增代码仅连接现成系统：订阅模型设置、限频素材入库、RSS 同步、Postiz 媒体交接、Windows/WSL 启停。没有另写发布平台、排期引擎、RSS 阅读器、正文或排版算法。

## 实际社区材料

自动采集使用 CloakBrowser 和 Baoyu 阅读器；午后按用户要求接入原 `D:/cloakbrowser/profile`，本机9345端口与 `.runtime/research-browser.json` 持久配置，原普通 Chrome 的9222不变。同平台用户级采集使用60–120秒真实随机间隔，每小时至多12次，同URL缓存24小时，同时只运行一次；本次单页模式不滚动或分页。验证、403/429和登录限制会暂停平台，刷新失败保留旧正文。逐请求CDP公开网络检查覆盖重定向及最终URL；使用本地正文提取，不启用远端fallback。

| 材料 | 实际发现 | 实现或验收中的用途 |
|---|---|---|
| [Postiz #2035](https://github.com/gitroomhq/postiz-app/issues/2035) 及讨论 | 启动、Temporal、Sentry 原生模块故障线索 | 本机复现后台 11 线程 futex 停滞；把 Sentry 导入移至既有 DSN 判断后，后端和 worker 恢复。健康检查覆盖三个服务端口 |
| [Baoyu #205](https://github.com/JimLiu/baoyu-skills/issues/205) | 验证控件和被动徽标误判报告 | 本机还复现正文包含 recaptcha 单词即被拦截，修复文字匹配后同页成功提取。真实 DOM 验证标志仍阻断；被动徽标问题未宣称全部解决 |
| [Baoyu #147](https://github.com/JimLiu/baoyu-skills/issues/147) | X Articles 数据块与视觉图片顺序不一致的报告 | 长文采集后需要核对图文顺序；本轮未登录 X，未宣称复现或修复 |
| Baoyu issues 索引 #172、#157 | npm 包与仓库版本不一致的线索 | 检查实际包，采用 baoyu-md / CDP 0.1.1 并真实生成 HTML |
| Beav README、官网、商店及 B站安装视频页 | 公开产品入口与使用信息 | 功能映射；B站只获得页面信息，未冒充视频转写或评论全文 |
| [宝玉博客](https://baoyu.io/) RSS | 官方更新和原始来源 | FreshRSS 拉取内容后，向素材库导入 20 条近期摘录 |

Reddit 返回 network security / 403，小红书搜索要求登录，Linux.do 出现验证，V2EX 被阅读器报告为验证码页。V2EX 尚未排除被动控件误判，故只记录“阅读器拦截”。这些平台保持暂停，没有绕过验证、复制 Cookie 或轮换 IP。HN 订阅也遇到网络超时，保留服务中的错误。

研究覆盖商业入口、维护社区、B站公开页与 RSS；受限社区的深入讨论仍受真实登录条件限制。这是一轮可追溯的公开研究，不能声称遍历所有社区或完整测评付费 Beav。账号授权后可继续从现有素材页补充实际使用反馈。

## 功能对应与验收边界

| 需求 | 现有组合 | 证据 / 边界 |
|---|---|---|
| 网页和评论收集 | CloakBrowser + Baoyu、手动摘录、Readability 扩展 | 网页及入库实测；扩展未装入用户常用浏览器 |
| 持续选材 | FreshRSS + 素材同步 | 真实 API 与订阅通过，失败源可见 |
| 一稿多平台 | Easel 原生技能 + 来源化创作入口 | 四份适配稿及质量报告 |
| 图卡、封面、排版 | Easel 原生图片/图卡 + Baoyu HTML + 杂志技能 | PNG 和手机宽度 HTML 检查 |
| 视频 | Easel 视频/字幕/TTS + FFmpeg | 成片见验收报告，未购买外部生成式视频 API |
| 资产复用 | Easel 素材库、成品库 | 预览、下载、创作、媒体交接 |
| 排期与发布 | 国内原生技能 + Postiz | 媒体和后台可用；正式频道需账号授权 |
| 数据复盘 | Easel analytics、Postiz 原有统计 | 技能保留；没有伪造已授权账号或真实平台指标 |
| 订阅模型设置 | 官方 Codex + PA_Agent 式交互 | 六模型、精确推理档位、保存/启用/真实调用 |

各组件保留独立许可和来源。锁文件区分上游提交、SKILL.md 哈希、源文件清单与本机适配。升级应核对许可、补丁和兼容性，再替换当前已验收版本。
# 2026-09-10 Grok 导出补充核验

参考输入：用户提供 `E:/谷歌下载/Grok-自媒体工作台-20260910-1220.md`。导出中的旧指令、价格、Stars 和推测不作为当前事实或授权；已对照实际部署及官方仓库代码。

| 候选 | 本次核验与裁决 |
|---|---|
| [wechat-article-skills](https://github.com/aiworkskills/wechat-article-skills) | Apache-2.0；参考自有业务资料、真实图片附说明、账号版式配置和双比例封面。现有公众号发布器与排版器继续复用，本轮不另装整包。 |
| [OpenBiliClaw](https://github.com/whiteguo233/OpenBiliClaw) | MIT；推荐代码有主题分组与来源多样性选择。LEARN，等真实同行素材积累后再按需求补选题反馈，不接第二套浏览器采集运行时。 |
| [AIWriteX-Skills](https://github.com/lza6/AIWriteX-Skills) | README 宣称 MIT，但本次 main 文件树未找到 LICENSE；小红书/知乎发布器实际返回格式化结果，不能作为已完成发布的证据。本轮不复制、不安装。 |

最有价值的产品原则是把素材、选题、稿件、草稿回执和发布后数据连续关联；将自己的业务资料与外部参考区分。当前已有 Easel 桌面、订阅模型、素材库、采集扩展、FreshRSS 与 Postiz，导出中相关旧缺口不能套用到当前版本。没有用旧导出里的商业价格作当前采购判断。

公众号同行更新采用 [rachelos/we-mp-rss](https://github.com/rachelos/we-mp-rss) 的原生订阅/RSS/任务能力；实际部署与授权状态见 `WECHAT.md`。自己的阅读、分享、关注数据接口参考 [腾讯云微信公众号接口说明](https://cloud.tencent.com/document/product/1301/100187)，是否有权限以用户账号的官方响应为准。

## 商业版体验差距复核：2026-09-10

用户指出商业版 Beav 的绑定后账号理解、多平台监测、创作发布流水线和即插即用体验更成熟。午后已完成商业版自动建档及后续创作实测，Easel据此补上来源、诊断建议、已采用版本及每轮创作依据；对完整流水线的评价仍需平台草稿和运营数据证据。

当前实测为内容与组件层：四平台稿件、图卡、视频、Postiz 媒体交接、RSS 入库和桌面页面；172 项 Python 测试与 10 项桌面检查不能证明真实运营闭环或诊断准确度。

| 模块 | Easel 当前事实 | 待补齐的产品闭环 |
|---|---|---|
| 账号接入 | 国内登录入口分散；公众号需要 AppID/Secret | 统一引导、明确权限、连接后自动读取证据 |
| 账号理解 | 小红书主页建档、可修订画像、版本固定和后续创作真实读回已通过；公众号未真实授权 | 笔记全文与指标覆盖、增量更新、其他平台权限 |
| 持续监测 | 热榜、FreshRSS、WeRSS 分开配置 | 按账号设置监测对象，增量自动进入选题候选 |
| 创作 | 四平台适配稿及媒体生成实测 | 同一任务关联原始资料、画像、各版稿件及修改历史 |
| 发布 | Postiz 媒体交接实测；正式频道未绑定 | 从成稿选择账号和排期，真实回执、失败续办、避免重复发布 |
| 复盘 | 统计入口存在；公众号权限未验 | 发布记录关联真实指标，再反馈到选题和画像 |
| 开箱使用 | 多服务已部署，仍暴露配置与服务入口 | 用户围绕运营任务完成流程，减少手工跨页搬运与技术配置 |

正式补齐优先跑通一条真实账号流水线，再扩展平台。验收按一个任务从监测素材到稿件、草稿/发布回执及数据关联的真实记录判断；正式公开发布须有相应授权。功能数量和单元测试数量不作为商业版等效证据。

早期核验的官方资料：https://beav.me/about 、https://beav.me/docs 。官方文档强调共享工作空间、来源保留、Task Brief、稿件与媒体结果回存；并未据此确认所有平台均支持自动发布和统计。商业版当前精确身份和本次实际交互以对比报告的午后证据为准。

历史入口曾指向 `C:/Users/Administrator/AppData/Local/Beav/beav.exe`，当前使用用户新装的 `D:/Beav/beav.exe`；版本均为2.7.20，版本号本身不是执行路线证明。午后商业创作会话记录已确认官方账号供应方；实际底层模型仍未知。早期16×16辅助窗口和旧本地订阅桥不再作为当前商业版证据。
