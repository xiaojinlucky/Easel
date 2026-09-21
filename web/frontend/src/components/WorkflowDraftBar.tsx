import { useEffect, useState } from 'react';
import { fetchWorkflows } from '../lib/api';
import type { WorkflowSummary } from '../lib/api';

type DraftFn = (text: string, stage?: string, skill?: string, workflowId?: string) => void;

export default function WorkflowDraftBar({
  context,
  onDraftToChat,
}: {
  context: string;
  onDraftToChat?: DraftFn;
}) {
  const [list, setList] = useState<WorkflowSummary[]>([]);
  const [id, setId] = useState('');

  useEffect(() => {
    fetchWorkflows()
      .then((items) => {
        setList(items);
        setId((cur) => cur || items[0]?.id || '');
      })
      .catch(() => setList([]));
  }, []);

  if (!onDraftToChat || list.length === 0) return null;
  const wf = list.find((w) => w.id === id) || list[0];
  if (!wf) return null;

  return (
    <div className="wf-draft-bar">
      <select
        aria-label="选择工作流"
        value={wf.id}
        onChange={(e) => setId(e.target.value)}
      >
        {list.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {item.stepCount ? ` · ${item.stepCount} 步` : ''}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={() => {
          const body = context.trim();
          const text = body
            ? `运行工作流「${wf.name}」：\n${body}`
            : `运行工作流「${wf.name}」：`;
          onDraftToChat(text, undefined, undefined, wf.id);
        }}
      >
        填入对话
      </button>
    </div>
  );
}
