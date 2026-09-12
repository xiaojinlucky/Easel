# Easel 桌面版

这是复用现有 Easel 前端与后端的独立 Windows 桌面应用，采用 Electron 44.3.0（MIT）。不需要浏览器标签或地址栏；创作、发布日历和订阅阅读在一个应用窗口内切换。

## 打开与关闭

- 双击桌面或开始菜单的 **Easel 自媒体工作台**。
- 或运行项目根目录的 `启动桌面工作台.ps1`。
- 实际程序：`.runtime/desktop-app/Easel-win32-x64/Easel.exe`。程序目录是本机部署产物，依赖本项目的 Python、OpenClaw 与 WSL 服务；不要把这个 EXE 单独复制到另一台电脑当作完整安装包。
- 打开后自动连接或启动本机服务。重复打开会聚焦已有窗口，不会再创建一套后台服务。
- 顶部切换创作工作台、Postiz 发布日历、FreshRSS 订阅阅读。`Ctrl+1/2/3` 对应三个入口；切换保留页面和进行中的对话。
- **关闭窗口只退出桌面界面，后台任务和发布排期继续运行。** 要全部停止，使用“应用 → 停止服务并退出”，该操作会提示进行中的任务将中断。
- 底部显示实际服务状态；启动失败时可以重试，或通过“帮助 → 打开运行日志”定位问题。
- “打开成品文件夹”直接打开本机 `outputs` 目录。附件使用系统文件选择器，支持原有粘贴和拖入操作。

## 数据与账号

原有素材库、成品、账号画像、模型设置、技能和后台数据库仍使用同一套项目数据，没有新建业务数据库。

桌面应用自己的浏览器存储位于 `.runtime/desktop-profile`，和原来的 Chrome、Edge、Codex 内置浏览器相互独立。原浏览器的对话列表、未提交发布草稿与 Postiz/FreshRSS 浏览器登录态不会自动迁移；原浏览器里的数据仍保留。桌面版内重新登录本机 Postiz/FreshRSS 时，使用原来的本地账户，凭据位置见 [部署说明](LOCAL_DEPLOYMENT.md)。Codex 订阅与国内平台后端保存的登录配置继续复用。

日常创作和两个后台不需要外部浏览器。查看外部来源、第三方授权等链接仍交给系统浏览器处理。浏览器采集扩展仍用于 Chrome/Edge，不会因桌面封装自动装入 Electron。

原版 `.runtime/backups` 备份覆盖项目业务数据与平台卷，不包含桌面 Chromium 存储。不要把该备份当作浏览器对话列表和登录态的完整备份。

## 构建与维护

在 `desktop` 目录执行：

```powershell
npm ci
npm test
npm run package
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-shortcuts.ps1
```

打包器复用 `@electron/packager`，Electron 压缩包从官方 GitHub Release 下载，并核验官方 npm 包附带的 SHA-256。下载使用本项目已声明的 requests 依赖，保留本机代理设置。当前版本归档保留在 `.runtime/electron-download`，用于可重复打包。

构建前关闭当前桌面窗口；后台服务可以继续运行。生产 EXE 内不开放调试端口，不向工作台、Postiz 或 FreshRSS 页面暴露 Node.js 或桌面文件系统接口。桌面菜单桥接仅允许本地应用外框调用固定动作。

桌面状态与诊断日志为 `.runtime/desktop-window.json` 和 `.runtime/logs/desktop.log`。

## 复用来源

- [Electron](https://www.electronjs.org/) 与[安全建议](https://www.electronjs.org/docs/latest/tutorial/security)
- [WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view)：保留多个独立页面状态
- [Electron Packager](https://github.com/electron/packager)：Windows 程序打包

桌面版本的实测记录在 `.runtime/desktop-check/result.json`，界面读回图在同目录。

## 本机验收（2026-09-10）

- 官方 Electron ZIP 的 SHA-256 核验通过；实际运行的是打包后的 `Easel.exe`。
- 从工作台、网关和发布服务全部关闭的状态启动，三组服务均成功就绪。
- 工作台、Postiz、FreshRSS 均在独立桌面窗口中真实渲染；已读回原生窗口图像。Postiz/FreshRSS 显示首次登录页面，未冒充已登录验收。
- 切换三个入口后，创作页 WebContents 保持同一实例；桌面标签选中状态同步。
- 工作台页面无法读取 Node、process 或桌面桥接；导航策略 2 项测试通过。
- 测试窗口退出后，后台服务仍健康。桌面快捷方式连续打开两次后，仍只有一个主窗口进程。
- 两路独立审查通过。桌面与开始菜单快捷方式已创建，并读回确认目标为本次打包的 EXE。
- 最终 Luna 额度读取：北京时间 2026-09-10 10:47，主 Codex 周剩余 45%，未触发停止阈值；本轮监测已结束。

收尾：正式程序、构建依赖、已校验的当前 Electron 归档和验收截图保留。自动审批拒绝删除本轮隔离测试存储 `.runtime/desktop-check/profile`，仅返回 `blocked by policy`；约 12 MB 保留，测试进程已退出，未绕过拒绝。正式桌面存储 `.runtime/desktop-profile` 未受影响。
