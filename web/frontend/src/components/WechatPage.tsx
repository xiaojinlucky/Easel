import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  checkWechatAccount,
  createWechatDraft,
  fetchOutputs,
  fetchWechat,
  fetchWechatAnalytics,
  fetchWechatMonitor,
  fetchWechatMonitorCredentials,
  mediaUrl,
  onboardWechat,
  prepareWechat,
  publishWechatDraft,
  saveWechatAccount,
  syncResearchFeeds,
} from '../lib/api';
import type {
  OutputNode,
  WechatAccount,
  WechatAnalyticsResponse,
  WechatMonitorState,
  WechatPrepareResponse,
  WechatState,
  WechatOnboardResponse,
  WechatDraftResult,
} from '../lib/api';
import { IconCheck, IconFile, IconImage, IconLayout, IconRefresh, IconSend } from './icons';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function collectCoverFiles(nodes: OutputNode[], out: OutputNode[] = []): OutputNode[] {
  for (const node of nodes) {
    if (node.type === 'file') {
      if (node.kind === 'image' && /\.(jpe?g|png|gif)$/i.test(node.path)) out.push(node);
    } else {
      collectCoverFiles(node.children || [], out);
    }
  }
  return out;
}

function pretty(value: unknown): string {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function accountLabel(account: WechatAccount): string {
  return account.name || account.key;
}

const DRAFT_KEY = 'easel-wechat-article';
function readArticle(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    return Object.fromEntries(Object.entries(value || {}).filter(([, item]) => typeof item === 'string')) as Record<string, string>;
  } catch { return {}; }
}

