import { useState, useEffect, useMemo } from 'react';
import type { ComponentType } from 'react';
import { fetchSkills } from '../lib/api';
import type { SkillItem } from '../lib/api';
import SkillDrawer from './SkillDrawer';
import { NewSkillModal, ManageSkillModal } from './MetaSkillManage';
import { displayName, SKILL_SHORT_DESC } from '../lib/skillDisplayNames';
import {
  IconSearch, IconCompass, IconSkills, IconSend, IconChart, IconLayers,
  IconVideo, IconImage, IconMusic, IconMic, IconText, IconLayout, IconProfile, IconOutputs,
} from './icons';

interface SkillPageProps {
  persona: string;
  onStartPrompt?: (prompt: string) => void;
}

type IconC = ComponentType<{ size?: number }>;
type LayerMeta = { key: string; label: string; Icon: IconC; color: string };

const LAYERS: LayerMeta[] = [
  { key: 'discover', label: '发现', Icon: IconSearch, color: 'var(--layer-discover)' },
  { key: 'plan', label: '策划', Icon: IconCompass, color: 'var(--layer-plan)' },
  { key: 'produce', label: '制作', Icon: IconSkills, color: 'var(--layer-produce)' },
  { key: 'publish', label: '发布', Icon: IconSend, color: 'var(--layer-publish)' },
  { key: 'attribute', label: '归因', Icon: IconChart, color: 'var(--layer-attribute)' },
  { key: 'general', label: '通用', Icon: IconLayers, color: 'var(--layer-general)' },
];
const LAYER_META: Record<string, LayerMeta> = Object.fromEntries(LAYERS.map((l) => [l.key, l]));
const OTHER: LayerMeta = { key: 'other', label: '其他', Icon: IconLayers, color: 'var(--layer-general)' };

// 按 skill 名关键词映射线性图标（无匹配退回层图标）
function iconFor(name: string, LayerIcon: IconC): IconC {
  const n = name.toLowerCase();
  const map: [RegExp, IconC][] = [
    [/video|clip|reframe|highlight|beat|slideshow|intro|chapter/, IconVideo],
    [/image|img|photo|poster|infographic|comparison|meme|remove-bg|green-screen|enhance/, IconImage],
    [/music|audio|bgm|mix|denoise/, IconMusic],
    [/voice|tts|clone|subtitle/, IconMic],
    [/card|xhs|xiaohongshu|note/, IconLayout],
    [/copy|writ|text|polish|condens|style|format|content/, IconText],
    [/chart|data|report|roi|analy|insight|scor/, IconChart],
    [/publish|upload|wechat|zhihu|bilibili|douyin|kuaishou|channel/, IconSend],
    [/rss|trend|news|discover|ugc|competitor|hot/, IconSearch],
    [/profile|persona|brand|position|audience/, IconProfile],
    [/schedul|calendar|plan|strategy|campaign|matrix/, IconCompass],
    [/asset|template|batch|doc|mindmap|link/, IconOutputs],
  ];
  for (const [re, C] of map) if (re.test(n)) return C;
  return LayerIcon;
}

// 卡片只放中文短说明：去掉「当用户说…」这类触发词，英文为主的描述换成分组说明
function cnDesc(d?: string): string {
  let s = (d || '').trim();
  if (!s) return '';
  s = s.split(/[。.]\s*(当用户|用户说|Use when|触发|Triggers?)/)[0];
  const cjk = (s.match(/[\u4e00-\u9fa5]/g) || []).length;
  if (cjk < s.length * 0.3) return '';
  return s.replace(/\bskills?\b/gi, '技能');
}

const LAYER_DESC: Record<string, string> = {
  discover: '发现层技能', plan: '策划层技能', produce: '制作层技能',
  publish: '发布层技能', attribute: '归因层技能', general: '通用技能', other: '技能',
};

