const test = require('node:test');
const assert = require('node:assert/strict');
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
