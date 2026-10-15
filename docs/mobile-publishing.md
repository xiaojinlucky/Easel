# 电脑创作与手机发布

## 需求与边界

问题本质：将电脑当前选定的平台文案和媒体完整交给手机，由用户在平台 App 检查并发布。领取成功不是发布成功。

目标入口是现役 Easel-v030 的 7871 发布中心。沿用已有标题、平台正文、标签、媒体选择、FastAPI、FileResponse 和 segno；不自动登录或发布，不新增付费依赖。

## 复用调研（2026-10-15）

| 候选 | 层级及来源 | 活跃度实测 | 许可 | 覆盖与决定 |
|---|---|---|---|---|
| Easel v0.3.0 现有组件 | P0 成熟开源；https://github.com/ZJU-REAL/Easel | 3638 stars；最近提交 bb3c8ff，2026-10-12；v0.3.0 同日发布 | 实际读取 LICENSE：Apache-2.0 | 大部分；ADAPT。已有发布编辑、选图、HTTP、二维码，只补选定内容的限时领取与手机页 |
| LocalSend v1.18.2 | P0 成熟开源；https://github.com/localsend/localsend | 94434 stars；最近提交 14f3a87，2026-10-10；v1.18.2 发布于2026-08-21 | 实际读取 LICENSE：Apache-2.0 | 大部分；REFERENCE。官方 changelog 确认浏览器链接领取，但作为独立应用还要跨应用移交稿件，当前不引入 |
| Beav 商业版 2.9.2 | P0 闭源产品设计；https://github.com/Jamailar/Beav/releases/tag/v2.9.2 | 主会话直接核实 2026-10-15 release 及本机 PE/UI 2.9.2；公开源码是2.5.0快照 | 商业安装版适用其用户协议；无闭源代码复用授权 | 部分；LEARN。仅借鉴同局域网、二维码取件、有效期及人工发布分工，不复制实现 |

开源活跃度通过 GitHub API 当日读取；直连匿名配额受限的查询使用公开只读转发，并核对官方页面。许可来源分别为各仓库 main/LICENSE。LocalSend 官方 app/assets/CHANGELOG.md 确认非 LocalSend 用户可通过浏览器链接取件。

结论：改造现役 Easel。二维码和 HTTP 传输直接复用已安装组件，新增代码只承担“选定内容形成临时快照、授权领取、过期撤销、手机展示”。独立传输软件会多出安装、启动与跨应用移交步骤。未建立新框架或新服务。

## 实现约束

- 电脑本机创建、查询和撤销领取包；手机仅能 GET/HEAD 领取页及该包声明的媒体。
- 复用7871监听，不把主工作台、配置、对话和整个 outputs 目录交给手机。非回环请求只允许进入领取路由；本机反向代理仍通过回环连接。
- 随机不可预测的领取凭证，30分钟有效；仅选中的文件进入快照，文件改动不悄悄改变已领取内容。
- 媒体从 outputs 的普通内容目录选择；拒绝路径穿越、符号链接、隐藏/系统目录、缺失文件及超限输入。
- 手机页允许复制标题、正文与标签，按顺序保存原图或下载素材包；HTTP下剪贴板不可用时明确提示长按复制。
- 结束领取和过期后，页面及文件都失效；不自动标记已发布。

## 证据状态

Beav官方流程：https://beav.pro/docs/workspace/drafts-and-publishing ，https://beav.pro/docs/workflows/asset-sharing 。

REA MCP 6.3.0 已连接，Windows原生UI观察不受支持；Computer Use原生管道重连仍失败。未获得Beav领取链接前，不能声称完成其手机领取页面的REA运行采集。既有官方行为是设计输入，不是闭源源码的证明。

## 实际实现与验收（2026-10-15）

已实现：发布中心各平台卡片的「发送到手机」、所选平台正文与媒体快照、局域网地址选择和二维码、手机文案复制及原文件/ZIP下载、结束领取与30分钟过期。话题文本保留#，平台内的话题绑定仍由用户手动完成。最多同时4包，每包30个媒体、100 MiB。撤销后新请求失效，已经开始的下载允许完成，结束后回收快照；已被手机保存的内容不会远程删除。

接口：本机 POST /api/phone-shares 创建；GET /api/phone-shares/{token} 查询；DELETE 同一路径幂等撤销。手机仅能 GET/HEAD /phone/{token}、/media/{index}、/download.zip。PhoneBoundary位于原Host/跨站写守卫外层，按ASGI连接来源限制其他入口。反向代理若把远端IP透传为ASGI client，也会被限制；本次现役入口是本机浏览器。

代码：web/phone_share.py、web/static/phone_share.html、web/app.py接线、前端MobileShareButton/PublishPage/api。正式前端已重新构建到web/frontend/dist。未改原稿、平台登录态及发布记录。

验证：pytest覆盖手机领取、本机守卫、设置安全、Direct API与Agent harness，221 passed、6 skipped。前端npm run build通过，仅有既有大chunk提示。破坏者、验收者、回归守门人三个独立GPT-6审查完成；下载清理竞态及两个旧测试客户端来源问题已修复并复测。

REA浏览器场景在临时7872服务走通真实构建页面：平台单独编辑正文、选图、生成二维码、手机尺寸页面复制、桌面结束领取。证据ev_c12884e3f200fe388e6d83e5755b3e71b5c344a131945b0023d8cad9c5c4f350、ev_fcca6e132b19de8a49dc9c531e5733ff98eb8404a8fe1dc57bac8368bd0fa3a6。手机页GET及图片GET为200；REA按其下载策略取消文件落盘，ZIP另用真实HTTP下载核对成功，媒体SHA-256及ZIP内原图与源文件一致。局域网普通工作台访问和伪造Host/Origin均403；撤销后页面及媒体404。

完整本地REA证据保留在.runtime/phone-publishing-rea-20261015.json，不提交含运行界面的诊断包。未实测实体手机的系统相册保存，也没有执行平台发布。

当前部署状态（2026-10-15 更新）：后续连续创作功能部署已重启现役 7871。提交前重新读取其 OpenAPI，确认手机领取、素材和创作路由均已加载。早期 7872 只用于验收，不是第二个常驻工作台；实体手机相册保存及平台发布仍未实测。

依赖与成本：运行时复用现有FastAPI、segno及Python标准库，无新增运行服务、付费接口或账号。开发验收在现有.venv补装免费pytest 9.1.1（iniconfig/pluggy/pygments），不纳入产品运行依赖。
