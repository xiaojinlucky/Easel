import { useEffect, useState } from 'react';
import { fetchAuthGuide } from '../lib/api';
import type { AuthGuideSnapshot } from '../lib/api';
import type { Page } from './Sidebar';

export default function AuthGuide({ onNavigate, compact = false }: { onNavigate: (page: Page) => void; compact?: boolean }) {
  const [data, setData] = useState<AuthGuideSnapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setBusy(true);
    setError('');
    fetchAuthGuide()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : '授权状态读取失败'))
      .finally(() => setBusy(false));
  };

  useEffect(() => { load(); }, []);

  const stepClass = (done: boolean) => `auth-guide-step${done ? ' auth-guide-step--done' : ''}`;

  return (
    <section className={`auth-guide${compact ? ' auth-guide--compact' : ''}`}>
      <div className="auth-guide-head">
        <div>
          <div className="auth-guide-kicker">授权引导</div>
          <h2>把能发的通道接上</h2>
          <p>按这三步走：国内平台扫码 → 公众号接口发布 → Postiz 频道授权。每一步都能看到当前状态和下一步。</p>
        </div>
        <button className="btn btn-sm" disabled={busy} onClick={load}>{busy ? '刷新中…' : '刷新状态'}</button>
      </div>
      {error && <div className="notice-error" role="alert">{error}</div>}
      {data && (
        <div className="auth-guide-grid">
          <article className={stepClass(data.platforms_logged > 0)}>
            <div className="auth-guide-num">1</div>
            <div className="auth-guide-body">
              <h3>国内平台扫码登录</h3>
              <p className="auth-guide-status">{data.platforms_logged}/{data.platforms.length} 已登录</p>
              <ul>
                {data.platforms.map((p) => (
                  <li key={p.key}>
                    <span>{p.name}</span>
                    <span className={`badge ${p.loggedIn ? 'badge-ok' : ''}`}>{p.loggedIn ? '已登录' : p.supported ? '未登录' : '待支持'}</span>
                  </li>
                ))}
              </ul>
              <p className="auth-guide-next">{data.platforms.find((p) => !p.loggedIn && p.supported)?.next || '已登录的平台可直接去发布中心发内容。'}</p>
              <button className="btn btn-sm btn-primary" onClick={() => onNavigate('accounts')}>去扫码登录</button>
              <button className="btn btn-sm" onClick={() => onNavigate('publish')}>打开发布中心</button>
            </div>
          </article>
          <article className={stepClass(data.wechat.configured_count > 0)}>
            <div className="auth-guide-num">2</div>
            <div className="auth-guide-body">
              <h3>公众号真实发布</h3>
              <p className="auth-guide-status">
                {data.wechat.configured_count > 0
                  ? `已配置 ${data.wechat.configured_count} 个账号`
                  : '还没填 AppID / AppSecret'}
              </p>
              {data.wechat.last_draft && (
                <p>最近草稿：{data.wechat.last_draft.title || data.wechat.last_draft.media_id}（{data.wechat.last_draft.status}）</p>
              )}
              <p className="auth-guide-next">{data.wechat.next}</p>
              <button className="btn btn-sm btn-primary" onClick={() => onNavigate('wechat')}>
                {data.wechat.can_publish ? '去正式发布' : '去配置并发布'}
              </button>
            </div>
          </article>
          <article className={stepClass(data.postiz.channel_count > 0)}>
            <div className="auth-guide-num">3</div>
            <div className="auth-guide-body">
              <h3>Postiz 频道授权</h3>
              <p className="auth-guide-status">
                {data.postiz.online
                  ? (data.postiz.channel_count ? `已授权 ${data.postiz.channel_count} 个频道` : '服务已连接，还没有频道')
                  : '服务尚未就绪'}
              </p>
              {data.postiz.channels.length > 0 && (
                <ul>
                  {data.postiz.channels.slice(0, 6).map((c) => (
                    <li key={c.id || c.name}>
                      <span>{c.name}</span>
                      <span className={`badge ${c.disabled ? '' : 'badge-ok'}`}>{c.disabled ? '停用' : (c.type || '已授权')}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="auth-guide-next">{data.postiz.next}</p>
              <a className="btn btn-sm btn-primary" href={data.postiz.url} target="_blank" rel="noreferrer">打开 Postiz 授权</a>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
