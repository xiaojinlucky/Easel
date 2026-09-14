import type { Page } from './Sidebar';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPlatforms, startLogin, loginStatus, mediaUrl,
  accountWhoami, logoutAccount, submitLoginSms,
} from '../lib/api';
import type { AccountWhoami, PlatformItem } from '../lib/api';
import { getWhoamiCache, setWhoamiCache, verifyStale } from '../lib/whoami';

type QRState = {
  platform: string;
  name: string;
  state: string;       // starting | window_login | qr_ready | success | expired | error | unknown
  message: string;
  qr: string;          // outputs 相对路径
  qrTs?: number;       // 二维码文件 mtime，作 img 缓存键：码刷新一次就变，避免看到过期旧码
};

const STATE_LABEL: Record<string, string> = {
  starting: '启动中…',
  window_login: '请在弹出的窗口里扫码',
  qr_ready: '请扫码',
  scanned: '扫码成功',
  sms_required: '需短信验证',
  verifying: '验证中…',
  success: '登录成功 ✅',
  expired: '二维码已过期',
  error: '登录出错',
  unknown: '等待中…',
};

function loginFailHint(message: string): string {
  if (/300012|风险 IP|IP 存在风险|干净网络/.test(message)) {
    return '这是平台对当前网络的限制，不是登录没记住。请改用手机热点或家宽后再扫；一旦成功，登录会保存在本机。';
  }
  return '可关闭后重试。';
}

// 能力字段 → 人话。只做「值 → 标签」的映射，不判断具体平台。
const AUTH_LABEL: Record<string, string> = {
  qrcode: '扫码登录', credential: 'AppID 配置', service: '服务授权',
};
const PUBLISH_LABEL: Record<string, string> = {
  direct: '直接发布', draft_then_publish: '先草稿后发布', scheduled: '排期发布',
};

// 状态徽标措辞按接入方式区分：扫码是「登录」、凭据是「配置」、服务是「授权」
const BADGE_LABEL: Record<string, { on: string; off: string }> = {
  qrcode: { on: '✓ 已登录', off: '未登录' },
  credential: { on: '✓ 已配置', off: '未配置' },
  service: { on: '✓ 已授权', off: '未授权' },
};
// 注册表引入新的 authKind、这里还没补措辞时的兜底：用中性说法，
// 不要借扫码那套（否则「中转服务」会被说成「未登录」）
const BADGE_FALLBACK = { on: '✓ 已接入', off: '未接入' };

// 三种接入方式 = 三个分组，各配一句「这一步在做什么」。
// 说明贴在分组标题旁，而不是堆成一个顶部引导块 —— 那会与下面的卡片枚举同一批平台（见 工具复用台账.md A9）。
const GROUPS: { kind: string; title: string; note: string }[] = [
  { kind: 'qrcode', title: '扫码登录', note: '弹出本机浏览器扫码；成功后登录保存在本机，不用每次重登' },
  { kind: 'credential', title: '账号凭据', note: '填写一次 AppID / AppSecret 即可，重启不会丢；公众号后台需给本机 IP 加白名单' },
  { kind: 'service', title: '中转服务', note: '第三方服务授权，负责排期与更多渠道' },
];
const KNOWN_KINDS = new Set(GROUPS.map((g) => g.kind));
// 兜底分组：注册表将来引入新的 authKind 时，卡片不会静默从页面上消失
const RENDER_GROUPS = [...GROUPS, { kind: '', title: '其他', note: '注册表新增的未归类接入方式' }];

type Filter = 'all' | 'todo' | 'done';

/** 头像：有 URL 就显示图（加载失败退回首字），否则显示昵称/平台名首字。 */
function Avatar({ url, name }: { url?: string; name: string }) {
  const [broken, setBroken] = useState(false);
  const initial = (name || '?').trim().charAt(0);
  if (url && !broken) {
    return <img className="account-avatar" src={url} alt={name}
      referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  }
  return <div className="account-avatar account-avatar-fallback">{initial}</div>;
}

