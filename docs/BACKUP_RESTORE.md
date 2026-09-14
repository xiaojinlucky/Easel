# 本机备份与恢复

备份包含私有账号信息，目录不要公开。源码、安装运行时和官方 Codex 登录应独立保留；此备份不是完整磁盘镜像。

## 两层备份：先明确用哪一层

| | `scripts/backup_local.py` | `scripts/backup_accounts.py` |
|---|---|---|
| 覆盖 | 全量：Docker 数据卷、`research.sqlite`、outputs/profiles/config/deploy | 只覆盖「配一次很费事、丢了必须重来」的账号登录态 |
| 前提 | 必须先停 Web / 网关 / 容器，备份期间不要重启创作任务 | 不碰 Docker、不停服，随时可跑 |
| 耗时 | 数分钟 | 秒级 |
| 产出 | `.runtime/backups/<时间戳>/`（目录 + manifest + ZIP + 卷 tar） | `.runtime/account-backups/<时间戳>.zip`（ZIP + 内嵌 MANIFEST） |

**为什么要单独做轻量那层**：六个平台的浏览器登录态在 `~/.easel-browser-profiles`，
位于项目目录**之外**，`backup_local.py` 的归档范围覆盖不到；而它恰好是最难重建的部分
——全靠重新扫码。换机器、清理用户目录、误删都会一次性丢掉。

轻量层覆盖：`~/.easel-browser-profiles/`、`outputs/_login/`、`profiles/`、`cookies.json`（B 站）、
`skills/openclaw/skill-wechat-publisher/wechat-publisher.yaml`（公众号凭据）、
`.runtime/{wechat-state.json,postiz-account.json,postiz.env,postiz-bind.yaml}`、`.runtime/postiz-cli-home/`。
浏览器缓存与日志（`Cache` / `Code Cache` / `*.log`）刻意排除：实测某个平台 profile 的 87 MB 里
85 MB 是缓存，去掉后同一份登录态只剩不到 1 MB。

刻意**不纳入**：`scripts/.token_cache*.json`（约 2 小时过期的微信令牌缓存，失效自动重取，属可重建产物；
`.gitignore` 单列它是为了防泄密，与备份覆盖面无关）、`~/.openclaw-easel-studio/`（实测 1.04 GB 的
agent 运行时与插件缓存，模型认证按本文口径用官方登录重新授权）、Postiz/WeRSS 的 Docker 卷（属全量层）。

```powershell
.\.venv\Scripts\python.exe -X utf8 scripts\backup_accounts.py status
.\.venv\Scripts\python.exe -X utf8 scripts\backup_accounts.py backup
.\.venv\Scripts\python.exe -X utf8 scripts\backup_accounts.py list
.\.venv\Scripts\python.exe -X utf8 scripts\backup_accounts.py verify .runtime\account-backups\accounts-<时间戳>.zip
.\.venv\Scripts\python.exe -X utf8 scripts\backup_accounts.py restore --dry-run .runtime\account-backups\accounts-<时间戳>.zip
.\.venv\Scripts\python.exe -X utf8 scripts\backup_accounts.py restore .runtime\account-backups\accounts-<时间戳>.zip
```

恢复的注意点：

- 先关闭工作台与浏览器进程。被占用而写不进去的文件会在结尾单独列出，重跑即可补齐。
- 恢复前脚本会先把**当前状态**快照成一份 `accounts-snapshot-<时间戳>.zip`，后悔可以直接 restore 回去。
- 只恢复自己产出的归档：`verify` 校验的是**完整性**（内容有没有坏），不是**来源签名**；
  自己改内容并同步改 MANIFEST 是能对上的。
- 归档含登录态与密钥，目录只放在本机私有位置。
- `postiz.env` / `postiz-bind.yaml` 是本机生成的，换机器后仍需按下面的顺序重新初始化发布栈。
- 手动备份与恢复前快照分开计数（默认各留 10 / 3 份），恢复不会挤掉手动备份。

## 全量备份

等创作完成，关闭工作台页面并停止 Web/模型网关，再运行：

```powershell
.\.venv\Scripts\python.exe -X utf8 -m easel.services stop web gateway
.\.venv\Scripts\python.exe -X utf8 scripts\backup_local.py
```

备份期间不要重新启动创作任务。脚本拒绝正在运行的 Web、网关或未结束会话；短暂停止本项目容器后复制八个数据卷，随后恢复发布服务。项目数据用 ZIP 保存，素材 SQLite 使用数据库 backup API。

只有 `.runtime/backups/日期-时间/manifest.json` 所在的完成目录可用。`.incomplete-*` 是失败或未结束的备份，不能直接恢复。脚本完整读取 ZIP/TAR、记录 SHA-256、关闭文件句柄后才把目录改为完成状态。

