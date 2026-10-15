import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const require = createRequire(new URL('../../web/frontend/package.json', import.meta.url));
const ts = require('typescript');
const source = readFileSync(new URL('../../web/frontend/src/lib/creations.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
});
const turn = () => new Promise(resolve => setImmediate(resolve));

function editor(browserLocks) {
  const exports = {};
  runInNewContext(outputText, { exports, require: () => ({}), navigator: { locks: browserLocks } });
  return exports.withCreationEditor;
}

test('same-tab page handoff waits for the browser to release the old editor lock', async () => {
  const held = new Set();
  const withEditor = editor({ async request(name, options, use) {
    if (held.has(name)) return use(null);
    held.add(name);
    try { await use({ name }); }
    finally { await turn(); held.delete(name); }
  } });
  let release;
  const first = withEditor('work', async lock => {
    assert.ok(lock);
    await new Promise(resolve => { release = resolve; });
  });
  await turn();
  release();
  let secondCanEdit = false;
  const second = withEditor('work', async lock => { secondCanEdit = !!lock; });
  await Promise.all([first, second]);
  assert.equal(secondCanEdit, true);
  assert.equal(held.size, 0);
});

test('rapid page changes serialize cancelled intermediate requests before the visible editor', async () => {
  const held = new Set();
  const withEditor = editor({ async request(name, options, use) {
    if (held.has(name)) return use(null);
    held.add(name);
    try { await use({ name }); }
    finally { await turn(); held.delete(name); }
  } });
  let release;
  const oldPage = withEditor('work', async () => new Promise(resolve => { release = resolve; }));
  await turn();
  const cancelledPage = withEditor('work', async () => {});
  let visibleCanEdit = false;
  const visiblePage = withEditor('work', async lock => { visibleCanEdit = !!lock; });
  release();
  await Promise.all([oldPage, cancelledPage, visiblePage]);
  assert.equal(visibleCanEdit, true);
  assert.equal(held.size, 0);
});

test('a lock held in another tab still grants viewing only', async () => {
  const withEditor = editor({ async request(name, options, use) {
    assert.equal(name, 'easel-creation:work');
    assert.equal(options.ifAvailable, true);
    await use(null);
  } });
  let canEdit = true;
  await withEditor('work', async lock => { canEdit = !!lock; });
  assert.equal(canEdit, false);
});
