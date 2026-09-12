# 本机备份与恢复

备份包含私有账号信息，目录不要公开。源码、安装运行时和官方 Codex 登录应独立保留；此备份不是完整磁盘镜像。

## 备份

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
