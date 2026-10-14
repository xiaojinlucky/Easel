import { useEffect, useState } from 'react';
import {
  addWatchPost, addWatchTarget, fetchWatch, refreshWatchTarget,
  removeWatchPost, removeWatchTarget, runAgent, watchParse, watchPrompt,
} from '../lib/api';
import type { PersonaItem, WatchTarget } from '../lib/api';
import { savePublishDraft } from '../lib/store';

const PLATFORM_LABEL: Record<string, string> = { xiaohongshu: '小红书', 'wechat-oa': '公众号' };

interface WatchPageProps {
  persona: string;
  personas: PersonaItem[];
  onPickPersona: (persona: string) => void;
  onOpenPublish: () => void;
}

export default function WatchPage({ persona, personas, onPickPersona, onOpenPublish }: WatchPageProps) {
  const [targets, setTargets] = useState<WatchTarget[]>([]);
  const [platform, setPlatform] = useState<'xiaohongshu' | 'wechat-oa'>('xiaohongshu');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { title: string; url: string; text: string }>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => fetchWatch().then((data) => setTargets(data.targets || [])).catch((e: Error) => setError(e.message));

  useEffect(() => { load(); }, []);

  const draftOf = (id: string) => drafts[id] || { title: '', url: '', text: '' };
  const setDraft = (id: string, patch: Partial<{ title: string; url: string; text: string }>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || { title: '', url: '', text: '' }), ...patch } }));
  };

  const add = async () => {
    setError('');
    setNotice('');
    setBusy('add');
    try {
      await addWatchTarget(platform, name, url);
      setName('');
      setUrl('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '没加上。');
    } finally {
      setBusy('');
    }
  };

  const refresh = async (id: string) => {
    setError('');
    setBusy(id);
    try {
      const updated = await refreshWatchTarget(id);
      setNotice(updated.message || '');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '这次没读到新帖。');
    } finally {
      setBusy('');
    }
  };

  const note = async (id: string) => {
    const draft = draftOf(id);
    setError('');
    setBusy('note-' + id);
    try {
      await addWatchPost(id, draft.title, draft.url, draft.text);
      setDrafts((prev) => ({ ...prev, [id]: { title: '', url: '', text: '' } }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '没记下。');
    } finally {
      setBusy('');
    }
  };

  const write = async (postId: string) => {
    if (!persona) {
      setError('先选一个画像。');
      return;
    }
    setError('');
    setNotice('');
    setBusy('write-' + postId);
    try {
      const { prompt } = await watchPrompt(postId, persona);
      const { response } = await runAgent(prompt, persona);
      const draft = await watchParse(response || '');
      savePublishDraft({
        title: draft.title,
        body: draft.body,
        platforms: ['xiaohongshu', 'wechat-oa'],
        overrides: {},
        tags: '',
      });
      onOpenPublish();
    } catch {
      setError('没写完。');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="page-scroll watch-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">盯账号</h1>
          <p className="page-subtitle">看他们的新帖，按你的画像写一篇，然后去发布。</p>
        </div>
      </div>
      {error && <div className="notice-error" role="alert">{error}</div>}
      {notice && !error && <p className="watch-notice">{notice}</p>}

      <section className="account-card watch-add">
        <div className="watch-platforms" role="group" aria-label="平台">
          <button type="button" className={`chip ${platform === 'xiaohongshu' ? 'active' : ''}`} onClick={() => setPlatform('xiaohongshu')}>小红书</button>
          <button type="button" className={`chip ${platform === 'wechat-oa' ? 'active' : ''}`} onClick={() => setPlatform('wechat-oa')}>公众号</button>
        </div>
        <label className="field-label">账号名字
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="你怎么称呼这个账号" />
        </label>
        <label className="field-label">{platform === 'xiaohongshu' ? '主页链接' : '主页链接，可以空着'}
          <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="手机上复制的整段也可以" />
        </label>
        <div className="watch-persona">
          <label className="field-label">用哪份画像写
            <select className="field" value={persona} onChange={(e) => onPickPersona(e.target.value)}>
              <option value="">先选画像</option>
              {personas.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
        </div>
        <button type="button" className="btn btn-primary" disabled={busy === 'add' || !name.trim()} onClick={add}>
          {busy === 'add' ? '正在添加…' : '添加'}
        </button>
      </section>

      {targets.length === 0 && <div className="dash-empty">还没有要盯的账号。</div>}

      <div className="watch-list">
        {targets.map((target) => (
          <section key={target.id} className="account-card">
            <div className="account-card-head">
              <div>
                <div className="account-card-name">{target.name}</div>
                <div className="account-card-note">{PLATFORM_LABEL[target.platform] || '账号'}</div>
              </div>
              <div className="watch-row-actions">
                <button type="button" className="btn btn-sm" disabled={busy === target.id} onClick={() => refresh(target.id)}>
                  {busy === target.id ? '正在看…' : '看新帖'}
                </button>
                <button type="button" className="btn btn-sm" onClick={() => {
                  if (window.confirm(`不再盯「${target.name}」？`)) {
                    removeWatchTarget(target.id).then(load).catch((e: Error) => setError(e.message));
                  }
                }}>移除</button>
              </div>
            </div>
            {target.message && <p className="account-card-note">{target.message}</p>}
            {(target.posts || []).map((post) => (
              <div key={post.id} className="watch-post">
                <div>
                  <div className="account-card-name">{post.title}</div>
                  {post.media && <div className="account-card-note">{post.media}</div>}
                  {post.text && <div className="account-card-note">{post.text.slice(0, 80)}</div>}
                </div>
                <div className="watch-row-actions">
                  <button type="button" className="btn btn-sm btn-primary" disabled={busy === 'write-' + post.id} onClick={() => write(post.id)}>
                    {busy === 'write-' + post.id ? '正在写…' : '写成一篇'}
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => removeWatchPost(post.id).then(load).catch((e: Error) => setError(e.message))}>去掉</button>
                </div>
              </div>
            ))}
            <div className="watch-note">
              <input className="field" value={draftOf(target.id).title} onChange={(e) => setDraft(target.id, { title: e.target.value })} placeholder="标题" />
              <input className="field" value={draftOf(target.id).url} onChange={(e) => setDraft(target.id, { url: e.target.value })} placeholder="帖子链接，可以空着" />
              <textarea className="field" value={draftOf(target.id).text} onChange={(e) => setDraft(target.id, { text: e.target.value })} placeholder="贴上这篇的文字" />
              <button type="button" className="btn btn-sm" disabled={busy === 'note-' + target.id} onClick={() => note(target.id)}>记下这篇</button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
