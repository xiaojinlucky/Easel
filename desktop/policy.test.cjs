const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { destination, allowedInView } = require('./policy.cjs');
test('local tools are recognized by exact host and port, with one persistent origin', () => {
  assert.deepEqual(destination('http://127.0.0.1:4007/media?x=1'), {kind:'local',key:'publish',url:'http://localhost:4007/media?x=1'});
  assert.equal(allowedInView('http://localhost:4007/media', 'publish'), true);
  assert.equal(allowedInView('http://127.0.0.1:4007/media', 'publish'), false);
  assert.equal(allowedInView('http://localhost:8089/', 'home'), false);
});
test('renderer cannot navigate to executable protocols or unrelated local services', () => {
  for (const url of ['file:///C:/Windows/System32/cmd.exe','javascript:alert(1)','ms-settings:privacy','http://127.0.0.1:9222/','http://localhost.evil.com:7860/','http://user:password@localhost:7860/','https://user:password@example.com/']) assert.equal(destination(url), null);
  assert.equal(destination('https://www.electronjs.org/').kind, 'external');
});
test('window close hides to tray and skips the taskbar', () => {
  const src = fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8');
  const match = src.match(/mainWindow\.on\('close',[\s\S]*?\n    \}\);/);
  assert.ok(match, 'main window close handler must exist');
  assert.match(match[0], /hideToTray\(/);
  assert.doesNotMatch(match[0], /minimize\(/);
  assert.match(src, /function hideToTray\(/);
  assert.match(src, /setSkipTaskbar\(true\)/);
  assert.match(src, /setSkipTaskbar\(false\)/);
});
