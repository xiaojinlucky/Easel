import { useEffect, useRef, useState } from 'react';
import { adoptAccountProfile, analyzeAccountProfile, buildAccountProfile, captureAccountSource, fetchAccountProfile, fetchAccountProfileJob, fetchAccountSources } from '../lib/api';
import type { AccountProfile, AccountProfileJob, AccountSource } from '../lib/api';
import { renderMarkdown } from '../lib/sanitize';
import '../styles/account-profile.css';

function sourceTime(value: number | string): string {
  const numeric = typeof value === 'number' || /^\d+(\.\d+)?$/.test(value);
  const date = new Date(numeric ? Number(value) * (Number(value) < 1e12 ? 1000 : 1) : value);
  return Number.isNaN(date.getTime()) ? String(value || '未记录') : date.toLocaleString('zh-CN');
}

function editableSuggestion(content: string): string {
  return content.replace(/^#{1,6}[^\n]*(?:待确认|未生效)[^\n]*$/m, '# 账号档案');
}

export default function AccountProfilePanel({ persona, onCreated, onStartCreate }: { persona?: string; onCreated?: (name: string) => void; onStartCreate?: (name: string) => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [intent, setIntent] = useState('');
  const [sources, setSources] = useState<AccountSource[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [capture, setCapture] = useState<AccountSource | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [content, setContent] = useState('');
  const [editorVersion, setEditorVersion] = useState(0);
  const captureGeneration = useRef(0);
  const currentUrl = useRef(url);
  currentUrl.current = url;
  const currentPersona = useRef(persona);
  currentPersona.current = persona;
  const [job, setJob] = useState<AccountProfileJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pollRetry, setPollRetry] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const version = ++generation.current;
    setError(''); setProfile(null); setJob(null); setContent(''); setEditorVersion(0); setBusy(false);
    if (persona) {
      fetchAccountProfile(persona).then(value => {
        if (generation.current !== version) return;
        setProfile(value); setContent(value?.active.content || ''); setEditorVersion(value?.active.version || 0);
        if (value?.latest_job_id) setJob({ job_id:value.latest_job_id,name:persona,status:'queued' });
      }).catch(e => { if (generation.current === version) setError(e.message); });
    } else {
      fetchAccountSources().then(value => { if (generation.current === version) setSources(value.filter(s => s.state === 'saved')); }).catch(e => { if (generation.current === version) setError(e.message); });
    }
    return () => { generation.current += 1; };
  }, [persona]);
  useEffect(() => {
    if (!job || !['queued', 'running'].includes(job.status)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const current = await fetchAccountProfileJob(job.job_id);
        if (cancelled) return;
        if (!['queued','running','succeeded','failed'].includes(current.status)) throw new Error('诊断状态无法确认，请重试读取状态。');
        setJob(current);
        if (current.status === 'failed') { setError(current.error || '诊断失败，原始资料与已采用版本已保留。'); return; }
        if (current.status === 'succeeded') {
          if (!persona) { onCreated?.(current.name); return; }
          const value = await fetchAccountProfile(persona);
          if (!cancelled) { setProfile(value); setNotice('分析建议已更新；当前采用内容未被覆盖。'); }
          return;
        }
        timer = setTimeout(poll, 2500);
      } catch (e) { if (!cancelled) setError((e as Error).message); }
    };
    void poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [job?.job_id, pollRetry, persona]);

  async function run(action: (isCurrent: () => boolean) => Promise<void>) {
    const version = generation.current;
    const identity = persona;
    const isCurrent = () => generation.current === version && currentPersona.current === identity;
    setBusy(true); setError(''); setNotice('');
    try { await action(isCurrent); } catch(e) { if (isCurrent()) setError((e as Error).message); } finally { if (isCurrent()) setBusy(false); }
  }
  const pending = job && ['queued','running'].includes(job.status);
  return <section className="account-profile-panel">
    <h3>{persona ? '账号档案与创作依据' : '已有账号：从主页建立档案'}</h3>
    {error && <div className="model-alert error" role="alert">{job?.status === 'failed' ? '本次诊断未完成，原始资料和已采用版本已保留。' : '本次操作未完成，请查看原因后处理。'}<details><summary>查看失败详情</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:240,overflowY:'auto'}}>{error}</pre></details></div>}
    {notice && <div className="model-alert" role="status">{notice}</div>}
    {!persona && <>
      <p>先读取一页真实资料，确认范围后再诊断。仅分析实际取得的内容，不把主页当作完整历史表现。</p>
      <label>档案名<input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="例如：我的科学传播账号" /></label>
      <label>账号主页链接<input className="field" value={url} onChange={e=>{captureGeneration.current += 1;currentUrl.current=e.target.value;setUrl(e.target.value);setCapture(null);setSelected([]);}} placeholder="https://…" /></label>
      <label>运营目标（可选）<textarea className="field" rows={2} value={intent} onChange={e=>setIntent(e.target.value)} placeholder="你想保留什么、改善什么？" /></label>
      <button className="btn" disabled={busy || Boolean(pending) || !url.trim()} onClick={()=>void run(async(isCurrent)=>{
        const requestedUrl = url.trim();
        const version = ++captureGeneration.current;
        const result = await captureAccountSource(requestedUrl);
        if (!isCurrent() || version !== captureGeneration.current || currentUrl.current.trim() !== requestedUrl) return;
        setCapture(result);
        if(result.state !== 'saved') throw new Error(result.error || '没有取得可用内容，请选择已有素材。');
        setSources(old=>[result,...old.filter(s=>s.id!==result.id)]); setSelected([result.id]);
        if(result.error) setError(result.error);
      })}>{busy ? '处理中…' : '读取主页资料'}</button>
      {capture && <div className="account-evidence"><strong>{capture.title || '主页读取结果'}</strong><p>采集方式：{capture.method || '未返回'} · 范围：本次保存的单页正文</p><pre>{capture.content || capture.excerpt || capture.error}</pre></div>}
      <details open={Boolean(error)}><summary>选择已有素材（可在读取失败时使用）</summary>{sources.length === 0 && <p>暂无可用素材，请先到“调研与素材”保存资料。</p>}{sources.map(source=><label className="account-source-choice" key={source.id}><input type="checkbox" checked={selected.includes(source.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,source.id]:old.filter(id=>id!==source.id))} /><span>{source.title}<small>{source.method} · {source.url || '用户导入，无来源链接'}</small><small>{source.excerpt || source.content?.slice(0, 300)}</small></span></label>)}</details>
      <p>所选 {selected.length} 条资料会保留来源与采集方式；手工摘录仍按手工来源记录；手选其他账号资料只作参考，不自动视为本账号事实。诊断将使用当前配置的模型。</p>
      <button className="btn btn-primary" disabled={busy || Boolean(pending) || !name.trim() || !selected.length} onClick={()=>void run(async(isCurrent)=>{const result=await buildAccountProfile({name:name.trim(),source_ids:selected,homepage_url:url.trim(),intent:intent.trim()});if(isCurrent()) setJob(result);})}>确认资料范围，建立档案并诊断</button>
    </>}
    {job && <div className="account-job" role="status">{job.status==='succeeded'?'诊断完成':job.status==='failed'?'诊断失败':job.status==='running'?'正在分析真实资料…':'诊断已排队…'}{error && job.status !== 'failed' && <button className="btn btn-sm" onClick={()=>{setError('');setPollRetry(n=>n+1);}}>重新读取状态</button>}</div>}
    {!persona && job?.status === 'failed' && <button className="btn" onClick={()=>onCreated?.(job.name)}>查看已保存资料并修订</button>}
    {persona && profile && <>
      <details><summary>原始资料 · {profile.evidence.length} 条</summary><p>{profile.homepage_url}</p><p>运营目标：{profile.user_input.intent || '未填写'}</p>{profile.evidence.map((source,index)=><div className="account-evidence" key={source.id || index}><strong>{source.title}</strong><p>{source.method} · 资料导入 / 抓取时刻：{sourceTime(source.captured_at)}</p>{source.url && <a href={source.url} target="_blank" rel="noreferrer">原始链接 ↗</a>}<pre>{source.content || source.excerpt}</pre></div>)}</details>
      <div className="account-profile-columns"><div><h4>分析建议</h4>{profile.suggestion ? <><div className="profile-content" dangerouslySetInnerHTML={{__html:renderMarkdown(profile.suggestion.content)}} /><button className="btn" onClick={()=>setContent(editableSuggestion(profile.suggestion!.content))}>把建议放入编辑区</button></>:<p>尚无成功生成的建议，可以重新分析。</p>}<button className="btn" disabled={busy || Boolean(pending)} onClick={()=>void run(async(isCurrent)=>{const result=await analyzeAccountProfile(persona);if(isCurrent()) setJob(result);})}>重新分析资料</button><p>重新分析只更新建议，保留你已采用的版本。</p></div>
      <div><h4>当前采用文案 · 版本 {profile.active.version}</h4><p>编辑基于版本 {editorVersion}{editorVersion !== profile.active.version ? '；已有新版本，请重新载入后再修订。' : ''}</p><button className="btn btn-sm" disabled={busy} onClick={()=>void run(async(isCurrent)=>{if(content!==profile.active.content && !window.confirm('重新载入已采用版本会放弃当前未保存编辑，继续？')) return;const value=await fetchAccountProfile(persona);if(value && isCurrent()){setProfile(value);setContent(value.active.content);setEditorVersion(value.active.version);}})}>重新载入已采用版本</button><textarea className="field" rows={14} value={content} onChange={e=>setContent(e.target.value)} aria-label="当前采用文案" /><button className="btn btn-primary" disabled={busy || !content.trim() || content===profile.active.content} onClick={()=>void run(async(isCurrent)=>{const active=await adoptAccountProfile(persona,content,editorVersion);if(!isCurrent()) return;setProfile(current=>current?{...current,active}:current);setEditorVersion(active.version);setNotice('已确认采用，后续使用此画像创作将读取该版本。');})}>确认采用此版本</button><p>编辑后请确认采用，再开始创作。</p><button className="btn" disabled={!profile.active.content || content!==profile.active.content} onClick={()=>onStartCreate?.(persona)}>使用此画像开始创作</button></div></div>
    </>}
    {persona && !profile && !error && <p>此画像尚未建立来源档案，下方六维资料仍可正常编辑。</p>}
  </section>;
}
