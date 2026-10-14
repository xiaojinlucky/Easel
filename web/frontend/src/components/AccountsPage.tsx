import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAccounts, startLogin, loginStatus, mediaUrl,
  accountWhoami, logoutAccount, submitLoginSms,
  saveCredentials, getCredentials, startMpLogin, mpLoginStatus,
} from '../lib/api';
import type { AccountItem, AccountWhoami, LoginStatus } from '../lib/api';
import { getWhoamiCache, setWhoamiCache, verifyStale } from '../lib/whoami';


type QRState = {
  platform: string;
  name: string;
  state: string;       // starting | qr_ready | success | expired | error | unknown
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
  success: '已登录',
  expired: '二维码过期了',
  error: '没有登上',
  unknown: '请稍候',
};

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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [err, setErr] = useState('');
  const [qr, setQr] = useState<QRState | null>(null);
  const [qrNonce, setQrNonce] = useState(0);   // 每次登录 +1，稳定缓存 key，避免每次轮询 img 闪烁

  const [busy, setBusy] = useState('');
  const [logoutBusy, setLogoutBusy] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsErr, setSmsErr] = useState('');
  // whoami 结果缓存到 localStorage：打开页面秒显示昵称/头像，不必每次都起浏览器校验
  const [whoami, setWhoami] = useState<Record<string, AccountWhoami | 'loading'>>(() => getWhoamiCache());
  // 凭证式登录（微信公众号 AppID/AppSecret）
  const [cred, setCred] = useState<{ platform: string; name: string } | null>(null);
  const [credForm, setCredForm] = useState({ appId: '', appSecret: '', author: '' });
  const [credBusy, setCredBusy] = useState(false);
  const [credMsg, setCredMsg] = useState('');
  const [credErr, setCredErr] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // 打开页面：拉「快」状态（读 status.json，不起浏览器），随后后台自愈——对缓存缺失/过期的
  // 浏览器平台逐个真校验（whoami），结果到了刷新 UI，并令陈旧的假阴性缓存被真值覆盖。
  const load = useCallback(() => {
    setErr('');
    fetchAccounts()
      .then((list) => {
        if (!aliveRef.current) return;
        setAccounts(list);
        const targets = list
          .filter((a) => a.supported && a.backend !== 'biliup')
          .map((a) => a.platform);
        verifyStale(targets, {
          alive: () => aliveRef.current,
          onUpdate: (platform, r) => setWhoami((w) => ({ ...w, [platform]: r })),
        });
      })
      .catch(() => setErr('账号没加载出来'));
  }, []);

  useEffect(() => { load(); }, [load]);

  // 切回本标签页 / 窗口重新获得焦点时自动重拉账号态——登录/退出后即使漏了一次刷新，切回来也是最新的，
  // 用户无需手动刷新页面。（登录中弹着二维码时不打扰，避免打断轮询。）
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible' && !pollRef.current) load(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const closeQr = useCallback(() => {
    stopPoll();
    setQr(null);
    setSmsCode(''); setSmsErr(''); setSmsBusy(false);
    load();
  }, [stopPoll, load]);

  const submitSms = useCallback(async () => {
    const code = smsCode.replace(/\D/g, '');
    if (code.length < 4) { setSmsErr('输入验证码'); return; }
    setSmsBusy(true); setSmsErr('');
    try {
      await submitLoginSms(qrPlatformRef.current, code);
      setSmsCode('');
      // 乐观切到「验证中」转圈：后端读走码→verifying；成功→success，失败→退回 sms_required 带错误
      setQr((prev) => prev && ({ ...prev, state: 'verifying', message: '' }));
      // 不停轮询：runner 读走验证码填码提交后，state 会转 success / 或退回 sms_required 重试
    } catch {
      setSmsErr('验证码不对');
    } finally {
      setSmsBusy(false);
    }
  }, [smsCode]);

  // 凭证式（公众号）：打开 AppID/AppSecret 表单
  const openCred = useCallback((a: AccountItem) => {
    setCred({ platform: a.platform, name: a.name });
    setCredForm({ appId: '', appSecret: '', author: '' });
    setCredMsg(''); setCredErr('');
    getCredentials(a.platform)
      .then((c) => { if (aliveRef.current && c.configured) setCredMsg('已填写'); })
      .catch(() => { /* 未配置，忽略 */ });
  }, []);

  const closeCred = useCallback(() => { setCred(null); setCredBusy(false); load(); }, [load]);

  const submitCred = useCallback(async () => {
    if (!cred) return;
    const appId = credForm.appId.trim();
    const appSecret = credForm.appSecret.trim();
    if (!appId || !appSecret) { setCredErr('两项都要填'); return; }
    setCredBusy(true); setCredErr(''); setCredMsg('');
    try {
      const r = await saveCredentials(cred.platform, { appId, appSecret, name: cred.name, author: credForm.author.trim() });
      if (r.ok) {
        runWhoami(cred.platform);
        closeCred();
      } else {
        setCredErr('没通过');
      }
    } catch {
      setCredErr('没保存上');
    } finally {
      setCredBusy(false);
    }
  }, [cred, credForm, runWhoami, closeCred]);

  const handleLogin = useCallback(async (a: AccountItem) => {
    if (!a.supported) return;
    if (a.backend === 'wechat-oa') { openCred(a); return; }   // 公众号走凭证表单，不扫码
    setBusy(a.platform);
    setSmsCode(''); setSmsErr('');
    qrPlatformRef.current = a.platform;
    setQrNonce((n) => n + 1);
    try {
      const res = await startLogin(a.platform);
      if (res.mode === 'terminal') {
        setErr('请在电脑上完成登录');
        return;
      }
      if (res.mode === 'credentials') { openCred(a); return; }
      setQr({ platform: a.platform, name: a.name, state: res.state || 'starting',
              message: '', qr: res.qr || '' });
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const s = await loginStatus(a.platform);
          setQr((prev) => prev && ({ ...prev, state: s.state, message: '', qr: s.qr, qrTs: s.qrTs }));
          if (['success', 'expired', 'error'].includes(s.state)) {
            stopPoll();
            if (s.state === 'success') runWhoami(a.platform);   // 登录成功即拉账号信息
          }
        } catch { /* 忽略单次轮询失败 */ }
      }, 2000);
    } catch {
      setErr('登录没开始');
    } finally {
      setBusy('');
    }
  }, [stopPoll, runWhoami]);

  const markWechatLoggedIn = useCallback((platform: string) => {
    setAccounts((list) => list.map((x) => x.platform === platform ? { ...x, loggedIn: true } : x));
    setWhoami((w) => { const n = { ...w }; delete n[platform]; return n; });
    setWhoamiCache(platform, null);
    runWhoami(platform);
    load();
  }, [runWhoami, load]);

  // 公众号后台扫码登录（数据中心取数用，独立于 AppID 凭证）
  const handleMpLogin = useCallback(async (a: AccountItem) => {
    setBusy(a.platform + ':mp');
    setSmsCode(''); setSmsErr('');
    setQrNonce((n) => n + 1);
    try {
      const res = await startMpLogin(a.platform);
      setQr({ platform: a.platform, name: a.name, state: res.state || 'starting',
              message: '', qr: res.qr || '', qrTs: res.qrTs });
      stopPoll();
      const applyStatus = (s: LoginStatus): boolean => {
        setQr((prev) => prev && ({ ...prev, state: s.state, message: '', qr: s.qr, qrTs: s.qrTs }));
        if (!['success', 'expired', 'error'].includes(s.state)) return false;
        stopPoll();
        if (s.state === 'success') markWechatLoggedIn(a.platform);
        return true;
      };
      if (applyStatus(res)) return;
      const tick = async () => {
        try {
          const s = await mpLoginStatus(a.platform);
          applyStatus(s);
        } catch { /* 忽略单次轮询失败 */ }
      };
      void tick();
      pollRef.current = setInterval(() => { void tick(); }, 500);
    } catch {
      setErr('登录没开始');
    } finally {
      setBusy('');
    }
  }, [stopPoll, markWechatLoggedIn]);

  const handleLogout = useCallback(async (a: AccountItem) => {
    if (!window.confirm(`退出「${a.name}」？`)) return;
    setLogoutBusy(a.platform);
    try {
      await logoutAccount(a.platform);
      // 内存态立即翻未登录（同登录路径），不等 load() 回来
      setAccounts((list) => list.map((x) => x.platform === a.platform ? { ...x, loggedIn: false } : x));
      setWhoami((w) => { const n = { ...w }; delete n[a.platform]; return n; });
      setWhoamiCache(a.platform, null);
      load();
    } catch {
      setErr('没退出');
    } finally {
      setLogoutBusy('');
    }
  }, [load]);

  // 卡片真实登录态：whoami 权威（已返回则以它为准，自愈假阳性），否则用后端 last-known。
  // 公众号(wechat-oa)例外：后端查 mp 会话即真值(快且权威)，直接用它，避免浏览器里过期的 whoami 缓存把已登录盖成未登录。
  const effLoggedIn = (a: AccountItem): boolean => {
    if (a.backend === 'wechat-oa') return a.loggedIn;
    const w = whoami[a.platform];
    if (w && w !== 'loading') return w.loggedIn;
    return a.loggedIn;
  };

  const badge = (a: AccountItem) => {
    if (!a.supported) return <span className="badge">暂不可用</span>;
    if (effLoggedIn(a)) return <span className="badge badge-ok">已登录</span>;
    return <span className="badge">未登录</span>;
  };

  return (
    <div className="accounts-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 className="page-title">账号</h1>
        <button className="btn btn-sm" onClick={load}>刷新</button>
      </div>

      {err && <div style={{ color: 'var(--red)', fontSize: 14, marginTop: 12 }}>{err}</div>}

      <div className="accounts-grid">
        {accounts.map((a) => {
          const w = whoami[a.platform];
          const info = w && w !== 'loading' ? w : null;
          const logged = effLoggedIn(a);
          return (
            <div key={a.platform} className="card account-card" style={{ opacity: a.supported ? 1 : 0.6 }}>
              <div className="account-card-head">
                <span className="account-card-name">{a.name}</span>
                {badge(a)}
              </div>

              {logged && info && (
                <div className="account-identity">
                  <Avatar url={info.avatar} name={info.name || a.name} />
                  <span className="account-nick">{info.name || '（已登录）'}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                {logged ? (
                  <button className="btn btn-sm btn-ghost btn-block"
                    disabled={logoutBusy === a.platform}
                    onClick={() => handleLogout(a)}>
                    {logoutBusy === a.platform ? '退出中…' : '退出'}
                  </button>
                ) : (
                  // 公众号与其它平台统一：都走扫码登录（公众号扫的是后台会话，用于发布+数据）
                  <button
                    className={`btn btn-block ${a.supported ? 'btn-primary' : ''}`}
                    disabled={!a.supported || busy === a.platform || busy === a.platform + ':mp'}
                    onClick={() => (a.backend === 'wechat-oa' ? handleMpLogin(a) : handleLogin(a))}>
                    {(busy === a.platform || busy === a.platform + ':mp') ? '启动中…' : '登录'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {qr && (
        <div className="overlay" onClick={closeQr}>
          <div className="modal" style={{ width: 360, maxWidth: '100%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px' }}>{qr.name}</h3>
            <div style={{ fontSize: 14, marginBottom: 14,
              color: qr.state === 'success' ? 'var(--green)'
                : ['error', 'expired'].includes(qr.state) ? 'var(--red)' : 'var(--text-secondary)' }}>
              {STATE_LABEL[qr.state] || '请稍候'}
            </div>
            {qr.state === 'sms_required' ? (
              <div style={{ padding: '6px 4px 2px' }}>
                <input
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitSms(); }}
                  placeholder="短信验证码" inputMode="numeric" autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center',
                    letterSpacing: 6, fontSize: 20, padding: '10px 12px',
                    border: '1px solid var(--border)', borderRadius: 8 }} />
                {smsErr && <div style={{ color: 'var(--red)', fontSize: 14, marginTop: 6 }}>{smsErr}</div>}
                <button className="btn btn-primary btn-block" style={{ marginTop: 12 }}
                  disabled={smsBusy} onClick={submitSms}>
                  {smsBusy ? '提交中…' : '提交验证码'}
                </button>
              </div>
            ) : qr.state === 'window_login' ? (
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '20px 8px', lineHeight: 1.6 }}>
                在弹出的窗口里扫码
                {qr.qr ? (
                  <img className="qr-img" style={{ marginTop: 12 }}
                    src={`${mediaUrl(qr.qr)}?v=${qr.qrTs || qrNonce}`} alt="登录二维码" />
                ) : null}
              </div>
            ) : qr.state === 'qr_ready' && qr.qr ? (
              <img className="qr-img" src={`${mediaUrl(qr.qr)}?v=${qr.qrTs || qrNonce}`} alt="登录二维码" />
            ) : qr.state === 'scanned' ? (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />正在登录</div>
            ) : qr.state === 'verifying' ? (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />正在登录</div>
            ) : qr.state === 'success' ? (
              null
            ) : ['error', 'expired'].includes(qr.state) ? (
              null
            ) : (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" /></div>
            )}
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={closeQr}>{qr.state === 'success' ? '完成' : '关闭'}</button>
            </div>
          </div>
        </div>
      )}

      {cred && (
        <div className="overlay" onClick={closeCred}>
          <div className="modal" style={{ width: 420, maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px' }}>{cred.name}</h3>
            {credMsg && <div style={{ fontSize: 14, color: 'var(--green)', marginBottom: 10 }}>{credMsg}</div>}
            <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>AppID</label>
            <input value={credForm.appId} autoFocus
              onChange={(e) => setCredForm((f) => ({ ...f, appId: e.target.value.trim() }))}
              placeholder="wx..." style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                margin: '4px 0 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
            <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>AppSecret</label>
            <input value={credForm.appSecret} type="password"
              onChange={(e) => setCredForm((f) => ({ ...f, appSecret: e.target.value.trim() }))}
              placeholder="密钥" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                margin: '4px 0 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
            <label style={{ fontSize: 14, color: 'var(--text-secondary)' }}>作者</label>
            <input value={credForm.author}
              onChange={(e) => setCredForm((f) => ({ ...f, author: e.target.value }))}
              placeholder="文章署名" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                margin: '4px 0 4px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
            {credErr && <div style={{ color: 'var(--red)', fontSize: 14, marginTop: 8 }}>{credErr}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={credBusy} onClick={submitCred}>
                {credBusy ? '保存中…' : '保存'}
              </button>
              <button className="btn" onClick={closeCred}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
