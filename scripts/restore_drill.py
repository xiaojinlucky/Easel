"""Verify Postiz database recovery in a disposable, network-isolated Docker volume.

Only newly generated drill resources are created or removed. Production volumes
are never restored over. A real disaster recovery follows docs/BACKUP_RESTORE.md.
"""
import json
import subprocess
import sys
import time
import uuid
from pathlib import Path
from check_backup import check

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from easel.runtime import CREATE_FLAGS, write_json
from easel.platform_services import WSL, wsl_path
from easel.services import start

folder = Path(sys.argv[1]).resolve(strict=True)
manifest = check(folder)
volume_key = 'easel-postiz_postgres-volume'
if volume_key not in manifest['volumes']:
    raise ValueError('Backup has no Postiz database')
start('wsl-runtime')
docker = WSL + ['/usr/bin/docker', '--host', 'unix:///var/run/docker.sock']
name = 'easel-restore-drill-' + uuid.uuid4().hex[:12]
locked = json.loads((ROOT / 'config/postiz-images.lock.json').read_text(encoding='utf-8'))['postiz-postgres']['local_image_id']
log = (folder / 'restore-drill.log').open('ab')
created = False
try:
    subprocess.run(docker + ['volume', 'create', '--label', 'easel.restore-drill=' + name, name], check=True, stdout=log, stderr=log, creationflags=CREATE_FLAGS)
    created = True
    subprocess.run(docker + ['run', '--rm', '--network', 'none', '--mount', f'type=volume,source={name},target=/restore', '--mount', f'type=bind,source={wsl_path(folder)},target=/backup,readonly', '--entrypoint', 'tar', locked, '-xzf', '/backup/platform-volumes.tar.gz', '--strip-components=2', '-C', '/restore', volume_key + '/_data'], check=True, stdout=log, stderr=log, timeout=120, creationflags=CREATE_FLAGS)
    subprocess.run(docker + ['run', '-d', '--name', name, '--network', 'none', '--mount', f'type=volume,source={name},target=/var/lib/postgresql/data', locked], check=True, stdout=log, stderr=log, creationflags=CREATE_FLAGS)
    sql = 'SELECT (SELECT count(*) FROM "User"), (SELECT count(*) FROM "Organization"), (SELECT count(*) FROM "Media");'
    for attempt in range(30):
        result = subprocess.run(docker + ['exec', name, 'psql', '-U', 'postiz-user', '-d', 'postiz-db-local', '-Atc', sql], capture_output=True, timeout=10, creationflags=CREATE_FLAGS)
        if result.returncode == 0:
            break
        time.sleep(1)
    if result.returncode:
        raise RuntimeError('Restored database failed to become readable; see drill log')
    counts = [int(value) for value in result.stdout.decode().strip().split('|')]
    if len(counts) != 3 or any(value < 1 for value in counts):
        raise RuntimeError('Expected local account and uploaded media were not restored')
    write_json(folder / 'restore-drill.json', {'passed': True, 'time': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'network': 'none', 'restored_counts': dict(zip(['users', 'organizations', 'media'], counts)), 'scope': 'Postiz PostgreSQL actual startup/readback in a fresh disposable volume; not a full replacement-machine test'})
    print('PASS: restored Postiz database booted without network or host ports; row counts:', counts)
finally:
    subprocess.run(docker + ['rm', '-f', name], stdout=log, stderr=log, creationflags=CREATE_FLAGS)
    if created:
        subprocess.run(docker + ['volume', 'rm', name], check=True, stdout=log, stderr=log, creationflags=CREATE_FLAGS)
    log.close()
