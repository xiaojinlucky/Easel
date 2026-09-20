const tokenInput = document.querySelector('#token');
const topicInput = document.querySelector('#topic');
const status = document.querySelector('#status');
const save = document.querySelector('#save');
chrome.storage.local.get(['easelToken', 'topic']).then(value => { tokenInput.value = value.easelToken || ''; topicInput.value = value.topic || ''; });
save.addEventListener('click', async () => {
  save.disabled = true; status.textContent = '正在读取当前网页…';
  try {
    const token = tokenInput.value.trim();
    if (!token) throw new Error('先在 Easel 调研页生成并复制配对码。');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:\/\//.test(tab.url || '')) throw new Error('请在普通网页上使用此扩展。');
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['Readability.js'] });
    const [extracted] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
      const selection = window.getSelection()?.toString().trim();
      const article = selection ? null : new Readability(document.cloneNode(true)).parse();
      return { title: article?.title || document.title, url: location.href, content: selection || article?.textContent || document.body.innerText };
    } });
    const source = extracted.result;
    if (!source?.content?.trim()) throw new Error('没有可保存的正文，请选择需要的文字后重试。');
    const response = await fetch('http://127.0.0.1:7860/api/clipper', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ ...source, title: source.title.slice(0, 300), content: source.content.slice(0, 300000), topic: topicInput.value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : '保存失败。');
    await chrome.storage.local.set({ easelToken: token, topic: topicInput.value });
    status.textContent = '已保存到本地素材库，可继续做选题、评论洞察和多平台改写。';
  } catch (error) { status.textContent = error.message.includes('Failed to fetch') ? '无法连接 Easel，请先启动本地工作台。' : error.message; }
  finally { save.disabled = false; }
});
