import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchWorkflows,
  fetchWorkflow,
  createWorkflow,
  saveWorkflow,
  deleteWorkflow,
  runWorkflow,
  fetchSkills,
  suggestWorkflow,
  streamChat,
} from '../lib/api';
import type { WorkflowGraph, WorkflowSummary, SkillItem, WorkflowRunResult, WorkflowSuggestStep } from '../lib/api';
import { IconPlus, IconTrash, IconWorkflow, IconChevron, IconChat } from './icons';
import SkillPicker from './SkillPicker';
import { layerLabel, parseWfSteps, skillSummary, stripWfSteps } from '../lib/skillText';

const LAYERS: { id: string; label: string }[] = [
  { id: 'discover', label: '发现' },
  { id: 'plan', label: '策划' },
  { id: 'produce', label: '制作' },
  { id: 'publish', label: '发布' },
  { id: 'attribute', label: '归因' },
  { id: 'general', label: '基础' },
];

const LAYER_LABEL: Record<string, string> = Object.fromEntries(LAYERS.map((l) => [l.id, l.label]));

type RecipeStep = {
  id: string;
  layer: string;
  skill: string;
  prompt: string;
  title: string;
};

type DraftFn = (text: string, stage?: string, skill?: string, workflowId?: string) => void;

type AssistMsg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  steps?: WorkflowSuggestStep[];
  streaming?: boolean;
};

function graphToRecipe(graph: WorkflowGraph): RecipeStep[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const n of graph.nodes) {
    incoming.set(n.id, 0);
    outgoing.set(n.id, []);
  }
  for (const e of graph.edges) {
    if (!incoming.has(e.source) || !incoming.has(e.target)) continue;
    outgoing.get(e.source)!.push(e.target);
    incoming.set(e.target, (incoming.get(e.target) || 0) + 1);
  }
  let ready = [...incoming.entries()].filter(([, n]) => n === 0).map(([id]) => id).sort();
  const order: string[] = [];
  while (ready.length) {
    const wave = [...ready];
    ready = [];
    for (const id of wave) {
      order.push(id);
      for (const child of outgoing.get(id) || []) {
        const next = (incoming.get(child) || 0) - 1;
        incoming.set(child, next);
        if (next === 0) ready.push(child);
      }
    }
    ready.sort();
  }
  const ids = order.length === graph.nodes.length ? order : graph.nodes.map((n) => n.id);
  return ids
    .map((id) => byId.get(id))
    .filter((n): n is NonNullable<typeof n> => !!n && n.type === 'skill')
    .map((n) => ({
      id: n.id,
      layer: n.layer || '',
      skill: n.skill || '',
      prompt: n.prompt || '',
      title: n.title || '',
    }));
}

function recipeToGraph(id: string, name: string, steps: RecipeStep[], persona: string): WorkflowGraph {
  const filled = steps.filter((s) => s.skill.trim());
  const nodes: WorkflowGraph['nodes'] = [
    { id: 'start', type: 'input', title: '起点', skill: '', prompt: '', layer: '', x: 80, y: 180 },
  ];
  const edges: WorkflowGraph['edges'] = [];
  let prev = 'start';
  filled.forEach((step, i) => {
    const nid = step.id && step.id !== 'start' ? step.id : `s${i + 1}`;
    nodes.push({
      id: nid,
      type: 'skill',
      title: step.title || LAYER_LABEL[step.layer] || step.skill,
      skill: step.skill,
      prompt: step.prompt,
      layer: step.layer,
      x: 80 + (i + 1) * 240,
      y: 180,
    });
    edges.push({ id: `e-${prev}-${nid}`, source: prev, target: nid });
    prev = nid;
  });
  return { id, name, persona, nodes, edges };
}

function newStep(layer = ''): RecipeStep {
  return {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    layer,
    skill: '',
    prompt: '',
    title: LAYER_LABEL[layer] || '',
  };
}

function formatRun(r: WorkflowRunResult): string {
  const bits = [`${r.ok ? '已跑完' : '有步骤失败'} · ${r.steps.filter((s) => s.skill).length} 步`];
  for (const step of r.steps) {
    if (!step.skill) continue;
    bits.push(`${step.ok ? '✓' : '×'} ${step.title}: ${(step.ok ? step.output : step.error).slice(0, 80)}`);
  }
  return bits.join('\n');
}

