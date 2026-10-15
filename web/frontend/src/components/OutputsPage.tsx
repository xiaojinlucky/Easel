import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { fetchOutputs, fetchOutputContent, mediaUrl, deleteOutput, batchOutputs, exportOutputs, fetchItemStatus, setItemStatus, askPublishedInfo } from '../lib/api';
import type { ItemStatus, ItemReview } from '../lib/api';
import { startMetaPrompt } from '../lib/api';
import type { OutputNode, OutputMeta } from '../lib/api';
import { renderMarkdown } from '../lib/sanitize';
import { IconOutputs, IconImage, IconVideo, IconMusic, IconFile, IconFolder, IconRefresh, IconChevron, IconTrash } from './icons';

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'audio', label: '音频' },
  { key: 'text', label: '文档' },
];

const KIND_LABEL: Record<string, string> = {
  article: '文章', 'xhs-note': '小红书', video: '视频', cards: '卡片',
  poster: '海报', audio: '音频', other: '其他',
};
const STATUS_LABEL: Record<string, string> = { todo: '待写', draft: '在写', ready: '待发', published: '已发' };
const STATUS_COLOR: Record<string, string> = { todo: 'var(--text-tertiary)', draft: 'var(--accent-start)', ready: 'var(--amber)', published: 'var(--green)' };
const STATUS_OPTIONS = ['todo', 'draft', 'ready', 'published'];

const badge: CSSProperties = {
  fontSize: 11, padding: '1px 7px', borderRadius: 999,
  background: 'var(--surface-hover)', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
};
const statusBadge = (s: string): CSSProperties => ({
  ...badge,
  background: `color-mix(in srgb, ${STATUS_COLOR[s] || 'var(--text-tertiary)'} 13%, transparent)`,
  color: STATUS_COLOR[s] || 'var(--text-secondary)',
});

function kindIcon(kind: string | undefined, size = 30) {
  if (kind === 'video') return <IconVideo size={size} />;
  if (kind === 'audio') return <IconMusic size={size} />;
  if (kind === 'image') return <IconImage size={size} />;
  return <IconFile size={size} />;
}
const isHtml = (name: string) => /\.html?$/i.test(name);
const kindLabel = (f: OutputNode) =>
  f.kind === 'text' ? (isHtml(f.name) ? '卡片' : '文档')
    : f.kind === 'image' ? '图片' : f.kind === 'video' ? '视频' : f.kind === 'audio' ? '音频' : '文件';

/** 递归找目录下第一张图/视频作封面缩略图。 */
function firstMedia(node: OutputNode): OutputNode | null {
  if (node.type === 'file') return (node.kind === 'image' || node.kind === 'video') ? node : null;
  for (const c of node.children || []) {
    const m = firstMedia(c);
    if (m) return m;
  }
  return null;
}

/** 展示头声明的封面 → 伪 file 节点（供 Thumb 渲染）。 */
function coverNode(m?: OutputMeta): OutputNode | null {
  if (!m?.cover) return null;
  const kind = /\.(mp4|mov|webm|mkv)$/i.test(m.cover) ? 'video' : 'image';
  return { name: 'cover', type: 'file', path: m.cover, kind } as OutputNode;
}

/** 按名称路径解析到当前目录的 children（stackNames 稳定，刷新后仍有效）。 */
function resolvePath(roots: OutputNode[], names: string[]): OutputNode[] {
  let nodes = roots;
  for (const nm of names) {
    const found = nodes.find((n) => n.type === 'dir' && n.name === nm);
    if (!found) return nodes;   // 路径失效（被删/改）→ 停在能解析到的层
    nodes = found.children || [];
  }
  return nodes;
}

function Thumb({ f, big }: { f: OutputNode | null; big?: boolean }) {
  if (f && f.kind === 'image') return <img src={mediaUrl(f.path)} alt="" loading="lazy" />;
  if (f && f.kind === 'video') return <video src={mediaUrl(f.path)} preload="metadata" muted />;
  return <div className="gcard-ph">{kindIcon(f?.kind, big ? 34 : 30)}</div>;
}

