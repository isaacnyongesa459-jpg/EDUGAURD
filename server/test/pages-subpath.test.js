const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');

test('local entry-page assets are relative for GitHub Pages project subpaths', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const urls = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map(match => match[1])
    .filter(url => !/^(?:https?:|data:|#)/i.test(url));

  assert.ok(urls.length > 0);
  for (const url of urls) assert.equal(url.startsWith('/'), false, `${url} must not escape the project subpath`);
  assert.ok(html.indexOf('demo-api.js') < html.indexOf('app.js'), 'demo API must load before app bootstrap');
  assert.match(html, /src="\.\/client\/app\.js"/);
});

test('PWA start URL and worker registration preserve the current project subpath', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  const registration = fs.readFileSync(path.join(root, 'client/register-sw.js'), 'utf8');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.match(registration, /new URL\('service-worker\.js', baseUrl\)/);
  assert.match(registration, /scope: baseUrl\.pathname/);
});
