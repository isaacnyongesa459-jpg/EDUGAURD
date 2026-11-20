const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');

function loadDemoApi() {
  const storage = new Map();
  const localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const window = {};
  const source = fs.readFileSync(path.join(root, 'client/demo-api.js'), 'utf8');
  vm.runInNewContext(source, { window, Date, localStorage, Blob: class Blob {}, URL: { createObjectURL: () => '', revokeObjectURL: () => {} } });
  return window.EduDemoAPI;
}

test('static demo uses clearly synthetic sample records without contacting a backend', async () => {
  const api = loadDemoApi();
  const [session, state, summary] = await Promise.all([api.me(), api.state, api.summary()]);
  assert.equal(session.role, 'School Administrator');
  assert.match(state.school.name, /Academy/);
  assert.ok(state.students.length >= 4);
  assert.ok(state.websites.some(site => site.domain === 'classroom.google.com'));
  assert.ok(state.activity.every(event => event.site && event.studentId));
  assert.equal(summary.devices, state.devices.length);
});

test('static demo supports safe fictional mutations and reset', async () => {
  const api = loadDemoApi();
  const before = api.state.websites.length;
  api.addWebsite({ name: 'Demo Library', domain: 'library.example', category: 'Learning' });
  assert.equal(api.state.websites.length, before + 1);
  const device = api.state.devices[0];
  const originalStatus = device.status;
  api.toggleDevice(device.id);
  assert.notEqual(api.state.devices[0].status, originalStatus);
  api.reset();
  assert.equal(api.state.websites.length, before);
  assert.equal(api.state.devices[0].status, originalStatus);
});

test('demo authentication accepts arbitrary credentials and stores only a local session flag', async () => {
  const storage = new Map();
  const localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const window = {};
  const source = fs.readFileSync(path.join(root, 'client/demo-api.js'), 'utf8');
  vm.runInNewContext(source, { window, Date, localStorage, Blob: class Blob {}, URL: { createObjectURL: () => '', revokeObjectURL: () => {} } });
  const auth = window.EduDemoAuth;
  assert.equal(auth.isAuthenticated(), false);
  const result = await auth.signIn('anything@example.test', 'not-a-real-password');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { mode: 'demo', authenticated: true });
  assert.equal(auth.isAuthenticated(), true);
  assert.equal(storage.size, 1);
  assert.equal(storage.get('eduguard-demo-session'), 'true');
  auth.signOut();
  assert.equal(auth.isAuthenticated(), false);
});
