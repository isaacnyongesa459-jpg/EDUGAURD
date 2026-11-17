const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../..');

function loadDemoApi() {
  const window = {};
  const source = fs.readFileSync(path.join(root, 'client/demo-api.js'), 'utf8');
  vm.runInNewContext(source, { window, Date });
  return window.EduDemoAPI;
}

test('static demo uses clearly synthetic sample records without contacting a backend', async () => {
  const api = loadDemoApi();
  const [session, students, devices, activity, summary] = await Promise.all([
    api.me(), api.students(), api.devices(), api.activity(), api.summary()
  ]);

  assert.equal(session.user.role, 'PARENT');
  assert.equal(session.user.email, 'demo@example.test');
  assert.ok(students.students.every(student => student.fullName.startsWith('Sample Learner')));
  assert.ok(devices.devices.every(device => device.id.startsWith('sample-device-')));
  assert.ok(activity.activities.every(event => event.domain.endsWith('.example')));
  assert.equal(summary.activityEvents, activity.activities.length);
});

test('static demo rejects changes and does not provide account authentication', async () => {
  const api = loadDemoApi();
  await assert.rejects(api.login('anyone@example.test', 'anything'), /Read-only demo/);
  await assert.rejects(api.addStudent({ fullName: 'Not saved' }), /Read-only demo/);
  await assert.rejects(api.setDeviceStatus('sample-device-1', 'revoked'), /Read-only demo/);
});
