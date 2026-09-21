"""Back up this installation's data with SQLite backup, ZIP and stopped-volume tar.

Platform services are briefly stopped for a consistent snapshot and restarted even
when archiving fails. The resulting private backup contains local account secrets.
"""
import hashlib
import json
import sqlite3
import subprocess
import sys
import tarfile
import time
import zipfile
from contextlib import closing
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from easel.runtime import STATE, CONFIG_FILE, CREATE_FLAGS, write_json
from easel.platform_services import WSL, compose_command, wsl_path, manage
from easel.services import owned_processes, start

if owned_processes('web') or owned_processes('gateway'):
    raise SystemExit('请先等待任务完成，再停止 Web 和模型网关后备份；备份期间不要启动工作台。')
for turn in (ROOT / 'outputs/_sessions').glob('*.json'):
    if json.loads(turn.read_text(encoding='utf-8')).get('status') == 'running':
        raise SystemExit('仍有生成任务，请等待任务完成后再备份。')
stamp = time.strftime('%Y%m%d-%H%M%S')
target = STATE / 'backups' / ('.incomplete-' + stamp)
target.mkdir(parents=True, exist_ok=False)
start('wsl-runtime')
docker = WSL + ['/usr/bin/docker', '--host', 'unix:///var/run/docker.sock']
names = subprocess.check_output(docker + ['volume', 'ls', '--filter', 'label=com.docker.compose.project=easel-postiz', '--format', '{{.Name}}'], text=True, encoding='utf-8', stderr=subprocess.DEVNULL, creationflags=CREATE_FLAGS).splitlines()
if not names or any(not name.startswith('easel-postiz_') or '/' in name or '\\' in name for name in names):
    raise RuntimeError('Unexpected volume scope; backup stopped.')
volumes = json.loads(subprocess.check_output(docker + ['volume', 'inspect'] + names, text=True, encoding='utf-8', stderr=subprocess.DEVNULL, creationflags=CREATE_FLAGS))
if any(item.get('Labels', {}).get('com.docker.compose.project') != 'easel-postiz' or item['Mountpoint'] != '/var/lib/docker/volumes/' + item['Name'] + '/_data' for item in volumes):
    raise RuntimeError('Volume ownership or mountpoint differs; backup stopped.')
with (STATE / 'logs/backup.log').open('ab') as log:
    try:
        subprocess.run(compose_command() + ['stop'], check=True, stdout=log, stderr=log, timeout=120, creationflags=CREATE_FLAGS)
        subprocess.run(WSL + ['tar', '-czf', wsl_path(target / 'platform-volumes.tar.gz'), '-C', '/var/lib/docker/volumes'] + [name + '/_data' for name in names], check=True, stdout=log, stderr=log, timeout=300, creationflags=CREATE_FLAGS)
    finally:
        manage('start')

with closing(sqlite3.connect(STATE / 'research.sqlite')) as source, closing(sqlite3.connect(target / 'research.sqlite')) as destination:
    source.backup(destination)
with zipfile.ZipFile(target / 'easel-data.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for folder in (ROOT / 'outputs', ROOT / 'profiles', ROOT / 'config', ROOT / 'deploy'):
        for path in folder.rglob('*'):
            if path.is_file() and path.suffix not in ('.lock', '.tmp'):
                archive.write(path, path.relative_to(ROOT).as_posix())
    for name in ('model-settings.json', 'postiz.env', 'postiz-account.json', 'acceptance.json', 'wechat-state.json'):
        path = STATE / name
        if path.is_file():
            archive.write(path, '.runtime/' + name)
    wechat_config = ROOT / 'skills/openclaw/skill-wechat-publisher/wechat-publisher.yaml'
    if wechat_config.is_file():
        archive.write(wechat_config, wechat_config.relative_to(ROOT).as_posix())
    if CONFIG_FILE.is_file():
        archive.write(CONFIG_FILE, 'openclaw-easel-studio/openclaw.json')
with zipfile.ZipFile(target / 'easel-data.zip') as archive:
    if archive.testzip() is not None:
        raise RuntimeError('ZIP integrity check failed; incomplete backup retained.')
with tarfile.open(target / 'platform-volumes.tar.gz', 'r:gz') as archive:
    for item in archive:
        if item.isfile():
            with archive.extractfile(item) as source:
                while source.read(1024 * 1024):
                    pass
checksums = {}
for path in target.iterdir():
    if path.is_file():
        with path.open('rb') as source:
            checksums[path.name] = {'bytes': path.stat().st_size, 'sha256': hashlib.file_digest(source, 'sha256').hexdigest()}
manifest = {'created_at': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'volumes': names, 'private': True, 'authentication': 'Codex authentication is not copied; use official login when restoring on a new device.', 'scope': 'Platform volumes and Easel data/configuration. Source code and installed runtimes remain in the project; OpenClaw agent catalog is not included.', 'files': checksums, 'archive_readback': 'ZIP CRC and full TAR member reads passed'}
write_json(target / 'manifest.json', manifest)
completed = target.with_name(stamp)
target.rename(completed)
print('Private backup: archive readback passed, SHA-256 manifest saved:', completed)
