const { app, BrowserWindow, WebContentsView, Menu, Tray, ipcMain, dialog, shell, session, screen, nativeImage } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { SERVICES, destination, allowedInView } = require('./policy.cjs');

const ROOT = (() => {
  if (!app.isPackaged) return path.resolve(__dirname, '..');
  const f = path.join(process.resourcesPath, 'easel-root.json');
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8')).root;
  } catch (e) {
    const fb = path.resolve(__dirname, '..');
    try {
      fs.mkdirSync(path.join(fb, '.runtime', 'logs'), { recursive: true });
      fs.appendFileSync(path.join(fb, '.runtime', 'logs', 'desktop.log'),
        `${new Date().toISOString()} [warn] easel-root.json 解析失败，回退到应用目录: ${e.message}\n`);
    } catch (_) { /* 日志不可写时静默 */ }
    return fb;
  }
})();
const STATE = path.join(ROOT, '.runtime');
const LOGS = path.join(STATE, 'logs');
const PIDFILE = path.join(STATE, 'desktop.pid');
const PYTHON = path.join(ROOT, '.venv', 'Scripts', 'python.exe');
const INDEX = pathToFileURL(path.join(__dirname, 'index.html')).href;
const PARTITION = 'persist:easel-desktop';
fs.mkdirSync(LOGS, { recursive: true });
function writePid() { try { fs.writeFileSync(PIDFILE, String(process.pid)); } catch (_) { /* 写失败不阻塞 */ } }
function clearPid() { try { if (fs.readFileSync(PIDFILE, 'utf8').trim() === String(process.pid)) fs.unlinkSync(PIDFILE); } catch (_) { /* 无 pid 文件或内容不匹配，忽略 */ } }
app.setPath('userData', path.join(STATE, process.env.EASEL_DESKTOP_SMOKE === '1' ? 'desktop-check/profile' : 'desktop-profile'));
app.setAppUserModelId('org.easel.studio.desktop');
app.setName('Easel');

let mainWindow;
let tray = null;
let active = 'home';
let starting = false;
let stopping = false;
let initialReady = false;
app.isQuitting = false;
const views = new Map();
const loaded = new Set();
const serviceState = { web: '准备中', gateway: '准备中', platforms: '准备中' };
const errors = new Map();
const log = message => fs.appendFileSync(path.join(LOGS, 'desktop.log'), `${new Date().toISOString()} ${message}\n`);

