import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import QuestionCards from './QuestionCards';
import type { ChatSession, ChatMessage, StreamState } from '../lib/store';
import { uploadFiles, fetchSkillRoute, fetchWorkflows } from '../lib/api';
import type { UploadedFile, SkillRouteHit, WorkflowSummary } from '../lib/api';
import { IconArrowUp, IconStop, IconPlus, IconFile } from './icons';
import { skillSummary } from '../lib/skillText';

interface ChatPageProps {
  session: ChatSession;
  stream?: StreamState;          // 进行中的流式态（来自 App，切页也不丢）
  onSend: (displayText: string, attachments?: UploadedFile[], stage?: string, skill?: string) => void;
  onRunWorkflow?: (workflowId: string, workflowName: string, input: string) => void;
  onStop: () => void;
  onResend: (
    userIndex: number,
    displayText: string,
    attachments?: UploadedFile[],
    legacyAgentText?: string,
    stage?: string,
    skill?: string,
  ) => void; // 重试：仅对最后一轮
  onQuestionAnswered?: (questionId: string) => void;   // 某道问答题提交成功（App 记录答过，重放不再出现）
  onConsumeDraft?: () => void;
}

// 空态推荐（贴合 Easel 社媒创作场景）
const SUGGESTIONS = [
  { icon: '🔥', title: '蹭个热点', prompt: '看看现在微博和抖音有什么热搜，挑几个适合我做二创的选题' },
  { icon: '✍️', title: '写小红书文案', prompt: '帮我写一条小红书种草文案，主题先问我' },
  { icon: '🎴', title: '做金句卡片', prompt: '把一句走心的话做成一张适合发朋友圈的金句卡片' },
  { icon: '🎬', title: '口播脚本', prompt: '帮我写一条 60 秒的口播短视频脚本，主题先问我' },
];

const LAYER_NAV = [
  { stage: 'discover', label: '发现', prompt: '看看现在有哪些适合我做的热点和二创机会' },
  { stage: 'plan', label: '策划', prompt: '帮我从现有机会里选出一个选题，并给出结构' },
  { stage: 'produce', label: '制作', prompt: '按最匹配的制作技能，把当前主题写成可发布文案' },
  { stage: 'publish', label: '发布', prompt: '检查这篇内容能不能发，并按平台适配' },
  { stage: 'attribute', label: '归因', prompt: '看看我已登录账号最近的数据和评论反馈' },
];

function greeting(): string {
  const h = new Date().getHours();
  const g = h < 6 ? '夜深了' : h < 12 ? '上午好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
  return `${g}，想创作点什么？`;
}

