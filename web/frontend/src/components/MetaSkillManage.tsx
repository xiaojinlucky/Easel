// META-PATCH: 技能库自助管理（新建/上传/对话创建/导入/编辑/停用/删除）
import { useState, useEffect, useMemo } from 'react';
import type { SkillItem, MetaImportItem } from '../lib/api';
import { metaSkillCreate, metaSkillUpload, metaSkillMeta, metaSkillToggle, metaSkillDelete, metaSkillSources, metaSkillImport } from '../lib/api';
import { displayName } from '../lib/skillDisplayNames';

export const META_SKILL_DIR = 'F:\\科研大师兄\\自媒体工作台\\meta-skills';
const LAYER_OPTS = [
  ['discover', '发现'], ['plan', '策划'], ['produce', '制作'], ['publish', '发布'], ['attribute', '归因'], ['general', '通用'],
];

function Modal({ title, onClose, width = 560, children }: { title: string; onClose: () => void; width?: number; children: React.ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal meta-skill-modal" style={{ width, maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

type Tab = 'form' | 'upload' | 'chat' | 'import';

export function NewSkillModal({ initialTab = 'form', onClose, onDone, onStartPrompt }: {
  initialTab?: Tab; onClose: () => void; onDone: () => void; onStartPrompt?: (p: string) => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [name] = useState(''); const [cn, setCn] = useState('');
  const [desc, setDesc] = useState(''); const [layer, setLayer] = useState('general'); const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [idea, setIdea] = useState('');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  // 导入
  const [items, setItems] = useState<MetaImportItem[] | null>(null);
  const [srcErr, setSrcErr] = useState(''); const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (tab !== 'import' || items) return;
    metaSkillSources().then((r) => setItems(r.items)).catch((e) => setSrcErr((e as Error).message));
  }, [tab, items]);
  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (items || []).filter((i) => !k || i.name.toLowerCase().includes(k) || i.description.toLowerCase().includes(k) || i.agents.join(' ').toLowerCase().includes(k));
  }, [items, q]);

  const wrap = async (fn: () => Promise<string>) => {
    setBusy(true); setMsg('');
    try { const m = await fn(); setMsg(m); onDone(); } catch (e) { setMsg('❌ ' + ((e as Error).message || '失败')); } finally { setBusy(false); }
  };
  const chatPrompt = `请用 oil-skill-creator 技能，帮我从零创建一个新技能。\n\n我想要的技能：${idea.trim() || '（我会在对话里说明）'}\n\n要求：\n1. 先问清楚用途、输入输出、适用平台，再动手；\n2. 最后把技能保存到 ${META_SKILL_DIR}\\<英文技能名>\\SKILL.md（英文名只用字母数字和 -），frontmatter 写 name、description、layer；\n3. 不要改动 Easel 程序目录里的内置技能。`;

  return (
    <Modal title="新建技能" onClose={onClose} width={tab === 'import' ? 760 : 580}>
      <div className="gallery-filters" style={{ marginBottom: 12 }}>
        {([['form', '填表新建'], ['upload', '上传文件'], ['chat', '对话创建'], ['import', '从已有技能导入']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} className={`chip ${tab === k ? 'active' : ''}`} onClick={() => { setTab(k); setMsg(''); }}>{l}</button>
        ))}
      </div>
      {tab === 'form' && (<>
                <label className="field-label">中文显示名</label>
        <input className="field" value={cn} onChange={(e) => setCn(e.target.value)} placeholder="如：选题体检" />
        <label className="field-label">一句话描述（什么时候用它）</label>
        <input className="field" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <label className="field-label">分区</label>
        <select className="field" value={layer} onChange={(e) => setLayer(e.target.value)}>{LAYER_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label className="field-label">技能正文（流程、规则、输出格式，Markdown）</label>
        <textarea className="field" style={{ minHeight: 150 }} value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="meta-skill-actions"><button className="btn btn-primary btn-sm" disabled={busy || !cn.trim() || !body.trim()}
          onClick={() => wrap(async () => { const r = await metaSkillCreate({ name: name.trim() || `meta-${Date.now().toString(36)}`, displayName: cn, description: desc, layer, body }); void r; return `✅ 已创建「${cn}」`; })}>创建</button></div>
      </>)}
      {tab === 'upload' && (<>
        <p className="meta-skill-tip">选一个技能说明文件，或打包好的技能压缩包。</p>
        <input type="file" accept=".md,.zip" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <label className="field-label">中文显示名（可空）</label>
        <input className="field" value={cn} onChange={(e) => setCn(e.target.value)} />
        <div className="meta-skill-actions"><button className="btn btn-primary btn-sm" disabled={busy || !file}
          onClick={() => wrap(async () => { const r = await metaSkillUpload(file!, name.trim(), cn); return `✅ 已添加「${cn || r.name}」`; })}>上传</button></div>
      </>)}
      {tab === 'chat' && (<>
        <p className="meta-skill-tip">会新开一个对话，让执行引擎用 <b>oil-skill-creator</b> 一步步问你、帮你写好技能，存进你的技能目录：<br /><code>{META_SKILL_DIR}</code></p>
        <label className="field-label">你想做个什么技能？（一两句话就行）</label>
        <textarea className="field" style={{ minHeight: 90 }} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="例如：把一篇论文拆成小红书 6 页图文的大纲，口吻按我的画像" />
        <div className="meta-skill-actions"><button className="btn btn-primary btn-sm" disabled={!onStartPrompt} onClick={() => { onStartPrompt?.(chatPrompt); onClose(); }}>去对话里创建</button></div>
      </>)}
      {tab === 'import' && (<>
        <p className="meta-skill-tip">来自 skills-manager（只读，不会改它）。勾选后复制一份到你的技能目录，不放进内置技能。</p>
        {srcErr && <div className="notice-error">{srcErr}</div>}
        {!items && !srcErr && <div className="loading"><div className="spinner" />读取中…</div>}
        {items && (<>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="field" placeholder="搜索名字 / 描述 / 来源 Agent" value={q} onChange={(e) => setQ(e.target.value)} />
            <span className="meta-skill-tip" style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}>已选 {picked.size}</span>
          </div>
          <div className="meta-import-list">
            {shown.map((i) => {
              const dis = i.already || !i.exists;
              return (
                <label key={i.id} className={`meta-import-row ${dis ? 'dis' : ''}`}>
                  <input type="checkbox" disabled={dis} checked={picked.has(i.name)} onChange={() => setPicked((c) => { const n = new Set(c); if (n.has(i.name)) n.delete(i.name); else n.add(i.name); return n; })} />
                  <div style={{ minWidth: 0 }}>
                    <div className="meta-import-name">{i.name} {i.already && <span className="badge">已在技能库</span>}{!i.exists && <span className="badge badge-warn">源文件不在</span>}</div>
                    <div className="meta-import-desc">{i.description || '（无描述）'}</div>
                    <div className="meta-import-agents">来源：{i.agents.length ? i.agents.join('、') : '未分发到任何 Agent'}{i.enabled ? '' : '（在 skills-manager 里已停用）'}</div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="meta-skill-actions"><button className="btn btn-primary btn-sm" disabled={busy || picked.size === 0}
            onClick={() => wrap(async () => { const r = await metaSkillImport([...picked]); setPicked(new Set()); setItems(null); return `✅ 导入 ${r.done.length} 个` + (r.errors.length ? `；失败：${r.errors.join('；')}` : ''); })}>导入选中的 {picked.size} 个</button></div>
        </>)}
      </>)}
      {msg && <div className="meta-skill-msg">{msg}</div>}
    </Modal>
  );
}

export function ManageSkillModal({ skill, onClose, onDone }: { skill: SkillItem; onClose: () => void; onDone: () => void }) {
  const isUser = skill.source === 'user';
  const [cn, setCn] = useState(skill.displayName || displayName(skill.name));
  const [desc, setDesc] = useState(skill.description || '');
  const [layer, setLayer] = useState(skill.layer || 'general');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<unknown>, ok: string, close = false) => {
    setBusy(true); setMsg('');
    try { await fn(); setMsg(ok); onDone(); if (close) onClose(); } catch (e) { setMsg('❌ ' + (e as Error).message); } finally { setBusy(false); }
  };
  return (
    <Modal title={`管理技能 · ${skill.displayName || skill.name}`} onClose={onClose} width={520}>
      <p className="meta-skill-tip">{isUser ? `我的技能，文件在 ${skill.disabled ? META_SKILL_DIR + '\\_停用' : META_SKILL_DIR}\\${skill.name}` : '内置技能：只改中文显示名，不动程序文件，也不能删。'}</p>
      <label className="field-label">中文显示名</label>
      <input className="field" value={cn} onChange={(e) => setCn(e.target.value)} />
      {isUser && (<>
        <label className="field-label">描述</label>
        <textarea className="field" style={{ minHeight: 70 }} value={desc} onChange={(e) => setDesc(e.target.value)} />
        <label className="field-label">分区</label>
        <select className="field" value={layer} onChange={(e) => setLayer(e.target.value)}>{LAYER_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </>)}
      <div className="meta-skill-actions">
        {isUser && <button className="btn btn-sm" disabled={busy} onClick={() => {
          const en = !!skill.disabled;
          if (!en && !window.confirm(`停用「${cn}」？\n停用后对话里不会再用它，随时能重新启用。`)) return;
          void act(() => metaSkillToggle(skill.name, en), en ? '✅ 已启用' : '✅ 已停用', true);
        }}>{skill.disabled ? '启用' : '停用'}</button>}
        {isUser && <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => {
          if (!window.confirm(`删除「${cn}」？\n不会硬删：移到 F:\\科研大师兄\\自媒体工作台\\_回收站\\技能库，可以找回。`)) return;
          void act(() => metaSkillDelete(skill.name), '✅ 已移到回收站', true);
        }}>删除</button>}
        <span style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => act(() => metaSkillMeta(skill.name, isUser ? { displayName: cn, description: desc, layer } : { displayName: cn }), '✅ 已保存')}>保存</button>
      </div>
      {msg && <div className="meta-skill-msg">{msg}</div>}
    </Modal>
  );
}
