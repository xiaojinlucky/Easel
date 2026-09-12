"""Fetch the official Electron ZIP through requests and verify its npm-published hash."""
import hashlib
import json
from pathlib import Path
import requests
import psutil

desktop = Path(__file__).resolve().parent
root = desktop.parent
installed_exe = root / '.runtime/desktop-app/Easel-win32-x64/Easel.exe'
for process in psutil.process_iter(['exe']):
    if process.info['exe'] and Path(process.info['exe']) == installed_exe:
        raise SystemExit('请先关闭 Easel 桌面窗口后再打包；后台服务无需停止。')
version = json.loads((desktop / 'package.json').read_text(encoding='utf-8'))['devDependencies']['electron']
filename = f'electron-v{version}-win32-x64.zip'
expected = json.loads((desktop / 'node_modules/electron/checksums.json').read_text(encoding='utf-8'))[filename]
folder = root / '.runtime/electron-download'
folder.mkdir(exist_ok=True)
target = folder / filename
if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == expected:
    print('Official Electron ZIP: cached SHA-256 verified.', flush=True)
else:
    url = f'https://github.com/electron/electron/releases/download/v{version}/{filename}'
    digest = hashlib.sha256()
    partial = target.with_suffix('.partial')
    with requests.get(url, stream=True, timeout=(15, 60)) as response:
        response.raise_for_status()
        with partial.open('wb') as output:
            for chunk in response.iter_content(1024 * 1024):
                output.write(chunk)
                digest.update(chunk)
    if digest.hexdigest() != expected:
        raise RuntimeError('Electron SHA-256 differs from official npm package; archive not used.')
    partial.replace(target)
    print('Official Electron ZIP downloaded; SHA-256 verified.', flush=True)
(folder / 'receipt.json').write_text(json.dumps({'version': version, 'file': filename, 'sha256': expected, 'source': f'https://github.com/electron/electron/releases/download/v{version}/{filename}'}, indent=2), encoding='utf-8')
