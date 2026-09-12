const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { desktopCapturer } = require('electron');

async function captureWindow(window, filename) {
  const bounds = window.getBounds();
  const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: bounds.width, height: bounds.height } });
  const source = sources.find(source => source.id === window.getMediaSourceId());
  assert.ok(source && !source.thumbnail.isEmpty(), 'Native Easel window capture must be available');
  fs.writeFileSync(filename, source.thumbnail.toPNG());
}

async function readUntil(contents, text, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const body = await contents.executeJavaScript('document.body.innerText');
    if (body.includes(text)) return body;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error(`Expected rendered text: ${text}`);
}

exports.run = async ({ app, mainWindow, views, switchView, status, ROOT, initialReady }) => {
  const out = path.join(ROOT, '.runtime', 'desktop-check');
  fs.mkdirSync(out, { recursive: true });
  const report = { version: process.versions.electron, packaged: app.isPackaged, started: new Date().toISOString(), checks: [] };
  try {
    const select = key => mainWindow.webContents.executeJavaScript(`window.easelDesktop.action(${JSON.stringify(key)})`);
    assert.equal(initialReady, true);
    assert.equal(status().status.includes('失败'), false, status().status);
    await select('home');
    const home = views.get('home').webContents;
    home.on('console-message', (_event, details) => { if (details.level === 'error') report.rendererError = details.message; });
    await readUntil(home, '内容库');
    const isolation = await home.executeJavaScript('({node:typeof require,process:typeof process,bridge:typeof window.easelDesktop})');
    assert.deepEqual(isolation, { node: 'undefined', process: 'undefined', bridge: 'undefined' });
    report.checks.push({ name: 'workbench-rendered-and-isolated', passed: true, isolation });
    await captureWindow(mainWindow, path.join(out, 'workbench.png'));
    await home.executeJavaScript("Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === 'AI 模型设置').click()");
    const settingsText = await readUntil(home, '本周剩余额度');
    assert.equal(settingsText.includes('额度保护已启用'), false);
    assert.equal(settingsText.includes('模型请求已暂停'), false);
    report.checks.push({ name: 'model-settings-without-development-quota-banner', passed: true });
    await readUntil(home, '调整推理强度可直接保存');
    const effortChange = await home.executeJavaScript("(() => { const select = Array.from(document.querySelectorAll('select')).find(el => el.parentElement.textContent.includes('推理强度')); const before = select.value; const next = Array.from(select.options).find(option => option.value !== before); if (!next) throw new Error('No alternative reasoning effort'); select.value = next.value; select.dispatchEvent(new Event('change', {bubbles:true})); return {before,after:next.value}; })()");
    const saveEnabled = await home.executeJavaScript("!Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '保存并启用').disabled");
    assert.equal(saveEnabled, true);
    report.checks.push({ name: 'effort-change-can-save-without-probe', passed: true, ...effortChange });
    await home.executeJavaScript("Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '工作台').click()");
    await readUntil(home, '热点雷达');
    await home.executeJavaScript("Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('热点雷达')).click()");
    await readUntil(home, '多平台实时热搜');
    await home.executeJavaScript("for (const label of ['B站', '头条']) Array.from(document.querySelectorAll('.trend-platforms button')).find(button => button.textContent.trim() === label && !button.classList.contains('active'))?.click()");
    const trendDeadline = Date.now() + 60000;
    let trendCounts;
    do {
      trendCounts = await home.executeJavaScript("Object.fromEntries(Array.from(document.querySelectorAll('.trend-col')).map(card => [card.querySelector('.trend-col-head').childNodes[0].textContent.trim(), card.querySelectorAll('.trend-item').length]))");
      if (trendCounts['头条'] > 0 && trendCounts['B站'] > 0) break;
      await new Promise(resolve => setTimeout(resolve, 300));
    } while (Date.now() < trendDeadline);
    assert.ok(trendCounts['头条'] > 0 && trendCounts['B站'] > 0, JSON.stringify(trendCounts));
    report.checks.push({ name: 'bilibili-toutiao-trends-rendered', passed: true, counts: trendCounts });
    await home.executeJavaScript("Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '公众号工作区').click()");
    await readUntil(home, '公众号内容与数据');
    await home.executeJavaScript(`(() => {
      const title = Array.from(document.querySelectorAll('label')).find(label => label.textContent.trim() === '标题').querySelector('input');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(title, '公众号本地排版验收');
      title.dispatchEvent(new Event('input', {bubbles:true}));
      const body = document.querySelector('.wechat-editor');
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(body, '这是一份本地排版验收示例。\\n\\n## 工作区说明\\n文章可先排版，再连接自己的公众号并送入草稿箱。');
      body.dispatchEvent(new Event('input', {bubbles:true}));
    })()`);
    await home.executeJavaScript("Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '生成排版预览').click()");
    await readUntil(home, '排版预览已生成');
    const previewUrl = await home.executeJavaScript("document.querySelector('.wechat-preview-frame').src");
    const previewResponse = await fetch(previewUrl);
    assert.equal(previewResponse.status, 200);
    assert.ok((await previewResponse.text()).includes('这是一份本地排版验收示例。'));
    const markdownUrl = await home.executeJavaScript("Array.from(document.querySelectorAll('.wechat-paths a')).find(a => a.textContent.includes('Markdown')).href");
    assert.ok((await (await fetch(markdownUrl)).text()).startsWith('# 公众号本地排版验收')); 
    report.checks.push({ name: 'wechat-local-prepare-without-account', passed: true, previewUrl });
    await home.executeJavaScript("Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '账号').click()");
    await readUntil(home, '公众号账号与草稿箱');
    await home.executeJavaScript("Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '公众号工作区').click()");
    await readUntil(home, '公众号内容与数据');
    const kept = await home.executeJavaScript("document.querySelector('.wechat-editor').value.includes('本地排版验收示例')");
    assert.ok(kept);
    report.checks.push({ name: 'wechat-draft-preserved-across-navigation', passed: true });
    await readUntil(home, 'WeRSS 服务已就绪');
    await home.executeJavaScript("Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '打开同行订阅管理').click()");
    const monitorDeadline = Date.now() + 30000;
    let monitorText = '';
    do {
      const frame = home.mainFrame.frames.find(frame => frame.url.startsWith('http://127.0.0.1:8090/'));
      if (frame) monitorText = await frame.executeJavaScript('document.body.innerText').catch(() => '');
      if (monitorText.trim().length > 20) break;
      await new Promise(resolve => setTimeout(resolve, 300));
    } while (Date.now() < monitorDeadline);
    assert.ok(monitorText.trim().length > 20, 'WeRSS embedded UI did not render');
    report.checks.push({ name: 'wechat-peer-monitor-embedded-ui', passed: true });
    await captureWindow(mainWindow, path.join(out, 'wechat.png'));
    const originalId = home.id;
    await select('publish');
    const publish = views.get('publish').webContents;
    const publishText = await readUntil(publish, 'Postiz');
    report.checks.push({ name: 'postiz-rendered', passed: true, url: publish.getURL(), text: publishText.slice(0, 400) });
    await captureWindow(mainWindow, path.join(out, 'publish.png'));
    await select('feeds');
    const feeds = views.get('feeds').webContents;
    const feedText = await readUntil(feeds, 'FreshRSS');
    report.checks.push({ name: 'freshrss-rendered', passed: true, url: feeds.getURL(), text: feedText.slice(0, 400) });
    await captureWindow(mainWindow, path.join(out, 'feeds.png'));
    await select('home');
    assert.equal(views.get('home').webContents.id, originalId);
    const selected = await mainWindow.webContents.executeJavaScript("document.querySelector('nav .selected').textContent");
    assert.equal(selected, '创作工作台');
    report.checks.push({ name: 'real-shell-ipc-tab-state-preserved-and-synced', passed: true });
    report.status = status();
    report.passed = true;
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(report, null, 2));
    app.quit();
  } catch (error) {
    report.passed = false; report.error = error.stack;
    report.page = await views.get('home').webContents.executeJavaScript('document.body.innerText').catch(() => 'unavailable');
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(report, null, 2));
    app.exit(1);
  }
};