function status() {
  return { active, status: `工作台：${serviceState.web}　·　AI：${serviceState.gateway}　·　发布 / 订阅：${serviceState.platforms}`, message: errors.get(active === 'home' ? 'web' : 'platforms') || `正在准备${SERVICES[active].title}…` };
}
function publishState() {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('desktop:state', status());
}
function runServices(action, names, timeout = 480000) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, ['-m', 'easel.services', action, ...names], { cwd: ROOT, windowsHide: true, env: { ...process.env, PYTHONUTF8: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const append = chunk => { output = (output + chunk.toString('utf8')).slice(-12000); };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    const timer = setTimeout(() => { child.kill(); reject(new Error('服务操作超时，请查看运行日志。')); }, timeout);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', code => {
      clearTimeout(timer);
      log(`${action} ${names.join(' ')} exit=${code}\n${output}`);
      if (code === 0) resolve(output);
      else reject(new Error(output.trim() || `服务操作失败（${code}）。`));
    });
  });
}
function probe(url) {
  return new Promise(resolve => {
    const req = http.get(url, { timeout: 3000 }, res => { res.resume(); resolve(res.statusCode >= 200 && res.statusCode < 400); });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(false));
  });
}
function resizeViews() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const [width, height] = mainWindow.getContentSize();
  for (const view of views.values()) view.setBounds({ x: 0, y: 54, width, height: Math.max(0, height - 84) });
}
async function route(raw) {
  const target = destination(raw);
  if (!target) { log('Blocked unsupported navigation'); return; }
  if (target.kind === 'external') { await shell.openExternal(target.url); return; }
  // Output previews get their own sandboxed window; they must not replace the running chat.
  if (target.key === 'home' && new URL(target.url).pathname !== '/') {
    const preview = new BrowserWindow({ title: 'Easel · 成品预览', width: 1000, height: 800, parent: mainWindow, autoHideMenuBar: true, icon: path.join(__dirname, 'icon.png'), webPreferences: preferences() });
    protect(preview.webContents, 'home');
    await preview.loadURL(target.url).catch(error => log(error.message));
  } else {
    await switchView(target.key, target.url === SERVICES[target.key].url ? undefined : target.url);
  }
}
function preferences() { return { partition: PARTITION, nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, webviewTag: false }; }
function protect(contents, key) {
  contents.setWindowOpenHandler(({ url }) => { void route(url).catch(error => log(error.message)); return { action: 'deny' }; });
  contents.on('will-navigate', (event, url) => {
    if (!allowedInView(url, key)) { event.preventDefault(); void route(url).catch(error => log(error.message)); }
  });
  contents.on('will-redirect', (event, url, _inPlace, isMainFrame) => {
    if (isMainFrame && !allowedInView(url, key)) { event.preventDefault(); void route(url).catch(error => log(error.message)); }
  });
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('render-process-gone', (_event, detail) => { log(`Renderer ${key}: ${detail.reason}`); errors.set(key === 'home' ? 'web' : 'platforms', '界面进程已退出，请点击重试连接。'); loaded.delete(key); publishState(); });
}
async function switchView(key, url) {
  if (!SERVICES[key] || !mainWindow || mainWindow.isDestroyed()) return;
  active = key;
  for (const [name, view] of views) view.setVisible(name === key && loaded.has(name));
  publishState();
  let view = views.get(key);
  if (!view) {
    view = new WebContentsView({ webPreferences: preferences() });
    view.setVisible(false);
    protect(view.webContents, key);
    mainWindow.contentView.addChildView(view);
    views.set(key, view);
    resizeViews();
  }
  if (!loaded.has(key) || url) {
    if (!await probe(SERVICES[key].url)) { publishState(); return; }
    try {
      await view.webContents.loadURL(url || SERVICES[key].url);
      loaded.add(key);
      view.setVisible(active === key);
    } catch (error) {
      errors.set(key === 'home' ? 'web' : 'platforms', `暂时无法打开${SERVICES[key].title}，请重试或查看日志。`);
      log(error.message);
    }
  }
  publishState();
}
async function startServices() {
  if (starting || stopping) return;
  starting = true;
  errors.clear();
  try {
    serviceState.web = '连接中'; publishState();
    try {
      await runServices('start', ['web']);
      serviceState.web = '已连接';
      await switchView(active);
    } catch (error) { serviceState.web = '启动失败'; errors.set('web', error.message); }
    publishState();
    await Promise.all([
      (async () => {
        serviceState.gateway = '连接中'; publishState();
        try { await runServices('start', ['gateway']); serviceState.gateway = '已连接'; }
        catch (error) { serviceState.gateway = '启动失败'; errors.set('gateway', error.message); }
        publishState();
      })(),
      (async () => {
        serviceState.platforms = '连接中'; publishState();
        try { await runServices('start', ['platforms']); serviceState.platforms = '已连接'; }
        catch (error) { serviceState.platforms = '启动失败'; errors.set('platforms', error.message); }
        if (active !== 'home') await switchView(active);
        publishState();
      })(),
    ]);
  } finally { starting = false; initialReady = true; publishState(); }
}
async function showStatus() {
  await dialog.showMessageBox(mainWindow, { type: errors.size ? 'warning' : 'info', title: 'Easel 运行状态', message: status().status, detail: [...errors.entries()].map(([key, value]) => `${key}: ${value}`).join('\n\n') || '关闭窗口会收起到托盘，任务栏不再显示，后台服务继续跑。\n需要全部停止时，使用托盘或“应用 → 停止服务并退出”。', buttons: ['知道了'] });
}
function quitNow() {
  // 「停止服务并退出」= 立即退出，绝不等、绝不弹框，避免 UI 僵死。
  // 服务停止交给独立后台进程执行，桌面端退出后它自己跑完。
  if (app.isQuitting) return;
  app.isQuitting = true;
  stopping = true;
  try { if (tray) { tray.destroy(); tray = null; } } catch (_) { /* 托盘销毁失败不阻塞退出 */ }
  try { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide(); } catch (_) { /* 忽略 */ }
  clearPid();
  stopServicesDetached();
  app.quit();
  // 兜底保险：万一 Electron 的退出流程被某个 close/preventDefault 卡住，
  // 3 秒后强制结束进程，保证「停止并退出」永远有响应。
  setTimeout(() => { try { process.exit(0); } catch (_) { /* 已退出 */ } }, 3000).unref();
}
function stopServicesDetached() {
  // 分离一个不随主进程退出的子进程去停服务，主界面立即关闭。
  // detached:true + unref() 已验证：父进程退出后子进程仍会跑完写文件。
  try {
    const child = spawn(PYTHON, ['-m', 'easel.services', 'stop', 'web', 'gateway', 'cloak', 'platforms'], { cwd: ROOT, detached: true, windowsHide: true, stdio: 'ignore', env: { ...process.env, PYTHONUTF8: '1' } });
    child.unref();
    log(`Detached service-stop started (pid=${child.pid}); quitting now.`);
  } catch (error) { log(`Stop-detach failed: ${error.message}`); }
}
function hideToTray() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!tray) {
    quitNow();
    return;
  }
  mainWindow.setSkipTaskbar(true);
  mainWindow.hide();
}
function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setSkipTaskbar(false);
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}
function installTray() {
  if (tray || !app.isReady) return;
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
  if (icon.isEmpty()) { log('Tray icon missing, skip tray'); return; }
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Easel 自媒体工作台 — 后台运行中');
  const menu = Menu.buildFromTemplate([
    { label: '打开工作台', click: () => showMainWindow() },
    { label: '最小化到后台（继续运行）', click: () => hideToTray() },
    { type: 'separator' },
    { label: '停止服务并退出', click: () => quitNow() },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => showMainWindow());
  log('Tray installed');
}
function installMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: '应用', submenu: [
      { label: '创作工作台', accelerator: 'CmdOrCtrl+1', click: () => void switchView('home') },
      { label: '发布日历', accelerator: 'CmdOrCtrl+2', click: () => void switchView('publish') },
      { label: '订阅阅读', accelerator: 'CmdOrCtrl+3', click: () => void switchView('feeds') },
      { type: 'separator' },
      { label: '打开成品文件夹', click: () => void shell.openPath(path.join(ROOT, 'outputs')) },
      { type: 'separator' },
      { label: '最小化到后台（继续运行）', click: () => hideToTray() },
      { label: '停止服务并退出', click: () => quitNow() },
    ] },
    { label: '编辑', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: '查看', submenu: [
      { label: '刷新当前页面', accelerator: 'CmdOrCtrl+R', click: () => views.get(active)?.webContents.reload() },
      { label: '放大', accelerator: 'CmdOrCtrl+=', click: () => { const c = views.get(active)?.webContents; if (c) c.setZoomLevel(Math.min(3, c.getZoomLevel() + 0.5)); } },
      { label: '缩小', accelerator: 'CmdOrCtrl+-', click: () => { const c = views.get(active)?.webContents; if (c) c.setZoomLevel(Math.max(-2, c.getZoomLevel() - 0.5)); } },
      { label: '实际大小', accelerator: 'CmdOrCtrl+0', click: () => views.get(active)?.webContents.setZoomLevel(0) },
      { role: 'togglefullscreen' },
    ] },
    { label: '帮助', submenu: [
      { label: '运行状态', click: () => void showStatus() },
      { label: '重试服务连接', click: () => void startServices() },
      { label: '打开运行日志', click: () => void shell.openPath(LOGS) },
      { label: '查看任务队列', click: () => void switchView('queue') },
      { label: '关于 Easel 桌面版', click: () => void dialog.showMessageBox(mainWindow, { message: 'Easel 自媒体桌面工作台', detail: `桌面版 ${app.getVersion()} · Electron ${process.versions.electron}\n复用 Easel、Postiz、FreshRSS；使用当前本机部署的数据与服务。`, buttons: ['关闭'] }) },
    ] },
  ]));
}

