const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');

test('frontend data views invoke API methods before reading their responses', () => {
  const app = fs.readFileSync(path.join(root, 'client/app.js'), 'utf8');
  for (const method of ['summary', 'activity', 'students', 'devices', 'rules', 'notifications', 'schools']) {
    assert.doesNotMatch(app, new RegExp(`await\\s+EduAPI\\.${method}\\b(?!\\s*\\()`), `${method} must be called`);
  }
});
