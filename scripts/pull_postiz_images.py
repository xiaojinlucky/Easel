"""Use official crane on Windows, then import into the isolated WSL Docker engine.

This keeps Windows' existing loopback proxy private. No proxy bridge or registry
mirror is introduced. Run again to resume images that were not imported.
"""
import json
import os
import subprocess
import sys
import tarfile
import hashlib
from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from easel.runtime import CREATE_FLAGS, runtime_env, write_json

compose = yaml.safe_load((root / 'deploy/postiz/compose.yaml').read_text(encoding='utf-8'))
crane = str(root / '.runtime/crane/crane.exe')
images = root / '.runtime/images'
images.mkdir(exist_ok=True)
lock_file = root / 'config/postiz-images.lock.json'
lock = json.loads(lock_file.read_text(encoding='utf-8')) if lock_file.exists() else {}
docker = ['wsl', '-d', 'Ubuntu-24.04', '-u', 'root', '--exec', '/usr/bin/docker', '--host', 'unix:///var/run/docker.sock']
env = runtime_env()
for name, service in compose['services'].items():
    if service.get('profiles'):
        continue
    reference = lock.get(name, {}).get('image') or service['image']
    if name in lock and lock[name].get('local_image_id') and subprocess.run(docker + ['image', 'inspect', lock[name]['local_image_id']], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=CREATE_FLAGS).returncode == 0:
        print(name + ': already imported', flush=True)
        continue
    print(name + ': downloading ' + reference, flush=True)
    digest = lock.get(name, {}).get('digest') or subprocess.check_output([crane, 'digest', reference, '--platform', 'linux/amd64'], env=env, text=True, encoding='utf-8', timeout=120, creationflags=CREATE_FLAGS).strip()
    target = images / (name + '.tar')
    with (root / '.runtime/logs/image-download.log').open('a', encoding='utf-8') as log:
        subprocess.run([crane, 'pull', reference.split('@')[0] + '@' + digest, str(target), '--platform', 'linux/amd64', '--cache_path', str(images / 'layers')], env=env, stdout=log, stderr=log, check=True, timeout=2400, creationflags=CREATE_FLAGS)
    with tarfile.open(target) as archive:
        manifest = json.load(archive.extractfile('manifest.json'))
        local_image_id = 'sha256:' + hashlib.sha256(archive.extractfile(manifest[0]['Config']).read()).hexdigest()
    print(name + ': importing into WSL', flush=True)
    wsl_path = '/mnt/' + target.drive[0].lower() + target.as_posix()[2:]
    subprocess.run(docker + ['load', '-i', wsl_path], stdout=subprocess.DEVNULL, check=True, timeout=300, creationflags=CREATE_FLAGS)
    subprocess.run(docker + ['image', 'inspect', local_image_id], stdout=subprocess.DEVNULL, check=True, timeout=30, creationflags=CREATE_FLAGS)
    lock[name] = {'image': reference, 'digest': digest, 'local_image_id': local_image_id, 'platform': 'linux/amd64'}
    write_json(lock_file, lock)
    # This exact archive was created above and has now been loaded successfully.
    target.unlink()
    print(name + ': ready', flush=True)
