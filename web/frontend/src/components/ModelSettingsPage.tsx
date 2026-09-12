import { useEffect, useState } from 'react';

type Profile = { id: string; name: string; model: string; reasoning_effort: string };
type Model = { model: string; displayName: string; description: string; supportedReasoningEfforts: { reasoningEffort: string; description: string }[] };
type Status = { logged_in: boolean; plan: string | null; weekly_remaining: number | null; resets_at: number | null; stop_reason: string | null };
type Test = { model: string; reasoning_effort: string; latency_seconds: number; tested_at: number };
type Settings = { active_id: string; profiles: Profile[]; last_test?: Test };

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/model-settings${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : '请求失败，请检查服务状态。');
  return data;
}

const effortNames: Record<string, string> = { low: '低', medium: '中', high: '高', xhigh: '很高', max: '最大', ultra: '极高', minimal: '最小', none: '关闭' };

export default function ModelSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savedId, setSavedId] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    setBusy('refresh'); setError('');
    const results = await Promise.allSettled([request<Settings>(''), request<Status>('/status'), request<{ models: Model[] }>('/catalog')]);
    const [config, account, catalog] = results;
    if (config.status === 'fulfilled') { setSettings(config.value); setSavedId(config.value.active_id); setTest(config.value.last_test || null); }
    if (account.status === 'fulfilled') setStatus(account.value);
    if (catalog.status === 'fulfilled') setModels(catalog.value.models);
    setError(results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason.message).join('；'));
    setBusy('');
  }
  useEffect(() => { void refresh(); }, []);
  const active = settings?.profiles.find(p => p.id === settings.active_id);
  const model = models.find(m => m.model === active?.model);
  const verified = active && test?.model === active.model;

  function updateProfile(changes: Partial<Profile>) {
    if (!settings) return;
    setSettings({ ...settings, profiles: settings.profiles.map(p => p.id === settings.active_id ? { ...p, ...changes } : p) });
    setMessage('');
  }
  async function act(action: string) {
    if (!active || !settings) return;
    setBusy(action); setError(''); setMessage('');
    try {
      if (action === 'probe') {
        const result = await request<Test>('/probe', active);
        setTest(result); setMessage(`订阅调用成功，耗时 ${result.latency_seconds} 秒。可以保存并启用。`);
      } else if (action === 'save') {
        const result = await request<Settings>('', settings);
        setSettings(result); setSavedId(result.active_id); setMessage('已保存，新请求将使用这个模型档案。');
      } else if (action === 'login') {
        const result = await request<{ message: string }>('/login', {});
        setMessage(result.message);
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(''); }
  }
  return (
    <div className="model-page">
      <div className="model-heading"><div><span className="model-eyebrow">创作引擎</span><h2>AI 模型设置</h2><p>使用你的 ChatGPT 订阅，模型与推理强度按账号实际能力选择。</p></div><button className="btn" onClick={refresh} disabled={!!busy}>{busy === 'refresh' ? '检测中…' : '检测登录与模型'}</button></div>
      {error && <div className="model-alert error" role="alert">{error}</div>}
      {message && <div className="model-alert" role="status">{message}</div>}
      <section className="model-account">
        <div><span className="model-label">连接方式</span><h3>ChatGPT · Codex 订阅</h3><p>{status ? status.logged_in ? `已登录${status.plan ? ` · ${status.plan.toUpperCase()}` : ''}` : '等待官方账号登录' : '正在读取账号状态…'}</p><button className="btn" disabled={!!busy || status?.logged_in} onClick={() => act('login')}>{status?.logged_in ? '订阅已连接' : '通过官方页面登录'}</button></div>
        <div className="model-quota"><span className="model-label">本周剩余额度</span><strong>{status?.weekly_remaining == null ? '—' : `${status.weekly_remaining}%`}</strong><div className="model-quota-track"><div style={{ width: `${status?.weekly_remaining ?? 0}%` }} /></div><p>{status?.resets_at ? `重置时间：${new Date(status.resets_at * 1000).toLocaleString('zh-CN')}` : '暂未取得重置时间'}</p></div>
      </section>
      {settings && active && <section className="model-editor">
        <aside className="model-profiles"><h3>模型档案</h3>{settings.profiles.map(p => <button key={p.id} className={`model-profile ${p.id === active.id ? 'selected' : ''}`} disabled={!!busy} onClick={() => { setSettings({ ...settings, active_id: p.id }); setMessage(''); }}><b>{p.name}</b><span>{p.model}</span>{p.id === savedId && <small>已启用</small>}</button>)}<button className="btn" disabled={!!busy || !models.length || settings.profiles.length >= 20} onClick={() => { const id = crypto.randomUUID(); setSettings({ ...settings, active_id: id, profiles: [...settings.profiles, { ...active, id, name: '新建档案' }] }); }}>＋ 新建档案</button></aside>
        <div className="model-fields"><label>档案名称<input value={active.name} maxLength={60} disabled={!!busy} onChange={e => updateProfile({ name: e.target.value })} /></label>
          <label>模型<select value={active.model} disabled={!!busy || !models.length} onChange={e => { const next = models.find(m => m.model === e.target.value)!; const efforts = next.supportedReasoningEfforts.map(e => e.reasoningEffort); updateProfile({ model: next.model, reasoning_effort: efforts.includes(active.reasoning_effort) ? active.reasoning_effort : efforts.includes('high') ? 'high' : efforts[0] }); }}>
            {!models.some(m => m.model === active.model) && <option value={active.model}>{active.model} · 等待验证</option>}{models.map(m => <option value={m.model} key={m.model}>{m.displayName || m.model}</option>)}</select><small>{model?.description || '模型目录由官方 Codex 返回。'}</small></label>
          <label>推理强度<select value={active.reasoning_effort} disabled={!!busy || !model} onChange={e => updateProfile({ reasoning_effort: e.target.value })}>{model ? model.supportedReasoningEfforts.map(e => <option key={e.reasoningEffort} value={e.reasoningEffort}>{effortNames[e.reasoningEffort] || e.reasoningEffort} · {e.reasoningEffort}</option>) : <option>{active.reasoning_effort}</option>}</select><small>更高强度适合复杂策划与长文审查，也会增加等待时间和额度消耗。</small></label>
          <div className="model-test-status">{verified ? `✓ 该模型已通过调用测试 · 调整推理强度可直接保存 · ${new Date(test!.tested_at * 1000).toLocaleString('zh-CN')}` : '该模型尚未测试，请先测试再启用。'}</div>
          <div className="model-actions"><button className="btn" disabled={!!busy || !model || !status?.logged_in || !!status?.stop_reason} onClick={() => act('probe')}>{busy === 'probe' ? '正在调用模型…' : '测试订阅调用'}</button><button className="btn btn-primary" disabled={!!busy || !verified || !active.name.trim()} onClick={() => act('save')}>{busy === 'save' ? '保存中…' : '保存并启用'}</button>{settings.profiles.length > 1 && <button className="btn" disabled={!!busy || active.id === savedId} onClick={() => setSettings({ ...settings, active_id: savedId, profiles: settings.profiles.filter(p => p.id !== active.id) })}>移除档案</button>}</div>
        </div>
      </section>}
      <p className="model-footnote">登录由官方 Codex 管理。文本、策划和原生图片工具使用当前运行时；外部视频、音乐等服务在「能力与集成」中单独显示配置与实测状态。</p>
    </div>
  );
}