```powershell
.\.venv\Scripts\python.exe -X utf8 scripts\check_backup.py .runtime\backups\20260910-045203
.\.venv\Scripts\python.exe -X utf8 scripts\restore_drill.py .runtime\backups\20260910-045203
```

第二条会创建随机名称的临时 PostgreSQL 卷和容器，恢复数据库并读取账号、组织、媒体行数，网络为 none、没有宿主端口，最后只删除刚创建的演练资源。2026-09-10 已实际通过，三项行数均为 1。这是数据库恢复演练，不冒充整台新机器的全系统恢复。

## 实际恢复顺序

实际恢复会替换数据，只有在用户明确要求恢复时执行。保留受损现状，不覆盖有内容的原卷。

1. 在目标机器恢复本项目源码及所需运行时，安装同版本 WSL Ubuntu/Docker/Compose；保持 Web、网关和本项目容器停止。原部署只在当前 Windows 本机验收，新机器需重新核对路径和依赖。
2. 对选定备份运行 `check_backup.py`，校验文件 SHA-256、ZIP CRC、TAR 全部成员及路径。任何不一致立即停止，不强行解包。
3. 使用标准 `zipfile.ZipFile.extractall` 将 `easel-data.zip` 解压到**新建且空的恢复暂存目录**；从暂存目录恢复 outputs、profiles、config、deploy 和 `.runtime` 私有配置。把单独的 `research.sqlite` 放回项目 `.runtime/research.sqlite`，确保没有旧 WAL/SHM 同时混入。已有正式文件先另存，不能直接覆盖。
4. ZIP 中的 `openclaw-easel-studio/openclaw.json` 是配置副本。核对新机器的项目路径后安装到独立 OpenClaw profile，重建 workspace-easel 的目录链接。模型认证未复制，用官方登录/迁移命令重新授权。Web 会话和结果在 `outputs/_sessions`；官方 Agent 会话 catalog 不在本备份中，因此不能把它当成完整的模型对话恢复。
5. 恢复数据卷。只在全新的空卷上操作。下面是在已有项目 Python 环境中执行的步骤；`check()` 已拒绝绝对路径、`..`、符号链接和非预期卷成员：

```python
import json, subprocess, sys
from pathlib import Path
sys.path.insert(0, 'scripts')
from check_backup import check
from easel.platform_services import WSL, wsl_path

backup = Path('.runtime/backups/20260910-045203').resolve(strict=True)
manifest = check(backup)
docker = WSL + ['/usr/bin/docker', '--host', 'unix:///var/run/docker.sock']
for name in manifest['volumes']:
    if not name.startswith('easel-postiz_'):
        raise RuntimeError('Unexpected volume name')
    exists = subprocess.run(docker + ['volume', 'inspect', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
    if exists:
        raise RuntimeError('Refusing existing volume: ' + name)
for name in manifest['volumes']:
    subprocess.run(docker + ['volume', 'create', '--label', 'com.docker.compose.project=easel-postiz', '--label', 'com.docker.compose.volume=' + name.split('_', 1)[1], name], check=True)
subprocess.run(WSL + ['tar', '-xzf', wsl_path(backup / 'platform-volumes.tar.gz'), '-C', '/var/lib/docker/volumes'], check=True)
```

6. 镜像缓存丢失时，先运行 `scripts/pull_postiz_images.py`。它依据 `config/postiz-images.lock.json` 的 registry digest 获取官方镜像并导入，不依赖浮动 latest；需要本项目已经安装的官方 crane。再运行 `scripts/prepare_postiz.py` 生成匹配当前 image ID 的 Compose。保留 Sentry 补丁及其对应镜像版本，不能把旧编译补丁套到未知新版。
7. 运行启动脚本，重新生成当前 WSL 私有 IP 的端口覆盖和 Caddy 配置。核验 Easel、Postiz、FreshRSS 地址、九个容器状态、Postiz API、已上传媒体、RSS 订阅和素材数量。必要时用 Temporal UI 核对队列 poller。账号重新授权后才恢复实际排期，避免重复发布。

本次没有对现有数据执行恢复覆盖。已实测的是：完整归档读回、隔离 PostgreSQL 卷启动及数据查询、原部署停止后重启的数据留存。

## 2026-09-10 公众号增量

备份脚本已纳入 `.runtime/wechat-state.json` 与存在时的 `skills/openclaw/skill-wechat-publisher/wechat-publisher.yaml`。WeRSS 持久卷 `easel-postiz_werss-data` 符合既有项目卷归属校验，恢复时随同项目卷处理。归档含账号凭据，应沿用已有私有备份保护。本次新增后未执行完整离线备份，旧备份不包含新增状态。
