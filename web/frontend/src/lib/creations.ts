import { request } from './api';

export interface CreationVersion {
  id: string; number: number; title: string; createdAt: string; label: string;
  bodyPath: string; bodyHash: string; platforms: Record<string, string>; tags: string; media: string[];
  cards: { path: string; text: string; bodyHash: string; edited: boolean }[];
}
export interface Creation {
  id: string; title: string; revision: number; sessionId: string; sourceIds: string[];
  sources: { id: string; title: string; link: string; platform: string; author: string }[];
  sourcePath: string; ideaId: string; body: string; fileError: string; versions: CreationVersion[];
  related: { schedule: { id: string; title: string; date: string; platform: string; creation_version: string }[];
    publications: { path: string; status: string; link?: string; date?: string; extra?: Record<string, string> }[] };
}
export type CreationBrief = Pick<Creation, 'id' | 'title' | 'revision' | 'sourceIds' | 'sessionId'> & { updatedAt: string };
export interface CreationInput { title: string; sourceIds?: string[]; sourcePath?: string; ideaId?: string }

export async function creationRequest<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('/api/creations' + path, body === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

export const operationId = () => crypto.randomUUID().replaceAll('-', '');

const localEditorLocks = new Map<string, Promise<void>>();

export async function withCreationEditor(id: string, use: (lock: Lock | null) => Promise<void>): Promise<void> {
  // A page unmount resolves its callback before the browser has released the lock.
  // Await that release when handing this tab from the editor to the publish page.
  const previous = localEditorLocks.get(id) || Promise.resolve();
  const pending = previous.catch(() => undefined).then(() =>
    navigator.locks.request('easel-creation:' + id, { ifAvailable: true }, use));
  localEditorLocks.set(id, pending);
  try { await pending; }
  finally { if (localEditorLocks.get(id) === pending) localEditorLocks.delete(id); }
}

export function openCreation(id: string) {
  window.dispatchEvent(new CustomEvent('meta-open-creation', { detail: id }));
}
