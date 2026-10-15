import { useEffect, useRef, useState } from 'react';
import { createPhoneShare, endPhoneShare } from '../lib/api';
import type { PhoneShare, PhoneShareInput } from '../lib/api';

interface Props {
  title: string;
  body: string;
  tags: string;
  mediaPaths: string[];
  platform: string;
}

export default function MobileShareButton({ title, body, tags, mediaPaths, platform }: Props) {
  const [snapshot, setSnapshot] = useState<PhoneShareInput | null>(null);
  const [share, setShare] = useState<PhoneShare | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [address, setAddress] = useState(0);
  const [now, setNow] = useState(Date.now());
  const pending = useRef(false);
  const mounted = useRef(true);
  const activeToken = useRef('');
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (activeToken.current) void endPhoneShare(activeToken.current).catch(console.error);
    };
  }, []);
  useEffect(() => {
    if (!snapshot) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    dialog.current?.focus();
    return () => window.clearInterval(timer);
  }, [snapshot]);

  const create = async (input: PhoneShareInput) => {
    if (pending.current) return;
    setError(''); setNotice('');
    const length = (text: string) => Array.from(text).length;
    const invalid = length(input.title) > 300 ? '标题最多 300 字，请缩短后重试。'
      : length(input.body) > 50000 ? '正文最多 50000 字，请缩短后重试。'
      : input.tags.length > 30 ? '最多领取 30 个标签，请减少后重试。'
      : input.tags.some((tag) => length(tag) > 100) ? '每个标签最多 100 字，请缩短后重试。'
      : input.media_paths.length > 30 ? '最多领取 30 个素材，请减少已选素材后重试。' : '';
    if (invalid) { setError(invalid); return; }
    pending.current = true;
    setSnapshot(input); setBusy(true); setError(''); setNotice('');
    try {
      const result = await createPhoneShare(input);
      if (!mounted.current) {
        await endPhoneShare(result.token);
        return;
      }
      activeToken.current = result.token;
      setShare(result); setAddress(0); setNow(Date.now());
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : '创建领取链接失败');
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const end = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      if (activeToken.current) await endPhoneShare(activeToken.current);
      activeToken.current = '';
      if (mounted.current) {
        setShare(null); setSnapshot(null); setNotice('');
        trigger.current?.focus();
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : '结束领取失败，请重试');
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const remaining = share ? Math.max(0, Math.ceil(share.expires_at - now / 1000)) : 0;
  const links = share?.links.length ? share.links : share ? [{ url: share.share_url, qr_data_url: share.qr_data_url }] : [];
  const link = links[address];
  const copyLink = async () => {
    setNotice(''); setError('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('浏览器不支持剪贴板，请选中链接手动复制');
      await navigator.clipboard.writeText(link.url);
      if (mounted.current && activeToken.current === share?.token) setNotice('链接已复制；请在手机浏览器打开');
    } catch (e) {
      if (mounted.current && activeToken.current === share?.token) setError(e instanceof Error ? e.message : '复制失败，请选中链接手动复制');
    }
  };

  return <>
    <button ref={trigger} className="pv-copy" disabled={busy || !!snapshot || (!title.trim() && !body.trim() && !tags.trim() && !mediaPaths.length)}
      onClick={() => void create({ title, body, tags: tags.split(/[,，\s]+/).filter(Boolean).map((tag) => tag.startsWith('#') ? tag : `#${tag}`), media_paths: [...mediaPaths], platform })}>发送到手机</button>
    {!snapshot && error && <span role="alert" style={{ color: 'var(--red)', fontSize: 12 }}>{error}</span>}
    {snapshot && <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) void end(); }}>
      <div ref={dialog} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-label="发送到手机"
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); void end(); }
          if (e.key === 'Tab') {
            const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], select, [tabindex="0"]'));
            const first = controls[0]; const last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
            else if (!e.shiftKey && (document.activeElement === last || document.activeElement === e.currentTarget)) { e.preventDefault(); first?.focus(); }
          }
        }}
        style={{ width: 'min(520px, calc(100vw - 32px))', maxWidth: 520, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', boxSizing: 'border-box' }}>
        <h3 style={{ margin: '0 0 10px' }}>发送到手机</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>手机与电脑连接同一 Wi-Fi，电脑保持开机。用手机浏览器领取并保存素材、复制文案，再手动打开平台 App 检查发布。</p>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <strong style={{ overflowWrap: 'anywhere' }}>{snapshot.title || '无标题'}</strong>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 120, overflowY: 'auto', fontSize: 13 }}>{snapshot.body || '无正文'}</p>
          {snapshot.tags.length > 0 && <p style={{ overflowWrap: 'anywhere', fontSize: 13 }}>标签：{snapshot.tags.join('、')}</p>}
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{share ? share.media_count : snapshot.media_paths.length} 个已选素材 · 此次领取内容已固定</span>
        </div>
        {!share && busy && <p role="status">正在创建领取链接…</p>}
        {share && remaining === 0 && <p role="status">领取链接已过期，请结束领取后重新生成。</p>}
        {share && remaining > 0 && link && <>
          <p role="status">剩余 {Math.floor(remaining / 60)} 分 {String(remaining % 60).padStart(2, '0')} 秒 · 到期自动失效</p>
          {links.length > 1 && <label className="field-label">电脑的局域网地址
            <select className="field" value={address} onChange={(e) => { setAddress(Number(e.target.value)); setNotice(''); }}>
              {links.map((item, i) => <option key={item.url} value={i}>{new URL(item.url).host}</option>)}
            </select>
          </label>}
          <img src={link.qr_data_url} alt="用手机扫描领取文案和素材" style={{ display: 'block', width: 208, maxWidth: '100%', margin: '12px auto', background: '#fff' }} />
          <a href={link.url} target="_blank" rel="noreferrer" style={{ display: 'block', overflowWrap: 'anywhere', fontSize: 13 }}>{link.url}</a>
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => void copyLink()}>复制领取链接</button>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已生成领取入口；尚未确认手机收到，也未发布。请勿将链接转给他人。</p>
        </>}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert" style={{ color: 'var(--red)', overflowWrap: 'anywhere' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          {!share && !busy && <button className="btn btn-sm" onClick={() => void create(snapshot)}>重试生成</button>}
          <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => void end()}>{busy ? '处理中…' : '结束领取'}</button>
        </div>
      </div>
    </div>}
  </>;
}
