# Easel 本机工作台

2026-09-10 部署于 `F:\科研大师兄\Easel`。保留完整 Easel 的 112 个技能，组合 8 个有许可的扩展、Postiz 和 FreshRSS。最终验收记录见 [验收记录](ACCEPTANCE.md)，复用与调研见 [复用报告](REUSE_AND_RESEARCH.md)。

## 打开与启动

现在优先使用独立桌面应用：双击“Easel 自媒体工作台”，或运行 `启动桌面工作台.ps1`。创作、发布日历和订阅阅读在同一窗口内切换，详见 [桌面版说明](DESKTOP.md)。下面的网页地址和旧启动脚本保留作备用入口。

| 入口 | 地址 / 文件 | 用途 |
|---|---|---|
| Easel | http://127.0.0.1:7860/ | 创作、素材、成品、账号、技能、模型设置 |
| Postiz | http://localhost:4007/ | 媒体库、频道、日历、排期、发布记录 |
| FreshRSS | http://localhost:8089/ | RSS / Atom 订阅库 |
| Temporal | http://localhost:8088/ | 发布后台任务排障 |
| 启动 | `启动工作台.ps1` | 启动模型网关、Web、发布和订阅服务 |
| 停止 | `停止工作台.ps1` | 停止本项目进程和容器，保留成品和数据卷 |

