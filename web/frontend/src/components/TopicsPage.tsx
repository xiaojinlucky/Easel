import { useEffect, useRef, useState } from 'react';
import { IconCompass, IconTrash } from './icons';
import { dismissWander, submitWander, useWanderJob } from '../lib/liveTasks';

// 灵感漫步（对齐 Beav 的 nav.wander 页内模式）：
// 从知识库随机抽素材 → 模型找它们之间不显眼但成立的关联 → 给出可直接做的选题方向。
// 与「选题库」的分工：选题库是你自己收藏的选题；这里是机器帮你撞出来的。
//
// 一次漫步要跑几十秒，所以任务做成了后台 job：状态存在 lib/liveTasks 的模块级 store 里，
// 切到别的板块再回来、甚至刷新页面，进度都还在。

type TopicSource = { id: string; title: string; url: string; platform: string; tags: string[] };
type TopicOption = { title: string; content_direction: string; connections: string[]; audience: string };
type Topic = {
  id: string; createdAt: number; mode: string; direction: string; anchorId: string;
  title: string; options: TopicOption[]; sources: TopicSource[]; fingerprint: string;
};
type Status = { total: number; pool: number; ready: boolean; min_sources: number };
type PoolItem = { id: string; title: string; platform: string; tags?: string[] };

async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const verb = method ?? (body === undefined ? 'GET' : 'POST');
  const init: RequestInit = verb === 'GET' ? {} : { method: verb, headers: { 'Content-Type': 'application/json' } };
  if (verb !== 'GET' && body !== undefined) init.body = JSON.stringify(body);
  const response = await fetch('/api/topics' + path, init);
  const value = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof (value as { detail?: string }).detail === 'string' ? (value as { detail: string }).detail : '请求失败');
  }
  return value as T;
}

const MODES = [
  { id: 'random', label: '随机漫步', hint: '随手抓几条，看看能撞出什么' },
  { id: 'direction', label: '按方向', hint: '给一个方向，只在相关知识里找' },
  { id: 'anchor', label: '从一条出发', hint: '以某条素材为锚点，找它的邻居' },
];

