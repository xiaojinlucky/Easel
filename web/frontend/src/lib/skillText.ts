export const LAYER_ZH: Record<string, string> = {
  discover: '发现',
  plan: '策划',
  produce: '制作',
  publish: '发布',
  attribute: '归因',
  general: '基础',
};

export function layerLabel(layer?: string): string {
  if (!layer) return '';
  return LAYER_ZH[layer] || layer;
}

export function skillSummary(s: { name: string; summary?: string; description?: string }): string {
  if (s.summary?.trim()) return s.summary.trim();
  const text = (s.description || '').replace(/\s+/g, ' ').trim();
  if (!text) return s.name.replace(/^skill-/, '').replace(/-/g, ' ');
  let sent = text.split(/[。！？]/)[0].trim();
  if (sent.includes('，') && sent.length > 28) sent = sent.split('，')[0].trim();
  if (sent.length > 40) sent = `${sent.slice(0, 40).replace(/[，、；; ]+$/, '')}…`;
  return sent || s.name;
}

export function stripWfSteps(text: string): string {
  return text.replace(/^\s*WF_STEP\s+.*$/gmi, '').replace(/\n{3,}/g, '\n\n').trim();
}

export function parseWfSteps(text: string): { layer: string; skill: string }[] {
  const out: { layer: string; skill: string }[] = [];
  const seen = new Set<string>();
  const re = /WF_STEP\s+layer=([a-z]+)\s+skill=([a-z][a-z0-9\-]{2,})/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text || ''))) {
    const layer = match[1].toLowerCase();
    const skill = match[2].toLowerCase();
    if (seen.has(skill)) continue;
    seen.add(skill);
    out.push({ layer, skill });
  }
  return out;
}
