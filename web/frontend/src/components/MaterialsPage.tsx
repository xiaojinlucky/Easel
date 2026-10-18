import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CreationInput } from '../lib/creations';
import { request } from '../lib/api';
import '../styles/creation.css';
import { IconSearch, IconBookmark, IconRefresh } from './icons';

// Meta 工作台 · 素材库：展示最新一份飞书收藏快照。确认删除会把飞书同一行标成不再同步。
interface MatItem {
  id: string; title: string; platform: string; author: string;
  collectedAt: string; publishedAt: string;
  likes: number | null; collects: number | null; comments: number | null; plays: number | null;
  heat: number | null; summary: string; topic: string; potential: string; form: string;
  cover: string; link: string; images: string[];
  rec?: { score: number; reason: string; parts: Record<string, number> } | null;
  matches?: { field: string; snippet: string }[];
}
interface MatDetail extends MatItem {
  keyPoints: string; body: string; transcript: string; ocr: string; imageDesc: string;
  whyHot: string; useForMe: string; commentsSay: string; hotComments: string; nextAction: string; source: string;
}
interface MatList { date: string; count: number; items: MatItem[]; canRefresh: boolean; refreshing: boolean; refreshMsg: string }

const PLATFORM_COLOR: Record<string, string> = {
  '小红书': '#ff2442', 'B站': '#00a1d6', '抖音': '#161823', 'X': '#1d9bf0', '公众号': '#07c160', '微信': '#07c160', '微信公众号': '#07c160', '知乎': '#0066ff',
};
const PAGE = 60;

function fmt(n: number | null): string {
  if (n == null) return '';
  return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '万' : String(Math.round(n));
}
function isXhs(p: string) { return p.includes('小红书'); }

function Stats({ it }: { it: MatItem }) {
  const parts: string[] = [];
  if (it.likes != null) parts.push(`赞 ${fmt(it.likes)}`);
  if (it.collects != null) parts.push(`藏 ${fmt(it.collects)}`);
  if (it.comments != null) parts.push(`评 ${fmt(it.comments)}`);
  if (!parts.length) return null;
  return <span className="mat-stats">{parts.join(' · ')}</span>;
}

function brief(it: MatItem): string {
  return [`标题：${it.title}`, it.platform && `平台：${it.platform}`, it.author && `作者：${it.author}`,
    it.summary && `一句话：${it.summary}`, it.link && `原帖：${it.link}`, `素材编号：${it.id}`].filter(Boolean).join('\n');
}