export default function ChatPage({ session, stream, onSend, onRunWorkflow, onStop, onResend, onQuestionAnswered, onConsumeDraft }: ChatPageProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [routeHits, setRouteHits] = useState<SkillRouteHit[]>([]);
  const [draftStage, setDraftStage] = useState<string | undefined>();
  const [pinnedSkill, setPinnedSkill] = useState<string | undefined>();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [pinnedWorkflow, setPinnedWorkflow] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStreaming = !!stream;
  const isEmpty = session.messages.length === 0 && !isStreaming;

  const doUpload = async (fs: FileList | File[]) => {
    const arr = Array.from(fs);
    if (!arr.length) return;
    setUploading(true);
    try {
      const saved = await uploadFiles(arr, session.id);
      setAttachments((a) => [...a, ...saved]);
    } catch (err) {
      alert((err as Error).message || '上传失败');
    } finally {
      setUploading(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) doUpload(e.dataTransfer.files);
  };
  const onPaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files?.length) { e.preventDefault(); doUpload(e.clipboardData.files); }
  };
  const removeAttachment = (path: string) => setAttachments((a) => a.filter((x) => x.path !== path));

  useEffect(() => {
    if (!isEmpty) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, stream?.content, stream?.thinking, stream?.activity, isEmpty]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 180) + 'px';
    }
  }, [input]);

  useEffect(() => {
    fetchWorkflows().then(setWorkflows).catch(() => setWorkflows([]));
  }, []);

  const draftKey = session.incomingDraft
    ? `${session.incomingDraft.text}\0${session.incomingDraft.workflowId || ''}\0${session.incomingDraft.skill || ''}`
    : '';
  useEffect(() => {
    const draft = session.incomingDraft;
    if (!draft?.text) return;
    setInput(draft.text);
    setDraftStage(draft.stage);
    setPinnedSkill(draft.skill);
    setPinnedWorkflow(draft.workflowId);
    window.requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = draft.text.length;
    });
    // 不在此处清掉 incomingDraft：React Strict Mode 会卸载重挂，提前清掉会把输入框洗空。
  }, [session.id, draftKey]);

  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setRouteHits([]);
      return;
    }
    let ignore = false;
    const timer = window.setTimeout(() => {
      fetchSkillRoute(q, draftStage, pinnedSkill)
        .then((r) => { if (!ignore) setRouteHits(r.matches || []); })
        .catch(() => { if (!ignore) setRouteHits([]); });
    }, 280);
    return () => { ignore = true; window.clearTimeout(timer); };
  }, [input, draftStage, pinnedSkill]);

  const chosenSkill = pinnedSkill || routeHits[0]?.name;

  const fillDraft = (text: string, stage?: string) => {
    if (isStreaming) return;
    setInput(text);
    setDraftStage(stage);
    setPinnedSkill(undefined);
    window.requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = text.length;
    });
  };

  const sendAndClear = (text: string, files?: UploadedFile[], stage?: string, skill?: string) => {
    if (isStreaming) return;
    onSend(text, files, stage, skill);
    setInput('');
    setAttachments([]);
    setRouteHits([]);
    setDraftStage(undefined);
    setPinnedSkill(undefined);
    setPinnedWorkflow(undefined);
    onConsumeDraft?.();
  };

  const chosenWorkflow = workflows.find((w) => w.id === pinnedWorkflow);

  const handleSend = () => {
    const trimmed = input.trim().replace(/(?:请执行\s*)+(?:\/|\$)?(?:skill-)?[a-z0-9\-]+\s*[：:]\s*/gi, '').trim() || input.trim();
    if (isStreaming || uploading) return;
    if (chosenWorkflow && onRunWorkflow) {
      onRunWorkflow(chosenWorkflow.id, chosenWorkflow.name, trimmed || `运行工作流「${chosenWorkflow.name}」`);
      setInput('');
      setAttachments([]);
      setRouteHits([]);
      setDraftStage(undefined);
      setPinnedSkill(undefined);
      setPinnedWorkflow(undefined);
      onConsumeDraft?.();
      return;
    }
    if (!trimmed && attachments.length === 0) return;
    sendAndClear(trimmed, attachments, draftStage, chosenSkill);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const skillNav = (
    <div className="skill-nav" aria-label="技能导航">
      <div className="skill-nav-layers">
        {LAYER_NAV.map((layer) => (
          <button
            key={layer.stage}
            type="button"
            className={`chip${draftStage === layer.stage ? ' active' : ''}`}
            disabled={isStreaming}
            onClick={() => fillDraft(layer.prompt, layer.stage)}
          >
            {layer.label}
          </button>
        ))}
      </div>
      {routeHits.length > 0 && (
        <div className="skill-nav-hits">
          <span className="skill-nav-kicker">
            {pinnedSkill ? '已指定主技能，点同一枚可取消' : '按你的原文自动选用，点其它可改，不改输入框'}
          </span>
          {routeHits.map((hit) => (
            <button
              key={hit.name}
              type="button"
              className={`chip skill-nav-hit${chosenSkill === hit.name ? ' active' : ''}`}
              title={hit.description}
              disabled={isStreaming}
              onClick={() => {
                if (isStreaming) return;
                setPinnedSkill((cur) => (cur === hit.name ? undefined : hit.name));
              }}
            >
              {chosenSkill === hit.name ? '本轮 · ' : ''}{hit.layerLabel} · {skillSummary(hit)}
            </button>
          ))}
        </div>
      )}
      {workflows.length > 0 && (
        <div className="skill-nav-hits">
          <span className="skill-nav-kicker">工作流 · 点一下填入输入框，确认后再发送</span>
          {workflows.map((wf) => (
            <button
              key={wf.id}
              type="button"
              className={`chip skill-nav-wf${pinnedWorkflow === wf.id ? ' active' : ''}`}
              disabled={isStreaming}
              onClick={() => {
                if (isStreaming) return;
                if (pinnedWorkflow === wf.id) {
                  setPinnedWorkflow(undefined);
                  return;
                }
                setPinnedWorkflow(wf.id);
                setPinnedSkill(undefined);
                const prefix = `运行工作流「${wf.name}」：`;
                setInput((cur) => (cur.trim() ? cur : prefix));
                setDraftStage(undefined);
                window.requestAnimationFrame(() => {
                  const el = textareaRef.current;
                  if (!el) return;
                  el.focus();
                  el.selectionStart = el.selectionEnd = el.value.length;
                });
              }}
            >
              {pinnedWorkflow === wf.id ? '本轮 · ' : ''}{wf.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const inputBox = (hero: boolean) => (
    <div className={`composer ${hero ? 'composer-hero' : ''} ${dragOver ? 'composer-drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
      onDrop={onDrop}>
      {skillNav}
      {attachments.length > 0 && (
        <div className="composer-attachments">
          {attachments.map((a) => (
            <span key={a.path} className="attach-chip" title={a.path}>
              <IconFile size={12} /> <span className="attach-name">{a.name}</span>
              <button className="attach-x" onClick={() => removeAttachment(a.path)} title="移除">×</button>
            </span>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        className="chat-input"
        placeholder={dragOver ? '松手上传素材…' : hero ? '把你的想法告诉我，选题 / 文案 / 卡片 / 视频 / 发布都行…（可拖入图片/文档当素材）' : '发消息…（Enter 发送，Shift+Enter 换行，可拖入/粘贴素材）'}
        value={input}
        onChange={(e) => { setInput(e.target.value); setPinnedSkill(undefined); }}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        rows={1}
        autoFocus={hero}
      />
      <input ref={fileInputRef} type="file" multiple hidden
        onChange={(e) => { if (e.target.files) doUpload(e.target.files); e.target.value = ''; }} />
      <div className="composer-bar">
        <button className="composer-attach-btn" onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || uploading} title="添加素材（图片/文档）">
          <IconPlus size={15} /> {uploading ? '上传中…' : '素材'}
        </button>
        <span className="composer-hint">{isStreaming ? '生成中…' : 'Enter 发送 · Shift+Enter 换行'}</span>
        {isStreaming ? (
          <button className="send-btn" onClick={onStop} title="停止生成"><IconStop size={15} /></button>
        ) : (
          <button className="send-btn" onClick={handleSend} disabled={(!input.trim() && !attachments.length && !pinnedWorkflow) || uploading} title="发送"><IconArrowUp size={17} /></button>
        )}
      </div>
    </div>
  );

  // ---- 空态：居中欢迎页 ----
  if (isEmpty) {
    return (
      <div className="chat-page">
        <div className="chat-hero">
          <div className="chat-hero-brand">
            <img src="./static/easel-icon-transparent.png" alt="" />
            <span>Easel</span>
          </div>
          <h1 className="chat-hero-title">{greeting()}</h1>
          <p className="chat-hero-sub">从选题到发布，一站式帮你把想法做成能发的内容。</p>
          {inputBox(true)}
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s.title} className="card card-hover suggestion-card"
                onClick={() => fillDraft(s.prompt)}>
                <span className="suggestion-icon">{s.icon}</span>
                <span className="suggestion-body">
                  <span className="suggestion-title">{s.title}</span>
                  <span className="suggestion-text">{s.prompt}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- 对话态 ----
  const displayMessages: ChatMessage[] = [...session.messages];
  if (isStreaming) displayMessages.push({ role: 'assistant', content: stream!.content || '' });

  return (
    <div className="chat-page">
      <div className="chat-messages">
        <div className="chat-thread">
          {displayMessages.map((msg, i) => {
            const isLast = i === displayMessages.length - 1;
            const live = isStreaming && isLast && msg.role === 'assistant';
            const isFinal = !live && i < session.messages.length;
            let actions;
            if (isFinal) {
              const copy = () => navigator.clipboard?.writeText(msg.content);
              // 只允许对「最后一轮」重试，契合 OpenClaw append-only 模型（不改写历史）；已移除编辑
              const isLastFinal = i === session.messages.length - 1;
              if (msg.role === 'user') {
                actions = {
                  onCopy: copy,
                  onRetry: isLastFinal
                    ? () => onResend(i, msg.content, msg.attachments, msg.agentContent, msg.stage, msg.skill)
                    : undefined,
                  canModify: !isStreaming,
                };
              } else {
                const pi = i - 1;
                const prevUser = pi >= 0 && session.messages[pi]?.role === 'user' ? session.messages[pi] : null;
                actions = {
                  onCopy: copy,
                  onRetry: (isLastFinal && prevUser)
                    ? () => onResend(pi, prevUser.content, prevUser.attachments, prevUser.agentContent, prevUser.stage, prevUser.skill)
                    : undefined,
                  canModify: !isStreaming,
                };
              }
            }
            return (
              <MessageBubble
                key={`${i}-${msg.role}`}
                message={msg}
                isStreaming={live}
                thinking={live ? stream!.thinking : ''}
                activity={live ? stream!.activity : ''}
                actions={actions}
              />
            );
          })}
          {isStreaming && (stream!.questions?.length ?? 0) > 0 && (
            <QuestionCards questions={stream!.questions || []} onDone={(qid) => onQuestionAnswered?.(qid)} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-input-area">
        <div className="chat-input-inner">{inputBox(false)}</div>
      </div>
    </div>
  );
}