if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => showMainWindow());
  app.on('before-quit', () => {
    app.isQuitting = true;
    try { if (tray) { tray.destroy(); tray = null; } } catch (_) { /* 托盘销毁失败不阻塞退出 */ }
  });
  app.on('will-quit', () => clearPid());
  app.whenReady().then(async () => {
    if (!fs.existsSync(PYTHON)) throw new Error('未找到本机 Easel Python 环境，请先完成部署。');
    const desktopSession = session.fromPartition(PARTITION);
    desktopSession.setPermissionRequestHandler((contents, permission, callback) => callback(permission === 'clipboard-sanitized-write' && Boolean(contents && destination(contents.getURL())?.kind === 'local')));
    desktopSession.setPermissionCheckHandler((contents, permission) => permission === 'clipboard-sanitized-write' && Boolean(contents && destination(contents.getURL())?.kind === 'local'));
    let bounds = { width: 1380, height: 900 };
    try { const saved = JSON.parse(fs.readFileSync(path.join(STATE, 'desktop-window.json'), 'utf8')); if (saved.width >= 960 && saved.height >= 680) bounds = { width: Math.min(saved.width, 1920), height: Math.min(saved.height, 1400) }; } catch { /* First launch has no window preferences. */ }
    const area = screen.getPrimaryDisplay().workAreaSize;
    bounds.width = Math.min(bounds.width, area.width); bounds.height = Math.min(bounds.height, area.height);
    mainWindow = new BrowserWindow({ ...bounds, minWidth: Math.min(960, area.width), minHeight: Math.min(680, area.height), title: 'Easel 自媒体工作台', backgroundColor: '#f7f8fb', icon: path.join(__dirname, 'icon.png'), show: false, webPreferences: { ...preferences(), preload: path.join(__dirname, 'preload.cjs') } });
    mainWindow.webContents.on('will-navigate', event => event.preventDefault());
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    mainWindow.on('resize', resizeViews);
    mainWindow.on('close', event => {
      // 「关闭窗口」= 收起到托盘：窗口隐藏、任务栏不留图标，后台继续跑。
      // 完全退出请用托盘或菜单「停止服务并退出」。托盘未装上时才改为真正退出，避免变成幽灵进程。
      try {
        const size = mainWindow.getNormalBounds();
        fs.writeFileSync(path.join(STATE, 'desktop-window.json'), JSON.stringify(size));
      } catch (_) { /* 窗口尺寸保存失败不阻塞退出 */ }
      if (app.isQuitting) return;
      event.preventDefault();
      hideToTray();
    });
    mainWindow.on('closed', () => { for (const view of views.values()) if (!view.webContents.isDestroyed()) view.webContents.close(); views.clear(); mainWindow = null; });
    ipcMain.handle('desktop:action', async (event, action) => {
      // 来源校验：只认主窗口自身界面进程（shell）。中文路径下 file:// URL 的百分号编码
      // 与渲染进程拿到的原文可能不一致，故放弃 URL 全等比较，改用 frame 对象身份 + 协议头校验。
      const senderIsShell = event.sender === mainWindow?.webContents
        && event.senderFrame === mainWindow.webContents.mainFrame
        && /^file:/.test(event.senderFrame.url || '');
      if (!senderIsShell) throw new Error('Untrusted desktop request');
      if (Object.hasOwn(SERVICES, action)) return switchView(action);
      if (action === 'outputs') return shell.openPath(path.join(ROOT, 'outputs'));
      if (action === 'logs') return shell.openPath(LOGS);
      if (action === 'retry') return startServices();
      if (action === 'status') return showStatus();
      if (action === 'ready') { publishState(); return; }
      throw new Error('Unknown desktop action');
    });
    installMenu();
    installTray();
    writePid();
    await mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.show();
    log(`Desktop started pid=${process.pid}, electron=${process.versions.electron}`);
    await startServices();
    const monitor = setInterval(async () => {
      if (starting || stopping || !mainWindow) return;
      serviceState.web = await probe(SERVICES.home.url) ? '已连接' : '连接中断';
      serviceState.gateway = await probe('http://127.0.0.1:18789/healthz') ? '已连接' : '连接中断';
      serviceState.platforms = await probe(SERVICES.publish.url) && await probe(SERVICES.feeds.url) ? '已连接' : '连接中断';
      publishState();
    }, 30000);
    monitor.unref();
    // Framework-level smoke tests use this app's own windows; no debugging port or privileged renderer bridge is exposed.
    if (process.env.EASEL_DESKTOP_SMOKE === '1') await require('./smoke.cjs').run({ app, mainWindow, views, switchView, status, ROOT, initialReady });
  }).catch(error => { log(error.stack || error.message); dialog.showErrorBox('Easel 桌面版启动失败', error.message); app.quit(); });
  app.on('window-all-closed', () => { if (app.isQuitting) app.quit(); });
}
