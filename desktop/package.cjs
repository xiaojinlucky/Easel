const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
async function main() {
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) process.env.ELECTRON_GET_USE_PROXY = 'true';
  const { packager } = await import('@electron/packager');
  const root = path.resolve(__dirname, '..');
  const prepared = spawnSync(path.join(root, '.venv', 'Scripts', 'python.exe'), ['-X', 'utf8', path.join(__dirname, 'prepare_electron.py')], { cwd: root, stdio: 'inherit', windowsHide: true, timeout: 600000 });
  if (prepared.error || prepared.status !== 0) throw prepared.error || new Error('Electron download or verification failed.');
  const outputs = await packager({ dir: __dirname, out: path.join(root, '.runtime', 'desktop-app'), name: 'Easel', platform: 'win32', arch: 'x64', electronVersion: '44.3.0', electronZipDir: path.join(root, '.runtime', 'electron-download'), icon: path.join(__dirname, 'icon.ico'), overwrite: true, asar: false, prune: true, ignore: [/^\/package\.cjs$/, /^\/policy\.test\.cjs$/, /^\/prepare_electron\.py$/], appCopyright: 'Easel contributors', win32metadata: { CompanyName: 'Easel', FileDescription: 'Easel 自媒体桌面工作台', ProductName: 'Easel' } });
  for (const output of outputs) {
    fs.writeFileSync(path.join(output, 'resources', 'easel-root.json'), JSON.stringify({ root }, null, 2));
    fs.copyFileSync(path.join(root, 'LICENSE'), path.join(output, 'resources', 'app', 'LICENSE'));
  }
  console.log(outputs.join('\n'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
