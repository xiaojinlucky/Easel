import { useMemo, useState } from 'react';
import type { ChatMessage } from '../lib/store';
import { renderMarkdown } from '../lib/sanitize';
import { linkifyOutputs, externalizeMediaLinks } from '../lib/linkifyOutputs';
import { IconCopy, IconCheck, IconRetry } from './icons';
import { extractArtifacts } from '../lib/artifacts';
import ArtifactGallery from './ArtifactGallery';

import { setItemStatus } from '../lib/api';
interface TopicJson { content_direction?: string; topic?: { title?: string; connections?: unknown[] }; direction_frame?: { target_reader?: string; core_tension?: string; angle?: string; material_entry?: string; why_now?: string; my_judgment?: string; fits_account?: string } }
function parseTopic(text: string): TopicJson | null {
  const s = text.indexOf('{'); const e = text.lastIndexOf('}');
  if (s < 0 || e <= s) return null;
  try {
    const j = JSON.parse(text.slice(s, e + 1)) as TopicJson;
    return j?.topic?.title && j.direction_frame ? j : null;
  } catch { return null; }
}
function TopicCard({ t }: { t: TopicJson }) {
  const f = t.direction_frame || {};
  const stuck = [f.target_reader, f.core_tension].filter(Boolean).join('：');
  const rows: [string, string | undefined][] = [['谁卡在哪', stuck], ['为什么现在讲', f.why_now], ['我有什么材料', f.material_entry], ['我的判断', f.my_judgment || f.angle], ['是否符合账号', f.fits_account]];
  const [added, setAdded] = useState(false);
  const addTopic = async () => {
    await setItemStatus(`选题/${t.topic?.title}`, { status: 'todo', extra: { topic: { title: t.topic?.title, stuck, whyNow: f.why_now || '', material: f.material_entry || '', judgment: f.my_judgment || f.angle || '', fits: f.fits_account || '', source: t.content_direction || '' } } });
    setAdded(true);
  };
  const go = () => window.dispatchEvent(new CustomEvent('meta-start-prompt', { detail:
    `就写这个选题：「${t.topic?.title}」\n谁卡在哪：${stuck}\n为什么现在讲：${f.why_now || '（没写）'}\n我有什么材料：${f.material_entry || ''}\n我的判断：${f.my_judgment || f.angle || ''}\n\n按我的画像和写作技能，先给我大纲，确认后再写正文。草稿存进内容库「选题/${t.topic?.title}」对应的项目。` }));
  return (
    <div className="meta-topic-card">
      <div className="meta-topic-label">选题</div>
      <div className="meta-topic-title">{t.topic?.title}</div>
      {rows.map(([k, v]) => (
        <div key={k} className="meta-topic-row"><span>{k}</span><p className={v ? '' : 'meta-unfilled'}>{v || '没写'}</p></div>
      ))}
      {t.content_direction && <div className="meta-topic-src">来源：{t.content_direction}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={go}>接着写</button>
        <button className="btn btn-sm" disabled={added} onClick={() => { void addTopic(); }}>{added ? '已入选题' : '入选题'}</button>
      </div>
    </div>
  );
}

export interface BubbleActions {
  onCopy: () => void;
  onRetry?: () => void;    // 仅最后一轮可用（append-only：不改写历史）
  canModify: boolean;      // 流式中禁用 retry
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  thinking?: string;
  activity?: string;
  stillWorking?: string;   // 防呆心跳提示（未卡住）；仅流式时的独立提示，不替代思考/活动
  actions?: BubbleActions;
}

function ActionBar({ actions }: { actions: BubbleActions }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    actions.onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="msg-actions">
      <button className="msg-action" onClick={copy} title="复制">
        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}<span>{copied ? '已复制' : '复制'}</span>
      </button>
      {actions.onRetry && actions.canModify && (
        <button className="msg-action" onClick={actions.onRetry} title="重新生成"><IconRetry size={14} /><span>重试</span></button>
      )}
    </div>
  );
}

export default function MessageBubble({ message, isStreaming, thinking, activity, stillWorking, actions }: MessageBubbleProps) {
  const rendered = useMemo(() => {
    if (message.role === 'user') return { html: '', artifacts: [], archives: [] };
    // 助手正文里裸露的产物路径先转成前端可用链接（文件直开、图片内联、目录跳内容库）。
    // 流式中不转换：路径/围栏代码块可能被 SSE token 从中间切开（扩展名没收全会被
    // 误判成目录、未闭合的 ``` 会误伤命令示例里的 outputs/），转换只在流式结束后
    // 对完整正文做一次，避免闪烁成错误链接再跳变。
    const body = isStreaming ? message.content : linkifyOutputs(message.content);
    const html = externalizeMediaLinks(renderMarkdown(body));
    return isStreaming ? { html, artifacts: [], archives: [] } : extractArtifacts(html);
  }, [message.content, message.role, isStreaming]);

  // ---- 用户消息 ----
  if (message.role === 'user') {
    // Attachment-only turns are intentionally invisible; the structured refs
    // remain in session state for retry but never leak paths into the chat UI.
    if (!message.content.trim()) return null;
    return (
      <div className="message-row user">
        <div className="msg-col user">
          <div className="message-bubble user">{message.content}</div>
          {actions && <ActionBar actions={actions} />}
        </div>
      </div>
    );
  }

  // ---- 助手消息 ----
  // 思考 / 活动：流式时用实时值；结束后用消息里持久化的值 —— 一直保留，不隐藏
  const effThinking = isStreaming ? (thinking || '') : (message.thinking || '');
  const liveActivity = isStreaming ? (activity || '') : '';
  const liveHint = isStreaming ? (stillWorking || '') : '';   // 防呆「未卡住」提示，附着显示、不顶掉真实状态
  const doneSteps = !isStreaming ? (message.activity || '') : '';

  const livePanel = (effThinking || liveActivity || liveHint || doneSteps) ? (
    <div className="live-panel">
      {liveActivity ? (
        <div className="live-activity">
          <span className="live-pulse" />{liveActivity}
          {liveHint && <span className="live-still"> · {liveHint}</span>}
        </div>
      ) : liveHint ? (
        <div className="live-activity"><span className="live-pulse" />{liveHint}</div>
      ) : null}
      {doneSteps && (
        <details className="thinking-block">
          <summary>🧠 执行过程（{doneSteps.split('\n').length} 步）</summary>
          <div className="thinking-text">{doneSteps}</div>
        </details>
      )}
      {effThinking && (
        <details className="thinking-block" open={isStreaming && !message.content}>
          <summary>💭 思考过程</summary>
          <div className="thinking-text">{effThinking}</div>
        </details>
      )}
    </div>
  ) : null;

  // 等待回复中（还没有正文、思考、活动）
  if (isStreaming && !message.content && !effThinking && !liveActivity && !liveHint) {
    return (
      <div className="message-row assistant">
        <div className="message-bubble assistant">
          <div className="typing-indicator">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-row assistant">
      <div className="msg-col assistant">
        <div className="message-bubble assistant">
          {livePanel}
          {message.content && (!isStreaming && parseTopic(message.content)
            ? <TopicCard t={parseTopic(message.content)!} />
            : <div dangerouslySetInnerHTML={{ __html: rendered.html }} />)}
          {!isStreaming && (rendered.artifacts.length > 0 || rendered.archives.length > 0) && (
            <ArtifactGallery artifacts={rendered.artifacts} archives={rendered.archives} />
          )}
          {isStreaming && <span className="streaming-cursor" />}
        </div>
        {actions && !isStreaming && <ActionBar actions={actions} />}
      </div>
    </div>
  );
}
