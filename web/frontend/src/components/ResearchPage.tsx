import { useEffect, useRef, useState } from 'react';
import AccountImportPanel from './AccountImportPanel';
import { IconSearch } from './icons';

type Source = {
  id: string; url: string; title: string; platform: string; topic: string;
  content?: string; excerpt?: string; state: string; error: string; captured_at: number;
  method: string; cached?: boolean; author?: string; kind?: string; cover_url?: string;
  tags?: string[]; pinned?: number; save_status?: string; summary?: string;
  extra?: { image_urls?: string[]; local_images?: string[]; comments_text?: string; ocr_text?: string; likes?: number; collects?: number; comments?: number; tags?: string[]; pending_tasks?: string[]; video_url?: string };
};
type SourcePage = { items: Source[]; total: number; kindCounts: Record<string, number>; limit: number; offset: number; engine: string };
type Status = { saved_count: number; blocked: { platform: string; reason: string }[]; platforms: string[] };
type IndexInfo = { total: number; fts_indexed: number; trash: number; pending_transcribe: number; ocr_available: boolean; enrich_pending?: number; enrich_failed?: number; enrich_cooldown?: number; transcribe_pending?: number; transcribe_failed?: number };
type TrashItem = { id: string; title: string; platform: string; kind: string; tags: string; deleted_at: number; captured_at: number };
type Workflow = { id: string; label: string; stage: string; task: string };
type TagCloud = { tags: { name: string; count: number }[]; total_tags: number; sites: { name: string; count: number; platform?: string; kind?: string }[] };

const MAX_PICK = 12;
const PAGE = 60;
// 批量删除/复原对齐后端 BatchIds 的 200 条上限（超了后端会 422，所以前端先截断并说清楚）
const BATCH_MAX = 200;
const WORKFLOWS: Workflow[] = [
  { id: 'rewrite', label: '仿写笔记', stage: 'produce', task: '参考选中素材的题材、结构和语气，写一条可直接发的新笔记。不要复述原文句子，也不要编造原文没有的事实、数据和出处。' },
  { id: 'script', label: '改成可发文案', stage: 'produce', task: '把选中素材改写成可直接发布的文案。先给小红书版，再各给一段公众号开头和短视频口播。' },
  { id: 'topics', label: '拆选题', stage: 'plan', task: '从选中素材里拆出 5 个可做的新选题，每个写一句为什么值得做、适合哪个平台。' },
  { id: 'platforms', label: '一稿多平台', stage: 'produce', task: '同一条内容改成小红书、公众号、知乎和短视频四个版本，并说明每版改了什么。' },
  { id: 'comments', label: '评论里找需求', stage: 'plan', task: '只根据素材里已有的评论和互动数据，归纳真实需求、分歧和可以做成内容的问题。没有评论就明说，不要编用户画像。' },
];

const KIND_LABELS: Record<string, string> = {
  'redbook-note': '小红书笔记', 'zhihu-answer': '知乎回答', 'zhihu-article': '知乎文章',
  'document-source': '文档', 'webpage': '网页', 'image': '图片', 'video': '视频',
  'comments': '评论', 'media': '音视频',
};
function kindLabel(kind: string) {
  return KIND_LABELS[kind] || '素材';
}

async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const verb = method ?? (body === undefined ? 'GET' : 'POST');
  const init: RequestInit = verb === 'GET' ? {} : { method: verb, headers: { 'Content-Type': 'application/json' } };
  if (verb !== 'GET' && body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch('/api/research' + path, init);
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value.detail === 'string' ? value.detail : '请求失败');
  return value;
}
const SEARCHES = [
  { label: '小红书', url: 'https://www.xiaohongshu.com/search_result?keyword=' },
  { label: '哔哩哔哩', url: 'https://search.bilibili.com/all?keyword=' },
  { label: '知乎', url: 'https://www.zhihu.com/search?type=content&q=' },
  { label: '抖音', url: 'https://www.douyin.com/search/' },
  { label: 'GitHub 社区', url: 'https://github.com/search?type=issues&q=' },
];

function coverOf(s: Source) {
  return s.extra?.local_images?.[0] ? '/api/media/' + s.extra.local_images[0] : s.cover_url || '';
}
function statsOf(s: Source) {
  const extra = s.extra || {};
  return [extra.likes != null ? `赞 ${extra.likes}` : '', extra.collects != null ? `藏 ${extra.collects}` : '', extra.comments != null ? `评 ${extra.comments}` : ''].filter(Boolean).join(' · ');
}
function isFresh(s: Source) {
  return Date.now() / 1000 - Number(s.captured_at || 0) < 180;
}
function splitNote(content?: string, ocr?: string) {
  const raw = content || '';
  const parts = raw.split('[图片文字]');
  const caption = parts[0].trim();
  const fromContent = (parts[1] || '').trim();
  const ocrText = fromContent || (ocr || '').trim();
  return { caption, ocrText };
}
function OcrBlocks({ text }: { text: string }) {
  const chunks: { title: string; body: string }[] = [];
  let title = '';
  let body: string[] = [];
  const flush = () => {
    const joined = body.join('\n').trim();
    if (title || joined) chunks.push({ title, body: joined });
    title = '';
    body = [];
  };
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      flush();
      title = line.slice(3).trim();
    } else body.push(line);
  }
  flush();
  if (chunks.length === 1 && !chunks[0].title) return <pre className="research-ocr-pre">{chunks[0].body}</pre>;
  return <div className="research-ocr">{chunks.map((chunk, index) => (
    <section key={index}>
      {chunk.title ? <h4>{chunk.title}</h4> : null}
      {chunk.body ? <p>{chunk.body}</p> : null}
    </section>
  ))}</div>;
}
function receiptText(s: Source) {
  if (s.save_status === 'updated') return '已更新同名素材（内容变了，未新增重复）。';
  if (s.save_status === 'unchanged') return '库里已有完全相同的素材，没有重复保存。';
  return '素材已保存。可以直接仿写，或改成可发文案。';
}