export default function AccountsPage({ onNavigate, onNewProfile }: { onNavigate: (page: Page) => void; onNewProfile: () => void }) {
  const [platforms, setPlatforms] = useState<PlatformItem[] | null>(null);
  const [err, setErr] = useState('');
  const [qr, setQr] = useState<QRState | null>(null);
  const [qrNonce, setQrNonce] = useState(0);   // 每次登录 +1，稳定缓存 key，避免每次轮询 img 闪烁
  const [terminalMsg, setTerminalMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [logoutBusy, setLogoutBusy] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsErr, setSmsErr] = useState('');
  const [filter, setFilter] = useState<Filter>('all');   // 全部 / 待处理 / 已接入
  // whoami 结果缓存到 localStorage：打开页面秒显示昵称/头像，不必每次都起浏览器校验
  const [whoami, setWhoami] = useState<Record<string, AccountWhoami | 'loading'>>(() => getWhoamiCache());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aliveRef = useRef(true);
  const qrPlatformRef = useRef('');   // 当前登录中的平台，供 submitSms 稳定引用

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  // 真校验某平台登录态 + 拉昵称/头像（后端起浏览器，数秒）；手动「校验账号」或登录成功后调
  const runWhoami = useCallback((platform: string) => {
    setWhoami((w) => ({ ...w, [platform]: 'loading' }));
    accountWhoami(platform)
      .then((r) => { if (aliveRef.current) { setWhoami((w) => ({ ...w, [platform]: r })); setWhoamiCache(platform, r); } })
      .catch(() => {
        if (aliveRef.current) setWhoami((w) => { const n = { ...w }; delete n[platform]; return n; });
      });
  }, []);

  // 打开页面：拉平台注册表（含各平台实时状态），随后后台自愈——对缓存缺失/过期的
  // 扫码平台逐个真校验（whoami）。凭据型平台（公众号）不走扫码通道，不参与 whoami。
  const load = useCallback(() => {
    setErr('');
    fetchPlatforms()
      .then(({ platforms: list }) => {
        if (!aliveRef.current) return;
        // 后端契约是数组；万一返回 null/undefined 也不能让页面停在永久 spinner（`platforms.length` 会抛）
        const rows = Array.isArray(list) ? list : [];
        setPlatforms(rows);
        const targets = rows
          .filter((p) => p.supported && p.backend !== 'biliup' && p.authKind === 'qrcode')
          .map((p) => p.id);
        verifyStale(targets, {
          alive: () => aliveRef.current,
          onUpdate: (platform, r) => setWhoami((w) => ({ ...w, [platform]: r })),
        });
      })
      .catch((e) => {
        if (!aliveRef.current) return;
        // 刷新失败时保留屏幕上已有的卡片（别把 7 张卡清成空态）；仅首次加载失败才落到空态
        setPlatforms((prev) => prev ?? []);
        setErr(e instanceof Error ? e.message : '加载平台列表失败');
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const stopBgPoll = useCallback(() => {
    if (bgPollRef.current) { clearInterval(bgPollRef.current); bgPollRef.current = null; }
  }, []);

  useEffect(() => () => { stopPoll(); stopBgPoll(); }, [stopPoll, stopBgPoll]);

  const closeQr = useCallback(() => {
    const plat = qrPlatformRef.current;
    stopPoll();
    setQr(null);
    setSmsCode(''); setSmsErr(''); setSmsBusy(false);
    if (plat) {
      setWhoamiCache(plat, null);
      setWhoami((w) => { const n = { ...w }; delete n[plat]; return n; });
      stopBgPoll();
      bgPollRef.current = setInterval(async () => {
        try {
          const s = await loginStatus(plat);
          if (['success', 'expired', 'error'].includes(s.state)) {
            stopBgPoll();
            if (s.state === 'success') runWhoami(plat);
            load();
          }
        } catch { /* 忽略单次轮询失败 */ }
      }, 2000);
    }
    fetchPlatforms()
      .then(({ platforms: list }) => {
        if (!aliveRef.current) return;
        setPlatforms(Array.isArray(list) ? list : []);
      })
      .catch(() => { /* 关弹层时刷新失败不挡后台轮询 */ });
  }, [stopPoll, stopBgPoll, load, runWhoami]);

  const submitSms = useCallback(async () => {
    const code = smsCode.replace(/\D/g, '');
    if (code.length < 4) { setSmsErr('请输入手机收到的验证码'); return; }
    setSmsBusy(true); setSmsErr('');
    try {
      await submitLoginSms(qrPlatformRef.current, code);
      setSmsCode('');
      // 乐观切到「验证中」转圈：后端读走码→verifying；成功→success，失败→退回 sms_required 带错误
      setQr((prev) => prev && ({ ...prev, state: 'verifying', message: '正在验证验证码…' }));
      // 不停轮询：runner 读走验证码填码提交后，state 会转 success / 或退回 sms_required 重试
    } catch (e) {
      setSmsErr(e instanceof Error ? e.message : '提交验证码失败');
    } finally {
      setSmsBusy(false);
    }
  }, [smsCode]);

  const handleLogin = useCallback(async (p: PlatformItem) => {
    if (!p.supported) return;
    setTerminalMsg('');
    setBusy(p.id);
    setSmsCode(''); setSmsErr('');
    qrPlatformRef.current = p.id;
    setQrNonce((n) => n + 1);
    setWhoamiCache(p.id, null);
    setWhoami((w) => { const n = { ...w }; delete n[p.id]; return n; });
    stopBgPoll();
    try {
      const res = await startLogin(p.id);
      if (res.mode === 'terminal') {
        setTerminalMsg(res.message || '请在终端登录');
        return;
      }
      setQr({ platform: p.id, name: p.name, state: res.state || 'starting',
              message: res.message || '', qr: res.qr || '' });   // qrTs 由随后的轮询填入
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const s = await loginStatus(p.id);
          setQr((prev) => prev && ({ ...prev, state: s.state, message: s.message, qr: s.qr, qrTs: s.qrTs }));
          if (['success', 'expired', 'error'].includes(s.state)) {
            stopPoll();
            if (s.state === 'success') runWhoami(p.id);   // 登录成功即拉账号信息
          }
        } catch { /* 忽略单次轮询失败 */ }
      }, 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '启动登录失败');
    } finally {
      setBusy('');
    }
  }, [stopPoll, stopBgPoll, runWhoami]);

  const handleLogout = useCallback(async (p: PlatformItem) => {
    if (!window.confirm(`确定退出「${p.name}」的登录？登录态将被清除，下次发布需重新扫码。`)) return;
    setLogoutBusy(p.id);
    try {
      await logoutAccount(p.id);
      setWhoami((w) => { const n = { ...w }; delete n[p.id]; return n; });
      setWhoamiCache(p.id, null);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '退出登录失败');
    } finally {
      setLogoutBusy('');
    }
  }, [load]);

  // 卡片真实登录态：whoami 权威（已返回则以它为准，自愈假阳性），否则用后端 last-known
  const effLoggedIn = (p: PlatformItem): boolean => {
    const w = whoami[p.id];
    if (w && w !== 'loading') return w.loggedIn;
    return p.loggedIn;
  };

  // 待处理 = 支持但尚未接入（含 whoami 校验出「已掉线」的情况）
  const isTodo = (p: PlatformItem): boolean => p.supported && !effLoggedIn(p);

  // 状态徽标：措辞按接入方式区分（登录 / 配置 / 授权），不判断具体平台
  const badge = (p: PlatformItem) => {
    const label = BADGE_LABEL[p.authKind] || BADGE_FALLBACK;
    if (!p.supported) return <span className="badge">待重写</span>;
    if (p.authKind === 'qrcode' && whoami[p.id] === 'loading') return <span className="badge">校验中…</span>;
    if (effLoggedIn(p)) return <span className="badge badge-ok">{label.on}</span>;
    return <span className="badge">{label.off}</span>;
  };

  // 卡片操作区：有独立工作区 → 进入工作区；有外链 → 打开外部服务；否则走扫码登录 / 校验 / 退出
  const actions = (p: PlatformItem) => {
    if (p.workspace) {
      return (
        <button className="btn btn-sm btn-primary btn-block" onClick={() => onNavigate(p.workspace as Page)}>
          进入工作区 →
        </button>
      );
    }
    // 外链型通道（如 Postiz）：授权在对方界面完成，这里只做跳转
    if (p.actionUrl) {
      return (
        <a className="btn btn-sm btn-primary btn-block" href={p.actionUrl} target="_blank" rel="noreferrer">
          {effLoggedIn(p) ? '打开管理频道' : (p.actionLabel || '打开服务')} →
        </a>
      );
    }
    const w = whoami[p.id];
    const logged = effLoggedIn(p);
    if (logged) {
      return (
        <>
          <button className="btn btn-sm" style={{ flex: 1 }}
            disabled={busy === p.id || w === 'loading'}
            onClick={() => runWhoami(p.id)}>
            {w === 'loading' ? '校验中…' : '校验账号'}
          </button>
          <button className="btn btn-sm btn-ghost" style={{ flex: 1 }}
            disabled={logoutBusy === p.id}
            onClick={() => handleLogout(p)}>
            {logoutBusy === p.id ? '退出中…' : '退出登录'}
          </button>
        </>
      );
    }
    return (
      <button
        className={`btn btn-block ${p.supported ? 'btn-primary' : ''}`}
        disabled={!p.supported || busy === p.id}
        onClick={() => handleLogin(p)}>
        {busy === p.id ? '启动中…' : '登录'}
      </button>
    );
  };

  /** 单张通道卡片。分组渲染复用同一份，避免两处 JSX 漂移。 */
  const renderCard = (p: PlatformItem) => {
    const w = whoami[p.id];
    const info = w && w !== 'loading' ? w : null;
    const logged = effLoggedIn(p);
    const showIdentity = logged && info && p.authKind === 'qrcode';
    // 能力值取不到标签就退回原始值：宁可显示原始能力名，也不要静默少一行信息
    const meta = [AUTH_LABEL[p.authKind] || p.authKind, PUBLISH_LABEL[p.publishMode] || p.publishMode]
      .filter(Boolean).join(' · ');
    return (
      <div key={p.id} className="card account-card" style={{ opacity: p.supported ? 1 : 0.6 }}>
        <div className="account-card-head">
          <span className="account-card-name">{p.name}</span>
          {badge(p)}
        </div>

        {showIdentity && (
          <div className="account-identity">
            <Avatar url={info.avatar} name={info.name || p.name} />
            <span className="account-nick">{info.name || '（已登录）'}</span>
          </div>
        )}
        {!showIdentity && (
          <div className="account-card-note">{p.note || `后端：${p.backend}`}</div>
        )}
        {meta && <div className="account-card-meta">{meta}</div>}
        {(p.panels ?? []).length > 0 && (
          <div className="account-card-meta">专属面板：{(p.panels ?? []).map((x) => x.label).join(' / ')}</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          {actions(p)}
        </div>
      </div>
    );
  };

  // 汇总口径只算一次，头部 / 筛选芯片 / 分组计数共用，避免三处各算各的
  const total = platforms?.length ?? 0;
  const doneCount = (platforms ?? []).filter(effLoggedIn).length;
  const todoCount = (platforms ?? []).filter(isTodo).length;
  const firstTodo = (platforms ?? []).find((p) => isTodo(p) && p.authKind !== 'service');
  const inGroup = (p: PlatformItem, kind: string) =>
    kind ? p.authKind === kind : !KNOWN_KINDS.has(p.authKind);
  const FILTERS: [Filter, string][] = [
    ['all', `全部 ${total}`], ['todo', `待处理 ${todoCount}`], ['done', `已接入 ${doneCount}`],
  ];

  return (
    <div className="accounts-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 className="page-title">社交媒体平台</h1>
          <button className="btn btn-sm" onClick={onNewProfile}>从账号主页建立档案 →</button>
          <p className="page-subtitle">
            {platforms === null
              ? '正在读取通道状态…'
              : total === 0 && err
                /* 读失败时不能说「全部就绪」——两句话会互相打脸 */
                ? '通道状态没读到，看下面的提示。'
                : <>已接入 <b>{doneCount}</b> / {total} 个通道{todoCount > 0 ? <>，还有 <b>{todoCount}</b> 个待处理</> : '，全部就绪'}。</>}
            <br />
            ⚠️ 平台可能对机房/代理 IP 判风险导致二维码弹不出，需干净/家宽 IP，或在正常网络登录后拷贝登录态目录。
          </p>
        </div>
        <button className="btn btn-sm" onClick={load}>⟳ 刷新</button>
      </div>

      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{err}</div>}
      {terminalMsg && (
        <div className="card" style={{ padding: 13, fontSize: 13, marginTop: 14 }}>{terminalMsg}</div>
      )}

      {platforms === null ? (
        <div className="loading" style={{ padding: 40 }}><div className="spinner" />正在读取平台列表…</div>
      ) : platforms.length === 0 ? (
        err ? null : (
          <div className="card" style={{ padding: 16, fontSize: 13, marginTop: 14 }}>
            没有读到任何平台。请确认本机服务已启动，或点右上角「⟳ 刷新」重试。
          </div>
        )
      ) : (
        <>
          {/* 引导只在「一个都没接入」时出现（空状态），有账号即收敛为上面的汇总行 */}
          {doneCount === 0 && !err && (
            <div className="notice-hint">
              还没有接入任何通道。建议从上往下走：先扫码登录内容平台 → 再填公众号凭据 → 最后连 Postiz 中转。
              {firstTodo && <> 也可以直接点下面 <b>{firstTodo.name}</b> 卡片的「登录」开始。</>}
            </div>
          )}

          {total > 1 && (
            <div className="chip-row">
              {FILTERS.map(([key, label]) => (
                <button key={key} className={`chip ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {RENDER_GROUPS.map((g) => {
            const all = platforms.filter((p) => inGroup(p, g.kind));
            if (all.length === 0) return null;
            const list = all.filter((p) =>
              filter === 'all' ? true : filter === 'todo' ? isTodo(p) : effLoggedIn(p));
            return (
              <section key={g.kind || 'other'} className="platform-group">
                <div className="platform-group-head">
                  <span className="platform-group-title">{g.title}</span>
                  <span className="platform-group-note">{g.note}</span>
                  <span className="platform-group-count">
                    {all.filter(effLoggedIn).length}/{all.length} 已就绪
                  </span>
                </div>
                {list.length === 0 ? (
                  <div className="platform-group-empty">
                    该分组下没有「{filter === 'todo' ? '待处理' : '已接入'}」的通道。
                  </div>
                ) : (
                  <div className="accounts-grid">{list.map(renderCard)}</div>
                )}
              </section>
            );
          })}
        </>
      )}

      {qr && (
        <div className="overlay" onClick={closeQr}>
          <div className="modal" style={{ width: 360, maxWidth: '100%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px' }}>登录 {qr.name}</h3>
            <div style={{ fontSize: 13, marginBottom: 14,
              color: qr.state === 'success' ? 'var(--green)'
                : ['error', 'expired'].includes(qr.state) ? 'var(--red)' : 'var(--text-secondary)' }}>
              {STATE_LABEL[qr.state] || qr.state}{qr.message ? ` — ${qr.message}` : ''}
            </div>
            {qr.state === 'sms_required' ? (
              <div style={{ padding: '6px 4px 2px' }}>
                <div style={{ fontSize: 13, marginBottom: 10,
                  color: /错误|过期|失败|重新|未找到|未完成|不正确|失效/.test(qr.message || '')
                    ? 'var(--red)' : 'var(--text-secondary)' }}>
                  {qr.message || '平台风控要求短信验证，验证码已发到你手机，请输入：'}
                </div>
                <input
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitSms(); }}
                  placeholder="短信验证码" inputMode="numeric" autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center',
                    letterSpacing: 6, fontSize: 20, padding: '10px 12px',
                    border: '1px solid var(--border)', borderRadius: 8 }} />
                {smsErr && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{smsErr}</div>}
                <button className="btn btn-primary btn-block" style={{ marginTop: 12 }}
                  disabled={smsBusy} onClick={submitSms}>
                  {smsBusy ? '提交中…' : '提交验证码'}
                </button>
              </div>
            ) : qr.state === 'window_login' ? (
              <div style={{ padding: 12 }}>
                <div className="loading" style={{ padding: 16 }}>
                  <div className="spinner" />
                  请到弹出的浏览器窗口里扫码，不要关掉那个窗口。成功后登录会保存在本机。
                </div>
                {qr.qr ? (
                  <img className="qr-img" src={`${mediaUrl(qr.qr)}?v=${qr.qrTs || qrNonce}`} alt="登录二维码" />
                ) : null}
              </div>
            ) : qr.state === 'qr_ready' && qr.qr ? (
              <img className="qr-img" src={`${mediaUrl(qr.qr)}?v=${qr.qrTs || qrNonce}`} alt="登录二维码" />
            ) : qr.state === 'scanned' ? (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />扫码成功，正在跳转验证…（首次可能等十几秒）</div>
            ) : qr.state === 'verifying' ? (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />正在验证验证码，登录中…</div>
            ) : qr.state === 'success' ? (
              <div style={{ fontSize: 48, padding: 40 }}>✅</div>
            ) : ['error', 'expired'].includes(qr.state) ? (
              <div style={{ fontSize: 13, color: 'var(--red)', padding: 30 }}>
                {qr.message || '登录失败'}<br />{loginFailHint(qr.message || '')}
              </div>
            ) : (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />正在打开登录窗口…</div>
            )}
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={closeQr}>{qr.state === 'success' ? '完成' : '关闭'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
