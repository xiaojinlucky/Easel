import { useState, useEffect, useMemo } from 'react';
import type { ComponentType } from 'react';
import { fetchSkills, setSkillEnabled } from '../lib/api';
import type { SkillItem } from '../lib/api';
import SkillDrawer from './SkillDrawer';
import { skillSummary } from '../lib/skillText';
import {
  IconSearch, IconCompass, IconSkills, IconSend, IconChart, IconLayers,
  IconVideo, IconImage, IconMusic, IconMic, IconText, IconLayout, IconProfile, IconOutputs,
} from './icons';

interface SkillPageProps {
  persona: string;
  onDraftToChat?: (text: string, stage?: string, skill?: string) => void;
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

const LAYER_DESC: Record<string, string> = {
  discover: '发现层技能', plan: '策划层技能', produce: '制作层技能',
  publish: '发布层技能', attribute: '归因层技能', general: '通用技能', other: '技能',
};

export default function SkillPage({ persona, onDraftToChat }: SkillPageProps) {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const load = () => {
    fetchSkills().then(setSkills).catch(() => setError('加载 SKILL 列表失败'));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter((s) =>
      s.name.toLowerCase().includes(q)
      || skillSummary(s).toLowerCase().includes(q)
      || (s.description || '').toLowerCase().includes(q));
  }, [skills, query]);

  const activeSkills = useMemo(() => filtered.filter((s) => s.enabled !== false), [filtered]);
  const archivedSkills = useMemo(() => filtered.filter((s) => s.enabled === false), [filtered]);

  const grouped = useMemo(() => {
    const g: Record<string, SkillItem[]> = {};
    for (const s of activeSkills) {
      const key = LAYER_META[s.layer] ? s.layer : 'other';
      (g[key] ||= []).push(s);
    }
    return g;
  }, [activeSkills]);

  const orderedLayers = [...LAYERS, OTHER].filter((l) => grouped[l.key]?.length);
  const needApiCount = skills.filter((s) => s.needsApi && !s.apiConfigured).length;
  const enabledCount = skills.filter((s) => s.enabled !== false).length;
  const archivedCount = skills.filter((s) => s.enabled === false).length;

  const toggleEnabled = (s: SkillItem, enabled: boolean) => {
    setSkills((list) => list.map((x) => x.name === s.name ? { ...x, enabled } : x));
    setSkillEnabled(s.name, enabled).catch(() => {
      setSkills((list) => list.map((x) => x.name === s.name ? { ...x, enabled: s.enabled } : x));
      setError('切换技能启用状态失败');
    });
  };

  const renderCard = (s: SkillItem, archived: boolean) => {
    const meta = LAYER_META[s.layer] || OTHER;
    const Icon = iconFor(s.name, meta.Icon);
    const alert = s.needsApi && !s.apiConfigured;
    return (
      <div
        key={s.name}
        className={`card card-hover skill-card${archived ? ' is-archived' : ''}`}
        style={{ ['--layer-color' as string]: meta.color }}
        onClick={() => setSelected(s.name)}
      >
        {alert && <div className="skill-card-alert" title="需要配置 API key">!</div>}
        <div className="skill-card-icon" style={{ color: meta.color }}><Icon size={19} /></div>
        <div className="skill-card-name">{skillSummary(s)}</div>
        <div className="skill-card-slug">{s.name}</div>
        <div className="skill-card-desc">{s.description?.trim() || LAYER_DESC[meta.key] || '技能'}</div>
        <div className="skill-card-foot">
          {s.needsApi && (s.apiConfigured
            ? <span className="badge badge-ok">已配置</span>
            : <span className="badge badge-warn">需 API</span>)}
          <button
            type="button"
            className={`btn btn-sm skill-card-toggle${archived ? '' : ' is-on'}`}
            onClick={(e) => { e.stopPropagation(); toggleEnabled(s, archived); }}
          >
            {archived ? '启用' : '✓ 已启用'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="skills-page">
      <div className="skills-page-head">
        <h1 className="page-title">技能库</h1>
        <p className="page-subtitle">
          已启用 {enabledCount} · 备选归档 {archivedCount}。未启用的技能对话和工作流不会用到。
          点卡片查看说明；右侧按钮切换启用。
          {needApiCount > 0 && <> 标 <span className="badge badge-warn" style={{ padding: '1px 7px' }}>需 API</span> 的需先配置密钥（当前 {needApiCount} 个）。</>}
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
      </div>

      {error && <div style={{ color: 'var(--red)', maxWidth: 1100, margin: '16px auto' }}>{error}</div>}

      <div className="skills-body">
        {orderedLayers.length === 0 && archivedSkills.length === 0 && !error && (
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
              {grouped[layer.key].map((s) => renderCard(s, false))}
            </div>
          </section>
        ))}

        {archivedSkills.length > 0 && (
          <section className="skills-archive">
            <div className="skills-archive-head">
              <h2>备选归档</h2>
              <span>{archivedSkills.length} off · 运行时不会调用</span>
            </div>
            <div className="skill-grid">
              {archivedSkills.map((s) => renderCard(s, true))}
            </div>
          </section>
        )}
      </div>

      {selected && (
        <SkillDrawer
          skillName={selected}
          persona={persona}
          onClose={() => setSelected(null)}
          onConfigured={load}
          onDraftToChat={onDraftToChat}
        />
      )}
    </div>
  );
}
