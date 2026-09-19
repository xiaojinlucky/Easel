import { useEffect, useMemo, useRef, useState } from 'react';
import type { SkillItem } from '../lib/api';
import { layerLabel, skillSummary } from '../lib/skillText';

export default function SkillPicker({
  skills,
  value,
  onChange,
  disabled,
}: {
  skills: SkillItem[];
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = skills.find((s) => s.name === value);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = [...skills].sort((a, b) => skillSummary(a).localeCompare(skillSummary(b), 'zh'));
    if (!needle) return list;
    return list.filter((s) => {
      const hay = `${s.name} ${skillSummary(s)} ${s.description || ''} ${layerLabel(s.layer)}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [skills, q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      if (!root.current?.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="skill-picker" ref={root}>
      <button
        type="button"
        className="skill-picker-btn"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => { setOpen((cur) => !cur); setQ(''); }}
      >
        {selected ? (
          <span className="skill-picker-current">
            <strong>{skillSummary(selected)}</strong>
            <em>{selected.name}</em>
          </span>
        ) : (
          <span className="skill-picker-placeholder">搜索并选择技能…</span>
        )}
      </button>
      {open && (
        <div className="skill-picker-pop" role="listbox">
          <input
            ref={searchRef}
            className="skill-picker-search"
            value={q}
            placeholder="搜中文说明或英文名"
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="skill-picker-list">
            <button
              type="button"
              className={`skill-picker-opt${!value ? ' active' : ''}`}
              onClick={() => { onChange(''); setOpen(false); }}
            >
              先不选
            </button>
            {filtered.length === 0 && <div className="skill-picker-empty">没有匹配「{q}」的技能</div>}
            {filtered.map((s) => (
              <button
                key={s.name}
                type="button"
                role="option"
                aria-selected={s.name === value}
                className={`skill-picker-opt${s.name === value ? ' active' : ''}`}
                title={s.description || s.name}
                onClick={() => { onChange(s.name); setOpen(false); }}
              >
                <span className="skill-picker-opt-main">
                  <strong>{skillSummary(s)}</strong>
                  <em>{s.name}</em>
                </span>
                <span className="skill-picker-layer">{layerLabel(s.layer) || '基础'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