export default function MaterialsPage({ onStartPrompt, onCreate }: { onStartPrompt: (prompt: string) => void; onCreate: (input: CreationInput) => Promise<void> }) {
  const [data, setData] = useState<MatList | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('全部');
  const [sort, setSort] = useState<'rec' | 'pub' | 'time' | 'heat'>('rec');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<MatDetail | null>(null);
  const [detailError, setDetailError] = useState('');
  const [detailRetry, setDetailRetry] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);
  const [picks, setPicks] = useState<{ id: string; title: string }[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('easel_material_picks') || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [manage, setManage] = useState(false);
  const [drops, setDrops] = useState<{ id: string; title: string }[]>([]);
  const [dismissing, setDismissing] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    setLoading(true);
    try {
      const d = await request<MatList>('/api/materials?q=' + encodeURIComponent(query), { signal: controller.signal });
      if (!controller.signal.aborted) { setData(d); setError(''); }
    } catch (e) { if (!controller.signal.aborted) setError((e as Error).message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [query]);
  useEffect(() => {
    requestRef.current?.abort(); setLoading(true); setData(d => d ? { ...d, items: [] } : null);
    const timer = setTimeout(() => { void load(); }, query ? 250 : 0);
    return () => { clearTimeout(timer); requestRef.current?.abort(); };
  }, [load, query]);
  useEffect(() => {
    if (!data?.refreshing) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [data?.refreshing, load]);
  useEffect(() => { try { sessionStorage.setItem('easel_material_picks', JSON.stringify(picks)); } catch { setError('素材选择暂时无法在浏览器保存'); } }, [picks]);
  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setDetail(null);
    setDetailError('');
    let ignore = false;
    request<MatDetail>(`/api/materials/item/${encodeURIComponent(selected)}`)
      .then((d) => { if (!ignore) setDetail(d); }).catch((e: Error) => { if (!ignore) setDetailError(e.message); });
    return () => { ignore = true; };
  }, [selected, detailRetry]);

  const platforms = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of data?.items || []) c[it.platform] = (c[it.platform] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const list = useMemo(() => {
    let arr = (data?.items || []).filter((it) => platform === '全部' || it.platform === platform);
    arr = [...arr].sort((a, b) => sort === 'rec'
      ? (b.rec?.score ?? -1) - (a.rec?.score ?? -1)
      : sort === 'heat'
      ? (b.heat ?? -1) - (a.heat ?? -1)
      : sort === 'pub'
        ? (b.publishedAt || '').localeCompare(a.publishedAt || '')
        : (b.collectedAt || '').localeCompare(a.collectedAt || ''));
    return arr;
  }, [data, platform, sort]);

  const pick = (it: { id: string; title: string }) => {
    if (creating) return;
    if (picks.some(p => p.id === it.id)) { setPicks(prev => prev.filter(p => p.id !== it.id)); return; }
    if (picks.length >= 5) { setError('一次最多引用 5 条素材，请先移除一条'); return; }
    setPicks(prev => [...prev, { id: it.id, title: it.title }]); setError('');
  };
  const create = async (chosen = picks) => {
    if (creating || !chosen.length) return;
    const ask = chosen.length === 1
      ? `用「${chosen[0].title}」新建一篇创作？\n只建稿，不会马上写或发布。`
      : `用这 ${chosen.length} 条素材新建一篇创作？\n只建稿，不会马上写或发布。`;
    if (!window.confirm(ask)) return;
    setCreating(true); setError('');
    try {
      await onCreate({ title: chosen[0].title, sourceIds: chosen.map(p => p.id) });
      const latest: { id: string; title: string }[] = JSON.parse(sessionStorage.getItem('easel_material_picks') || '[]');
      const remaining = latest.filter(p => !chosen.some(c => c.id === p.id));
      setPicks(remaining); sessionStorage.setItem('easel_material_picks', JSON.stringify(remaining));
    }
    catch (e) { setError((e as Error).message); }
    finally { setCreating(false); }
  };

  useEffect(() => { setLimit(PAGE); }, [query, platform, sort]);

  const refresh = () => request('/api/materials/refresh', { method: 'POST' }).then(() => load()).catch((e: Error) => setError(e.message));

  const toggleDrop = (it: { id: string; title: string }) => {
    if (dismissing) return;
    if (drops.some(d => d.id === it.id)) { setDrops(prev => prev.filter(d => d.id !== it.id)); return; }
    if (drops.length >= 100) { setError('一次最多删除 100 条'); return; }
    setDrops(prev => [...prev, { id: it.id, title: it.title }]);
    setError('');
  };
  const dismiss = async (chosen: { id: string; title: string }[]) => {
    if (dismissing || creating || !chosen.length) return;
    const names = chosen.slice(0, 8).map(c => c.title).join('\n');
    const more = chosen.length > 8 ? `\n…等 ${chosen.length} 条` : '';
    const ok = window.confirm(
      `确定删除这 ${chosen.length} 条？\n${names}${more}\n\n工作台里会先看不到它们。飞书收藏库里同一条会记成「不再同步」，行还留着，之后从手机收藏同步时不会再加回来。手机 App 里原来的收藏不会被取消。`,
    );
    if (!ok) return;
    setDismissing(true); setError('');
    try {
      await request('/api/materials/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: chosen.map(c => c.id) }),
      });
      const gone = new Set(chosen.map(c => c.id));
      setDrops(prev => prev.filter(d => !gone.has(d.id)));
      setPicks(prev => prev.filter(p => !gone.has(p.id)));
      if (selected && gone.has(selected)) setSelected(null);
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setDismissing(false); }
  };

  const actWrite = (it: MatItem) => onStartPrompt(
    `用 meta-writing-core 和 writing-style 技能，把下面这条收藏素材写成一篇小红书草稿（只出草稿，不发布）。完整正文、转写和要点按素材编号去最新的飞书收藏快照里取。\n\n${brief(it)}`);

  const shown = list.slice(0, limit);

  return (
    <div className="skills-page">
      <div className="skills-page-head">
        <h1 className="page-title">素材库</h1>
        <p className="page-subtitle">
          你在飞书收藏的内容，共 {data?.count ?? '…'} 条{data?.date ? `，${data.date} 更新` : ''}。点卡片看详情，一键拿去写。
          {data?.canRefresh && (
            <button className="btn btn-ghost btn-sm mat-refresh" disabled={data.refreshing} onClick={refresh}>
              <IconRefresh size={13} /> {data.refreshing ? '更新中…' : '更新'}
            </button>
          )}
          {data?.refreshMsg && !data.refreshing && <span className="mat-refresh-msg">{data.refreshMsg}</span>}
          {data?.canRefresh && (
            <button className="btn btn-sm mat-refresh" disabled={dismissing} onClick={() => { setManage(on => !on); setDrops([]); }}>
              {manage ? '退出整理' : '整理'}
            </button>
          )}
        </p>
        <div className="skill-search">
          <span className="skill-search-ic"><IconSearch size={16} /></span>
          <input className="field" placeholder="搜全文：正文、转写、图片文字、评论…" maxLength={200} value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button className="btn btn-ghost btn-sm" onClick={() => setQuery('')}>清除</button>}
        </div>
        {manage ? (
          <div className="mat-basket"><span>{`${drops.length} 条待删除`}</span>
            {drops.map(p => <button className="chip" key={p.id} title={p.title} disabled={dismissing} onClick={() => toggleDrop(p)}>{p.title.slice(0, 14)} ×</button>)}
            <button className="btn btn-danger btn-sm" disabled={!drops.length || dismissing} onClick={() => dismiss(drops)}>{dismissing ? '正在删除…' : '删除所选'}</button>
            {!!drops.length && <button className="btn btn-ghost btn-sm" disabled={dismissing} onClick={() => setDrops([])}>清空</button>}
          </div>
        ) : (
          <div className="mat-basket"><span>{loading ? '正在检索…' : `${list.length} 条匹配`} · 已选 {picks.length}/5</span>
            {picks.map(p => <button className="chip" key={p.id} title={p.title} disabled={creating || dismissing} onClick={() => pick(p)}>{p.title.slice(0, 14)} ×</button>)}
            <button className="btn btn-primary btn-sm" disabled={!picks.length || creating || dismissing} onClick={() => create()}>{creating ? '正在创建…' : '用选中素材创作'}</button>
            {!!picks.length && <button className="btn btn-ghost btn-sm" disabled={creating || dismissing} onClick={() => setPicks([])}>清空选择</button>}
          </div>
        )}
        <div className="mat-toolbar">
          <div className="mat-chips">
            {[['全部', data?.count ?? 0] as [string, number], ...platforms].map(([p, n]) => (
              <button key={p} className={`chip ${platform === p ? 'active' : ''}`} onClick={() => setPlatform(p)}>
                {p} <span className="mat-chip-n">{n}</span>
              </button>
            ))}
          </div>
          <div className="mat-chips">
            <button className={`chip ${sort === 'rec' ? 'active' : ''}`} onClick={() => setSort('rec')} title="按画像贴合、爆款信号、新鲜度、信息完整度综合打分">最推荐</button>
            <button className={`chip ${sort === 'pub' ? 'active' : ''}`} onClick={() => setSort('pub')}>最新发布</button>
            <button className={`chip ${sort === 'time' ? 'active' : ''}`} onClick={() => setSort('time')}>最近收藏</button>
            <button className={`chip ${sort === 'heat' ? 'active' : ''}`} onClick={() => setSort('heat')}>最热</button>
          </div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--red)', maxWidth: 1100, margin: '16px auto' }}>{error}</div>}

      <div className="skills-body">
        {data && list.length === 0 && !loading && (
          <div className="empty-state" style={{ height: 240 }}>
            <div className="empty-icon"><IconSearch size={40} /></div>
            <p>{data.count ? '没有符合条件的素材' : '还没有素材快照，先点「更新」'}</p>
          </div>
        )}
        <div className="skill-grid" style={{ marginTop: 16 }}>
          {shown.map((it) => {
            const color = PLATFORM_COLOR[it.platform] || 'var(--text-tertiary)';
            return (
              <div key={it.id} className={`card card-hover skill-card mat-card ${(manage ? drops : picks).some(p => p.id === it.id) ? 'mat-picked' : ''}`}
                style={{ ['--layer-color' as string]: color }} onClick={() => setSelected(it.id)}>
                {manage ? (
                  <label className="mat-pick" onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`选择删除 ${it.title}`} disabled={dismissing} checked={drops.some(p => p.id === it.id)} onChange={() => toggleDrop(it)} /> 删除</label>
                ) : (
                  <label className="mat-pick" onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`引用 ${it.title}`} disabled={creating || dismissing} checked={picks.some(p => p.id === it.id)} onChange={() => pick(it)} /> 引用</label>
                )}
                <div className={`mat-cover ${!it.cover ? 'mat-cover-empty' : isXhs(it.platform) ? 'mat-cover-tall' : ''}`}>
                  {it.cover
                    ? <img src={it.cover} loading="lazy" decoding="async" alt="" onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; if (!el.parentElement?.querySelector('.mat-cover-none')) el.insertAdjacentHTML('afterend', '<span class="mat-cover-none">图片暂缺</span>'); }} />
                    : <span className="mat-cover-none">图片暂缺</span>}
                </div>
                <div className="mat-card-top">
                  <span className="mat-platform" style={{ color }}>{it.platform}</span>
                  <span className="mat-date">
                    {it.publishedAt && <b className="mat-pub">发布 {it.publishedAt}</b>}
                    {it.collectedAt && <span className="mat-col">{it.publishedAt ? ' · ' : ''}{it.collectedAt.slice(5)} 收藏</span>}
                  </span>
                </div>
                <div className="skill-card-name mat-title">{it.title}</div>
                {it.author && <div className="mat-author">{it.author}</div>}
                {it.rec && <div className="mat-rec" title={Object.entries(it.rec.parts).map(([k, v]) => `${k} ${v}`).join(' · ')}><b>{Math.round(it.rec.score)}</b> {it.rec.reason}</div>}
                <div className="skill-card-desc">{it.summary || '暂无摘要'}</div>
                {it.matches?.map(m => <div className="mat-match" key={m.field}><b>{m.field}</b>{m.snippet}</div>)}
                <div className="skill-card-foot"><Stats it={it} />{it.potential === '高' && <span className="badge badge-ok">值得写</span>}</div>
              </div>
            );
          })}
        </div>
        {list.length > limit && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button className="btn btn-sm" onClick={() => setLimit(limit + PAGE)}>再看 {Math.min(PAGE, list.length - limit)} 条（还剩 {list.length - limit}）</button>
          </div>
        )}
      </div>

      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="skill-detail-title">{detail?.title || '加载中…'}</div>
                  {detail && (
                    <div className="skill-detail-meta">
                      <span className="badge badge-accent">{detail.platform}</span>
                      {detail.author && <span className="badge">{detail.author}</span>}
                      {detail.publishedAt && <span className="badge badge-ok">发布 {detail.publishedAt}</span>}
                      {detail.collectedAt && <span className="badge">{detail.collectedAt} 收藏</span>}
                      <Stats it={detail} />
                    </div>
                  )}
                  {detail?.rec && (
                    <div className="mat-rec mat-rec-detail">推荐分 <b>{Math.round(detail.rec.score)}</b>：{detail.rec.reason}<span className="mat-rec-parts">（{Object.entries(detail.rec.parts).map(([k, v]) => `${k} ${v}`).join(' · ')}）</span></div>
                  )}
                </div>
                <button className="icon-btn" onClick={() => setSelected(null)} title="关闭">×</button>
              </div>
              {detail && (
                <div className="mat-actions">
                  <button className="btn btn-primary btn-sm" disabled={creating} onClick={() => create([detail])}>开始创作</button>
                  <button className="btn btn-sm" onClick={() => pick(detail)}>{picks.some(p => p.id === detail.id) ? '移除引用' : '加入引用'}</button>
                  <button className="btn btn-primary btn-sm" onClick={() => actWrite(detail)}>拿去写</button>
                  {detail.link && <a className="btn btn-ghost btn-sm" href={detail.link} target="_blank" rel="noreferrer">看原帖 ↗</a>}
                  {data?.canRefresh && <button className="btn btn-danger btn-sm" disabled={dismissing || creating} onClick={() => dismiss([detail])}>删除这条</button>}
                </div>
              )}
            </div>
            <div className="drawer-body">
              {detail && detail.images?.length > 0 && (
                <div className={`mat-gallery ${detail.images.length === 1 ? 'single' : ''}`}>
                  {detail.images.map((u) => (
                    <button key={u} className="mat-thumb" onClick={() => setZoom(u)} title="点开看大图">
                      <img src={u} loading="lazy" alt="" />
                    </button>
                  ))}
                </div>
              )}
              {detail && ([
                ['一句话', detail.summary], ['关键要点', detail.keyPoints], ['对我有什么用', detail.useForMe],
                ['为什么火', detail.whyHot], ['评论区在说什么', detail.commentsSay], ['正文', detail.body],
                ['视频转写', detail.transcript], ['图里的字', detail.ocr], ['图片内容', detail.imageDesc],
              ] as [string, string][]).filter(([, v]) => v && !/^【?无|^图1：（(无文字|图片下载失败)）$/.test(v.trim())).map(([k, v]) => (
                <div className="panel mat-panel" key={k}>
                  <div className="panel-title">{k}</div>
                  <div className="mat-text">{v}</div>
                </div>
              ))}
              {detailError ? <div role="alert">{detailError}<button className="btn btn-sm" onClick={() => setDetailRetry(n => n + 1)}>重试</button></div> : !detail && <div style={{ color: 'var(--text-secondary)' }}><IconBookmark size={14} /> 正在读取…</div>}
            </div>
          </div>
        </div>
      )}
      {zoom && (
        <div className="mat-zoom" onClick={() => setZoom(null)} title="点任意处关闭">
          <img src={zoom} alt="" />
        </div>
      )}
    </div>
  );
}