在项目目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\启动工作台.ps1
```

加 `-NoPlatforms` 仅启动创作工作台，加 `-NoBrowser` 不打开浏览器。服务通过 Windows 回环地址使用，未配置公网访问。

Postiz 本地账号是 `studio@easel.local`，随机密码在 `.runtime/postiz-account.json`；FreshRSS 用户是 `easel`，密码在 `.runtime/postiz.env` 的 `FRESHRSS_ADMIN_PASSWORD`。均为被 Git 排除的本机私有文件，勿分享。Postiz 初始化后已关闭注册。社交平台仍需用户登录/授权，当前 Postiz 返回 0 个频道。

## 已跑通的流程

1. 素材页用 CloakBrowser + Baoyu/Defuddle 提取公开网页，保留来源、时间和正文；支持手动导入评论、摘录，勾选素材直接创作。
2. FreshRSS 按小时更新，素材页同步最近 20 条；标注 RSS 摘录，不覆盖同 URL 的完整正文。
3. 真实生成小红书、公众号、知乎和短视频四份适配稿，附来源核查及质量报告。
4. 真实生成三张 1080×1440 卡片、公众号 HTML 和一张 1536×1024 原生 AI 配图；卡片审计与手机宽度排版检查通过。
5. 内容库打开图片或视频，点击「送入 Postiz 媒体库」。卡片已实际上传并在 Postiz 读回，SHA-256 与原图相同。连接频道后可在 Postiz 编排内容，正式发布必须取得平台回执。

样例目录：`outputs/独立创作者素材到发布的可复用流程/`。视频成片与最终审查状态见 `ACCEPTANCE.md`。能力页区分安装、账号状态和实测，未用虚构频道创建“成功草稿”。

## 模型与额度

使用独立官方 OpenClaw `easel-studio` 和官方 Codex 插件，通过现有 ChatGPT Pro 登录。PA_Agent 仅参考了官方状态读取、模型/推理目录、保存、测试和启用逻辑，没有修改 Quant。模型调用不依赖 OpenAI API Key，不自动转向按量付费 API。

官方本地 RPC 当前返回 gpt-6-astra、gpt-5.6-sol、gpt-5.6-terra、gpt-5.6-luna、gpt-5.5、gpt-5.3-codex-spark，各自推理档位按实际支持范围展示。已启用 `gpt-6-astra / high` 并通过真实调用。原生图片工具也已实测；外部视频、音乐等供应商仍需各自的账号或 API 条件。

工作台已取消开发阶段的 15% / 95% 自定义停止阈值、运行中轮询拦截和停止锁。周额度仅供查看，暂时无法读取额度也不会拦截模型请求；实际可用性仍以官方订阅服务返回为准。

本次开发由 GPT-5.6-Luna 子 Agent 监测，主 Agent 在阶段交接也核对额度。网关 heartbeat、Cron 和记忆 dreaming 均关闭；没有自动续跑任务。开发监测不是开机常驻 Agent。其他设备或其他任务不在本地进程管理器控制范围内，不能宣称实现账号级全局强停。

## 运行组件与数据

| 组件 | 验收版本 / 位置 |
|---|---|
| Easel | 上游 `ac062520a23a72de14e4877300c8c5572dc60ca6`，Apache-2.0 |
| Python | 3.12.12，项目 `.venv` |
| Node / Bun | 24.16.0 / 1.4.2，项目 `.runtime/node_modules` |
| OpenClaw | 2026.9.3，官方 Codex 插件，托管 Codex 0.153.4 |
| 模型状态 RPC | 已安装官方 Codex CLI 0.153.0 |
| 前端 | React 19、TypeScript 6、Vite 8.1.4，生产构建 |
| Postiz | 实际 UI v2.23.0；官方 CLI 2.0.16；镜像摘要与 image ID 锁定 |
| 容器 | Ubuntu-24.04 WSL，Docker 29.1.3 / Compose 2.40.3，项目 easel-postiz |
| Caddy | 官方 2.11.4，SHA-512 核验，Windows 回环代理至 WSL 私有地址 |

OpenClaw 配置在 `C:\Users\Administrator\.openclaw-easel-studio`，工作区为 `C:\Users\Administrator\.openclaw\workspace-easel`，skills / outputs / profiles 指向项目目录。会话使用官方 SQLite catalog；未接入旧版 sessions.json 修复器。原有全局 openclaw-cn 保持独立。

备份需包含：`outputs/`（包括 `_sessions/`）、`profiles/`、`.runtime/research.sqlite*`、`.runtime/model-settings.json`、`.runtime/postiz.env`、`.runtime/postiz-account.json`、OpenClaw 独立配置，以及 WSL 中 easel-postiz 的数据卷。容器数据不在 Windows `.runtime` 内，只复制源码不能备份发布数据库/媒体。停止不会删卷，禁止把 `docker compose down -v` 当重启。已提供[备份与恢复步骤](BACKUP_RESTORE.md)，含真实隔离数据库恢复演练。

```powershell
.\.venv\Scripts\python.exe -X utf8 -m easel.services status gateway web cloak platforms
.\.venv\Scripts\python.exe -X utf8 -m easel doctor
.\.venv\Scripts\python.exe -X utf8 -m easel.postiz auth:status
.\.venv\Scripts\python.exe -X utf8 -m easel.postiz integrations:list
```

日志在 `.runtime/logs/`。Caddy 不继承互联网代理，避免回环请求进入代理。WSL 保持进程只保障本项目服务存活，停止入口会一并清理。

## 更新与边界

本次是已验收的本机部署，不宣称适配任意新机器。版本和来源保存在 `config/*lock.json`、`deploy/postiz/UPSTREAM.json`；扩展锁分别记录 SKILL.md 与源文件哈希。更新先备份数据、配置和当前源码，再核对版本、构建、运行，不能直接追 latest。

Postiz 当前镜像带一个只读挂载的最小 Sentry 初始化补丁，来源与前后哈希见 `deploy/postiz/patches/PROVENANCE.json`。换镜像时重新核对原文件和路径，不能盲目覆盖新的编译文件。

摘录扩展目录为 `extensions/easel-clipper`，按 README 在 Chrome/Edge 加载，再从素材页生成配对码。它复用 Mozilla Readability，仅按点击读取当前页；已准备好，但未安装到用户常用浏览器。

国内浏览器发布技能和 Postiz 集成受平台账号、OAuth、权限及网络条件约束。没有实际对外发布、购买媒体服务或伪造统计指标。社区调研的受限平台保持暂停，完整比较见复用文档。
