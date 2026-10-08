const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { createSessionSynchronizer } = require('../lib/auth/session-sync.ts');
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const identity = { uid: 'student', getIdTokenResult: async () => ({ token: 'test-token', claims: { role: 'student' } }) };

test('logout clears the cookie after an already-started session POST finishes', async () => {
  const started = deferred(), finish = deferred(), calls = []; let uid = 'student';
  const sessions = createSessionSynchronizer(async (_, options) => {
    calls.push(options.method);
    if (options.method === 'POST') { started.resolve(); await finish.promise; }
    return Response.json({});
  }, () => uid);
  const refresh = sessions.sync(identity);
  await started.promise;
  sessions.invalidate(); uid = null;
  const logout = sessions.clear();
  finish.resolve(); await refresh; await logout;
  assert.deepEqual(calls, ['POST', 'DELETE']);
});

test('a stale token lookup cannot mint a session after logout starts', async () => {
  const started = deferred(), finish = deferred(), calls = []; let uid = 'student';
  const sessions = createSessionSynchronizer(async (_, options) => { calls.push(options.method); return Response.json({}); }, () => uid);
  const refresh = sessions.sync({ uid, getIdTokenResult: async () => { started.resolve(); return finish.promise; } });
  await started.promise;
  sessions.invalidate(); uid = null;
  const logout = sessions.clear();
  finish.resolve({ token: 'old-token', claims: { role: 'student' } });
  await refresh; await logout;
  assert.deepEqual(calls, ['DELETE']);
});

test('a late observer with an old user cannot restore a logged-out session', async () => {
  const calls = [];
  const sessions = createSessionSynchronizer(async (_, options) => { calls.push(options.method); return Response.json({}); }, () => 'student');
  sessions.invalidate(); await sessions.clear();
  assert.equal(await sessions.sync(identity), null);
  assert.deepEqual(calls, ['DELETE']);
});

test('an old signed-out observer cannot delete a newly signed-in session', async () => {
  const calls = []; let uid = null;
  const sessions = createSessionSynchronizer(async (_, options) => { calls.push(options.method); return Response.json({}); }, () => uid);
  const oldObserver = sessions.sync(null);
  sessions.beginSignIn(); uid = 'student';
  const role = sessions.sync(identity);
  await oldObserver; assert.equal(await role, 'student');
  assert.deepEqual(calls, ['POST']);
});

test('cookie deletion failure is reported instead of claiming successful logout', async () => {
  const sessions = createSessionSynchronizer(async () => Response.json({}, { status: 503 }), () => null);
  await assert.rejects(sessions.clear(), /Could not complete sign-out/);
});

test('failed session writes do not prevent later cookie deletion', async () => {
  const calls = [];
  const sessions = createSessionSynchronizer(async (_, options) => { calls.push(options.method); return Response.json({}, { status: options.method === 'POST' ? 401 : 200 }); }, () => 'student');
  await assert.rejects(sessions.sync(identity));
  sessions.invalidate(); await sessions.clear();
  assert.deepEqual(calls, ['POST', 'DELETE']);
});

test('a new explicit sign-in can establish a session after logout', async () => {
  const sessions = createSessionSynchronizer(async () => Response.json({}), () => 'student');
  sessions.invalidate(); await sessions.clear(); sessions.beginSignIn();
  assert.equal(await sessions.sync(identity), 'student');
});