export default function WechatPage({ onCreate }: { onCreate: (prompt: string, title: string) => void }) {
  const [savedArticle] = useState(readArticle);
  const previewVersion = useRef(0);
  const connectionVersion = useRef(0);
  const alive = useRef(true);
  const [connecting, setConnecting] = useState(false);
  const [onboarding, setOnboarding] = useState<WechatOnboardResponse | null>(null);
  const [state, setState] = useState<WechatState | null>(null);
  const [covers, setCovers] = useState<OutputNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [monitor, setMonitor] = useState<WechatMonitorState | null>(null);
  const [monitorError, setMonitorError] = useState('');
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [monitorBusy, setMonitorBusy] = useState(false);
  const [feedSyncing, setFeedSyncing] = useState(false);

  const [accountKey, setAccountKey] = useState('wechat-main');
  const currentAccount = useRef(accountKey);
  currentAccount.current = accountKey;
  const [accountName, setAccountName] = useState('微信公众号');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [author, setAuthor] = useState(savedArticle.author || '');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<Record<string, unknown> | null>(null);

  const [title, setTitle] = useState(savedArticle.title || '');
  const [body, setBody] = useState(savedArticle.body || '');
  const [digest, setDigest] = useState(savedArticle.digest || '');
  const [prepared, setPrepared] = useState<WechatPrepareResponse | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [coverPath, setCoverPath] = useState(savedArticle.coverPath || '');
  const [drafting, setDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState<WechatDraftResult | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<Record<string, unknown> | null>(null);

  const [analyticsDate, setAnalyticsDate] = useState(today);
  const [analytics, setAnalytics] = useState<WechatAnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [next, outputs] = await Promise.all([fetchWechat(), fetchOutputs()]);
      setState(next);
      setCovers(collectCoverFiles(outputs));
      try {
        setMonitor(await fetchWechatMonitor());
        setMonitorError('');
      } catch (e) {
        setMonitor(null);
        setMonitorError(e instanceof Error ? e.message : '同行订阅服务状态读取失败');
      }
      const selected = next.default_account || next.accounts[0]?.key || 'wechat-main';
      setAccountKey(selected);
      const account = next.accounts.find((item) => item.key === selected);
      if (account) {
        setAccountName(account.name || account.key);
        setAppId(account.app_id || '');
      }
      setAppSecret('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '公众号工作区状态读取失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const account = state?.accounts.find((item) => item.key === accountKey);
    if (!account) return;
    setAccountName(account.name || account.key);
    setAppId(account.app_id || '');
    setAppSecret('');
  }, [accountKey, state]);

  useEffect(() => {
    previewVersion.current += 1;
    setPrepared(null);
    setDraftResult(null);
  }, [accountKey, title, body, author]);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body, digest, coverPath, author })); }
    catch { setError('浏览器存储不可用，请先复制正文保存，切换页面可能丢失修改。'); }
  }, [title, body, digest, coverPath, author]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; previewVersion.current += 1; connectionVersion.current += 1; };
  }, []);

  useEffect(() => {
    connectionVersion.current += 1;
    setConnecting(false);
    setOnboarding(null);
  }, [accountKey]);

  const configuredCount = state?.accounts.filter((account) => account.configured).length || 0;
  const selectedAccount = state?.accounts.find((account) => account.key === accountKey);
  const hasArticle = Boolean(title.trim() && body.trim());
  const coverPreview = useMemo(() => covers.find((file) => file.path === coverPath), [covers, coverPath]);

  const chooseExisting = (account: WechatAccount) => {
    setAccountKey(account.key);
    setCheckResult(null);
    setNotice('');
  };

  const newAccount = () => {
    setAccountKey('');
    setAccountName('微信公众号');
    setAppId('');
    setAppSecret('');
    setAuthor('');
    setCheckResult(null);
    setNotice('');
  };

  const connectAccount = async (key: string) => {
    const version = ++connectionVersion.current;
    const isCurrent = () => alive.current && currentAccount.current.trim() === key && connectionVersion.current === version;
    setConnecting(true);
    setError('');
    setOnboarding(null);
    try {
      const result = await onboardWechat(key);
      if (!isCurrent()) return;
      setOnboarding(result);
      if (result.prompt && result.evidence_count > 0) {
        onCreate(result.prompt, '公众号账号定位与诊断');
      } else {
        setNotice('账号资料读取完成，但可用证据不足，尚未启动模型诊断。');
      }
    } catch (e) {
      if (isCurrent()) setError(e instanceof Error ? e.message : '公众号资料读取失败');
    } finally {
      if (isCurrent()) setConnecting(false);
    }
  };

  const saveAccount = async () => {
    if (!accountKey.trim() || !accountName.trim() || !appId.trim()) {
      setError('请填写账号标识、账号名称和 AppID。');
      return;
    }
    const key = accountKey.trim();
    const version = ++connectionVersion.current;
    const isCurrent = () => alive.current && currentAccount.current.trim() === key && connectionVersion.current === version;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await saveWechatAccount({
        key, name: accountName.trim(), app_id: appId.trim(),
        app_secret: appSecret, author: author.trim(),
      });
      if (!isCurrent()) return;
      setAppSecret('');
      const next = await fetchWechat();
      if (!isCurrent()) return;
      setState(next);
      setNotice('账号配置已保存，正在读取真实文章与官方数据。');
      await connectAccount(key);
    } catch (e) {
      if (isCurrent()) setError(e instanceof Error ? e.message : '公众号账号保存失败');
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const checkAccount = async () => {
    if (!accountKey.trim()) return;
    setChecking(true);
    setError('');
    setCheckResult(null);
    try {
      setCheckResult(await checkWechatAccount(accountKey.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : '公众号配置校验失败');
    } finally {
      setChecking(false);
    }
  };

  const buildPreview = async () => {
    if (!hasArticle) {
      setError('请先填写标题和正文。');
      return;
    }
    const version = ++previewVersion.current;
    setPreparing(true);
    setError('');
    setNotice('');
    try {
      const result = await prepareWechat({
        title: title.trim(), body, author: author.trim() || undefined, account: accountKey.trim() || undefined,
      });
      if (version !== previewVersion.current) return;
      setPrepared(result);
      setNotice('排版预览已生成，下面的预览来自本地 /api/media。');
    } catch (e) {
      if (version === previewVersion.current) setError(e instanceof Error ? e.message : '公众号排版生成失败');
    } finally {
      setPreparing(false);
    }
  };

  const insertBodyImage = (file: OutputNode) => {
    const imagePath = `/api/media/${file.path.split('/').map((part) => encodeURIComponent(part).replace(/\(/g, '%28').replace(/\)/g, '%29')).join('/')}`;
    const alt = file.name.replace(/[\[\]\r\n]/g, '');
    setBody((current) => `${current.trimEnd()}\n\n![${alt}](${imagePath})\n`);
    setNotice(`已把 ${file.name} 插入正文末尾，请重新生成排版预览。`);
  };

  const sendDraft = async () => {
    if (!prepared || !coverPath || !hasArticle) {
      setError('请先完成标题正文、排版预览和封面选择。');
      return;
    }
    const draftAccount = accountKey.trim() || (state?.mp_logged_in ? 'mp' : '');
    if (!draftAccount) {
      setError('请先选择账号，或到账号页扫公众号后台码。');
      return;
    }
    const confirmed = window.confirm(
      '将把当前内容创建为微信公众号草稿，仅进入草稿箱，不会群发或公开发布。\n\n确定继续？',
    );
    if (!confirmed) return;
    setDrafting(true);
    setError('');
    setDraftResult(null);
    try {
      const result = await createWechatDraft({
        account: draftAccount,
        markdown_path: prepared.markdown_path,
        html_path: prepared.html_path,
        cover_path: coverPath, title: title.trim(), digest: digest.trim() || undefined,
        author: author.trim() || undefined,
      });
      setDraftResult(result);
      setPublishResult(null);
      setNotice(result.via === 'mp-session'
        ? '草稿已提交到公众号后台草稿箱。群发请到 mp 后台确认；本页「正式发布」只适用于 AppID 官方接口草稿。'
        : '草稿已提交到公众号草稿箱。确认无误后可在下方正式发布。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '公众号草稿创建失败');
    } finally {
      setDrafting(false);
    }
  };

  const sendPublish = async () => {
    const mediaId = String(draftResult?.media_id || '').trim();
    if (draftResult?.via === 'mp-session') {
      setError('扫码草稿请到公众号后台群发，不能走本页官方发布接口。');
      return;
    }
    if (!accountKey.trim() || !mediaId) {
      setError('请先成功创建草稿，再正式发布。');
      return;
    }
    const confirmed = window.confirm(
      '将把这篇草稿正式发布到公众号，粉丝可见。\n\n这是真实发布，不是本地预览。确定继续？',
    );
    if (!confirmed) return;
    setPublishing(true);
    setError('');
    setPublishResult(null);
    try {
      const result = await publishWechatDraft(accountKey.trim(), mediaId);
      setPublishResult(result);
      setNotice('已提交正式发布。发布任务号以接口回执为准，可在公众号后台核对。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '公众号正式发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const loadAnalytics = async () => {
    if (!accountKey.trim()) {
      setError('请先选择公众号账号。');
      return;
    }
    setAnalyticsLoading(true);
    setError('');
    try {
      setAnalytics(await fetchWechatAnalytics(accountKey.trim(), analyticsDate));
    } catch (e) {
      setError(e instanceof Error ? e.message : '公众号数据读取失败');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const copyMonitorPassword = async () => {
    setMonitorBusy(true);
    setError('');
    try {
      const credentials = await fetchWechatMonitorCredentials();
      await navigator.clipboard.writeText(credentials.password);
      setNotice('本地同行订阅管理密码已复制到剪贴板；页面不会显示或记录密码。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '复制本地管理密码失败');
    } finally {
      setMonitorBusy(false);
    }
  };

  const syncFeeds = async () => {
    setFeedSyncing(true);
    setError('');
    try {
      const result = await syncResearchFeeds();
      setNotice(`已同步 ${result.imported} 条订阅摘录，跳过 ${result.skipped} 条已有或无正文内容。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '同步订阅素材失败');
    } finally {
      setFeedSyncing(false);
    }
  };

  return (
    <div className="page-scroll wechat-page">
      <div className="page-head wechat-page-head">
        <div>
          <div className="wechat-eyebrow">公众号工作区</div>
          <h1 className="page-title"><IconLayout size={22} /> 公众号内容与数据</h1>
          <p className="page-subtitle">扫码登录后把 Markdown 排成可读文章并送进草稿箱；AppID 只给官方接口备用。</p>
        </div>
        <button className="btn btn-sm" onClick={() => void load()} disabled={loading}>
          <IconRefresh size={14} /> {loading ? '读取中…' : '刷新状态'}
        </button>
      </div>

      {error && <div className="notice-error wechat-notice" role="alert">{error}</div>}
      {notice && <div className="wechat-notice-ok" role="status"><IconCheck size={14} /> {notice}</div>}

      <section className="wechat-section card">
        <div className="wechat-section-head">
          <div>
            <div className="wechat-section-kicker">连接状态</div>
            <h2>公众号账号配置（官方 API 备用）</h2>
          </div>
          <span className={`badge ${state?.mp_logged_in || state?.config_present ? 'badge-ok' : ''}`}>
            {loading ? '状态读取中…' : state?.mp_logged_in ? '已扫后台码' : state?.config_present ? `AppID 备用 ${configuredCount}/${state.accounts.length}` : '待扫码'}
          </span>
        </div>
        <p className="wechat-help">日常发稿请先到账号页扫公众号后台码。下面的 AppID / AppSecret 只给官方接口（按日取数、正式群发）用，不走扫码登录。AppSecret 不会从状态接口回填；留空保存会保留已有值。</p>

        <div className="wechat-account-tabs">
          {(state?.accounts || []).map((account) => (
            <button key={account.key} className={`chip ${account.key === accountKey ? 'active' : ''}`} onClick={() => chooseExisting(account)}>
              {accountLabel(account)} {account.configured ? '· 已配置' : '· 待配置'}
            </button>
          ))}
          <button className="chip" onClick={newAccount}>+ 新账号</button>
        </div>

        <div className="wechat-form-grid">
          <label className="wechat-field"><span>账号标识</span><input className="field" value={accountKey} onChange={(e) => setAccountKey(e.target.value)} placeholder="wechat-main" /></label>
          <label className="wechat-field"><span>账号名称</span><input className="field" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="我的公众号" /></label>
          <label className="wechat-field"><span>AppID</span><input className="field" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="wx…" autoComplete="off" /></label>
          <label className="wechat-field"><span>AppSecret <small>（不回显）</small></span><input className="field" type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder="留空保留已有值" autoComplete="new-password" /></label>
          <label className="wechat-field"><span>默认作者</span><input className="field" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="可选" /></label>
        </div>
        <div className="wechat-actions">
          <button className="btn btn-sm btn-primary" onClick={() => void saveAccount()} disabled={saving || connecting}>{saving || connecting ? '连接与读取中…' : '保存并连接账号'}</button>
          <button className="btn btn-sm" onClick={() => void checkAccount()} disabled={checking || !accountKey.trim()}>{checking ? '校验中…' : '校验配置'}</button>
          <button className="btn btn-sm" onClick={() => void connectAccount(accountKey.trim())} disabled={saving || connecting || !selectedAccount?.configured}>{connecting ? '读取中…' : '重新读取并诊断'}</button>
          {selectedAccount && <span className="wechat-inline-note">当前 AppID：{selectedAccount.app_id || '未填写'}</span>}
        </div>
        <p className="wechat-help">连接后自动读取近 10 篇可读发布文章和昨日官方数据，按当前 GPT 订阅模型分析真实资料，进入“公众号账号定位与诊断”会话。权限不足会列明缺口，没有可用证据时不会启动模型。</p>
        {onboarding && <div className="wechat-result" role="status"><div className="wechat-result-title">账号资料读取结果 · {onboarding.evidence_count} 项证据</div>{onboarding.missing.length > 0 && <ul>{onboarding.missing.map((item, index) => <li key={index}>{item}</li>)}</ul>}{onboarding.evidence_count === 0 && onboarding.missing.length === 0 && <p>没有返回可用账号证据，请检查接口权限后重新读取。</p>}</div>}
        {checkResult && (
          <div className="wechat-result" role="status">
            <div className="wechat-result-title">配置校验原始结果</div>
            <pre>{pretty(checkResult)}</pre>
          </div>
        )}
      </section>

      <section className="wechat-compose-grid">
        <div className="wechat-section card">
          <div className="wechat-section-head"><div><div className="wechat-section-kicker">内容准备</div><h2>Markdown 编辑</h2></div></div>
          <label className="wechat-field"><span>标题</span><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="公众号文章标题" /></label>
          <label className="wechat-field"><span>摘要 <small>（可选）</small></span><input className="field" value={digest} onChange={(e) => setDigest(e.target.value)} placeholder="草稿摘要" /></label>
          <label className="wechat-field"><span>正文 Markdown</span><textarea className="field wechat-editor" value={body} onChange={(e) => setBody(e.target.value)} placeholder="在这里编辑公众号正文…" /></label>
          <div className="wechat-actions">
            <button className="btn btn-sm btn-primary" onClick={() => void buildPreview()} disabled={preparing || !hasArticle}>
              <IconFile size={14} /> {preparing ? '生成中…' : '生成排版预览'}
            </button>
            {prepared && <span className="wechat-inline-note">Markdown / HTML 已保存到本地输出</span>}
          </div>
        </div>

        <div className="wechat-section card">
          <div className="wechat-section-head"><div><div className="wechat-section-kicker">本地预览</div><h2>排版结果</h2></div></div>
          {prepared ? (
            <>
              <iframe className="wechat-preview-frame" src={mediaUrl(prepared.html_path)} title="公众号排版预览" sandbox="" />
              <div className="wechat-paths">
                <a href={mediaUrl(prepared.markdown_path)} target="_blank" rel="noreferrer">打开 Markdown ↗</a>
                <a href={mediaUrl(prepared.html_path)} target="_blank" rel="noreferrer">打开 HTML ↗</a>
              </div>
            </>
          ) : (
            <div className="wechat-preview-empty"><IconFile size={28} /><p>填写标题和正文后生成排版预览。</p><small>预览读取本地 /api/media 文件，不调用模型。</small></div>
          )}
        </div>
      </section>

      <section className="wechat-section card">
        <div className="wechat-section-head">
          <div><div className="wechat-section-kicker">草稿箱</div><h2>选择封面并送入草稿箱</h2></div>
          <span className="badge">不会群发</span>
        </div>
        <p className="wechat-help">图片来自现有内容库，支持 JPG、JPEG、PNG、GIF；点击图片选择封面，点击“插入正文”添加文章配图。送草稿箱默认走账号页已扫的后台会话，不需要 AppID。正式发布会调用微信 freepublish 接口（需 AppID），粉丝可见；扫码会话建的草稿请到公众号后台确认群发。</p>
        <div className="wechat-cover-grid">
          {covers.length === 0 && <div className="wechat-preview-empty"><IconImage size={24} /><p>内容库暂无可用图片封面。</p></div>}
          {covers.map((file) => (
            <div key={file.path} className="wechat-image-item">
            <button className={`wechat-cover ${coverPath === file.path ? 'selected' : ''}`} onClick={() => setCoverPath(file.path)} title={file.path}>
              <img src={mediaUrl(file.path)} alt={file.name} loading="lazy" />
              <span>{file.name}</span>
              {coverPath === file.path && <i><IconCheck size={14} /></i>}
            </button>
            <button className="btn btn-sm" onClick={() => insertBodyImage(file)}>插入正文</button>
            </div>
          ))}
        </div>
        {coverPreview && <div className="wechat-selected-cover">已选封面：{coverPreview.name}</div>}
        <div className="wechat-actions">
          <button className="btn btn-sm btn-primary" onClick={() => void sendDraft()} disabled={drafting || !prepared || !coverPath || !hasArticle}>
            <IconSend size={14} /> {drafting ? '提交中…' : '确认并送草稿箱'}
          </button>
        </div>
        {draftResult && <div className="wechat-result" role="status"><div className="wechat-result-title">草稿接口原始结果</div><pre>{pretty(draftResult)}</pre></div>}
        <div className="wechat-actions">
          <button className="btn btn-sm btn-primary" onClick={() => void sendPublish()} disabled={publishing || !draftResult?.media_id || draftResult.via === 'mp-session'}>
            <IconSend size={14} /> {publishing ? '发布中…' : '确认并正式发布'}
          </button>
        </div>
        {publishResult && <div className="wechat-result" role="status"><div className="wechat-result-title">正式发布回执</div><pre>{pretty(publishResult)}</pre></div>}
      </section>

      <section className="wechat-section card">
        <div className="wechat-section-head">
          <div><div className="wechat-section-kicker">官方数据</div><h2>按日期读取公众号数据</h2></div>
        </div>
        <div className="wechat-analytics-toolbar">
          <label className="wechat-field"><span>账号</span><select className="field" value={accountKey} onChange={(e) => setAccountKey(e.target.value)}>
            {(state?.accounts || []).map((account) => <option key={account.key} value={account.key}>{accountLabel(account)}</option>)}
            {!state?.accounts.length && <option value={accountKey}>{accountKey || '未配置账号'}</option>}
          </select></label>
          <label className="wechat-field"><span>日期</span><input className="field" type="date" value={analyticsDate} onChange={(e) => setAnalyticsDate(e.target.value)} /></label>
          <button className="btn btn-sm btn-primary wechat-analytics-button" onClick={() => void loadAnalytics()} disabled={analyticsLoading}>{analyticsLoading ? '读取中…' : '读取官方原始数据'}</button>
        </div>
        <p className="wechat-help">只展示接口返回的原始字段；阅读、分享、关注等没有返回时保持为空，不补造统计。</p>
        {analytics ? (
          <div className="wechat-analytics-results">
            <p className="wechat-help">本次结果：{analytics.account} · {analytics.date}</p>
            {Object.entries(analytics.results || {}).map(([endpoint, result]) => (
              <div className="wechat-result" key={endpoint}>
                <div className="wechat-result-title"><code>{endpoint}</code><span className={`badge ${result.ok ? 'badge-ok' : ''}`}>{result.ok ? '接口成功' : '接口失败'}</span></div>
                {result.error && <div className="wechat-result-error">{result.error}</div>}
                {result.data !== undefined && <pre>{pretty(result.data)}</pre>}
              </div>
            ))}
            {Object.keys(analytics.results || {}).length === 0 && <div className="wechat-preview-empty"><p>该日期没有返回接口结果。</p></div>}
          </div>
        ) : <div className="wechat-preview-empty"><p>选择日期后读取官方数据。</p></div>}
      </section>

      <section className="wechat-section wechat-monitor-section card">
        <div className="wechat-section-head">
          <div><div className="wechat-section-kicker">同行监测</div><h2>WeRSS 同行订阅管理</h2></div>
          <span className={`badge ${monitor?.online ? 'badge-ok' : ''}`}>
            {monitor ? (monitor.online ? (monitor.configured ? '服务就绪 · 已配置' : '服务就绪 · 待配置') : '服务未就绪') : '状态读取失败'}
          </span>
        </div>
        <p className="wechat-help">
          {monitor?.online
            ? 'WeRSS 服务已就绪；服务配置不代表微信授权。请在内嵌管理页扫码并添加同行公众号。'
            : monitorError || monitor?.message || '暂时无法确认 WeRSS 服务状态。'}
        </p>
        <p className="wechat-help">本地管理用户名：{monitor?.username || 'easel'}</p>
        <div className="wechat-actions">
          <button className="btn btn-sm btn-primary" onClick={() => setMonitorOpen(true)} disabled={!monitor?.online || !monitor.url}>打开同行订阅管理</button>
          <button className="btn btn-sm" onClick={() => void copyMonitorPassword()} disabled={monitorBusy || !monitor?.online}>{monitorBusy ? '复制中…' : '复制本地管理密码'}</button>
          <button className="btn btn-sm" onClick={() => void syncFeeds()} disabled={feedSyncing}>{feedSyncing ? '同步中…' : '同步订阅到素材库'}</button>
        </div>
        <div className="wechat-monitor-flow">
          <span>1 · 在内嵌页扫码并添加同行公众号</span>
          <span>2 · WeRSS 定时生成 RSS</span>
          <span>3 · FreshRSS 订阅对应 RSS 后同步素材</span>
        </div>
        <p className="wechat-help wechat-monitor-url-note">FreshRSS / Docker 内订阅地址使用 `http://werss:8001/feed/...`；这里的同步按钮调用已有素材库同步接口。</p>
        {monitorOpen && monitor?.url && (
          <div className="wechat-monitor-frame-wrap">
            <div className="wechat-monitor-frame-head"><span>同行订阅管理</span><button className="btn btn-sm btn-ghost" onClick={() => setMonitorOpen(false)}>收起</button></div>
            <iframe className="wechat-monitor-frame" src={monitor.url} title="WeRSS 同行订阅管理" referrerPolicy="no-referrer" />
          </div>
        )}
      </section>

      {state?.history?.length === 0 && <div className="wechat-footer-note">当前后端未返回草稿历史；草稿状态以公众号后台为准。</div>}
    </div>
  );
}
