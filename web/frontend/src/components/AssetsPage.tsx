import { useEffect, useMemo, useRef, useState } from 'react';
import { IconPlus, IconSearch, IconTrash } from './icons';

// 资产库（对齐 Beav 的「资产库」/ redbox.asset-folder.v1）
// 一条资产 = 磁盘上一个文件夹 asset-library/<标题>/asset.md，脱离本页也读得懂。

type Asset = {
  id: string; folder: string; title: string; type: string; category: string;
  cover: string; tags: string[]; aliases: string[]; platform: string;
  description: string; updated_at: string;
};
type Category = { id: string; name: string };
type Status = {
  total: number; by_category: Record<string, number>; uncategorized: number;
  categories: Category[]; types: Record<string, string>;
};

const UNCATEGORIZED = '__none__';

async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const verb = method ?? (body === undefined ? 'GET' : 'POST');
  const init: RequestInit = verb === 'GET' ? {} : { method: verb, headers: { 'Content-Type': 'application/json' } };
  if (verb !== 'GET' && body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch('/api/assets' + path, init);
  const value = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof (value as { detail?: string }).detail === 'string' ? (value as { detail: string }).detail : '请求失败');
  }
  return value as T;
}

/** Beav 的封面写成同目录相对路径（./xxx.webp），这里转成后端取文件的地址。 */
function coverSrc(asset: Asset) {
  const cover = (asset.cover || '').trim();
  if (!cover) return '';
  if (/^https?:\/\//i.test(cover)) return cover;
  const file = cover.replace(/^\.\//, '').replace(/\\/g, '/').split('/').pop() || '';
  if (!file) return '';
  return `/api/assets/file/${encodeURIComponent(asset.folder)}/${encodeURIComponent(file)}`;
}

type Draft = {
  title: string; type: string; category: string; platform: string;
  cover: string; tags: string; aliases: string; description: string;
};

const EMPTY_DRAFT: Draft = {
  title: '', type: 'person', category: '', platform: '', cover: '', tags: '', aliases: '', description: '',
};

export default function AssetsPage() {
  const [items, setItems] = useState<Asset[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingFolder, setEditingFolder] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  async function reload(nextQuery = query, nextCategory = category, nextType = typeFilter) {
    const params = new URLSearchParams();
    if (nextQuery) params.set('query', nextQuery);
    if (nextCategory === UNCATEGORIZED) params.set('category', UNCATEGORIZED);
    else if (nextCategory) params.set('category', nextCategory);
    if (nextType) params.set('type', nextType);
    const [list, stats] = await Promise.all([
      api<{ items: Asset[] }>('/items?' + params.toString()),
      api<Status>('/status'),
    ]);
    // 未分类筛选：后端按分类名精确匹配，这里再兜一层"未分类"语义
    setItems(nextCategory === UNCATEGORIZED ? list.items.filter((x) => !x.category) : list.items);
    setStatus(stats);
  }

  useEffect(() => { reload('', '', '').catch((e) => setError((e as Error).message)); }, []);

  // 顶栏搜索：输入即搜（防抖），对齐 Beav 知识库页的即时检索手感
  useEffect(() => {
    const timer = window.setTimeout(() => {
      reload(query, category, typeFilter).catch((e) => setError((e as Error).message));
    }, 260);
    return () => window.clearTimeout(timer);
  }, [query, category, typeFilter]);

  // Ctrl+K / ⌘K 聚焦搜索框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const categories = status?.categories || [];
  const types = status?.types || {};
  const counts = status?.by_category || {};

  function openCreate() {
    setEditingFolder('');
    setDraft({ ...EMPTY_DRAFT, category: category && category !== UNCATEGORIZED ? category : (categories[0]?.name || '') });
    setError('');
  }

  function openEdit(asset: Asset) {
    setEditingFolder(asset.folder);
    setDraft({
      title: asset.title, type: asset.type || 'person', category: asset.category || '',
      platform: asset.platform || '', cover: asset.cover || '',
      tags: (asset.tags || []).join(', '), aliases: (asset.aliases || []).join(', '),
      description: asset.description || '',
    });
    setError('');
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) { setError('资产标题不能为空。'); return; }
    setBusy(true); setError(''); setMessage('');
    const payload = {
      title: draft.title.trim(),
      type: draft.type || 'person',
      category: draft.category || '',
      platform: draft.platform.trim(),
      cover: draft.cover.trim(),
      tags: draft.tags.split(/[,，]/).map((x) => x.trim()).filter(Boolean),
      aliases: draft.aliases.split(/[,，]/).map((x) => x.trim()).filter(Boolean),
      description: draft.description,
    };
    try {
      if (editingFolder) {
        await api('/items/' + encodeURIComponent(editingFolder), payload, 'PATCH');
        setMessage(`已更新「${payload.title}」。`);
      } else {
        await api('/items', payload);
        setMessage(`已新建「${payload.title}」，磁盘上已生成 asset-library/${payload.title}/asset.md。`);
      }
      setDraft(null); setEditingFolder('');
      await reload();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function remove(asset: Asset) {
    if (!window.confirm(`删除资产「${asset.title}」？文件夹会移入回收站。`)) return;
    setBusy(true); setError('');
    try {
      await api('/items/' + encodeURIComponent(asset.folder), undefined, 'DELETE');
      setMessage(`已删除「${asset.title}」。`);
      setDraft(null);
      await reload();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const typeLabel = (t: string) => types[t] || t || '未分类';

  const cards = useMemo(() => items.map((asset) => {
    const cover = coverSrc(asset);
    return (
      <article key={asset.id} className="asset-card">
        <button className="asset-card-main" onClick={() => openEdit(asset)}>
          <div className={`asset-cover ${cover ? '' : 'asset-cover-empty'}`}>
            {cover ? <img src={cover} alt="" /> : <span>{typeLabel(asset.type).slice(0, 2)}</span>}
          </div>
          <div className="asset-card-body">
            <div className="asset-card-top">
              <h4>{asset.title}</h4>
              <span className="asset-type">{typeLabel(asset.type)}</span>
            </div>
            {asset.category ? <span className="asset-category">{asset.category}</span> : <span className="asset-category muted">未分类</span>}
            {asset.description ? <p>{asset.description.slice(0, 90)}</p> : null}
            {(asset.tags.length > 0 || asset.aliases.length > 0) && (
              <div className="asset-tags">
                {asset.tags.slice(0, 4).map((t) => <span key={'t' + t}>#{t}</span>)}
                {asset.aliases.slice(0, 3).map((t) => <span key={'a' + t} className="alias">≈{t}</span>)}
              </div>
            )}
          </div>
        </button>
      </article>
    );
  }), [items, types]);

  return <div className="research-page asset-page">
    <div className="model-heading">
      <div>
        <span className="model-eyebrow">一条资产 = 一个文件夹</span>
        <h2>资产库</h2>
        <p>人设、品牌、场景、物品都存在这里，磁盘上是 asset-library/&lt;标题&gt;/asset.md，随时能用 Obsidian 打开。</p>
      </div>
      <span className="research-engine">共 {status?.total ?? 0} 条</span>
    </div>

    <div className="asset-toolbar">
      <div className="asset-search">
        <IconSearch size={15} />
        <input ref={searchRef} placeholder="搜索资产标题、描述、标签…" value={query}
          onChange={(e) => setQuery(e.target.value)} />
        <kbd>Ctrl K</kbd>
      </div>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="按类型筛选">
        <option value="">全部类型</option>
        {Object.entries(types).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
      <button className="btn btn-primary" onClick={openCreate}><IconPlus size={14} /> 新建资产</button>
    </div>

    {error && <div className="model-alert error" role="alert">{error}</div>}
    {message && <div className="model-alert" role="status">{message}</div>}

    <div className="asset-layout">
      <aside className="asset-rail">
        <button className={`asset-rail-item ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>
          <span>全部</span><b>{status?.total ?? 0}</b>
        </button>
        {categories.map((c) => (
          <button key={c.id} className={`asset-rail-item ${category === c.name ? 'active' : ''}`}
            onClick={() => setCategory(c.name)}>
            <span>{c.name}</span><b>{counts[c.name] || 0}</b>
          </button>
        ))}
        <button className={`asset-rail-item ${category === UNCATEGORIZED ? 'active' : ''}`}
          onClick={() => setCategory(UNCATEGORIZED)}>
          <span>未分类</span><b>{status?.uncategorized ?? 0}</b>
        </button>
      </aside>

      <section className="asset-grid-wrap">
        {!items.length && (
          <div className="research-empty">
            {query || category || typeFilter ? '没有匹配的资产。' : '还没有资产。点「新建资产」开始，第一条建议放你自己的账号人设卡。'}
          </div>
        )}
        <div className="asset-grid">{cards}</div>
      </section>
    </div>

    {draft && <div className="overlay"><div className="modal asset-editor">
      <div className="asset-editor-head">
        <h3>{editingFolder ? '编辑资产' : '新建资产'}</h3>
        <button className="btn" onClick={() => { setDraft(null); setEditingFolder(''); }}>关闭</button>
      </div>
      {editingFolder && <p className="research-hint">磁盘位置：<code>Easel-official/asset-library/{editingFolder}/asset.md</code></p>}
      <div className="asset-form">
        <label>标题
          <input value={draft.title} maxLength={80} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="例如：做科研的Meta师兄 / AI科研工作台场景" />
        </label>
        <div className="asset-form-row">
          <label>类型
            <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              {Object.entries(types).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </label>
          <label>分类
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              <option value="">未分类</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <label>平台
            <input value={draft.platform} maxLength={40} onChange={(e) => setDraft({ ...draft, platform: e.target.value })} placeholder="小红书 / 公众号…" />
          </label>
        </div>
        <label>别名（逗号分隔）
          <input value={draft.aliases} onChange={(e) => setDraft({ ...draft, aliases: e.target.value })} placeholder="AI科研工具, 研究工作台" />
        </label>
        <label>标签（逗号分隔）
          <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="账号本人, 科研" />
        </label>
        <label>封面
          <input value={draft.cover} onChange={(e) => setDraft({ ...draft, cover: e.target.value })} placeholder="图片链接，或 ./封面.webp（放在该资产文件夹里）" />
        </label>
        <label>描述
          <textarea rows={6} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="这个人物/场景/品牌是什么，用在什么内容里。这段文字会写进 asset.md 的正文。" />
        </label>
      </div>
      <div className="model-actions">
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? '保存中…' : '保存'}</button>
        {editingFolder && <button className="btn btn-danger" disabled={busy} onClick={() => {
          const target = items.find((x) => x.folder === editingFolder);
          if (target) void remove(target);
        }}><IconTrash size={13} /> 删除</button>}
      </div>
    </div></div>}
  </div>;
}
