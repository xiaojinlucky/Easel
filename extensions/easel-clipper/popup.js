const tokenInput = document.querySelector('#token');
const topicInput = document.querySelector('#topic');
const previewBox = document.querySelector('#preview');
const status = document.querySelector('#status');
const save = document.querySelector('#save');
const previewBtn = document.querySelector('#previewBtn');

chrome.storage.local.get(['easelToken', 'topic']).then((value) => {
  tokenInput.value = value.easelToken || '';
  topicInput.value = value.topic || '';
});

function markdownEngine() {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  if (window.turndownPluginGfm && typeof window.turndownPluginGfm.gfm === 'function') {
    td.use(window.turndownPluginGfm.gfm);
  }
  return td;
}

async function readCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const href = tab.url || '';
  if (!tab?.id || !/^https?:\/\//.test(href)) {
    throw new Error('请在普通网页上使用此扩展，不要在 grok / chrome 设置页上用。');
  }
  let host = '';
  try { host = new URL(href).hostname; } catch { host = ''; }
  if (/(?:^|\.)(grok\.com|chatgpt\.com|claude\.ai)$/i.test(host)) {
    throw new Error('不要在 grok / ChatGPT / Claude 页面上采集。请打开要保存的文章或笔记。');
  }
  if (/(?:^|\.)(xiaohongshu\.com|rednote\.com)$/i.test(host)) {
    throw new Error('小红书请用「Beav采集 → Easel」：打开单篇笔记后点页内「保存笔记」。这只扩展只适合公众号和普通文章。');
  }
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['Readability.js'] });
  const [extracted] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const sel = window.getSelection();
      let html = '';
      let title = document.title;
      if (sel && !sel.isCollapsed) {
        const box = document.createElement('div');
        box.appendChild(sel.getRangeAt(0).cloneContents());
        html = box.innerHTML;
      } else {
        const article = new Readability(document.cloneNode(true)).parse();
        html = article?.content || document.body.innerHTML;
        title = article?.title || title;
      }
      const images = Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img[src]'))
        .map((img) => img.src)
        .filter((src) => /^https?:\/\//.test(src))
        .slice(0, 8);
      return { title, url: location.href, html, images };
    },
  });
  const source = extracted.result;
  if (!source?.html?.trim()) throw new Error('没有可保存的正文。');
  const markdown = markdownEngine().turndown(source.html).trim();
  if (!markdown) throw new Error('转 Markdown 后为空。');
  return { title: (source.title || '网页').slice(0, 300), url: source.url, content: markdown, images: source.images || [] };
}

previewBtn.addEventListener('click', async () => {
  previewBtn.disabled = true;
  status.textContent = '正在读取当前网页…';
  try {
    const source = await readCurrentPage();
    previewBox.value = source.content;
    previewBox.dataset.title = source.title;
    previewBox.dataset.url = source.url;
    previewBox.dataset.images = JSON.stringify(source.images || []);
    status.textContent = `已预览 ${source.content.length} 字。确认后点保存。`;
  } catch (error) {
    status.textContent = error.message;
  } finally {
    previewBtn.disabled = false;
  }
});

save.addEventListener('click', async () => {
  save.disabled = true;
  status.textContent = '正在保存…';
  try {
    const token = tokenInput.value.trim();
    if (!token) throw new Error('先在 Easel 调研页生成并复制配对码。');
    let markdown = previewBox.value.trim();
    let title = previewBox.dataset.title || '';
    let url = previewBox.dataset.url || '';
    if (!markdown) {
      const source = await readCurrentPage();
      markdown = source.content;
      title = source.title;
      url = source.url;
      previewBox.value = markdown;
    }
    const response = await fetch('http://127.0.0.1:7870/api/clipper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        title: title.slice(0, 300),
        url,
        content: markdown.slice(0, 300000),
        topic: topicInput.value,
        image_urls: (() => { try { return JSON.parse(previewBox.dataset.images || '[]'); } catch { return []; } })(),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : '保存失败。');
    await chrome.storage.local.set({ easelToken: token, topic: topicInput.value });
    status.textContent = '已保存到本地素材库。';
  } catch (error) {
    status.textContent = error.message.includes('Failed to fetch')
      ? '无法连接 Easel（7870），请先打开本地工作台。'
      : error.message;
  } finally {
    save.disabled = false;
  }
});
