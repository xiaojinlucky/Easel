# -*- coding: utf-8 -*-
"""账号登录态轻量备份 / 恢复。

与 `scripts/backup_local.py` 的分工（两者不可互相替代）：

| | backup_local.py | 本脚本 |
|---|---|---|
| 范围 | 全量：Docker 卷 + SQLite + 项目数据 | 只覆盖「配一次很费事、丢了必须重来」的账号态 |
| 前提 | 必须先停 Web / 网关 / 容器 | 不碰 Docker、不停服，随时可跑 |
| 耗时 | 数分钟 | 秒级 |

**为什么单独做这一份**：`~/.easel-browser-profiles` 在项目目录**之外**，
不在 `backup_local.py` 的归档范围内。它恰好又是最难重建的东西——六个平台的
登录态全靠扫码重来。换机器、清理用户目录、误删，都会一次性丢掉。

设计约束（刻意为之）：
* **只用标准库**，不 import `easel`。恢复工具若依赖被恢复的对象，就没法救急。
* **不改动被备份的文件**，只读。恢复才写盘，且写盘前先把现状快照成另一份备份。
* 遇到被浏览器独占而读不到的文件不中断，如实计入 `skipped` 并在结尾报出来。
* **`FILES` 里的符号链接一律跳过**（`TREES` 本来就不跟随）。否则 `cookies.json`
  软链到外部文件时，会把外部内容悄悄打进归档，既泄露又可能撑爆体积。

刻意**不纳入**的三处（都有理由，不是漏了）：
1. `skills/openclaw/skill-wechat-publisher/scripts/.token_cache*.json`
   —— 微信 access_token 缓存，约 2 小时过期、失效即自动重取。它是**可自动重建的
   短期产物**，不是「配一次长期有效」的状态；而 `.gitignore` 单列它是为了**防止把
   secret 提交进版本库**，与备份覆盖面是两件事。放进来只会让归档多一份密钥、
   且在换机器时多一个「令牌其实是旧的」的失败面。
2. `~/.openclaw-easel-studio/` —— 实测 1.04 GB，是 agent 的 codex-home 与插件
   缓存。体量与「轻量」定位冲突，且模型认证按 `docs/BACKUP_RESTORE.md` 的既定
   口径就应「用官方登录命令重新授权」，不随备份迁移。
3. Postiz/WeRSS 的 Docker 数据卷 —— 属全量备份（`backup_local.py`）的职责。

用法：
    .venv\\Scripts\\python.exe -X utf8 scripts\\backup_accounts.py status
    .venv\\Scripts\\python.exe -X utf8 scripts\\backup_accounts.py backup
    .venv\\Scripts\\python.exe -X utf8 scripts\\backup_accounts.py list
    .venv\\Scripts\\python.exe -X utf8 scripts\\backup_accounts.py verify .runtime\\account-backups\\accounts-20260914-223000.zip
    .venv\\Scripts\\python.exe -X utf8 scripts\\backup_accounts.py restore --dry-run .runtime\\account-backups\\accounts-20260914-223000.zip
    .venv\\Scripts\\python.exe -X utf8 scripts\\backup_accounts.py restore .runtime\\account-backups\\accounts-20260914-223000.zip
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import socket
import sys
import time
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / '.runtime'
BACKUP_DIR = STATE / 'account-backups'
SKILL_CONFIG = ROOT / 'skills' / 'openclaw' / 'skill-wechat-publisher' / 'wechat-publisher.yaml'


def _home() -> Path:
    """用户目录的唯一出口。

    刻意包一层而不是直接用 `Path.home()`：恢复要写 `~/.easel-browser-profiles`，
    这是唯一一个落在项目之外的写盘目标，必须能在测试里被替换到临时目录，
    否则就只能拿真实登录态做实验（不可接受）。
    """
    return Path.home()


HOME_PROFILES = '.easel-browser-profiles'      # 相对用户目录

MANIFEST_NAME = 'MANIFEST.json'
KIND = 'easel-account-state'
VERSION = 1
DEFAULT_KEEP = 10
SNAPSHOT_KEEP = 3          # 恢复前自动快照的保留份数（独立计数，不挤占手动备份）

# 目录名（按小写比较）命中即跳过整棵子树。
# 这些全是浏览器可自行重建的缓存：实测 XiaohongshuProfile 87 MB 里有 85 MB 是
# Cache / Code Cache，去掉后同一份登录态只剩几 MB —— 备份体积与耗时都降一个量级。
SKIP_DIRS = {
    'cache', 'code cache', 'gpucache', 'dawnwebgpucache', 'dawngraphitecache',
    'dawncache', 'shadercache', 'grshadercache', 'crashpad', 'component_crx_cache',
    'cachestorage', 'scriptcache', '__pycache__',
}
SKIP_SUFFIXES = {'.log'}

# arcname 前缀 → 源路径 → 人话说明。前缀决定恢复时的落地位置：
#   home/...    → Path.home()/...
#   project/... → 项目根/...
# ⚠️ 禁止把 `STATE`（`.runtime`）整目录列入 TREE —— 备份归档自己就放在
#    `.runtime/account-backups/` 下，那样会自包含递归。只按名列入具体文件。
TREES = (
    ('home/.easel-browser-profiles', lambda: _home() / HOME_PROFILES, '六个平台的浏览器登录态'),
    ('project/outputs/_login', lambda: ROOT / 'outputs' / '_login', '扫码登录留下的状态文件'),
    ('project/profiles', lambda: ROOT / 'profiles', '账号画像 / 人设'),
    ('project/.runtime/postiz-cli-home', lambda: STATE / 'postiz-cli-home', 'Postiz CLI 的 OAuth 凭据'),
)
FILES = (
    ('project/cookies.json', lambda: ROOT / 'cookies.json', 'B 站 biliup 登录态'),
    ('project/skills/openclaw/skill-wechat-publisher/wechat-publisher.yaml',
     lambda: SKILL_CONFIG, '公众号 AppID / AppSecret'),
    ('project/.runtime/wechat-state.json', lambda: STATE / 'wechat-state.json', '公众号本地历史与数据快照'),
    ('project/.runtime/postiz-account.json', lambda: STATE / 'postiz-account.json', 'Postiz 本机账号'),
    ('project/.runtime/postiz.env', lambda: STATE / 'postiz.env', 'Postiz 服务密钥（机器绑定）'),
    ('project/.runtime/postiz-bind.yaml', lambda: STATE / 'postiz-bind.yaml', 'Postiz 端口绑定（本机生成）'),
)

# 恢复时提醒：这些是「跟着机器走」的，换一台机器未必还能用。
MACHINE_BOUND = {'.runtime/postiz.env', '.runtime/postiz-bind.yaml'}


# --------------------------------------------------------------------------- #
# 瞬时锁重试
#
# 实测（2026-09-14）：刚被替换过的文件会短暂读不到——第一次 open 抛
# PermissionError，1.5 秒后同一路径读得好好的。触发者通常是杀毒/索引服务
# 对新建文件做扫描时短暂独占。备份撞上它会**静默少存一个登录态文件**，
# 恢复撞上会**静默少恢复一个**，两种都属于「看起来成功、其实丢了东西」。
# 因此读写各加一层短重试；重试仍失败才计入 skipped / failed 如实报出。
# --------------------------------------------------------------------------- #
RETRY_ATTEMPTS = 3
RETRY_DELAY = 0.25


def _open_with_retry(path: Path):
    last: OSError | None = None
    for attempt in range(RETRY_ATTEMPTS):
        try:
            return path.open('rb')
        except OSError as exc:
            last = exc
            if attempt + 1 < RETRY_ATTEMPTS:
                time.sleep(RETRY_DELAY)
    assert last is not None
    raise last


def _replace_with_retry(source: Path, destination: Path) -> None:
    last: OSError | None = None
    for attempt in range(RETRY_ATTEMPTS):
        try:
            os.replace(source, destination)
            return
        except OSError as exc:
            last = exc
            if attempt + 1 < RETRY_ATTEMPTS:
                time.sleep(RETRY_DELAY)
    try:
        source.unlink(missing_ok=True)          # 别在目标目录留 .restore-part 垃圾
    except OSError:
        pass
    assert last is not None
    raise last


# --------------------------------------------------------------------------- #
# 采集
# --------------------------------------------------------------------------- #
def _iter_tree(base: Path):
    """遍历一棵子树，跳过缓存目录与日志；符号链接一律不跟随（防环）。"""
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = sorted(d for d in dirnames if d.lower() not in SKIP_DIRS)
        for name in sorted(filenames):
            if Path(name).suffix.lower() in SKIP_SUFFIXES:
                continue
            path = Path(dirpath) / name
            if path.is_symlink():
                continue
            yield path


def _collect() -> tuple[list[tuple[str, Path]], list[str]]:
    """返回 (待写入清单, 未纳入项说明)。清单元素为 (arcname, 源文件)。"""
    items: list[tuple[str, Path]] = []
    missing: list[str] = []
    for arc_base, factory, _desc in TREES:
        base = factory()
        if not base.is_dir():
            missing.append(f'{arc_base}（不存在）')
            continue
        for path in _iter_tree(base):
            items.append((f'{arc_base}/{path.relative_to(base).as_posix()}', path))
    for arc, factory, _desc in FILES:
        path = factory()
        if path.is_symlink():
            # 与 TREES 同一口径：符号链接不跟随。软链很可能指向项目外的文件，
            # 一旦跟随就会把外部内容静默打进归档（隐私外泄 + 体积失控）。
            missing.append(f'{arc}（是符号链接，已跳过）')
        elif path.is_file():
            items.append((arc, path))
        else:
            missing.append(f'{arc}（不存在）')
    return items, missing


# --------------------------------------------------------------------------- #
# 写归档
# --------------------------------------------------------------------------- #
STALE_PART_AGE = 3600       # 临时文件多久算「中断残留」，可以清掉


def _sweep_stale_parts(folder: Path) -> None:
    """清掉上次中断留下的 `*.part`。

    只清超过 1 小时的：正在并发执行的另一个备份进程也可能刚建了 `.part`，
    按年龄判断才不会误删别人正在写的文件。
    """
    now = time.time()
    for stale in folder.glob('*.part'):
        try:
            if now - stale.stat().st_mtime > STALE_PART_AGE:
                stale.unlink()
        except OSError:
            pass


def _write_archive(target: Path, items: list[tuple[str, Path]]) -> dict:
    target.parent.mkdir(parents=True, exist_ok=True)
    _sweep_stale_parts(target.parent)
    # 临时名带 pid：固定名会让同秒并发的两次备份共用同一个 `.part`，
    # 后者截断前者的写入，最终 rename 出去的是一个损坏的 zip。
    temporary = target.with_name(f'{target.name}.{os.getpid()}.part')
    entries: list[dict] = []
    skipped: list[str] = []
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for arc, source in items:
                digest = hashlib.sha256()
                size = 0
                try:
                    info = zipfile.ZipInfo(arc, date_time=time.localtime()[:6])
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.external_attr = 0o600 << 16
                    with _open_with_retry(source) as handle, archive.open(info, 'w') as sink:
                        while True:
                            chunk = handle.read(1 << 20)
                            if not chunk:
                                break
                            digest.update(chunk)
                            size += len(chunk)
                            sink.write(chunk)
                except OSError as exc:
                    # 被正在运行的浏览器独占、文件被删、路径过长……都不该让整次备份作废。
                    skipped.append(f'{arc}（{exc.__class__.__name__}: {exc.strerror or exc}）')
                    continue
                entries.append({'arc': arc, 'bytes': size, 'sha256': digest.hexdigest()})
            manifest = {
                'kind': KIND,
                'version': VERSION,
                'created_at': time.strftime('%Y-%m-%dT%H:%M:%S%z'),
                'host': socket.gethostname(),
                'home': str(_home()),
                'project_root': str(ROOT),
                'file_count': len(entries),
                'total_bytes': sum(item['bytes'] for item in entries),
                'skipped': skipped,
                'contains_secrets': True,
                'warning': '本归档含登录态与密钥，仅供本机私有保存，不要提交或外发。',
                'entries': entries,
            }
            archive.writestr(MANIFEST_NAME, json.dumps(manifest, ensure_ascii=False, indent=2))
        os.replace(temporary, target)
    except BaseException:
        try:                                    # 失败别把 `.part` 留在备份目录里
            temporary.unlink(missing_ok=True)
        except OSError:
            pass
        raise
    return manifest


REQUIRED_MANIFEST_FIELDS = ('created_at', 'host', 'file_count', 'total_bytes', 'entries')


def _read_manifest(archive_path: Path) -> dict:
    """读出并校验 MANIFEST。

    校验的意义：`list` / `verify` / `restore` 三个子命令都会直接取这些字段。
    一份损坏或被人手工改坏的 MANIFEST（非法 JSON、或合法 JSON 但缺字段）若放任下去，
    它们会各抛各的 `JSONDecodeError` / `KeyError` —— 恢复工具死在堆栈上是最糟的失败
    方式：用户看不出该删哪一份、该重备哪一份。这里统一转成可读的 `SystemExit`。
    """
    try:
        with zipfile.ZipFile(archive_path) as archive:
            try:
                raw = archive.read(MANIFEST_NAME)
            except KeyError:
                raise SystemExit(f'不是本脚本产出的归档（缺 {MANIFEST_NAME}）：{archive_path}')
    except zipfile.BadZipFile as exc:
        raise SystemExit(f'不是有效的 zip，已损坏或不是归档：{archive_path}（{exc}）')
    try:
        manifest = json.loads(raw.decode('utf-8'))
    except (UnicodeDecodeError, ValueError) as exc:
        raise SystemExit(f'{MANIFEST_NAME} 无法解析，归档可能已损坏，建议重新备份：{archive_path}（{exc}）')
    if not isinstance(manifest, dict):
        raise SystemExit(f'{MANIFEST_NAME} 顶层不是对象：{archive_path}')
    if manifest.get('kind') != KIND:
        raise SystemExit(f'归档类型不符：期望 {KIND}，实际 {manifest.get("kind")!r}：{archive_path}')
    absent = [field for field in REQUIRED_MANIFEST_FIELDS if field not in manifest]
    if absent:
        raise SystemExit(f'{MANIFEST_NAME} 缺字段 {absent}，归档已损坏，建议重新备份：{archive_path}')
    if not isinstance(manifest['entries'], list):
        raise SystemExit(f'{MANIFEST_NAME}.entries 不是数组，归档已损坏：{archive_path}')
    return manifest


def _prune(prefix: str, keep: int) -> list[str]:
    """只保留最新的 keep 份「同一前缀」备份；被删的名字返回给调用方打印。

    手动备份（`accounts-*`）与恢复前的自动快照（`accounts-snapshot-*`）分开计数：
    否则每恢复一次就会挤掉一份手动备份，而手动备份才是用户真正想留的。
    这里用正则而不是 glob —— `accounts-*.zip` 会连 `accounts-snapshot-*.zip` 一起匹配。
    """
    pattern = re.compile(rf'^{re.escape(prefix)}-\d{{8}}-\d{{6}}(?:-\d+)?\.zip$')
    if not BACKUP_DIR.is_dir():
        return []
    candidates = sorted(
        (p for p in BACKUP_DIR.iterdir() if p.is_file() and pattern.match(p.name)),
        key=lambda p: p.name, reverse=True)
    removed = []
    for path in candidates[keep:]:
        try:
            path.unlink()
            removed.append(path.name)
        except OSError:
            pass
    return removed


def _make_backup(prefix: str, keep: int) -> Path:
    items, missing = _collect()
    if not items:
        raise SystemExit('没有找到任何可备份的账号态文件；先在账号页完成一次登录再备份。')
    stamp = time.strftime('%Y%m%d-%H%M%S')
    target = BACKUP_DIR / f'{prefix}-{stamp}.zip'
    counter = 2
    while target.exists():          # 同一秒内连跑两次不该互相覆盖
        target = BACKUP_DIR / f'{prefix}-{stamp}-{counter}.zip'
        counter += 1
    manifest = _write_archive(target, items)
    print(f'备份完成：{target}')
    print(f'  文件 {manifest["file_count"]} 个，{_human(manifest["total_bytes"])}，'
          f'压缩包 {_human(target.stat().st_size)}')
    for note in missing:
        print(f'  未纳入：{note}')
    for note in manifest['skipped']:
        print(f'  跳过（读取失败）：{note}')
    removed = _prune(prefix, keep)
    for name in removed:
        print(f'  清理旧备份：{name}')
    print('  提示：归档含密钥，请只在本机私有位置保存。')
    return target


# --------------------------------------------------------------------------- #
# 子命令
# --------------------------------------------------------------------------- #
def cmd_status(_args) -> int:
    print(f'项目根：{ROOT}')
    print(f'用户目录：{_home()}')
    print()
    print('覆盖范围（"一次配置、长期有效"的账号态）：')
    total_files = 0
    total_bytes = 0
    for arc_base, factory, desc in TREES:
        base = factory()
        if base.is_dir():
            files = list(_iter_tree(base))
            size = 0
            for path in files:
                try:
                    size += path.stat().st_size
                except OSError:
                    pass
            total_files += len(files)
            total_bytes += size
            mark = '有'
            detail = f'{len(files)} 个文件 / {_human(size)}'
        else:
            mark = '无'
            detail = '目录不存在'
        print(f'  [{mark}] {arc_base:34s} {detail:22s} {desc}')
    for arc, factory, desc in FILES:
        path = factory()
        if path.is_file():
            size = path.stat().st_size
            total_files += 1
            total_bytes += size
            print(f'  [有] {arc:34s} {_human(size):22s} {desc}')
        else:
            print(f'  [无] {arc:34s} {"文件不存在":22s} {desc}')
    print()
    print(f'合计：{total_files} 个文件 / {_human(total_bytes)}（已排除浏览器缓存与日志）')
    backups = _all_archives()
    print(f'现有备份：{len(backups)} 份' + (f'，最新 {backups[0].name}' if backups else '（还没有，建议跑一次 backup）'))
    return 0


def cmd_backup(args) -> int:
    _make_backup('accounts', args.keep)
    return 0


def cmd_list(_args) -> int:
    backups = _all_archives()
    if not backups:
        print(f'还没有备份。目录：{BACKUP_DIR}')
        return 0
    print(f'备份目录：{BACKUP_DIR}')
    for path in backups:
        try:
            manifest = _read_manifest(path)
        except SystemExit as exc:
            print(f'  {path.name}  <损坏或非本工具产出：{exc}>')
            continue
        print(f'  {path.name:36s} {manifest["created_at"]:26s} '
              f'{manifest["file_count"]:5d} 个文件 / {_human(manifest["total_bytes"]):>9s} '
              f'(包 {_human(path.stat().st_size)})')
    return 0


def cmd_verify(args) -> int:
    path = Path(args.archive).expanduser().resolve()
    if not path.is_file():
        raise SystemExit(f'找不到归档：{path}')
    manifest = _read_manifest(path)
    with zipfile.ZipFile(path) as archive:
        bad_member = archive.testzip()          # 全量读一遍，CRC 校验
        problems: list[str] = []
        if bad_member:
            problems.append(f'CRC 校验失败：{bad_member}')
        for entry in manifest['entries']:
            # 单条 entry 也可能是坏的（数组里混进非对象、缺键）——先校验再用，
            # 否则一个手改坏的 MANIFEST 会让校验器自己崩在 KeyError 上。
            if not isinstance(entry, dict) or not {'arc', 'bytes', 'sha256'} <= set(entry):
                problems.append(f'条目字段不全：{entry!r}'[:120])
                continue
            try:
                with archive.open(entry['arc']) as handle:
                    digest = hashlib.sha256()
                    size = 0
                    while True:
                        chunk = handle.read(1 << 20)
                        if not chunk:
                            break
                        digest.update(chunk)
                        size += len(chunk)
            except KeyError:
                problems.append(f'缺少成员：{entry["arc"]}')
                continue
            if size != entry['bytes']:
                problems.append(f'大小不符：{entry["arc"]}（{size} != {entry["bytes"]}）')
            elif digest.hexdigest() != entry['sha256']:
                problems.append(f'SHA-256 不符：{entry["arc"]}')
    if problems:
        print(f'校验未通过（{len(problems)} 项）：{path}')
        for item in problems[:40]:
            print('  -', item)
        if len(problems) > 40:
            print(f'  …其余 {len(problems) - 40} 项略')
        return 1
    print(f'校验通过：{path}')
    print(f'  {manifest["file_count"]} 个文件 / {_human(manifest["total_bytes"])}，'
          f'ZIP CRC 与逐文件 SHA-256 一致')
    print(f'  产出时间：{manifest["created_at"]}    来源机器：{manifest["host"]}')
    print('  说明：这是**完整性**校验（内容有没有坏），不是**来源签名**（谁做的）。'
          '改内容并同步改 MANIFEST 是能对上的，所以只恢复你自己产出的归档。')
    return 0


def _dest_for(arc: str) -> Path | None:
    """arcname → 本机落地路径。只认 home/ 与 project/ 两个前缀。

    越界三种写法一律拒绝：绝对路径、含 `..`、以及含 `:` 的段
    （Windows 上 `C:foo` 是「当前盘相对路径」，拼进项目路径后语义会飘）。
    """
    pure = PurePosixPath(arc)
    parts = pure.parts
    if pure.is_absolute() or '..' in parts or not parts:
        return None
    if any(':' in part for part in parts[1:]):
        return None
    if parts[0] == 'home':
        return _home().joinpath(*parts[1:]) if len(parts) > 1 else None
    if parts[0] == 'project':
        return ROOT.joinpath(*parts[1:]) if len(parts) > 1 else None
    return None


def cmd_restore(args) -> int:
    path = Path(args.archive).expanduser().resolve()
    if not path.is_file():
        raise SystemExit(f'找不到归档：{path}')
    manifest = _read_manifest(path)
    print(f'归档：{path.name}（{manifest["created_at"]} 由 {manifest["host"]} 产出）')

    planned: list[tuple[str, Path]] = []
    rejected: list[str] = []
    with zipfile.ZipFile(path) as archive:
        names = [n for n in archive.namelist() if n != MANIFEST_NAME]
    for arc in names:
        dest = _dest_for(arc)
        if dest is None:
            rejected.append(arc)
            continue
        planned.append((arc, dest))

    if rejected:
        print(f'拒绝 {len(rejected)} 个越界成员（绝对路径 / .. / 未知前缀），不会写入：')
        for arc in rejected[:10]:
            print('  -', arc)

    if args.dry_run:
        print(f'[试运行] 将恢复 {len(planned)} 个文件：')
        for arc, dest in planned[:40]:
            print(f'  {arc}\n      -> {dest}')
        if len(planned) > 40:
            print(f'  …其余 {len(planned) - 40} 个略')
        print('[试运行] 未写入任何文件。')
        return 0

    print('提示：恢复会覆盖同名文件。开始前请关闭工作台与浏览器进程——'
          '被占用而恢复失败的文件会在结尾单独列出。')
    print('      只恢复你自己产出的归档：`verify` 能查内容有没有坏，但不能证明来源。')
    snapshot = _make_backup('accounts-snapshot', SNAPSHOT_KEEP)
    print(f'已先把现有状态快照为：{snapshot.name}（不满意可 restore 回去）')

    restored = 0
    failed: list[str] = []
    with zipfile.ZipFile(path) as archive:
        for arc, dest in planned:
            try:
                dest.parent.mkdir(parents=True, exist_ok=True)
                temporary = dest.with_name(dest.name + '.restore-part')
                with archive.open(arc) as source, temporary.open('wb') as sink:
                    while True:
                        chunk = source.read(1 << 20)
                        if not chunk:
                            break
                        sink.write(chunk)
                _replace_with_retry(temporary, dest)
                restored += 1
            except (OSError, KeyError) as exc:
                failed.append(f'{arc}（{exc.__class__.__name__}: {exc}）')
    print(f'恢复完成：{restored} 个文件')
    if failed:
        print(f'失败 {len(failed)} 个（多为浏览器正在占用，关闭后重跑即可）：')
        for item in failed[:20]:
            print('  -', item)
    touched = {arc.split('project/', 1)[1] for arc, _ in planned if arc.startswith('project/')}
    if touched & MACHINE_BOUND:
        print('提醒：postiz.env / postiz-bind.yaml 是本机生成的，换机器后需要重新初始化发布栈。')
    print('下一步：关闭并重开工作台（以及浏览器进程），再点一次「检查登录」确认状态。')
    return 1 if failed else 0


# --------------------------------------------------------------------------- #
def _all_archives() -> list[Path]:
    """目录下全部归档（含恢复前快照），按文件名倒序 = 时间倒序。"""
    if not BACKUP_DIR.is_dir():
        return []
    return sorted((p for p in BACKUP_DIR.iterdir() if p.is_file() and p.suffix == '.zip'),
                  key=lambda p: p.name, reverse=True)


def _human(size: int) -> str:
    value = float(size)
    for unit in ('B', 'KB', 'MB', 'GB'):
        if value < 1024 or unit == 'GB':
            return f'{value:.1f} {unit}' if unit != 'B' else f'{int(value)} B'
        value /= 1024
    return f'{value:.1f} GB'


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8')      # Windows 控制台默认 GBK，中文会炸
        except (AttributeError, ValueError):
            pass
    parser = argparse.ArgumentParser(
        description='账号登录态轻量备份 / 恢复（不动 Docker，可随时执行）',
        formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    sub.add_parser('status', help='查看当前账号态分布与备份数量').set_defaults(func=cmd_status)
    backup = sub.add_parser('backup', help='打包一份新的账号态备份')
    backup.add_argument('--keep', type=int, default=DEFAULT_KEEP, help=f'保留最新几份（默认 {DEFAULT_KEEP}）')
    backup.set_defaults(func=cmd_backup)
    sub.add_parser('list', help='列出全部备份').set_defaults(func=cmd_list)
    verify = sub.add_parser('verify', help='校验归档完整性（CRC + SHA-256）')
    verify.add_argument('archive')
    verify.set_defaults(func=cmd_verify)
    restore = sub.add_parser('restore', help='从归档恢复；会先把现有状态快照一份')
    restore.add_argument('archive')
    restore.add_argument('--dry-run', action='store_true', help='只显示会写哪些文件，不落盘')
    restore.set_defaults(func=cmd_restore)
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