const LAYER_IDS = new Set(LAYERS.map((l) => l.id));

function normalizeAssistSteps(
  rows: { layer: string; skill: string }[],
  catalog: SkillItem[],
  fallback: WorkflowSuggestStep[],
): WorkflowSuggestStep[] {
  const parsed: WorkflowSuggestStep[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const hit = catalog.find((s) => s.name.toLowerCase() === row.skill);
    if (!hit || seen.has(hit.name)) continue;
    seen.add(hit.name);
    const layer = LAYER_IDS.has(row.layer) ? row.layer : (hit.layer || 'general');
    parsed.push({
      name: hit.name,
      layer,
      layerLabel: layerLabel(layer) || layer,
      summary: skillSummary(hit),
      description: hit.description || '',
    });
  }
  if (!parsed.length) return fallback;
  if (fallback.length && parsed.length < fallback.length) return fallback;
  return parsed;
}

function skillCaption(skills: SkillItem[], name: string): string {
  const hit = skills.find((s) => s.name === name);
  return hit ? skillSummary(hit) : name.replace(/^skill-/, '').replace(/-/g, ' ');
}

export default function WorkflowsPage({
  persona,
  onDraftToChat,
}: {
  persona: string;
  onDraftToChat?: DraftFn;
}) {
  const [list, setList] = useState<WorkflowSummary[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('未命名工作流');
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [bindPersona, setBindPersona] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [runInput, setRunInput] = useState('');
  const [runLog, setRunLog] = useState('');
  const [assistInput, setAssistInput] = useState('');
  const [assistMsgs, setAssistMsgs] = useState<AssistMsg[]>([]);
  const [assistBusy, setAssistBusy] = useState(false);
  const sessionId = useRef(`wf-assist-${Date.now().toString(36)}`);
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const reloadList = () => fetchWorkflows().then(setList).catch(() => setList([]));

  useEffect(() => {
    reloadList();
    fetchSkills().then(setSkills).catch(() => setSkills([]));
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [assistMsgs]);

  const applyGraph = (g: WorkflowGraph) => {
    setCurrentId(g.id);
    setName(g.name);
    setSteps(graphToRecipe(g));
    setBindPersona(!!(g.persona && persona && g.persona === persona));
    setDirty(false);
    setRunLog('');
  };

  const open = async (id: string) => {
    if (dirty && !window.confirm('当前配方未保存，放弃修改？')) return;
    setBusy('读取…');
    try {
      applyGraph(await fetchWorkflow(id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const onNew = async () => {
    if (dirty && !window.confirm('当前配方未保存，放弃修改？')) return;
    setBusy('新建…');
    try {
      const g = await createWorkflow('未命名工作流');
      await reloadList();
      applyGraph(g);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const persist = async (next?: { name?: string; steps?: RecipeStep[] }) => {
    const useName = (next?.name ?? name).trim() || '未命名工作流';
    const useSteps = next?.steps ?? steps;
    let id = currentId;
    if (!id) {
      const created = await createWorkflow(useName);
      id = created.id;
      setCurrentId(id);
    }
    const saved = await saveWorkflow(recipeToGraph(
      id,
      useName,
      useSteps,
      bindPersona ? persona : '',
    ));
    applyGraph(saved);
    await reloadList();
    return saved;
  };

  const onSave = async () => {
    setBusy('保存…');
    try {
      await persist();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const onDelete = async () => {
    if (!currentId) return;
    if (!window.confirm(`删除配方「${name}」？`)) return;
    setBusy('删除…');
    try {
      await deleteWorkflow(currentId);
      setCurrentId(null);
      setSteps([]);
      setName('未命名工作流');
      setDirty(false);
      setRunLog('');
      await reloadList();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const filled = steps.filter((s) => s.skill.trim());

  const draftToChat = async () => {
    if (!onDraftToChat) return;
    if (filled.length === 0) {
      alert('先为至少一步选好技能');
      return;
    }
    setBusy('保存…');
    try {
      const saved = await persist();
      const topic = runInput.trim();
      const text = topic
        ? `运行工作流「${saved.name}」：\n${topic}`
        : `运行工作流「${saved.name}」：`;
      onDraftToChat(text, filled[0]?.layer || undefined, undefined, saved.id);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const onRun = async () => {
    if (filled.length === 0) {
      alert('先为至少一步选好技能');
      return;
    }
    if (dirty || !currentId) {
      alert('请先保存再试跑');
      return;
    }
    setBusy('运行中，每步会真实调用对应技能…');
    setRunLog('');
    try {
      const r = await runWorkflow(currentId, runInput.trim() || `运行工作流「${name}」`, persona);
      setRunLog(formatRun(r));
    } catch (err) {
      setRunLog((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const patchStep = (id: string, patch: Partial<RecipeStep>) => {
    setSteps((cur) => cur.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, ...patch };
      if (patch.skill && !patch.layer) {
        const hit = skills.find((sk) => sk.name === patch.skill);
        if (hit?.layer) {
          next.layer = hit.layer;
          next.title = LAYER_LABEL[hit.layer] || next.title;
        }
      }
      if (patch.layer && !patch.title) next.title = LAYER_LABEL[patch.layer] || next.title;
      return next;
    }));
    setDirty(true);
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= steps.length) return;
    setSteps((cur) => {
      const copy = [...cur];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
    setDirty(true);
  };

  const skillsByLayer = useMemo(() => {
    const map = new Map<string, SkillItem[]>();
    for (const s of skills) {
      const key = s.layer || 'general';
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [skills]);

  const applySuggestion = (picked: WorkflowSuggestStep[]) => {
    if (picked.length === 0) return;
    if (filled.length > 0 && !window.confirm('用这几步替换当前配方？')) return;
    const next = picked.map((item) => {
      const hit = skills.find((s) => s.name === item.name);
      const layer = hit?.layer || item.layer;
      return {
        ...newStep(layer),
        skill: item.name,
        title: LAYER_LABEL[layer] || item.layerLabel || item.summary,
      };
    });
    setSteps(next);
    setDirty(true);
    if (!runInput.trim()) {
      const lastUser = [...assistMsgs].reverse().find((m) => m.role === 'user');
      if (lastUser?.text) setRunInput(lastUser.text);
    }
    if (!currentId && name === '未命名工作流') {
      const lastUser = [...assistMsgs].reverse().find((m) => m.role === 'user');
      if (lastUser?.text) setName(lastUser.text.slice(0, 18));
    }
  };

  const sendAssist = async () => {
    const text = assistInput.trim();
    if (!text || assistBusy) return;
    abortRef.current?.abort();
    setAssistInput('');
    const userId = `u${Date.now()}`;
    const botId = `a${Date.now()}`;
    setAssistMsgs((cur) => [...cur, { id: userId, role: 'user', text }, { id: botId, role: 'assistant', text: '', streaming: true }]);
    setAssistBusy(true);

    let picked: WorkflowSuggestStep[] = [];
    try {
      const sug = await suggestWorkflow(text);
      picked = sug.steps;
      setAssistMsgs((cur) => cur.map((m) => (
        m.id === botId ? { ...m, text: sug.reply, steps: sug.steps } : m
      )));
    } catch {
      /* 后面用对话补 */
    }

    let streamStarted = false;
    abortRef.current = streamChat(
      text,
      persona || undefined,
      sessionId.current,
      (chunk) => {
        setAssistMsgs((cur) => cur.map((m) => {
          if (m.id !== botId) return m;
          if (!streamStarted) {
            streamStarted = true;
            return { ...m, text: chunk };
          }
          return { ...m, text: m.text + chunk };
        }));
      },
      () => {
        setAssistMsgs((cur) => cur.map((m) => {
          if (m.id !== botId) return m;
          return {
            ...m,
            streaming: false,
            text: stripWfSteps(m.text),
            steps: normalizeAssistSteps(parseWfSteps(m.text), skills, m.steps || picked),
          };
        }));
        setAssistBusy(false);
      },
      (err) => {
        setAssistMsgs((cur) => cur.map((m) => (
          m.id === botId
            ? {
              ...m,
              streaming: false,
              text: (m.text || picked.length)
                ? `${stripWfSteps(m.text) || '先按上面这几步即可。'}\n对话暂时连不上：${err.message}`
                : `对话暂时连不上：${err.message}。你可以再说具体一点，或自己在左边选技能。`,
              steps: m.steps || picked,
            }
            : m
        )));
        setAssistBusy(false);
      },
      undefined,
      undefined,
      undefined,
      undefined,
      false,
      undefined,
      [],
      undefined,
      'assemble',
    );
  };

  return (
    <div className="wf-page">
      <aside className="wf-rail">
        <div className="wf-rail-head">
          <h1 className="page-title" style={{ fontSize: 20 }}><IconWorkflow size={20} /> 工作流</h1>
          <button className="btn btn-primary" type="button" onClick={onNew} disabled={!!busy}>
            <IconPlus size={15} /> 新建
          </button>
        </div>
        <p className="wf-hint">按发现 → 策划 → 制作 → 发布 → 归因选技能，或右侧跟 AI 说目的，保存后到对话里确认再跑。</p>
        <div className="wf-list">
          {list.length === 0 && <div className="wf-empty">还没有配方，点新建，或先跟右侧说你想做什么。</div>}
          {list.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`wf-item${currentId === item.id ? ' active' : ''}`}
              onClick={() => open(item.id)}
            >
              <strong>{item.name}</strong>
              <span>
                {item.stepCount ?? item.skills?.length ?? 0} 步
                {item.skills?.length ? ` · ${item.skills.slice(0, 2).map((sk) => skillCaption(skills, sk)).join('、')}` : ''}
                {item.persona ? ` · ${item.persona}` : ''}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="wf-main">
        {!currentId && steps.length === 0 ? (
          <div className="wf-blank">从左侧新建一份配方，或先在右侧说明你想达成什么。</div>
        ) : (
          <>
            <div className="wf-toolbar">
              <input
                className="wf-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setDirty(true); }}
                aria-label="配方名称"
              />
              <button type="button" className="btn btn-primary" onClick={onSave} disabled={!!busy || (!dirty && !!currentId)}>
                {dirty || !currentId ? '保存' : '已保存'}
              </button>
              <button type="button" className="chip" onClick={onDelete} disabled={!!busy || !currentId} title="删除">
                <IconTrash size={14} />
              </button>
              {busy && <span className="wf-busy">{busy}</span>}
            </div>

            <div className="wf-recipe">
              <div className="wf-add-layers">
                {LAYERS.filter((l) => l.id !== 'general').map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    className="chip"
                    disabled={!!busy}
                    onClick={() => {
                      setSteps((cur) => [...cur, newStep(layer.id)]);
                      setDirty(true);
                    }}
                  >
                    + {layer.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="chip"
                  disabled={!!busy}
                  onClick={() => { setSteps((cur) => [...cur, newStep()]); setDirty(true); }}
                >
                  + 任意技能
                </button>
              </div>

              {steps.length === 0 && (
                <p className="wf-hint">上面点一个环节，再为这一步选技能。不必五个环节都填。</p>
              )}

              <ol className="wf-steps">
                {steps.map((step, index) => {
                  const inferredLayer = step.layer || skills.find((s) => s.name === step.skill)?.layer || '';
                  const options = inferredLayer
                    ? (skillsByLayer.get(inferredLayer) || [])
                    : skills;
                  const chosen = skills.find((s) => s.name === step.skill);
                  return (
                    <li key={step.id} className={`wf-step wf-layer-${step.layer || 'general'}`}>
                      <div className="wf-step-index">{index + 1}</div>
                      <div className="wf-step-body">
                        <div className="wf-step-row">
                          <label>
                            环节
                            <select
                              value={inferredLayer}
                              onChange={(e) => patchStep(step.id, { layer: e.target.value, skill: '', title: LAYER_LABEL[e.target.value] || '' })}
                            >
                              <option value="">不限</option>
                              {LAYERS.map((l) => (
                                <option key={l.id} value={l.id}>{l.label}</option>
                              ))}
                            </select>
                          </label>
                          <label className="wf-step-skill">
                            技能
                            <SkillPicker
                              skills={options}
                              value={step.skill}
                              onChange={(skill) => patchStep(step.id, { skill })}
                              disabled={!!busy}
                            />
                          </label>
                          <div className="wf-step-move">
                            <button type="button" className="chip" disabled={index === 0} onClick={() => moveStep(index, -1)} title="上移">
                              <span style={{ display: 'inline-flex', transform: 'rotate(-90deg)' }}><IconChevron size={14} /></span>
                            </button>
                            <button type="button" className="chip" disabled={index === steps.length - 1} onClick={() => moveStep(index, 1)} title="下移">
                              <span style={{ display: 'inline-flex', transform: 'rotate(90deg)' }}><IconChevron size={14} /></span>
                            </button>
                            <button
                              type="button"
                              className="chip"
                              onClick={() => { setSteps((cur) => cur.filter((s) => s.id !== step.id)); setDirty(true); }}
                              title="删除这步"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>
                        {chosen && (
                          <p className="wf-step-desc">
                            <strong>{skillSummary(chosen)}</strong>
                            {chosen.description ? ` —— ${chosen.description}` : ''}
                          </p>
                        )}
                        <label>
                          这一步补充（可空）
                          <textarea
                            rows={2}
                            value={step.prompt}
                            onChange={(e) => patchStep(step.id, { prompt: e.target.value })}
                            placeholder="会拼在主题和上一步结果前面"
                          />
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="wf-deploy">
                {persona && (
                  <label className="wf-bind">
                    <input
                      type="checkbox"
                      checked={bindPersona}
                      onChange={(e) => { setBindPersona(e.target.checked); setDirty(true); }}
                    />
                    绑定当前画像「{persona}」
                  </label>
                )}
                <label>
                  主题 / 起点（填入对话或试跑都会带上）
                  <textarea
                    rows={3}
                    value={runInput}
                    onChange={(e) => setRunInput(e.target.value)}
                    placeholder="例如：围绕今天小红书里和科研相关的热点，做成一篇可发的笔记"
                  />
                </label>
                <div className="wf-deploy-actions">
                  <button type="button" className="btn btn-primary" onClick={() => void draftToChat()} disabled={!!busy || !onDraftToChat}>
                    填入对话
                  </button>
                  <button type="button" className="chip" onClick={() => void onRun()} disabled={!!busy}>
                    在本页试跑
                  </button>
                </div>
                <p className="wf-hint">填入对话后不会自动发送，你看过再按发送才会整条跑。</p>
                {runLog && <pre className="wf-log">{runLog}</pre>}
              </div>
            </div>
          </>
        )}
      </section>

      <aside className="wf-assist">
        <div className="wf-assist-head">
          <h2><IconChat size={16} /> 跟 AI 选技能</h2>
          <p>说你想达成什么。AI 只帮你挑现成技能，不会自己开跑。</p>
        </div>
        <div className="wf-assist-thread" ref={threadRef}>
          {assistMsgs.length === 0 && (
            <div className="wf-assist-empty">
              例如：「先看今天科研热点，再写成一篇能发的小红书。」
            </div>
          )}
          {assistMsgs.map((msg) => (
            <div key={msg.id} className={`wf-assist-msg ${msg.role}`}>
              <div className="wf-assist-bubble">{msg.role === 'assistant' ? stripWfSteps(msg.text) || (msg.streaming ? '正在想…' : '') : msg.text}</div>
              {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                <div className="wf-assist-steps">
                  {msg.steps.map((step, i) => (
                    <div key={`${step.name}-${i}`} className="wf-assist-step">
                      <b>{i + 1}. {step.layerLabel}</b>
                      <span>{step.summary}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={!!busy}
                    onClick={() => applySuggestion(msg.steps || [])}
                  >
                    采用到配方
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <form
          className="wf-assist-form"
          onSubmit={(e) => { e.preventDefault(); void sendAssist(); }}
        >
          <textarea
            rows={3}
            value={assistInput}
            disabled={assistBusy}
            onChange={(e) => setAssistInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendAssist();
              }
            }}
            placeholder="我想做成什么…"
          />
          <button type="submit" className="btn btn-primary" disabled={assistBusy || !assistInput.trim()}>
            {assistBusy ? '在想…' : '发送'}
          </button>
        </form>
      </aside>
    </div>
  );
}