interface OutputsPageProps {
  /** 从对话跳转进来的目录（outputs 相对路径，不含 outputs/ 前缀）；消费后由父层清空 */
  jumpPath?: string;
  onJumpHandled?: () => void;
}

export default function OutputsPage({ jumpPath, onJumpHandled }: OutputsPageProps) {
  const [roots, setRoots] = useState<OutputNode[]>([]);
  const [treeError, setTreeError] = useState('');
  const [stack, setStack] = useState<string[]>([]);   // 当前所在的文件夹名称路径
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<OutputNode | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const reqSeq = useRef(0);
  // META-PATCH: 批量管理
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const lastPick = useRef<string | null>(null);
  const [batchMode, setBatchMode] = useState<'' | 'move' | 'status'>('');
  const [moveTarget, setMoveTarget] = useState('');
  const [busy, setBusy] = useState(false);

  const [itemSt, setItemSt] = useState<Record<string, ItemStatus>>({});
  const loadSt = useCallback(() => { fetchItemStatus().then(setItemSt).catch(() => {}); }, []);
  useEffect(() => { loadSt(); }, [loadSt]);
  const isWord = (n: string) => /\.docx?$/i.test(n);
  const daysSince = (d?: string) => { if (!d) return null; const x = Date.parse(d); return isNaN(x) ? null : Math.max(0, Math.floor((Date.now() - x) / 86400000)); };
  const ctxPrompt = (f: OutputNode, st?: string) => {
    const head = `这篇稿子在内容库：${f.path}。${isWord(f.name) ? '这是我在 Word 里亲手改过的当前定稿，只读，绝不能覆盖；你的修改另存为新文件。' : ''}\n${content && f.kind === 'text' ? '当前内容：\n' + content.slice(0, 6000) + '\n' : ''}`;
    if (st === 'ready') return ['发布前检查', head + '按我的画像做发布前检查：标题、开头、事实和数字、敏感词、结尾。只列问题和改法，不要改原文件。'];
    if (st === 'published') return ['下一篇写什么', head + `这篇已发布${itemSt[f.path]?.link ? '（' + itemSt[f.path].link + '）' : ''}。复盘：${JSON.stringify(itemSt[f.path]?.review || {})}。按我的画像，给我下一篇该写的 3 个选题，每个说清谁卡在哪、为什么现在讲。`];
    return ['按我的语气改一遍', head + '用 meta-writing-core 和 writing-style，按我的原文语气改一遍。改好的版本另存为新文件，不覆盖原文件。'];
  };
  const saveReview = async (p: string, r: ItemReview) => { await setItemStatus(p, { extra: { review: r } }); loadSt(); };
  const topicItems = Object.entries(itemSt).filter(([k]) => k.startsWith('选题/'));
  const load = useCallback(() => {
    loadSt();
    setTreeError('');
    fetchOutputs().then(setRoots).catch(() => setTreeError('加载产物列表失败'));
  }, []);
  useEffect(() => { load(); }, [load]);

  const currentNodes = useMemo(() => resolvePath(roots, stack), [roots, stack]);
  const dirs = useMemo(
    () => currentNodes.filter((n) => n.type === 'dir').sort((a, b) => (b.mtime || 0) - (a.mtime || 0)),
    [currentNodes]);
  const files = useMemo(() => {
    const fs = currentNodes.filter((n) => n.type === 'file').sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    return filter === 'all' ? fs : fs.filter((f) => f.kind === filter);
  }, [currentNodes, filter]);

  const atTop = stack.length === 0;
  const atProjectRoot = stack.length === 1;
  // 当前项目的展示头（进入项目后才有），用于「成品/素材」分区
  const projectMeta = useMemo(
    () => (stack.length >= 1 ? roots.find((r) => r.name === stack[0])?.meta : undefined),
    [roots, stack]);
  const deliverableSet = useMemo(
    () => new Set(atProjectRoot ? (projectMeta?.deliverablePaths || []) : []),
    [projectMeta, atProjectRoot]);
  const hasSplit = atProjectRoot && deliverableSet.size > 0;
  const deliverableFiles = useMemo(
    () => (hasSplit ? files.filter((f) => deliverableSet.has(f.path)) : []),
    [files, deliverableSet, hasSplit]);
  const restFiles = useMemo(
    () => (hasSplit ? files.filter((f) => !deliverableSet.has(f.path)) : files),
    [files, deliverableSet, hasSplit]);

  const enterDir = useCallback((name: string) => { setStack((s) => [...s, name]); setFilter('all'); setPicked(new Set()); }, []);
  const goTo = useCallback((depth: number) => { setStack((s) => s.slice(0, depth)); setFilter('all'); setPicked(new Set()); }, []);

  // 当前页面可见顺序（用于 shift 连选）
  const visibleOrder = useMemo(
    () => (hasSplit ? [...deliverableFiles, ...dirs, ...restFiles] : [...dirs, ...files]).map((n) => n.path),
    [hasSplit, deliverableFiles, dirs, restFiles, files]);
  const togglePick = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = lastPick.current, shift = e.shiftKey;
    setPicked((cur) => {
      const next = new Set(cur);
      if (shift && prev && visibleOrder.includes(prev)) {
        const a = visibleOrder.indexOf(prev), b = visibleOrder.indexOf(path);
        const [lo, hi] = a < b ? [a, b] : [b, a];
        for (const p of visibleOrder.slice(lo, hi + 1)) next.add(p);
      } else if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    lastPick.current = path;
  }, [visibleOrder]);
  const allPicked = visibleOrder.length > 0 && visibleOrder.every((p) => picked.has(p));
  const pickAll = () => setPicked(allPicked ? new Set() : new Set(visibleOrder));
  const topProjects = useMemo(() => roots.filter((r) => r.type === 'dir').map((r) => r.name), [roots]);

  const runBatch = useCallback(async (action: 'move' | 'status' | 'archive' | 'delete', extra: { target?: string; status?: string } = {}) => {
    const paths = [...picked];
    if (!paths.length) return;
    const names = paths.slice(0, 8).map((p) => '· ' + p.split('/').pop()).join('\n') + (paths.length > 8 ? `\n…等 ${paths.length} 项` : '');
    if (action === 'delete' && !window.confirm(`确定删除这 ${paths.length} 项？\n${names}\n\n会先放进回收站，能找回。`)) return;
    if (action === 'archive' && !window.confirm(`把这 ${paths.length} 项归档？\n${names}\n\n归档后先藏起来，能找回。`)) return;
    setBusy(true);
    try {
      const r = await batchOutputs(action, paths, extra);
      if (r.errors.length) alert(`完成 ${r.done.length} 项，失败 ${r.errors.length} 项：\n` + r.errors.join('\n'));
      setPicked(new Set()); setBatchMode('');
      load();
    } catch (err) {
      alert((err as Error).message || '操作失败');
    } finally { setBusy(false); }
  }, [picked, load]);
  const runExport = useCallback(async () => {
    setBusy(true);
    try { await exportOutputs([...picked]); } catch (err) { alert((err as Error).message); } finally { setBusy(false); }
  }, [picked]);


  const remove = useCallback(async (node: OutputNode, e: React.MouseEvent) => {
    e.stopPropagation();
    const isDir = node.type === 'dir';
    const label = isDir ? `项目/文件夹「${node.meta?.title || node.name}」及其全部内容` : `文件「${node.name}」`;
    if (!window.confirm(`确定删除${label}？\n会先放进回收站，能找回。`)) return;
    try {
      await deleteOutput(node.path);
      setSelected((cur) => (cur?.path === node.path ? null : cur));
      load();
    } catch (err) {
      alert((err as Error).message || '删除失败');
    }
  }, [load]);

  const open = useCallback(async (f: OutputNode) => {
    const seq = ++reqSeq.current;
    setSelected(f); setContent('');
    if (f.kind === 'text' && !isHtml(f.name)) {
      setLoading(true);
      try {
        const res = await fetchOutputContent(f.path);
        if (seq === reqSeq.current) setContent(res.isBinary ? '' : res.content);
      } finally { if (seq === reqSeq.current) setLoading(false); }
    }
  }, []);

  // 等内容树加载后区分文件与目录；文件链接直接打开预览。
  useEffect(() => {
    if (!jumpPath || roots.length === 0) return;
    const parts = jumpPath.split('/').filter(Boolean);
    const parent: string[] = [];
    let nodes = roots;
    let node: OutputNode | undefined;
    for (const part of parts) {
      node = nodes.find(candidate => candidate.name === part);
      if (!node || node.type !== 'dir') break;
      parent.push(part);
      nodes = node.children || [];
    }
    if (node?.path !== parts.join('/')) node = undefined;
    setStack(parent);
    setFilter('all');
    if (node?.type === 'file') void open(node);
    else setSelected(null);
    onJumpHandled?.();
  }, [jumpPath, roots, open, onJumpHandled]);

  const preview = () => {
    if (!selected) return null;
    const url = mediaUrl(selected.path);
    if (selected.kind === 'image') return <img src={url} alt={selected.name} style={{ maxWidth: '100%', borderRadius: 'var(--radius)' }} />;
    if (selected.kind === 'video') return <video src={url} controls style={{ maxWidth: '100%', borderRadius: 'var(--radius)' }} />;
    if (selected.kind === 'audio') return <audio src={url} controls style={{ width: '100%' }} />;
    if (selected.kind === 'text' && isHtml(selected.name)) return (
      <>
        {/* allow-scripts：让预览页自带的「复制到公众号」按钮(execCommand('copy'))能运行；
            allow="clipboard-write"：授予剪贴板写权限。不给 allow-same-origin —— iframe 保持
            opaque origin，脚本跑得起来但访问不到本站，安全。(修复：内嵌预览里复制按钮点了没反应) */}
        <iframe src={`${url}?v=${selected.mtime ?? 0}`} title={selected.name} sandbox="allow-scripts" allow="clipboard-write"
          style={{ width: '100%', height: '68vh', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fff' }} />
        <div style={{ marginTop: 8 }}><a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-start)', fontSize: 13 }}>在新标签打开 ↗</a></div>
      </>
    );
    if (selected.kind === 'text') {
      if (loading) return <div className="loading"><div className="spinner" />加载中…</div>;
      return <div className="outputs-viewer-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
    }
    return <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>无法预览。<a href={url} download style={{ color: 'var(--accent-start)' }}>下载 {selected.name}</a></div>;
  };

  /** 项目/文件夹卡片：顶层项目用展示头（标题/平台/状态/封面），嵌套子文件夹回退朴素样式。 */
  const renderDir = (d: OutputNode) => {
    const m = d.meta;
    const cover = coverNode(m) || firstMedia(d);
    return (
      <div key={d.path} className={`card card-hover gcard ${picked.has(d.path) ? 'meta-picked' : ''}`} onClick={(e) => (picked.size > 0 || e.shiftKey ? togglePick(d.path, e) : enterDir(d.name))}>
        <div className="gcard-thumb">
          <span className={`meta-pick ${picked.has(d.path) ? 'on' : ''}`} title="选择（按住 Shift 连选）" onClick={(e) => togglePick(d.path, e)}>{picked.has(d.path) ? '✓' : ''}</span>
          <span className="gcard-kind">{m?.kind ? (KIND_LABEL[m.kind] || m.kind) : '文件夹'}</span>
          <button className="gcard-del" title="删除" onClick={(e) => remove(d, e)}><IconTrash size={14} /></button>
          {cover ? <Thumb f={cover} big /> : <div className="gcard-ph"><IconFolder size={38} /></div>}
        </div>
        <div className="gcard-meta">
          <div className="gcard-name" title={m?.title || d.name}>
            {!m && <IconFolder size={13} />} {m?.title || d.name}
          </div>
          <div className="gcard-sub" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {m?.platform && <span style={badge}>{m.platform}</span>}
            {(itemSt[d.path]?.status || m?.status) && <span style={statusBadge(itemSt[d.path]?.status || m!.status!)}>{STATUS_LABEL[itemSt[d.path]?.status || m!.status!]}</span>}
            <span>{d.fileCount ?? 0} 个文件</span>
          </div>
        </div>
      </div>
    );
  };

  const renderFile = (f: OutputNode) => (
    <div key={f.path} className={`card card-hover gcard ${picked.has(f.path) ? 'meta-picked' : ''}`} onClick={(e) => (picked.size > 0 || e.shiftKey ? togglePick(f.path, e) : open(f))}>
      <div className="gcard-thumb">
        <span className={`meta-pick ${picked.has(f.path) ? 'on' : ''}`} title="选择（按住 Shift 连选）" onClick={(e) => togglePick(f.path, e)}>{picked.has(f.path) ? '✓' : ''}</span>
          <span className="gcard-kind">{isWord(f.name) ? '当前定稿' : kindLabel(f)}</span>
        <button className="gcard-del" title="删除" onClick={(e) => remove(f, e)}><IconTrash size={14} /></button>
        <Thumb f={f} />
      </div>
      <div className="gcard-meta">
        <div className="gcard-name" title={f.name}>{f.name}</div>
        {itemSt[f.path]?.status && (
          <div className="gcard-sub" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={statusBadge(itemSt[f.path].status!)}>{STATUS_LABEL[itemSt[f.path].status!]}</span>
            {itemSt[f.path].date && <span>{itemSt[f.path].date}</span>}
          </div>
        )}
      </div>
    </div>
  );

  const empty = dirs.length === 0 && files.length === 0;

  return (
    <div className="gallery-page">
      <div className="gallery-head">
        <div>
          <h1 className="page-title">
            <span className="crumb" onClick={() => goTo(0)}>内容库</span>
            {stack.map((name, i) => (
              <span key={i}>
                <span className="crumb-sep">/</span>
                {i === stack.length - 1
                  ? (projectMeta?.title && i === 0 ? projectMeta.title : name)
                  : <span className="crumb" onClick={() => goTo(i + 1)}>{name}</span>}
              </span>
            ))}
          </h1>
          <p className="page-subtitle">
            {atTop
              ? `共 ${roots.length} 个项目。点开看稿子；勾选可批量改状态。`
              : `${dirs.length} 个文件夹 · ${files.length} 个文件（可继续点开子文件夹）`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {visibleOrder.length > 0 && <button className="btn btn-sm" onClick={pickAll}>{allPicked ? '取消全选' : '全选'}</button>}
          <button className="btn btn-sm" onClick={load}><IconRefresh size={14} /> 刷新</button>
        </div>
      </div>

      {picked.size > 0 && (
        <div className="meta-batchbar">
          <b>已选 {picked.size} 项</b>
          <span className="meta-batch-tip">点卡片继续勾选，Shift 连选</span>
          <button className="btn btn-sm" disabled={busy} onClick={() => setBatchMode(batchMode === 'move' ? '' : 'move')}>移动到…</button>
          <button className="btn btn-sm" disabled={busy} onClick={() => setBatchMode(batchMode === 'status' ? '' : 'status')}>改状态</button>
          <button className="btn btn-sm" disabled={busy} onClick={async () => {
            const info = askPublishedInfo(); if (!info) return;
            setBusy(true);
            try { for (const p of picked) await setItemStatus(p, { status: 'published', ...info }); setPicked(new Set()); loadSt(); }
            catch (err) { alert((err as Error).message); } finally { setBusy(false); }
          }}>标记已发布</button>
          <button className="btn btn-sm" disabled={busy} onClick={() => runBatch('archive')}>归档</button>
          <button className="btn btn-sm" disabled={busy} onClick={runExport}>导出</button>
          <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => runBatch('delete')}><IconTrash size={13} /> 删除</button>
          <button className="btn btn-sm" disabled={busy} onClick={() => { setPicked(new Set()); setBatchMode(''); }}>取消选择</button>
          {batchMode === 'move' && (
            <div className="meta-batch-sub">
              移到项目：
              <input className="input" list="meta-proj-list" value={moveTarget} placeholder="选已有项目，或输入新名字" onChange={(e) => setMoveTarget(e.target.value)} style={{ width: 240 }} />
              <datalist id="meta-proj-list">{topProjects.map((n) => <option key={n} value={n} />)}</datalist>
              <button className="btn btn-sm btn-primary" disabled={busy || !moveTarget.trim()} onClick={() => runBatch('move', { target: moveTarget.trim() })}>确定移动</button>
            </div>
          )}
          {batchMode === 'status' && (
            <div className="meta-batch-sub">
              改成：
              {STATUS_OPTIONS.map((st) => (
                <button key={st} className="chip" style={statusBadge(st)} disabled={busy} onClick={() => runBatch('status', { status: st })}>{STATUS_LABEL[st]}</button>
              ))}
              <span className="meta-batch-tip">（文件、文件夹都能改）</span>
            </div>
          )}
        </div>
      )}

      {treeError && <div className="notice-error">{treeError}</div>}

      {atTop && topicItems.length > 0 && (
        <>
          <div className="section-label" style={{ margin: '6px 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>选题 · {topicItems.length}</div>
          <div className="gallery-grid" style={{ marginBottom: 14 }}>
            {topicItems.map(([k, v]) => (
              <div key={k} className="card gcard meta-topic-mini">
                <div className="gcard-meta">
                  <div className="gcard-name" title={v.topic?.title}>{v.topic?.title || k.slice(3)}</div>
                  <div className="gcard-sub" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {v.status && <span style={statusBadge(v.status)}>{STATUS_LABEL[v.status]}</span>}
                    <span>{v.updatedAt}</span>
                  </div>
                  <p className="meta-topic-mini-desc">{v.topic?.stuck || '没写谁卡在哪'}</p>
                  <button className="btn btn-sm" onClick={async () => {
                    await setItemStatus(k, { status: 'draft' }); loadSt();
                    startMetaPrompt(`接着写选题「${v.topic?.title}」。\n谁卡在哪：${v.topic?.stuck || ''}\n为什么现在讲：${v.topic?.whyNow || ''}\n我有什么材料：${v.topic?.material || ''}\n我的判断：${v.topic?.judgment || ''}\n来源：${v.topic?.source || ''}\n\n先给大纲，确认后写正文，草稿存进内容库新项目。`);
                  }}>接着写</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 项目主题标签（进入项目根时展示） */}
      {atProjectRoot && projectMeta?.tags && projectMeta.tags.length > 0 && (
        <div className="gallery-filters" style={{ marginBottom: 4 }}>
          {projectMeta.tags.map((t) => <span key={t} style={badge}>#{t}</span>)}
        </div>
      )}

      {/* 面包屑返回 + 文件过滤（进入任意层后显示） */}
      {stack.length > 0 && (
        <div className="gallery-filters">
          <button className="btn btn-sm" onClick={() => goTo(stack.length - 1)}>
            <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><IconChevron size={13} /></span> 返回上级
          </button>
          {files.length > 0 && FILTERS.map((f) => (
            <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => { setFilter(f.key); setPicked(new Set()); setBatchMode(''); }}>{f.label}</button>
          ))}
        </div>
      )}

      {empty && !treeError ? (
        <div className="empty-state" style={{ height: 300 }}>
          <div className="empty-icon"><IconOutputs size={44} /></div>
          <p>{atTop ? '还没有内容。去「对话」写第一篇吧' : '这个文件夹是空的'}</p>
        </div>
      ) : hasSplit ? (
        <>
          {/* 成品区 */}
          {deliverableFiles.length > 0 && (
            <>
              <div className="section-label" style={{ margin: '6px 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                成品 · {deliverableFiles.length}
              </div>
              <div className="gallery-grid">{deliverableFiles.map(renderFile)}</div>
            </>
          )}
          {/* 素材 / 过程文件区 */}
          {(dirs.length > 0 || restFiles.length > 0) && (
            <>
              <div className="section-label" style={{ margin: '18px 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)' }}>
                素材 / 过程文件
              </div>
              <div className="gallery-grid">
                {dirs.map(renderDir)}
                {restFiles.map(renderFile)}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="gallery-grid">
          {dirs.map(renderDir)}
          {files.map(renderFile)}
        </div>
      )}

      {selected && (
        <div className="drawer-overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ minWidth: 0 }}>
                <div className="skill-detail-title" style={{ fontSize: 16 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{selected.path.split('/').slice(0, -1).join(' / ') || '内容库'}</div>
              </div>
              <button className="icon-btn" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="meta-item-st">
              <span>状态：</span>
              {STATUS_OPTIONS.map((st) => (
                <button key={st} className={`chip ${itemSt[selected.path]?.status === st ? 'active' : ''}`} style={itemSt[selected.path]?.status === st ? statusBadge(st) : undefined}
                  onClick={async () => {
                    const info = st === 'published' ? askPublishedInfo() : {};
                    if (info === null) return;
                    await setItemStatus(selected.path, { status: st, ...info }); loadSt();
                  }}>{STATUS_LABEL[st]}</button>
              ))}
              {itemSt[selected.path]?.status === 'published' && (
                <span className="meta-item-pub">{itemSt[selected.path].date}{itemSt[selected.path].link ? <> · <a href={itemSt[selected.path].link} target="_blank" rel="noreferrer">看原帖</a></> : null}</span>
              )}
            </div>
            {isWord(selected.name) && <div className="meta-final-note">当前定稿 · 你在 Word 里改过，AI 只读不改，建议另存</div>}
            {(() => { const [lab, pr] = ctxPrompt(selected, itemSt[selected.path]?.status); return (
              <div className="meta-ctx-row">
                {selected.type === 'file' && /\.(md|txt|docx)$/i.test(selected.name) && <button className="btn btn-sm" onClick={() => {
                  window.dispatchEvent(new CustomEvent('meta-create', { detail: { title: selected.name.replace(/\.[^.]+$/, ''), sourcePath: selected.path } }));
                  setSelected(null);
                }}>另存为创作</button>}
                <button className="btn btn-sm btn-primary" onClick={() => { startMetaPrompt(pr); setSelected(null); }}>{lab}</button>
                <button className="btn btn-sm" onClick={() => { startMetaPrompt(`接着写这篇。${ctxPrompt(selected)[1].split('\n')[0]}\n先告诉我它现在写到哪了，再问我下一步。`); setSelected(null); }}>接着写这篇</button>
              </div>); })()}
            {itemSt[selected.path]?.status === 'published' && (() => {
              const rv = itemSt[selected.path]?.review || {}; const mt = rv.metrics || {};
              const ds = daysSince(itemSt[selected.path]?.date);
              const KEYS = ['阅读', '点赞', '收藏', '评论', '涨粉'];
              return (
                <div className="meta-review">
                  <div className="meta-review-head">复盘{ds !== null ? ` · 发布第 ${ds} 天` : ''}</div>
                  <div className="meta-review-metrics">
                    {KEYS.map((k) => (
                      <label key={k}>{k}<input className="input" placeholder="未填写" defaultValue={mt[k] || ''}
                        onBlur={(e) => { const v = e.target.value.trim(); if (v !== (mt[k] || '')) void saveReview(selected.path, { metrics: { ...mt, [k]: v } }); }} /></label>
                    ))}
                  </div>
                  {([['responded', '读者响应了吗'], ['newQuestions', '评论里的新问题'], ['keepChange', '下篇保留、调整什么']] as [keyof ItemReview, string][]).map(([k, l]) => (
                    <label key={k} className="meta-review-q">{l}<textarea className="field" placeholder="未填写" defaultValue={(rv[k] as string) || ''}
                      onBlur={(e) => { const v = e.target.value.trim(); if (v !== ((rv[k] as string) || '')) void saveReview(selected.path, { [k]: v }); }} /></label>
                  ))}
                </div>);
            })()}
            <div className="drawer-body">{preview()}</div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm btn-danger" onClick={(e) => remove(selected, e)}><IconTrash size={13} /> 删除此文件</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
