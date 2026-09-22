import { useCallback, useEffect, useState } from 'react';
import {
  activateAccountProfile, buildProfileFromSession, fetchAccountImportSessions,
  fetchAccountProfile, fetchAccountProfileJob,
  type AccountImportSession, type AccountProfileFile,
} from '../lib/api';

const STATUS: Record<string, string> = { open: '仍在采集', completed: '已完成', partial: '部分完成', failed: '采集失败' };

function summaryOf(s: AccountImportSession) {
  const posts = s.item_counts?.post ?? 0;
  const media = s.item_counts?.media ?? 0;
  const comments = s.item_counts?.comment ?? 0;
  const parts = [`帖 ${posts}`, `图/视频 ${media}`, `评论 ${comments}`, `挂上素材库 ${s.linked_source_count} 条`];
  if (s.failed_post_count) parts.push(`采集失败 ${s.failed_post_count}`);
  return parts.join(' · ');
}

export default function AccountImportPanel({ onActivated }: { onActivated?: (name: string) => void }) {
  const [sessions, setSessions] = useState<AccountImportSession[]>([]);
  const [target, setTarget] = useState('');
  const [name, setName] = useState('');
  const [intent, setIntent] = useState('');
  const [job, setJob] = useState<{ id: string; name: string; status: string; note: string } | null>(null);
  const [profile, setProfile] = useState<AccountProfileFile | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try { setSessions((await fetchAccountImportSessions()).items); }
    catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => {
    load();
    const timer = window.setInterval(() => { if (!document.hidden) load(); }, 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function generate(sessionId: string) {
    if (!name.trim()) { setError('先给这份画像起个名字。'); return; }
    setBusy(true); setError(''); setNotice(''); setProfile(null);
    try {
      const result = await buildProfileFromSession(sessionId, name.trim(), intent.trim());
      setJob({ id: result.job_id, name: result.name, status: result.status, note: `用 ${result.used_source_count} 条素材（共挂上 ${result.linked_source_count} 条，${result.skipped_source_count} 条不可回读已跳过）` });
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  // 分析在后台线程跑（一次模型调用，约 1-2 分钟），这里只跟着任务状态走。
  useEffect(() => {
    if (!job || job.status === 'succeeded' || job.status === 'failed') return;
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const next = await fetchAccountProfileJob(job.id);
        setJob(prev => (prev ? { ...prev, status: next.status, note: next.error || prev.note } : prev));
        if (next.status === 'succeeded') setProfile(await fetchAccountProfile(job.name));
        if (next.status === 'failed') setError(next.error || '分析失败，档案未改动。');
      } catch (e) { setError((e as Error).message); }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [job]);

  useEffect(() => {
    if (job?.status === 'succeeded') setDraft(profile?.suggestion?.content || '');
  }, [job?.status, profile]);

  async function activate() {
    if (!profile) return;
    setBusy(true); setError('');
    try {
      const active = await activateAccountProfile(profile.name, draft, profile.active.version);
      setProfile({ ...profile, active });
      setNotice(`已确认生效（第 ${active.version} 版）。新建对话选画像「${profile.name}」即会带上这份档案。`);
      setTarget('');
      onActivated?.(profile.name);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return <details className="account-profile-panel" open={sessions.length > 0}>
    <summary>账号采集会话（{sessions.length}）</summary>
    <p>用 Beav 开源采集扩展整账号采集时，每一批会先存成一次会话。挑一批生成账号画像：模型只依据这批正文给建议，你确认后才会生效进入对话。</p>
    {!sessions.length && <div className="account-job">还没有整账号导入。先在小红书作者主页用扩展采集，批次会出现在这里。</div>}
    {error && <div className="model-alert error" role="alert">{error}</div>}
    {notice && <div className="model-alert" role="status">{notice}</div>}
    {sessions.map(s => {
      const open = target === s.id;
      return <div key={s.id} className="account-session">
        <div className="account-session-head">
          <b>{s.username || s.homepage_url || s.account_id}</b>
          <span>{s.platform} · {STATUS[s.status] || s.status} · {new Date(s.created_at * 1000).toLocaleString('zh-CN')}</span>
        </div>
        <small>{summaryOf(s)}{s.last_error ? ` · ${s.last_error}` : ''}</small>
        {s.status === 'open' && <small className="account-session-warn">这批仍在采集，先生成只会用到已经入库的部分。</small>}
        <button className="btn" disabled={busy || (open && !!job && !profile)} onClick={() => {
          setTarget(open ? '' : s.id); setProfile(null); setJob(null); setError('');
          if (!name) setName(`${s.username || '账号'}·账号档案`);
        }}>{open ? (profile ? '收起' : job ? '分析中…' : '取消') : '用这批生成画像'}</button>
        {open && !profile && <>
          <label>画像名（不能与已有画像重名）
            <input className="field" name="account-profile-name" value={name} maxLength={100} onChange={e => setName(e.target.value)} />
          </label>
          <label>你的运营意图（可选，会作为你的输入而不是采集事实）
            <textarea className="field" name="account-profile-intent" rows={2} value={intent} maxLength={10000} onChange={e => setIntent(e.target.value)} />
          </label>
          <button className="btn btn-primary" disabled={busy || !!job} onClick={() => generate(s.id)}>
            {job ? '分析中…' : '生成建议（跑一次模型）'}
          </button>
          {job && <div className="account-job">{job.status === 'queued' || job.status === 'running'
            ? `${job.note}；模型正在分析，约 1-2 分钟。`
            : job.status === 'succeeded' ? `${job.note}；建议已生成，确认后才会生效。` : `分析未成功：${job.note}`}</div>}
        </>}
        {open && profile && <>
          <div className="account-profile-columns">
            <div>
              <h4>待确认建议（未生效）</h4>
              <p>依据 {profile.suggestion?.evidence_ids.length ?? 0} 条素材，生成于 {profile.suggestion?.generated_at?.slice(0, 19).replace('T', ' ') || '—'}。改哪句都行，生效的是下面这份。</p>
              <textarea className="field" name="account-profile-draft" rows={12} value={draft} onChange={e => setDraft(e.target.value)} />
            </div>
            <div>
              <h4>当前生效版本</h4>
              <p>{profile.active.version ? `第 ${profile.active.version} 版 · ${profile.active.updated_at?.slice(0, 19).replace('T', ' ') || ''}` : '还没有生效内容，对话里选这个画像只会提示"尚未确认"。'}</p>
              <div className="account-evidence">{profile.active.content ? <pre>{profile.active.content}</pre> : <pre>（空）</pre>}</div>
            </div>
          </div>
          <div className="model-actions">
            <button className="btn btn-primary" disabled={busy || !draft.trim()} onClick={activate}>确认生效</button>
            <button className="btn" disabled={busy} onClick={() => { setTarget(''); setProfile(null); setJob(null); }}>稍后再说</button>
          </div>
        </>}
      </div>;
    })}
  </details>;
}