export default function ResearchPage({ onCreate, persona = '', onProfileActivated }: {
  onCreate: (prompt: string, stage?: string) => void; persona?: string; onProfileActivated?: (name: string) => void;
}) {
  const [sources, setSources] = useState<Source[]>([]);
  const [total, setTotal] = useState(0);
  const [kindCounts, setKindCounts] = useState<Record<string, number>>({});

  const [indexInfo, setIndexInfo] = useState<IndexInfo | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'capture' | 'import'>('capture');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkPick, setBulkPick] = useState<string[]>([]);
  const [trashPick, setTrashPick] = useState<string[]>([]);
  const [preview, setPreview] = useState<Source | null>(null);
  const [tagDraft, setTagDraft] = useState('');
  const [editingBody, setEditingBody] = useState<string | null>(null);
  const [pairing, setPairing] = useState('');
  const [beavExtId, setBeavExtId] = useState('');
  const [view, setView] = useState<'library' | 'capture' | 'trash'>('library');
  function changeView(next: 'library' | 'capture' | 'trash') {
    setBulkPick([]);
    setTrashPick([]);
    setView(next);
  }
  const [kindFilter, setKindFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [tagCloud, setTagCloud] = useState<TagCloud | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [exportNote, setExportNote] = useState('');

  const knownIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const filtersRef = useRef({ query, kindFilter, tagFilter, platformFilter });
  filtersRef.current = { query, kindFilter, tagFilter, platformFilter };
  const loadedRef = useRef(0);
  loadedRef.current = sources.length;

  async function refresh(search = query, kind = kindFilter, offset = 0, append = false, limit = PAGE, tag = tagFilter, platform = platformFilter) {
    const params = new URLSearchParams({ query: search, limit: String(limit), offset: String(offset), sort: 'recent' });
    if (kind) params.set('kind', kind);
    if (tag) params.set('tag', tag);
    if (platform) params.set('platform', platform);
    const [page, current, index, cloud] = await Promise.all([
      api<SourcePage>('/sources?' + params.toString()), api<Status>('/status'), api<IndexInfo>('/index-status'),
      api<TagCloud>('/tags').catch(() => null),
    ]);
    if (cloud) setTagCloud(cloud);
    if (firstLoad.current) {
      knownIds.current = new Set(page.items.map(s => s.id));
      firstLoad.current = false;
    } else {
      const incoming = page.items.filter(s => s.state === 'saved' && !knownIds.current.has(s.id));
      incoming.forEach(s => knownIds.current.add(s.id));
      if (incoming.length) {
        setSelected(prev => [...incoming.map(s => s.id), ...prev.filter(id => !incoming.some(s => s.id === id))].slice(0, MAX_PICK));
        setMessage(incoming.length === 1 ? `「${incoming[0].title}」已保存。勾选后点仿写或改写成稿。` : `刚保存 ${incoming.length} 条。勾选后可以二创。`);
        changeView('library');
      }
    }
    setSources(prev => append ? [...prev, ...page.items] : page.items);
    setTotal(page.total); setKindCounts(page.kindCounts);
    setStatus(current); setIndexInfo(index);
  }
  async function refreshTrash() {
    setTrash((await api<{ items: TrashItem[] }>('/trash')).items);
  }
  // 6 秒轮询按"当前已加载多少条"整段重取：原来固定取 60 条，用户点过「再加载」翻出来的
  // 后面几页会在下一次轮询时被收回首屏，看起来像列表自己跳回顶部。上限对齐后端 500 条。
  async function pollLibrary() {
    const { query: currentQuery, kindFilter: currentKind, tagFilter: currentTag, platformFilter: currentPlatform } = filtersRef.current;
    await refresh(currentQuery, currentKind, 0, false, Math.min(500, Math.max(PAGE, loadedRef.current)), currentTag, currentPlatform);
  }
  useEffect(() => { refresh('').catch(e => setError(e.message)); }, []);
  useEffect(() => {
    if (view !== 'library') return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      pollLibrary().catch(() => {});
    }, 6000);
    return () => window.clearInterval(timer);
  }, [view, query, kindFilter, tagFilter, platformFilter]);
  // 顶栏搜索：输入即搜。Beav 用的是 500ms 防抖（KNOWLEDGE_SEARCH_DEBOUNCE_MS），照抄这个节奏
  const queryInit = useRef(true);
  useEffect(() => {
    if (queryInit.current) { queryInit.current = false; return; }
    const timer = window.setTimeout(() => {
      refresh(query, kindFilter, 0, false, PAGE, tagFilter, platformFilter).catch(() => {});
    }, 500);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Cmd/Ctrl+F 与 Cmd/Ctrl+K 打开搜索框，Esc 清空并收起标签抽屉（对齐 Beav 键盘入口）
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 'k' || key === 'f')) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (e.key === 'Escape') {
        setTagsOpen(false);
        const el = searchRef.current;
        if (el && document.activeElement === el && el.value) {
          setQuery('');
          refresh('', kindFilter, 0, false, PAGE, tagFilter).catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kindFilter, tagFilter]);

  useEffect(() => { if (view === 'trash') refreshTrash().catch(() => {}); }, [view]);

  async function collect() {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api<Source>(mode === 'capture' ? '/capture' : '/import', mode === 'capture' ? { url, topic } : { url, topic, title, content });
      if (result.state === 'saved') {
        if (result.error) setError(result.error);
        else setMessage(result.cached ? '已使用 24 小时内的采集结果，未重复访问来源。' : receiptText(result));
        setPreview(result);
        setSelected(prev => [result.id, ...prev.filter(id => id !== result.id)].slice(0, MAX_PICK));
        changeView('library');
      } else setError(result.error || '该页面暂未取得可用内容。');
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  function toggleSelect(id: string, saved: boolean) {
    if (!saved) return;
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_PICK) {
        setError(`一次最多带 ${MAX_PICK} 条进创作，先取消几条。`);
        return prev;
      }
      setError('');
      return [...prev, id];
    });
  }

  async function requestMaterialDraft(body: { ids?: string[]; all?: boolean }, task = '', stage?: string) {
    setBusy(true); setError('');
    try {
      const draft = await api<{ context?: string; stage?: string; error?: string }>('/sources/draft', {
        persona,
        all: !!body.all,
        ...(body.ids ? { ids: body.ids } : {}),
      });
      if (!draft.context) throw new Error(draft.error || '这次没写完。');
      onCreate(task ? `${draft.context}\n\n${task}` : draft.context, stage || draft.stage || 'produce');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  function draftFromSelection(workflow: Workflow = WORKFLOWS[0], ids = selected) {
    return requestMaterialDraft({ ids, all: false }, workflow.task, workflow.stage);
  }

  function draftFromAllMaterials() {
    return requestMaterialDraft({ all: true }, '', 'produce');
  }

  async function openPreview(id: string) {
    try {
      const item = await api<Source>('/sources/' + id);
      setEditingBody(null); setTagDraft('');
      setPreview(item);
    } catch (e) { setError((e as Error).message); }
  }
  async function afterGovernance(id: string, note: string) {
    setMessage(note);
    try {
      setPreview(await api<Source>('/sources/' + id));
      await refresh();
    } catch (e) { setError((e as Error).message); }
  }
  async function togglePin(s: Source) {
    setBusy(true);
    try { await api('/sources/' + s.id, { pinned: !s.pinned }, 'PATCH'); await afterGovernance(s.id, s.pinned ? '已取消置顶。' : '已置顶，会排在素材库最前。'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function trashSource(s: Source) {
    setBusy(true);
    try {
      await api('/sources/' + s.id, undefined, 'DELETE');
      setPreview(null);
      setSelected(prev => prev.filter(id => id !== s.id));
      setBulkPick(prev => prev.filter(id => id !== s.id));
      await refresh(); setMessage('已移入回收站，30 天内可恢复。');
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function addTag() {
    if (!preview || !tagDraft.trim()) return;
    setBusy(true);
    try { await api(`/sources/${preview.id}/tags`, { tag: tagDraft.trim() }); setTagDraft(''); await afterGovernance(preview.id, '标签已添加。'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function dropTag(tag: string) {
    if (!preview) return;
    setBusy(true);
    try { await api(`/sources/${preview.id}/tags/${encodeURIComponent(tag)}`, undefined, 'DELETE'); await afterGovernance(preview.id, '标签已移除。'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function saveBody() {
    if (!preview || editingBody === null) return;
    setBusy(true);
    try { await api('/sources/' + preview.id, { content: editingBody }, 'PATCH'); await afterGovernance(preview.id, '正文已更新，检索索引同步刷新。'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  function toggleBulk(id: string) {
    setBulkPick(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= BATCH_MAX) { setMessage(`一次最多处理 ${BATCH_MAX} 条，先取消几条再勾。`); return prev; }
      return [...prev, id];
    });
  }

  function toggleTrash(id: string) {
    setTrashPick(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // 筛选条件一变就重新勾：批量删除是不可逆动作的前置步骤，不该对着看不见的条目生效
  useEffect(() => { setBulkPick([]); setTrashPick([]); }, [query, kindFilter, tagFilter, platformFilter]);

  // 回收站的勾选按「现在还在回收站里」过滤：清超 30 天或被别人恢复过的条目不能留在计数里
  const trashSelected = trashPick.filter(id => trash.some(t => t.id === id));

  async function trashMany() {
    const picked = bulkPick.filter(Boolean);
    if (!picked.length) return;
    const capped = picked.slice(0, BATCH_MAX);
    const note = picked.length > capped.length ? `（一次最多 ${BATCH_MAX} 条，本次只处理前 ${capped.length} 条）` : '';
    if (!window.confirm(`确认把选中的 ${capped.length} 条素材移入回收站？30 天内可在回收站恢复。${note}`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await api<{ deleted: number }>('/sources/batch-delete', { ids: capped });
      setBulkPick([]);
      // 删掉的条目不能留在「选入二创」里，否则点仿写会去取一条已经不存在的素材
      setSelected(prev => prev.filter(id => !capped.includes(id)));
      setPreview(prev => (prev && capped.includes(prev.id) ? null : prev));
      await pollLibrary(); await refreshTrash();
      const missed = capped.length - r.deleted;
      setMessage(`已把 ${r.deleted} 条移入回收站，30 天内可恢复。${note}${missed > 0 ? `另有 ${missed} 条已经不在素材库里，跳过。` : ''}`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function restoreMany() {
    const picked = trashSelected;
    if (!picked.length) return;
    const capped = picked.slice(0, BATCH_MAX);
    if (!window.confirm(`把选中的 ${capped.length} 条恢复回素材库？`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await api<{ restored: number }>('/trash/restore', { ids: capped });
      setTrashPick([]);
      await refreshTrash(); await pollLibrary();
      const missed = capped.length - r.restored;
      setMessage(`已恢复 ${r.restored} 条回素材库。${missed > 0 ? `${missed} 条已经不在回收站里，跳过。` : ''}`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const kindChips = Object.entries(kindCounts).sort((a, b) => b[1] - a[1]);
  return <div className="research-page">
    <div className="model-heading"><div><h2>知识库</h2><p>这里是保存下来的笔记和文章。勾选几条，就可以带进对话里改写。</p></div><span className="research-engine">已保存 {status?.saved_count ?? 0} 条</span></div>
    <div className="research-tabs"><button className={view === 'library' ? 'selected' : ''} onClick={() => changeView('library')}>素材库</button><button className={view === 'capture' ? 'selected' : ''} onClick={() => changeView('capture')}>采集</button><button className={view === 'trash' ? 'selected' : ''} onClick={() => changeView('trash')}>回收站{indexInfo?.trash ? ` (${indexInfo.trash})` : ''}</button></div>
    {view === 'capture' && <>
    <section className="research-collect">
      <div className="research-tabs"><button className={mode === 'capture' ? 'selected' : ''} onClick={() => setMode('capture')}>采集网页</button><button className={mode === 'import' ? 'selected' : ''} onClick={() => setMode('import')}>导入摘录 / 评论</button></div>
      <label>调研主题<input placeholder="例如：知识类账号的选题、封面与评论区需求" value={topic} maxLength={100} onChange={e => setTopic(e.target.value)} /></label>
      <div className="research-searches"><span>找线索</span>{SEARCHES.map(s => <a key={s.label} href={s.url + encodeURIComponent(topic || '自媒体工作台')} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</div>
      <label>来源链接<input value={url} onChange={e => setUrl(e.target.value)} placeholder={mode === 'capture' ? '粘贴要深读的公开网页 HTTPS 链接' : '保留原始链接，或留空标记为用户导入'} /></label>
      {mode === 'import' && <><label>素材标题<input value={title} maxLength={300} onChange={e => setTitle(e.target.value)} placeholder="给摘录起一个方便检索的名字" /></label><label>摘录内容<textarea rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="粘贴你有权使用的文章摘录、评论记录或已有调研内容" /></label></>}
      <div className="research-submit"><p>同一个平台至少隔一分钟，一小时最多采 12 次。<br />遇到要登录或验证时，先停下来处理，再继续。</p><button className="btn btn-primary" disabled={busy || (mode === 'capture' ? !url : !title.trim() || !content.trim())} onClick={collect}>{busy ? '处理中…' : mode === 'capture' ? '采集这个网页' : '保存素材'}</button></div>
    </section>
    {error && <div className="model-alert error" role="alert">{error}</div>}{message && <div className="model-alert" role="status">{message}</div>}
    <section className="research-collect"><h3>公开订阅</h3><p>若本机已开订阅库，可把最近文章摘录带进素材库并保留原文链接。未配置时会明确提示，不影响导入摘录。</p><div className="model-actions"><button className="btn" disabled={busy} onClick={async () => {setBusy(true);setError('');try{const result=await api<{imported:number;skipped:number}>('/feeds/sync',{});setMessage(`已同步 ${result.imported} 条订阅摘录，跳过 ${result.skipped} 条已有或无正文内容。`);await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>同步最近订阅</button></div></section>
    {!!status?.blocked.length && <section className="research-blocked"><b>等待你处理的来源</b>{status.blocked.map(b => <div key={b.platform}><span>{b.platform}：{b.reason}</span><button className="btn" disabled={busy} onClick={async () => { setBusy(true); try { await api('/restore/' + encodeURIComponent(b.platform), {}); await refresh(); setMessage(`已恢复 ${b.platform}，仍遵守采集频率限制。`); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>我已完成登录或解除限制，恢复</button></div>)}</section>}
    <details className="research-collect"><summary>用浏览器插件保存笔记</summary><p>商店里的 Beav 插件只会存进 Beav。要存进这里，请用已经装好的采集插件。编号在浏览器的「扩展程序」页面，是一串字母和数字。填好后刷新插件，再去笔记页点保存。</p><div className="model-actions"><input placeholder="插件编号" value={beavExtId} onChange={e => setBeavExtId(e.target.value)} style={{ minWidth: 280 }} /><button className="btn" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await api('/beav-host', { extensionId: beavExtId.trim() }); setMessage('已记下。请到浏览器里刷新这个插件，再去保存笔记。'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>保存编号</button></div></details>
    <details className="research-collect"><summary>简易采集扩展（仅当前页/选区）</summary><p>功能更少。下载并解压，加载已解压扩展，生成配对码后即可保存当前页或选中文字。</p><div className="model-actions"><a className="btn" href="/api/research/clipper-download" download>下载简易扩展</a><button className="btn" onClick={async () => { try { const value = await api<{ token: string }>('/clipper-pair', {}); setPairing(value.token); } catch (e) { setError((e as Error).message); } }}>生成配对码</button>{pairing && <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(pairing); setMessage('配对码已复制，请粘贴到采集扩展。'); } catch { setError('复制失败，请在下方手动复制配对码。'); } }}>复制配对码</button>}</div>{pairing && <label>配对码<input type="password" readOnly value={pairing} aria-label="配对码" /></label>}</details>
    </>}
    {error && view !== 'capture' && <div className="model-alert error" role="alert">{error}</div>}
    {message && view !== 'capture' && <div className="model-alert" role="status">{message}</div>}
    {view === 'trash' && <section className="research-library">
      <div className="research-library-head"><h3>回收站</h3><div className="model-actions"><button className="btn" disabled={busy} onClick={async () => { setBusy(true); try { const r = await api<{ purged: number }>('/trash/purge', {}); await refreshTrash(); await refresh(); setMessage(r.purged ? `已彻底清理 ${r.purged} 条超期素材。` : '没有超过 30 天的素材。'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>清理超 30 天</button><button className="btn" disabled={busy || !trash.length} onClick={() => setTrashPick(trash.map(t => t.id).slice(0, BATCH_MAX))}>全选</button><button className="btn" disabled={busy || !trashSelected.length} onClick={() => setTrashPick([])}>清空选择</button><button className="btn btn-primary" disabled={busy || !trashSelected.length} onClick={() => restoreMany()}>恢复选中 ({trashSelected.length})</button></div></div>
      <p className="research-hint">删除的素材在这里保留 30 天，可恢复；超期后正文与本地图片会被彻底清理。</p>
      {!trash.length && <div className="research-empty">回收站是空的。</div>}
      <div className="research-trash-list">{trash.map(t => <div key={t.id} className={'research-trash-row' + (trashPick.includes(t.id) ? ' is-bulk-picked' : '')}><label className="research-bulk-pick" title="勾选后可批量恢复"><input type="checkbox" aria-label={'选择 ' + t.title} checked={trashPick.includes(t.id)} onChange={() => toggleTrash(t.id)} /></label><span><b>{t.title}</b><small>{[t.platform, t.kind].filter(Boolean).join(' · ')} · 删除于 {new Date(t.deleted_at * 1000).toLocaleDateString('zh-CN')}</small></span><button className="btn" disabled={busy} onClick={async () => { setBusy(true); try { await api('/trash/restore', { ids: [t.id] }); await refreshTrash(); await refresh(); setMessage('已恢复回素材库。'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>恢复</button></div>)}</div>
    </section>}
    {view === 'library' && <section className="research-library">
      <div className="research-library-head"><h3>素材库</h3>
        <div className="research-search">
          <IconSearch size={15} />
          <input ref={searchRef} placeholder="搜索知识库..." value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button className="research-search-clear" title="清空" onClick={() => { setQuery(''); refresh('', kindFilter, 0, false, PAGE, tagFilter).catch(() => {}); }}>×</button>}
          <kbd>Ctrl K</kbd>
        </div>
      </div>
      <div className="research-index-status">
        {(indexInfo?.enrich_pending ?? 0) > 0 && <span>正在给 {indexInfo?.enrich_pending} 条写摘要</span>}
        {(indexInfo?.enrich_failed ?? 0) > 0 && <span>{indexInfo?.enrich_failed} 条摘要没写上</span>}
        {(indexInfo?.transcribe_pending ?? 0) > 0 && <span>{indexInfo?.transcribe_pending} 条视频还在转成文字</span>}
        {(indexInfo?.transcribe_failed ?? 0) > 0 && <span>{indexInfo?.transcribe_failed} 条视频没转成文字</span>}
        <button className="btn" disabled={busy} onClick={async () => { setBusy(true); try { const r = await api<{ indexed: number; skipped?: number }>('/reindex', {}); await refresh(); setMessage(r.skipped ? `已让 ${r.indexed} 条能被搜到，${r.skipped} 条暂时跳过。` : `这 ${r.indexed} 条现在都能被搜到了。`); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>让搜索认全</button>
        <button className="btn" disabled={busy || (indexInfo?.enrich_cooldown ?? 0) > 0} onClick={async () => { setBusy(true); try { const r = await api<{ queued: number; workerStarted: boolean }>('/enrich', {}); await refresh(); setMessage(r.workerStarted ? `开始给 ${r.queued} 条写摘要。可以先去做别的。` : (r.queued ? `已记下 ${r.queued} 条，等上一批写完就接着做。` : '现在没有需要写摘要的素材。')); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>{(indexInfo?.enrich_cooldown ?? 0) > 0 ? '摘要稍后再写' : '写摘要'}</button>
        <button className="btn" disabled={busy} onClick={async () => { setBusy(true); try { const r = await api<{ processed: number; with_text: number }>('/refresh-ocr', {}); await refresh(); setMessage(!indexInfo?.ocr_available ? '这台电脑还不能识别图片里的字。' : r.processed ? `看过 ${r.processed} 条图片，其中 ${r.with_text} 条写出了图上的字。` : '没有还没看过的图片。'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>识别图片里的字</button>
        <button className="btn" disabled={busy || !sources.length} onClick={async () => {
          setBusy(true); setExportNote('');
          const all = selected.length ? selected : sources.map(s => s.id);
          const ids = all.slice(0, 500);
          const capped = all.length > ids.length ? `（一次最多 500 条，本次只导了前 ${ids.length} 条）` : '';
          try {
            const r = await api<{ file?: string; folder?: string; count: number; items?: { folder: string }[] }>('/export', { ids, format: 'csv' });
            setExportNote(r.file ? `/api/media/${r.file}` : ''); setMessage(`已导出 ${r.count} 条为 CSV${selected.length ? '（勾选的）' : `（未勾选＝当前已加载的 ${all.length} 条）`}${capped}。`);
          } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
        }}>导出表格</button>
        <button className="btn" disabled={busy || !sources.length} onClick={async () => {
          setBusy(true); setExportNote('');
          const all = selected.length ? selected : sources.map(s => s.id);
          const ids = all.slice(0, 500);
          const capped = all.length > ids.length ? `（一次最多 500 条，本次只导了前 ${ids.length} 条）` : '';
          try {
            const r = await api<{ items?: { folder: string }[] }>('/export', { ids, format: 'folder' });
            setMessage(`已导出 ${r.items?.length ?? 0} 条${selected.length ? '（勾选的）' : `（没勾选，就是当前这 ${all.length} 条）`}${capped}。可以在笔记软件里打开这些文件夹。`);
          } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
        }}>导出笔记文件夹</button>
        <button className="btn" disabled={busy} onClick={async () => {
          setBusy(true);
          try {
            const r = await api<{ total: number; written: number; failed: number }>('/knowledge/sync', {});
            await refresh();
            setMessage(`已把 ${r.written}/${r.total} 条素材同步成 knowledge/ 文件夹${r.failed ? `，${r.failed} 条写盘失败` : ''}。`);
          } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
        }}>同步到磁盘</button>
        {exportNote && <a href={exportNote} download>下载导出文件</a>}
      </div>
      <div className="research-kinds"><button className={kindFilter === '' ? 'selected' : ''} onClick={() => { setKindFilter(''); refresh(query, '', 0, false, PAGE, tagFilter).catch(() => {}); }}>全部 {total}</button>{kindChips.map(([k, n]) => <button key={k} className={kindFilter === k ? 'selected' : ''} onClick={() => { setKindFilter(k); refresh(query, k, 0, false, PAGE, tagFilter).catch(() => {}); }}>{kindLabel(k)} {n}</button>)}</div>
      {platformFilter && (
        <div className="research-tagbar">
          <span className="research-tagbar-label">来源</span>
          <button className="research-tag-chip active"
            onClick={() => { setPlatformFilter(''); refresh(query, kindFilter, 0, false, PAGE, tagFilter, '').catch(() => {}); }}>
            {platformFilter} <b>×</b>
          </button>
        </div>
      )}
      {!!(tagCloud?.total_tags) && (
        <div className="research-tagbar">
          <span className="research-tagbar-label">标签</span>
          {(tagsOpen ? tagCloud!.tags.slice(0, 40) : tagCloud!.tags.slice(0, 8)).map(t => (
            <button key={t.name} className={`research-tag-chip ${tagFilter === t.name ? 'active' : ''}`}
              onClick={() => { const next = tagFilter === t.name ? '' : t.name; setTagFilter(next); refresh(query, kindFilter, 0, false, PAGE, next).catch(() => {}); }}>
              #{t.name} <b>{t.count}</b>
            </button>
          ))}
          {tagCloud!.total_tags > 8 && (
            <button className="research-tag-all" onClick={() => setTagsOpen(v => !v)}>
              全部标签 ({tagCloud!.total_tags}) {tagsOpen ? '收起' : '展开'}
            </button>
          )}
          {tagFilter && <button className="research-tag-clear" onClick={() => { setTagFilter(''); refresh(query, kindFilter, 0, false, PAGE, '').catch(() => {}); }}>清除筛选</button>}
        </div>
      )}
      {tagsOpen && !!tagCloud && (
        <div className="research-tag-drawer">
          <div className="research-tag-drawer-head">
            <div>
              <div className="research-tag-drawer-title">全部标签</div>
              <div className="research-tag-drawer-sub">共 {tagCloud.total_tags} 个标签，点击即可筛选内容</div>
            </div>
            <button className="btn" onClick={() => setTagsOpen(false)}>收起标签抽屉</button>
          </div>
          <div className="research-tag-drawer-sec"><span>按标签</span>
            <div className="research-tag-drawer-cloud">
              {tagCloud.tags.map(t => (
                <button key={t.name} className={tagFilter === t.name ? 'active' : ''}
                  onClick={() => { const next = tagFilter === t.name ? '' : t.name; setTagFilter(next); refresh(query, kindFilter, 0, false, PAGE, next).catch(() => {}); }}>
                  #{t.name} <b>{t.count}</b>
                </button>
              ))}
              {!tagCloud.tags.length && <span className="research-hint">还没有标签。给素材打标后会自动出现。</span>}
            </div>
          </div>
          <div className="research-tag-drawer-sec"><span>按来源</span>
            <div className="research-tag-drawer-cloud">
              {tagCloud.sites.map(s => (
                <button key={s.name} disabled={!s.platform && !s.kind}
                  title={s.platform || s.kind ? `按来源筛选：${s.name}` : `${s.name} 没有可筛的来源字段`}
                  onClick={() => { const p = s.platform || ''; const k = p ? '' : (s.kind || ''); if (!p && !k) return; setPlatformFilter(p); setKindFilter(k); setTagFilter(''); refresh(query, k, 0, false, PAGE, '', p).catch(() => {}); }}>
                  {s.name} <b>{s.count}</b>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="research-bulkbar">
        <span>{bulkPick.length ? `已勾选 ${bulkPick.length} 条待删除（与上面的「选入二创」互不影响）` : '批量删除：勾卡片左上角方框，或'}</span>
        <button className="btn" disabled={busy || !sources.some(s => s.state === 'saved')} onClick={() => { const all = sources.filter(s => s.state === 'saved').map(s => s.id); setBulkPick(all.slice(0, BATCH_MAX)); if (all.length > BATCH_MAX) setMessage(`已选中前 ${BATCH_MAX} 条（一次最多 ${BATCH_MAX} 条）。`); }}>全选</button>
        {!!bulkPick.length && <button className="btn" disabled={busy} onClick={() => setBulkPick([])}>清空选择</button>}
        {!!bulkPick.length && <button className="btn btn-danger" disabled={busy} onClick={() => trashMany()}>移入回收站（{bulkPick.length}）</button>}
      </div>
      <div className="research-workflows">
        <span>{selected.length ? `已选 ${selected.length} 条` : '还没勾选'}</span>
        <button className="btn btn-primary" disabled={busy} onClick={() => { void draftFromSelection(); }}>用勾选的写</button>
        <button className="btn" disabled={busy} onClick={() => { void draftFromAllMaterials(); }}>用全部素材写</button>
        {WORKFLOWS.slice(1).map(wf => (
          <button key={wf.id} className="btn" disabled={busy || !selected.length} onClick={() => { void draftFromSelection(wf); }}>{wf.label}</button>
        ))}
      </div>
      <AccountImportPanel onActivated={onProfileActivated} />
      {!sources.length && <div className="research-empty">还没有素材。用小红书页里的「保存笔记」，或到「采集」保存网页。</div>}
      <div className="research-sources">{sources.map(s => {
        const cover = coverOf(s);
        const stats = statsOf(s);
        const picked = selected.includes(s.id);
        const bulk = bulkPick.includes(s.id);
        return <article key={s.id} className={[picked ? 'is-picked' : '', bulk ? 'is-bulk-picked' : '', isFresh(s) ? 'is-fresh' : '', s.pinned ? 'is-pinned' : ''].filter(Boolean).join(' ')}>
          {cover ? <button className="research-cover" onClick={() => openPreview(s.id)}><img src={cover} alt="" /></button> : null}
          <div className="research-source-top">
            <label className="research-bulk-pick" title="勾选后可批量移入回收站">
              <input type="checkbox" aria-label={'批量选择 ' + s.title} checked={bulk} onChange={() => toggleBulk(s.id)} />
            </label>
            <label className="research-pick">
              <input type="checkbox" aria-label={'选择 ' + s.title} checked={picked} disabled={s.state !== 'saved'} onChange={() => toggleSelect(s.id, s.state === 'saved')} />
              <span>选入二创</span>
            </label>
            <span>{s.platform}{s.kind ? ` · ${kindLabel(s.kind)}` : ''}</span>
            {isFresh(s) ? <small className="fresh">刚保存</small> : <small className={s.state === 'saved' ? 'saved' : 'blocked'}>{s.state === 'saved' ? (s.pinned ? '置顶' : '已保存') : s.state === 'blocked' ? '需登录 / 验证' : '采集失败'}</small>}
          </div>
          <h4><button onClick={() => openPreview(s.id)}>{s.title}</button></h4>
          <p>{s.author ? `${s.author} · ` : ''}{stats ? `${stats} · ` : ''}{s.error || s.excerpt}</p>
          {!!(s.tags || []).length && <div className="research-tags">{s.tags!.slice(0, 5).map(t => <button key={t} onClick={() => { const q = t; setQuery(q); refresh(q, kindFilter).catch(() => {}); }}>#{t}</button>)}</div>}
          <div className="research-source-bottom"><span>{s.topic || new Date(s.captured_at * 1000).toLocaleDateString('zh-CN')}</span>{s.url && <a href={s.url} target="_blank" rel="noreferrer">原文 ↗</a>}</div>
        </article>;
      })}</div>
      {sources.length < total && <div className="research-more"><button className="btn" disabled={busy} onClick={() => refresh(query, kindFilter, sources.length, true)}>再加载 {Math.min(PAGE, total - sources.length)} 条（共 {total}）</button></div>}
    </section>}
    {preview && <div className="overlay"><div className="modal research-preview">{(() => {
      const note = splitNote(preview.content, preview.extra?.ocr_text);
      const images = preview.extra?.local_images?.length ? preview.extra.local_images.map(p => '/api/media/' + p) : preview.extra?.image_urls || [];
      return <>
      <div className="research-preview-head">
        <div><h3>{preview.title}</h3><button className="btn" onClick={() => setPreview(null)}>返回素材库</button></div>
        <p>{[preview.author, preview.kind ? kindLabel(preview.kind) : '', new Date(preview.captured_at * 1000).toLocaleString('zh-CN'), statsOf(preview)].filter(Boolean).join(' · ')}</p>
        {preview.url && <a href={preview.url} target="_blank" rel="noreferrer">原始来源 ↗</a>}
        <div className="model-actions">
          <button className="btn btn-primary" disabled={busy} onClick={() => { const id = preview.id; setSelected([id]); setPreview(null); void draftFromSelection(WORKFLOWS[0], [id]); }}>仿写这条</button>
          {WORKFLOWS.slice(1, 4).map(wf => <button key={wf.id} className="btn" disabled={busy} onClick={() => { const id = preview.id; setSelected([id]); setPreview(null); void draftFromSelection(wf, [id]); }}>{wf.label}</button>)}
        </div>
      </div>
      <div className="research-manage">
        <div className="research-tags">{(preview.tags || []).map(t => <span key={t}>#{t}<button aria-label={'移除标签 ' + t} onClick={() => dropTag(t)}>×</button></span>)}
          <input placeholder="加标签" value={tagDraft} maxLength={30} onChange={e => setTagDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
          <button className="btn" disabled={busy || !tagDraft.trim()} onClick={addTag}>加</button>
        </div>
        <div className="model-actions">
          <button className="btn" disabled={busy} onClick={() => togglePin(preview)}>{preview.pinned ? '取消置顶' : '置顶'}</button>
          <button className="btn" disabled={busy} onClick={() => setEditingBody(editingBody === null ? (preview.content || '') : null)}>{editingBody === null ? '编辑正文' : '取消编辑'}</button>
          {editingBody !== null && <button className="btn btn-primary" disabled={busy} onClick={saveBody}>保存正文</button>}
          {!!preview.extra?.video_url && <button className="btn" disabled={busy} onClick={async () => { setBusy(true); try { const r = await api<{ queued: boolean; workerStarted: boolean }>('/sources/' + preview.id + '/transcribe', {}); setMessage(r.workerStarted ? '转写任务已排队，后台先拉字幕、没有字幕再跑 Whisper，完成后自动写回正文。' : '转写任务已排队，等当前任务跑完自动接上。'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>转写视频</button>}
          <button className="btn btn-danger" disabled={busy} onClick={() => trashSource(preview)}>移入回收站</button>
        </div>
      </div>
      {preview.summary ? <p className="research-hint">AI 摘要：{preview.summary}</p> : (preview.extra?.pending_tasks || []).includes('transcribe') ? <p className="research-hint">这条带视频，点「转写视频」可拉字幕或跑 Whisper 转写。</p> : null}
      <div className="research-preview-body">
        {!!images.length && <div className="research-gallery">{images.map(src => <img key={src} src={src} alt="" />)}</div>}
        {editingBody !== null
          ? <textarea className="research-edit" rows={12} value={editingBody} onChange={e => setEditingBody(e.target.value)} />
          : note.caption ? <div className="research-caption"><span>配文</span><p>{note.caption}</p></div> : null}
        {editingBody === null && note.ocrText ? <div className="research-ocr-wrap"><span>图片文字</span><OcrBlocks text={note.ocrText} /></div> : null}
        {editingBody === null && preview.extra?.comments_text ? <div className="research-caption"><span>评论</span><pre>{preview.extra.comments_text}</pre></div> : null}
        {editingBody === null && !note.caption && !note.ocrText && preview.error ? <pre>{preview.error}</pre> : null}
      </div>
      </>;
    })()}</div></div>}
  </div>;
}
