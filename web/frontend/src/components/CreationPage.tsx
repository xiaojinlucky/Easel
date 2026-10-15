import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { creationRequest, operationId, withCreationEditor } from '../lib/creations';
import type { Creation, CreationBrief, CreationInput } from '../lib/creations';
import { mediaUrl } from '../lib/api';
import { savePublishDraft, loadPublishDraft, selectPublishCreation, publishContent } from '../lib/store';
import '../styles/creation.css';

interface Props {
  id: string; onSelect: (id: string) => void; onCreate: (input: CreationInput) => Promise<void>;
  onLoaded: (work: Creation) => void; renderChat: (work: Creation, body: string, selection: string) => ReactNode;
  latestReply: (sessionId: string) => string; onPublish: () => void;
}
interface Buffer { title: string; body: string; revision: number; updatedAt?: number }
let editorTab = sessionStorage.getItem('easel_creation_editor_tab');
if (!editorTab) { editorTab = operationId(); sessionStorage.setItem('easel_creation_editor_tab', editorTab); }
const bufferKey = (id: string) => `easel_creation_buffer:${id}:${editorTab}`;

export default function CreationPage({ id, onSelect, onCreate, onLoaded, renderChat, latestReply, onPublish }: Props) {
  const [items, setItems] = useState<CreationBrief[]>([]);
  const [work, setWork] = useState<Creation | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [baseRevision, setBaseRevision] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [lockNotice, setLockNotice] = useState('');
  const busyRef = useRef(false);
  const [tab, setTab] = useState<'draft' | 'cards' | 'versions' | 'links'>('draft');
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [replacement, setReplacement] = useState('');
  const [undo, setUndo] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState<number | null>(null);
  const [cardText, setCardText] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);
  const loadedId = useRef('');

  useEffect(() => {
    let cancelled = false;
    let release: (() => void) | undefined;
    setCanEdit(false); setLockNotice('');
    if (!id) return;
    if (!navigator.locks) { setLockNotice('当前浏览器无法保护跨标签编辑，请使用本机 Chrome 或 Edge 打开创作。'); return; }
    void withCreationEditor(id, async lock => {
      if (cancelled) return;
      if (!lock) { setLockNotice('另一标签页正在编辑这篇创作。本页仅查看；关闭那一页后刷新即可接着写。'); return; }
      setCanEdit(true);
      await new Promise<void>(resolve => { release = resolve; });
    }).catch((e: Error) => setLockNotice(e.message));
    return () => { cancelled = true; release?.(); };
  }, [id]);

  const list = () => creationRequest<{ items: CreationBrief[]; unreadable: string[] }>('').then((data) => {
    setItems(data.items);
    if (data.unreadable.length) setError(`${data.unreadable.length} 篇记录读取失败，文件已保留`);
  });
  useEffect(() => { list().catch((e: Error) => setError(e.message)); }, [id]);
  useEffect(() => {
    let cancelled = false;
    setWork(null); loadedId.current = ''; setError(''); setNotice(''); setSelection(null); setUndo(null); setCardIndex(null);
    if (id) creationRequest<Creation>('/' + id).then((data) => {
      if (cancelled) return;
      let buffer: Buffer | null = null;
      const candidates = [bufferKey(id), localStorage.getItem('easel_creation_latest_buffer:' + id), 'easel_creation_buffer:' + id];
      for (const key of candidates) {
        try {
          const candidate: Buffer | null = key ? JSON.parse(localStorage.getItem(key) || 'null') : null;
          if (candidate && typeof candidate.body === 'string' && (!buffer || (candidate.updatedAt || 0) > (buffer.updatedAt || 0))) buffer = candidate;
        } catch { /* another recoverable buffer may still be intact */ }
      }
      if (buffer && buffer.body === data.body && buffer.title === data.title) buffer = null;
      setWork(data); setTitle(buffer?.title ?? data.title); setBody(buffer?.body ?? data.body);
      setBaseRevision(buffer?.revision ?? data.revision); loadedId.current = id;
      if (buffer && buffer.revision !== data.revision) setNotice('本机有未保存编辑，服务器已有新版本。请先复制保留编辑，再载入当前版本。');
      else if (buffer && (buffer.title !== data.title || buffer.body !== data.body)) setNotice('已恢复本机未保存的编辑');
    }).catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [id, onLoaded]);
  useEffect(() => {
    if (!work || !canEdit || loadedId.current !== work.id) return;
    try {
      localStorage.setItem(bufferKey(work.id), JSON.stringify({ title, body, revision: baseRevision, updatedAt: Date.now() }));
      localStorage.setItem('easel_creation_latest_buffer:' + work.id, bufferKey(work.id));
    }
    catch { setError('浏览器存储已满，请立即点「保存版本」保存到本机文件'); }
  }, [work, title, body, baseRevision, canEdit]);
  useEffect(() => { if (work && canEdit) onLoaded(work); }, [work?.id, canEdit, onLoaded]);

  const accept = (data: Creation) => {
    setWork(data); setTitle(data.title); setBody(data.body); setBaseRevision(data.revision);
    setSelection(null); setUndo(null); setNotice(`已保存 · 版本 ${data.revision}`);
    list().catch((e: Error) => setError(e.message));
  };
  const run = async (action: () => Promise<void>) => {
    if (busyRef.current || (work && !canEdit)) return;
    busyRef.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError((e as Error).message); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const current = work?.versions.at(-1);
  const dirty = !!work && (body !== work.body || title !== work.title);
  const save = async (label = '保存稿件') => {
    if (!work || !current) throw new Error('请先打开一篇创作');
    const data = await creationRequest<Creation>(`/${work.id}/versions`, {
      revision: baseRevision, operationId: operationId(), title, body, label,
      platforms: current.platforms, tags: current.tags, media: current.media,
    });
    accept(data); return data;
  };
  const publish = () => run(async () => {
    const data = dirty ? await save() : work;
    if (!data) return;
    const version = data.versions.at(-1)!;
    const existing = loadPublishDraft(data.id);
    // A separate key preserves the old standalone draft and any unsaved platform edits.
    if (existing.creationId && existing.savedContent !== publishContent(existing)) {
      setNotice('已保留这篇创作的发布中心编辑');
    } else {
      const draft = { creationId: data.id, creationRevision: data.revision, title: data.title, body: data.body,
        platforms: Object.keys(version.platforms).length ? Object.keys(version.platforms) : ['xiaohongshu'],
        overrides: version.platforms, tags: version.tags, media: version.media.length ? version.media : version.cards.map(c => c.path) };
      savePublishDraft({ ...draft, savedContent: publishContent(draft) });
    }
    selectPublishCreation(data.id); onPublish();
  });
  const applyReply = () => run(async () => {
    if (!work) return;
    const reply = latestReply(work.sessionId);
    if (!reply.trim()) throw new Error('先让助手给出一段建议，再选择采纳');
    if (body.trim() && !window.confirm('会先保存当前稿件，再将最近回复放入编辑区，确认采用？')) return;
    if (dirty) await save('采用建议前保留手改稿');
    setUndo(body); setBody(reply); setNotice('建议已放入编辑区，检查后保存');
  });

  return <div className="creation-page">
    <aside className="creation-library">
      <div className="creation-library-head"><h1>创作</h1><button className="btn btn-sm" disabled={busy} onClick={() => { void onCreate({ title: '未命名创作' }).catch((e: Error) => setError(e.message)); }}>新建</button></div>
      <p>每篇内容，从素材接着写。</p>
      <div className="creation-work-list">{items.map(item => <button key={item.id} className={`creation-work ${item.id === id ? 'active' : ''}`} disabled={busy} onClick={() => onSelect(item.id)}>
        <strong>{item.title}</strong><span>版本 {item.revision} · {item.sourceIds.length} 条素材</span>
      </button>)}</div>
    </aside>
    {!work ? <div className="creation-empty"><h2>{id ? '正在打开创作…' : '把素材与稿件留在同一篇创作里'}</h2>
      <p>从素材库勾选 1–5 条素材，或从内容库另存已有稿件。也可以直接新建。</p>{error && <p role="alert">{error}</p>}</div> :
    <section className="creation-workspace">
      <header className="creation-header">
        <input aria-label="创作标题" className="field creation-title" value={title} maxLength={160} disabled={busy || !canEdit} onChange={e => setTitle(e.target.value)} />
        <div className="creation-actions"><span>{dirty ? '有未保存编辑' : `版本 ${work.revision}`}</span>
          <button className="btn btn-primary btn-sm" disabled={busy || !canEdit || !!work.fileError} onClick={() => run(async () => { await save(); })}>{busy ? '处理中…' : '保存版本'}</button>
          <button className="btn btn-sm" disabled={busy || !canEdit || !body.trim() || !!work.fileError} onClick={publish}>去发布中心</button>
        </div>
      </header>
      <div className="creation-sources"><b>引用素材</b>{work.sources.length ? work.sources.map(s => <a key={s.id} href={/^https?:\/\//.test(s.link) ? s.link : undefined} target="_blank" rel="noreferrer" title={`${s.platform} · ${s.author} · ${s.id}`}>{s.title}</a>) : <span>尚未引用素材</span>}
        {work.sourcePath && <span title={work.sourcePath}>从原稿另存 · 原件保留</span>}
      </div>
      {(error || notice || work.fileError || lockNotice) && <div className={`creation-notice ${error || work.fileError ? 'error' : ''}`} role={error || work.fileError ? 'alert' : 'status'}>{error || work.fileError || lockNotice || notice}</div>}
      <div className="creation-split">
        <div className="creation-editor">
          <nav className="creation-tabs">{([['draft', '稿件'], ['cards', '文字卡片'], ['versions', '历史版本'], ['links', '排期与记录']] as const).map(([key, label]) => <button className={`chip ${tab === key ? 'active' : ''}`} key={key} onClick={() => setTab(key)}>{label}</button>)}</nav>
          <div className="creation-editor-scroll">
          {tab === 'draft' && <>
            <div className="creation-draft-tools"><button className="btn btn-sm" disabled={busy || !canEdit} onClick={applyReply}>用最近回复作为稿件</button><button className="btn btn-ghost btn-sm" disabled={undo === null || busy || !canEdit} onClick={() => { setBody(undo!); setUndo(null); setSelection(null); }}>撤销本次替换</button></div>
            <label className="field-label" htmlFor="creation-body">母稿 · 选中文字后可只改这一段</label>
            <textarea id="creation-body" ref={editRef} className="field creation-body" value={body} disabled={busy || !!work.fileError} placeholder="在这里写，或在右侧对话后采纳建议。每次保存都保留旧版本。"
              readOnly={!canEdit} onChange={e => { setBody(e.target.value); setSelection(null); setUndo(null); }} onSelect={e => { const el = e.currentTarget; if (el.selectionEnd > el.selectionStart) setSelection({ start: el.selectionStart, end: el.selectionEnd, text: el.value.slice(el.selectionStart, el.selectionEnd) }); }} />
            {selection && <section className="creation-replace"><h3>只修改选中的 {selection.text.length} 个字</h3><blockquote>{selection.text}</blockquote>
              <label htmlFor="creation-replacement">替换建议</label><textarea id="creation-replacement" className="field" rows={5} value={replacement} disabled={!canEdit || busy} onChange={e => setReplacement(e.target.value)} placeholder="手动填写，或让右侧助手只改选中段落，再取回建议" />
              <div className="creation-actions"><button className="btn btn-sm" onClick={() => setReplacement(latestReply(work.sessionId))}>取最近回复</button>
                <button className="btn btn-primary btn-sm" disabled={!replacement.trim() || busy || !canEdit} onClick={() => {
                  if (body.slice(selection.start, selection.end) !== selection.text) { setError('选中内容已变化，请重新选择'); return; }
                  setUndo(body); setBody(body.slice(0, selection.start) + replacement + body.slice(selection.end)); setSelection(null); setReplacement(''); setNotice('已替换选中段落，其余文字保留。检查后保存版本。');
                }}>只替换选中段落</button><button className="btn btn-ghost btn-sm" onClick={() => setSelection(null)}>取消选择</button></div>
            </section>}
          </>}
          {tab === 'cards' && <>
            <div className="creation-draft-tools"><p>沿用现有 Meta 文字卡片样式。正文改动后需重新排版。</p><button className="btn btn-sm" disabled={busy || !canEdit || !body.trim()} onClick={() => run(async () => {
              const data = dirty ? await save() : work;
              accept(await creationRequest<Creation>(`/${id}/cards`, { revision: data.revision, operationId: operationId() })); setCardIndex(null);
            })}>按当前稿件生成卡片</button></div>
            {current?.cards.some(c => c.bodyHash !== current.bodyHash) && <p className="creation-notice">正文已有修改，以下卡片仍保留上次排版。</p>}
            <div className="creation-cards">{current?.cards.map((card, i) => <button className={`creation-card ${cardIndex === i ? 'active' : ''}`} key={card.path} onClick={() => { setCardIndex(i); setCardText(card.text); }}>
              <img src={mediaUrl(card.path)} alt={`文字卡片第 ${i + 1} 张`} loading="lazy"/><span>第 {i + 1} 张{card.edited ? ' · 单独改过' : ''}</span></button>)}</div>
            {cardIndex !== null && <section className="creation-replace"><h3>只改第 {cardIndex + 1} 张</h3><textarea aria-label="单张卡片文字" className="field" rows={8} value={cardText} onChange={e => setCardText(e.target.value)} disabled={busy}/>
              <button className="btn btn-primary btn-sm" disabled={busy || !canEdit || !cardText.trim() || dirty} onClick={() => run(async () => {
                accept(await creationRequest<Creation>(`/${id}/cards`, { revision: work.revision, operationId: operationId(), index: cardIndex, text: cardText })); setCardIndex(null);
              })}>只重新生成这一张</button>{dirty && <p>请先保存母稿。</p>}</section>}
          </>}
          {tab === 'versions' && <>
            {baseRevision !== work.revision && <button className="btn btn-sm" onClick={() => { if (window.confirm('请先复制保留本机编辑。载入会将编辑区换为服务器当前稿件，继续？')) accept(work); }}>载入当前版本</button>}
            {[...work.versions].reverse().map(v => <div className="creation-version" key={v.id}><div><b>版本 {v.number} · {v.label}</b><p>{v.createdAt.replace('T', ' ')} · {v.title}</p><a href={`#/outputs/${encodeURIComponent(v.bodyPath)}`}>在内容库查看稿件</a></div>
              <button className="btn btn-sm" disabled={busy || !canEdit} onClick={() => run(async () => {
                const data = dirty ? await save('恢复历史前保留手改稿') : work;
                accept(await creationRequest<Creation>(`/${id}/restore`, { revision: data.revision, operationId: operationId(), versionId: v.id }));
              })}>恢复为新版本</button></div>)}
          </>}
          {tab === 'links' && <><h3>内容排期</h3>{work.related.schedule.length ? work.related.schedule.map(s => <p key={s.id}>{s.date} · {s.platform} · {s.title}</p>) : <p>在发布中心将平台稿加入日历后，会显示在这里。</p>}
            <h3>发布记录</h3>{work.related.publications.length ? work.related.publications.map(p => <p key={p.path}>{p.date} · {p.status === 'published' ? '手动标记已发布' : p.status}{p.link && <a href={/^https?:\/\//.test(p.link) ? p.link : undefined} target="_blank" rel="noreferrer">查看链接</a>}</p>) : <p>尚无这篇创作的发布记录。</p>}</>}
          </div>
        </div>
        <aside className="creation-chat"><div className="creation-chat-head"><b>一起写这篇</b><span>{selection ? '已带入选中段落' : '已带入素材与当前稿件'} · 建议需你采纳</span></div>{canEdit ? renderChat(work, body, selection?.text || '') : <p className="creation-notice">{lockNotice || '正在接回创作…'}</p>}</aside>
      </div>
    </section>}
  </div>;
}
