import { useSyncExternalStore } from 'react';

// 灵感漫步的「后台运行」：任务状态放在模块级 store 里，而不是页面组件里。
// 这样切到别的板块再切回来、甚至整页刷新，都还能接着看到进度和结果。
// 后端已经把一次漫步拆成 job（POST /api/topics/wander 立刻返回 job_id），
// 前端只负责轮询，并把快照广播给订阅它的组件。
//
// 为什么不用 TanStack Query / zustand：这个需求只要「模块级 store + 订阅」，
// React 19 的 useSyncExternalStore 就够了，零新增依赖。

const STORAGE_KEY = 'easel-wander-job';
const POLL_MS = 2000;
// 提交本身应当毫秒级返回（后端只落一条 job 记录）。
// 留 45s 上限是为了把「后端还是旧版本、POST 会一直阻塞」这种情况变成一句能看懂的话，
// 而不是让界面无限停在「提交中」。
const SUBMIT_TIMEOUT_MS = 45_000;
// 后端重启会留下永远 running 的僵尸任务（线程已经没了，jobs.json 里还写着 running），
// 所以前端必须自己兜底判死，否则会无限轮询。
const MAX_JOB_SECONDS = 1200;

export type WanderJobStatus = 'submitting' | 'running' | 'done' | 'error';

export type WanderJob<T = unknown> = {
  id: string;
  status: WanderJobStatus;
  createdAt: number;
  finishedAt: number | null;
  direction: string;
  anchorId: string;
  error: string;
  topic: T | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let timer: number | null = null;
let inflight = false;

function readStored(): WanderJob | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as WanderJob | null;
    if (value && typeof value === 'object' && typeof value.id === 'string') return value;
  } catch {
    /* 隐私模式下 localStorage 会抛，按「没有历史任务」处理即可 */
  }
  return null;
}

// getSnapshot 必须返回稳定引用，否则 React 会认为「一直在变」而无限重渲染
let snapshot: WanderJob | null = readStored();

function emit() {
  for (const listener of listeners) listener();
}

function persist(next: WanderJob | null) {
  try {
    // 只有 running 才落盘：submitting 是本地占位态，刷新后没有意义，
    // 而它也没有服务端 id，恢复出来只会去轮询一个不存在的任务。
    if (next && next.status === 'running') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 同 readStored */
  }
}

function setSnapshot(next: WanderJob | null) {
  snapshot = next;
  persist(next);
  emit();
}

function stopPolling() {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

async function tick() {
  const current = snapshot;
  if (!current || current.status !== 'running') return;
  // 超时判死必须排在 inflight 之前：否则一个挂死的请求会让 inflight 永远为真，
  // 上限就形同虚设，轮询会无限空转。
  if (current.createdAt > 0 && Date.now() / 1000 - current.createdAt > MAX_JOB_SECONDS) {
    stopPolling();
    setSnapshot({
      ...current,
      status: 'error',
      finishedAt: Date.now() / 1000,
      error: `这次漫步超过 ${Math.round(MAX_JOB_SECONDS / 60)} 分钟还没有结果（多半是后端重启把任务弄丢了），已停止等待，可以重新发起。`,
    });
    return;
  }
  if (inflight) return;
  inflight = true;
  // fetch 本身没有超时，不自己上界的话 inflight 会被卡死
  const controller = new AbortController();
  const abortTimer = window.setTimeout(() => controller.abort(), POLL_MS * 4);
  try {
    const response = await fetch('/api/topics/wander/jobs/' + encodeURIComponent(current.id), {
      signal: controller.signal,
    });
    // 期间可能已经重新发起（换了 job），过期回包一律丢掉，否则会把快照覆盖回旧任务
    if (snapshot?.id !== current.id) return;
    if (response.status === 404) {
      stopPolling();
      setSnapshot({
        ...current,
        status: 'error',
        finishedAt: Date.now() / 1000,
        error: '这次漫步的任务记录已经不存在了（后端可能重启过），请重新发起。',
      });
      return;
    }
    const value = (await response.json().catch(() => null)) as WanderJob | null;
    if (snapshot?.id !== current.id) return;
    // 网络抖动／后端短暂不可用时保持 running，等下一轮再试，不把任务判死
    if (!response.ok || !value || typeof value.id !== 'string') return;
    setSnapshot(value);
    if (value.status !== 'running') stopPolling();
  } catch {
    /* 请求超时或网络抖动：保持 running，等下一轮 */
  } finally {
    window.clearTimeout(abortTimer);
    inflight = false;
  }
}

function startPolling() {
  if (timer !== null) return;
  void tick();
  timer = window.setInterval(() => { void tick(); }, POLL_MS);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): WanderJob<unknown> | null {
  return snapshot;
}

/** 订阅当前漫步任务。轮询跑在模块作用域，所以切走板块不会中断。 */
export function useWanderJob<T = unknown>(): WanderJob<T> | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as unknown as WanderJob<T> | null;
}

/** 提交一次漫步：立刻拿到 job，进度靠轮询；已存在的任务会被新任务顶掉。 */
export async function submitWander(payload: {
  direction?: string;
  anchor_id?: string;
  count?: number;
  topic_count?: number;
  timeout?: number;
}): Promise<WanderJob> {
  // 先切到「提交中」：POST 要等后端受理，这段时间里界面必须立刻有反应，
  // 否则点了按钮像没点到（尤其是后端还在跑旧版本、POST 会阻塞几十秒的时候）。
  const provisional: WanderJob = {
    id: `local-${Date.now()}`,
    status: 'submitting',
    createdAt: Date.now() / 1000,
    finishedAt: null,
    direction: payload.direction ?? '',
    anchorId: payload.anchor_id ?? '',
    error: '',
    topic: null,
  };
  setSnapshot(provisional);

  const controller = new AbortController();
  const abortTimer = window.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
  try {
    const response = await fetch('/api/topics/wander', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const value = (await response.json().catch(() => ({}))) as { detail?: string } & Partial<WanderJob>;
    if (!response.ok) {
      throw new Error(typeof value.detail === 'string' ? value.detail : '发起漫步失败。');
    }
    const job = value as WanderJob;
    // 旧版后端会直接把整条选题回过来（有 id 但没有 status）：
    // 这种回包不能当成 job，否则界面会一直停在「提交中」且永远等不到结果。
    if (job.status !== 'running' || typeof job.id !== 'string') {
      throw new Error('后端还没有换成任务化接口（没返回任务 id）。重启一次工作台再试。');
    }
    setSnapshot(job);
    startPolling();
    return job;
  } catch (error) {
    setSnapshot(null);
    if ((error as Error)?.name === 'AbortError') {
      throw new Error(`后端 ${Math.round(SUBMIT_TIMEOUT_MS / 1000)} 秒内没有受理这次漫步，多半是工作台还停在旧版本。重启工作台后再试。`);
    }
    throw error;
  } finally {
    window.clearTimeout(abortTimer);
  }
}

/** 收起当前结果：只清本地快照，服务端已落库的选题不动。 */
export function dismissWander() {
  stopPolling();
  setSnapshot(null);
}

// 模块加载时如果还留着 running 的任务（切走过，或者刷过页面），自动把轮询续上
if (snapshot && snapshot.status === 'running') startPolling();
