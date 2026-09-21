"""Install a checksum-verified official Caddy binary for local reverse proxying."""
import hashlib
import io
import json
import zipfile
from pathlib import Path
import requests

root = Path(__file__).resolve().parents[1]
version = '2.11.4'
name = f'caddy_{version}_windows_amd64.zip'
base = f'https://github.com/caddyserver/caddy/releases/download/v{version}/'
checks = requests.get(base + f'caddy_{version}_checksums.txt', timeout=60)
checks.raise_for_status()
expected = next(line.split()[0] for line in checks.text.splitlines() if line.split()[-1] == name)
response = requests.get(base + name, timeout=180)
response.raise_for_status()
actual = hashlib.sha512(response.content).hexdigest()
if actual != expected:
    raise RuntimeError('Caddy archive checksum mismatch')
target = root / '.runtime/caddy'
target.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
    for entry in ('caddy.exe', 'LICENSE', 'README.md'):
        (target / entry).write_bytes(archive.read(entry))
(root / 'config/caddy.lock.json').write_text(json.dumps({'version': version, 'url': base + name, 'sha512': actual, 'license': 'Apache-2.0'}, indent=2) + '\n', encoding='utf-8')
print(f'Caddy {version} installed; official SHA-512 verified.')
