const SERVICES = Object.freeze({
  home: { title: '创作工作台', url: 'http://127.0.0.1:7860/' },
  publish: { title: '发布日历', url: 'http://localhost:4007/' },
  feeds: { title: '订阅阅读', url: 'http://localhost:8089/' },
  queue: { title: '任务队列', url: 'http://localhost:8088/' },
});

function destination(raw) {
  try {
    const url = new URL(raw);
    if (url.username || url.password) return null;
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) {
      const key = Object.keys(SERVICES).find(key => new URL(SERVICES[key].url).port === url.port);
      if (key) {
        const canonical = new URL(SERVICES[key].url);
        canonical.pathname = url.pathname;
        canonical.search = url.search;
        canonical.hash = url.hash;
        return { kind: 'local', key, url: canonical.href };
      }
    }
    if (url.protocol === 'https:') return { kind: 'external', url: url.href };
  } catch { /* Invalid URLs are not navigation targets. */ }
  return null;
}

function allowedInView(raw, key) {
  const target = destination(raw);
  return target?.kind === 'local' && target.key === key && new URL(raw).origin === new URL(SERVICES[key].url).origin;
}

module.exports = { SERVICES, destination, allowedInView };