export default function SkillPage({ persona, onStartPrompt }: SkillPageProps) {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [newTab, setNewTab] = useState<'' | 'form' | 'upload' | 'chat' | 'import'>('');
  const [managing, setManaging] = useState<SkillItem | null>(null);
  const nameOf = (s: SkillItem) => s.displayName || displayName(s.name);

  const load = () => {
    fetchSkills().then(setSkills).catch(() => setError('加载 SKILL 列表失败'));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter((s) =>
      s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q) || nameOf(s).toLowerCase().includes(q));
  }, [skills, query]);

  const grouped = useMemo(() => {
    const g: Record<string, SkillItem[]> = {};
    for (const s of filtered) {
      if (s.disabled) { (g.disabled ||= []).push(s); continue; }
      const key = s.source === 'user' ? 'mine' : (LAYER_META[s.layer] ? s.layer : 'other');
      (g[key] ||= []).push(s);
    }
    return g;
  }, [filtered]);

  const MINE: LayerMeta = { key: 'mine', label: '我的技能', Icon: IconProfile, color: 'var(--accent-start)' };
  const OFF: LayerMeta = { key: 'disabled', label: '已停用', Icon: IconLayers, color: 'var(--text-tertiary)' };
  const orderedLayers = [MINE, ...LAYERS, OTHER, OFF].filter((l) => grouped[l.key]?.length);
  const mineCount = skills.filter((s) => s.source === 'user').length;
  const needApiCount = skills.filter((s) => s.needsApi && !s.apiConfigured).length;

  return (
    <div className="skills-page">
      <div className="skills-page-head">
        <h1 className="page-title">技能库</h1>
        <p className="page-subtitle">
          共 {skills.length} 个技能，我的 {mineCount} 个，按用途分组。点卡片看说明、直接用；
          标 <span className="badge badge-warn" style={{ padding: '1px 7px' }}>需设置</span> 的要先在设置里填好
          {needApiCount > 0 && `（当前 ${needApiCount} 个待配置）`}。
        </p>
        <div className="skill-search">
          <span className="skill-search-ic"><IconSearch size={16} /></span>
          <input
            className="field"
            placeholder="搜索技能名或描述…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button className="btn btn-ghost btn-sm" onClick={() => setQuery('')}>清除</button>}
        </div>
        <div className="meta-skill-toolbar">
          <button className="btn btn-primary btn-sm" onClick={() => setNewTab('form')}>+ 新建技能</button>
          <button className="btn btn-sm" onClick={() => setNewTab('upload')}>上传文件</button>
          <button className="btn btn-sm" onClick={() => setNewTab('chat')}>对话创建</button>
          <button className="btn btn-sm" onClick={() => setNewTab('import')}>从已有技能导入</button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--red)', maxWidth: 1100, margin: '16px auto' }}>{error}</div>}

      <div className="skills-body">
        {orderedLayers.length === 0 && !error && (
          <div className="empty-state" style={{ height: 240 }}>
            <div className="empty-icon"><IconSearch size={40} /></div>
            <p>没有匹配「{query}」的技能</p>
          </div>
        )}

        {orderedLayers.map((layer) => (
          <section key={layer.key}>
            <div className="section-title">
              <span className="section-ic" style={{ color: layer.color }}><layer.Icon size={15} /></span>
              {layer.label}
              <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>· {grouped[layer.key].length}</span>
            </div>
            <div className="skill-grid">
              {grouped[layer.key].map((s) => {
                const meta = LAYER_META[s.layer] || (s.source === 'user' ? MINE : OTHER);
                const Icon = iconFor(s.name, meta.Icon);
                const alert = s.needsApi && !s.apiConfigured;
                return (
                  <div
                    key={s.name}
                    className={`card card-hover skill-card ${s.disabled ? 'meta-off' : ''}`}
                    style={{ ['--layer-color' as string]: meta.color }}
                    onClick={() => (s.disabled ? setManaging(s) : setSelected(s.name))}
                  >
                    <button className="meta-skill-gear" title="管理：改名 / 停用 / 删除" onClick={(e) => { e.stopPropagation(); setManaging(s); }}>⚙</button>
                    {alert && <div className="skill-card-alert" title="需要配置 API key">!</div>}
                    <div className="skill-card-icon" style={{ color: meta.color }}><Icon size={19} /></div>
                    <div className="skill-card-name">{nameOf(s)}</div>
                    <div className="skill-card-desc">{SKILL_SHORT_DESC[s.name] || cnDesc(s.description) || LAYER_DESC[layer.key]}</div>
                    <div className="skill-card-foot">
                      {s.source === 'user' && <span className="badge badge-mine">{s.disabled ? '已停用' : '我的'}</span>}
                      {s.needsApi && (s.apiConfigured
                        ? <span className="badge badge-ok">已配置</span>
                        : <span className="badge badge-warn">需设置</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {newTab && <NewSkillModal initialTab={newTab} onClose={() => setNewTab('')} onDone={load} onStartPrompt={onStartPrompt} />}
      {managing && <ManageSkillModal skill={managing} onClose={() => setManaging(null)} onDone={load} />}
      {selected && (
        <SkillDrawer
          skillName={selected}
          persona={persona}
          onClose={() => setSelected(null)}
          onConfigured={load}
        />
      )}
    </div>
  );
}