export default function TopicsPage({ onDraftToChat }: { onDraftToChat: (text: string, stage?: string) => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [mode, setMode] = useState('random');
  const [direction, setDirection] = useState('');
  const [anchorId, setAnchorId] = useState('');
  const [error, setError] = useState('');
  // 用户点开的往期记录。null 时展示刚跑完的 job 结果。
  const [viewing, setViewing] = useState<Topic | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // 后端还停在旧版本（没有 /wander/jobs）时说清楚，比让用户点完干等 45 秒好
  const [staleBackend, setStaleBackend] = useState(false);

  const job = useWanderJob<Topic>();
  const running = job?.status === 'running';
  // 提交中也要挡住重复点击，并把按钮文案换成「提交中…」
  const busy = running || job?.status === 'submitting';
  const current = viewing ?? (job?.status === 'done' ? job.topic : null);
  const shownError = error || (job?.status === 'error' ? job.error : '');

  async function reload() {
    const [stats, list, sources] = await Promise.all([
      api<Status>('/status'),
      api<{ items: Topic[] }>(''),
      fetch('/api/research/sources?limit=200&state=saved').then((r) => r.json()).catch(() => ({ items: [] })),
    ]);
    setStatus(stats);
    setTopics(list.items);
    setPool((sources.items || []) as PoolItem[]);
  }

  useEffect(() => { reload().catch((e) => setError((e as Error).message)); }, []);

  useEffect(() => {
    // 只认 404：网络抖动不要误报「后端是旧的」
    fetch('/api/topics/wander/jobs')
      .then((response) => setStaleBackend(response.status === 404))
      .catch(() => {});
  }, []);

  // 秒数从 job.createdAt 推算，而不是组件内从 0 数：切走再回来不会归零
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  const elapsed = running && job ? Math.max(0, Math.floor(now / 1000 - job.createdAt)) : 0;

  // 任务结束（可能是在别的板块跑完的，所以在这里收口）：服务端 catalog 才是真源，对齐一次就够
  const settled = useRef('');
  useEffect(() => {
    // submitting 不是终态：这时候去 reload 只会白跑一次
    if (!job || job.status === 'running' || job.status === 'submitting') return;
    if (settled.current === job.id) return;
    settled.current = job.id;
    // 刚跑完的结果优先展示：不清掉 viewing，点开过的旧记录会把新结果一直盖住
    setViewing(null);
    reload().catch(() => {});
  }, [job]);

  async function wander() {
    if (mode === 'anchor' && !anchorId) { setError('先选一条锚点素材。'); return; }
    setError(''); setViewing(null);
    try {
      // 提交即返回，模型在本机后台跑；页面切走也不影响
      await submitWander({
        direction: mode === 'direction' ? direction.trim() : '',
        anchor_id: mode === 'anchor' ? anchorId : '',
        count: 4, topic_count: 3,
      });
    } catch (e) { setError((e as Error).message); }
  }

  async function remove(topic: Topic) {
    if (!window.confirm('删除这条漫步记录？')) return;
    try {
      await api('/' + topic.id, undefined, 'DELETE');
      setTopics((prev) => prev.filter((t) => t.id !== topic.id));
      if (viewing?.id === topic.id) setViewing(null);
    } catch (e) { setError((e as Error).message); }
  }

  function toChat(topic: Topic, option?: TopicOption) {
    const lines = [
      `围绕选题「${option?.title || topic.title}」写一条可以直接发的笔记。`,
      option?.content_direction ? `方向：${option.content_direction}` : '',
      option?.audience ? `给谁看：${option.audience}` : '',
      '',
      '参考素材（只使用其中的事实，不要编造数据与出处）：',
      ...topic.sources.map((s, i) => `#${i + 1} ${s.title}${s.url ? `（${s.url}）` : ''}`),
    ].filter(Boolean);
    onDraftToChat(lines.join('\n'), 'produce');
  }

  const modeHint = MODES.find((m) => m.id === mode)?.hint || '';

  return <div className="research-page topic-page">
    <div className="model-heading">
      <div>
        <span className="model-eyebrow">从已有素材里撞出新角度</span>
        <h2>灵感漫步</h2>
        <p>从知识库随机抽几条素材，让本机模型找出它们之间不显眼但成立的关联，得到可以直接做的选题方向。</p>
      </div>
      <span className="research-engine">素材池 {status?.pool ?? 0} 条 · 往期 {status?.total ?? 0} 次</span>
    </div>

    {staleBackend && (
      <div className="model-alert error wander-backend-stale" role="alert">
        这一页暂时开不了。请先退出工作台，再重新打开，然后回来。
      </div>
    )}

    {status && !status.ready && (
      <div className="model-alert error" role="alert">
        知识库里有正文的素材还不够（现在 {status.pool} 条，至少 {status.min_sources} 条）。先去「知识库」采集几条再来。
      </div>
    )}

    <section className="wander-panel">
      <div className="wander-modes">
        {MODES.map((m) => (
          <button key={m.id} className={`wander-mode ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)} disabled={busy}>{m.label}</button>
        ))}
        <span className="wander-mode-hint">{modeHint}</span>
      </div>

      {mode === 'direction' && (
        <input className="wander-input" value={direction} maxLength={100} disabled={busy}
          onChange={(e) => setDirection(e.target.value)}
          placeholder="例如：医疗器械行业拆解 / 单细胞数据分析踩坑" />
      )}
      {mode === 'anchor' && (
        <select className="wander-input" value={anchorId} disabled={busy}
          onChange={(e) => setAnchorId(e.target.value)}>
          <option value="">选一条锚点素材…</option>
          {pool.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      )}

      <div className="wander-actions">
        <button className="btn btn-primary wander-go" disabled={busy || !status?.ready} onClick={wander}>
          <IconCompass size={15} /> {job?.status === 'submitting' ? '提交中…' : running ? `漫步中… ${elapsed}s` : '开始漫步'}
        </button>
        {busy
          ? <span className="wander-tip">{running ? '正在看这几条笔记，找出能做的题目，通常要一会儿。' : '正在开始…'}<b>可以先去别的页面，回来还能看到进度。</b></span>
          : <span className="wander-tip">任务在后台跑，切走板块或刷新页面都不会丢。</span>}
      </div>
    </section>

    {shownError && <div className="model-alert error" role="alert">{shownError}</div>}

    {running && (
      <>
        <div className="wander-resume">后台任务进行中（已跑 {elapsed}s）。这次漫步不依赖本页面，切走板块或刷新都不会中断。</div>
        <div className="wander-loading">
          <div className="wander-dice">🎲</div>
          <p>正在抽素材、找关联…</p>
        </div>
      </>
    )}

    {current && (
      <section className="wander-result">
        <div className="wander-result-head">
          <h3>本次漫步</h3>
          <span className="research-hint">
            {current.mode === 'anchor' ? '从一条素材出发' : current.mode === 'direction' ? `方向：${current.direction}` : '随机漫步'}
            · 抽了 {current.sources.length} 条素材
          </span>
          <button className="btn" onClick={() => { setViewing(null); if (!busy) dismissWander(); }}>收起结果</button>
        </div>
        {current.options.map((option, i) => (
          <article key={i} className="wander-card">
            <div className="wander-card-top">
              <h4>{option.title}</h4>
              <button className="btn" onClick={() => toChat(current, option)}>带进对话</button>
            </div>
            {option.content_direction && <p className="wander-direction">{option.content_direction}</p>}
            {option.connections.length > 0 && (
              <ul className="wander-connections">
                {option.connections.map((c, j) => <li key={j}>{c}</li>)}
              </ul>
            )}
            {option.audience && <p className="wander-audience">适合：{option.audience}</p>}
          </article>
        ))}
        <div className="wander-sources">
          <span>本次用到的素材</span>
          {current.sources.map((s, i) => (
            <a key={s.id} className="wander-source" href={s.url || undefined} target="_blank" rel="noreferrer">
              #{i + 1} {s.title}
            </a>
          ))}
        </div>
      </section>
    )}

    {topics.length > 0 && (
      <section className="wander-history">
        <h3>往期漫步 · {topics.length}</h3>
        {topics.map((topic) => (
          <div key={topic.id} className="wander-history-row">
            <button className="wander-history-main" onClick={() => setViewing(topic)}>
              <b>{topic.title}</b>
              <small>
                {new Date(topic.createdAt * 1000).toLocaleString('zh-CN')}
                {' · '}{topic.sources.length} 条素材
                {' · '}{topic.options.length} 个方向
              </small>
            </button>
            <button className="session-act danger" title="删除" onClick={() => remove(topic)}><IconTrash size={14} /></button>
          </div>
        ))}
      </section>
    )}
  </div>;
}
