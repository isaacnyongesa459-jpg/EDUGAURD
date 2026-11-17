const API_KEY = 'eduguardConfig';
const POLICY_KEY = 'eduguardPolicy';
const DEVICE_KEY = 'eduguardDeviceToken';
const DB_NAME = 'eduguard-outbox-v1';
const STORE = 'events';
const SYNC_ALARM = 'eduguard-sync';
const POLICY_ALARM = 'eduguard-policy';
const activeTabs = new Map();

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'eventId' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function dbPut(event) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(event);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  }); db.close();
}
async function dbAll() {
  const db = await openDb();
  const rows = await new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
  }); db.close(); return rows;
}
async function dbDelete(ids) {
  if (!ids.length) return;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite'); ids.forEach(id => tx.objectStore(STORE).delete(id));
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  }); db.close();
}
const local = keys => chrome.storage.local.get(keys);
const setLocal = values => chrome.storage.local.set(values);
const uuid = () => crypto.randomUUID();
function originFor(apiOrigin) { return apiOrigin.replace(/\/+$/, ''); }
function validDomain(raw) {
  const value = String(raw || '').trim().toLowerCase().replace(/^\*\./, '').replace(/\.$/, '');
  if (!value || value.includes('/') || value.includes(':') || value.includes('*')) throw new Error(`Invalid policy domain: ${raw}`);
  const url = new URL(`https://${value}` );
  if (url.hostname !== value || value === 'localhost') return url.hostname;
  return value;
}
function matchesDomainRule(rule, domain) {
  const host = validDomain(rule.domain);
  return domain === host || domain.endsWith(`.${host}`);
}
function ruleUrlFilter(_rule, host) {
  // The current API supplies domain rules only; legacy urlMatch labels carry no path pattern.
  return `||${host}^`;
}
async function refreshDnr(policy) {
  if (!policy || policy.defaultAction !== 'deny' || typeof policy.captureFullUrl !== 'boolean' || !Array.isArray(policy.websiteRules) || !Array.isArray(policy.applicationRules)) throw new Error('Unsupported policy format: expected defaultAction deny, captureFullUrl, websiteRules and applicationRules');
  for (const rule of policy.websiteRules) {
    if (!rule || !rule.id || !rule.domain || !['allow', 'block'].includes(rule.action) || typeof rule.category !== 'string') throw new Error('Unsupported website rule in policy');
  }
  const rules = [{ id: 1, priority: 1, action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } }, condition: { regexFilter: '^https?://', resourceTypes: ['main_frame'] } }];
  let id = 10;
  const validRules = policy.websiteRules.filter(r => ['allow', 'block'].includes(r.action) && r.domain);
  for (const rule of validRules) {
    const host = validDomain(rule.domain);
    rules.push({ id: id++, priority: rule.action === 'block' ? 300 : 200, action: rule.action === 'block' ? { type: 'redirect', redirect: { extensionPath: '/blocked.html' } } : { type: 'allow' }, condition: { regexFilter: ruleUrlFilter(rule, host), resourceTypes: ['main_frame'] } });
  }
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existing.map(r => r.id), addRules: rules });
  await setLocal({ [POLICY_KEY]: policy });
}
async function request(path, method, body) {
  const { [API_KEY]: cfg, [DEVICE_KEY]: token } = await local([API_KEY, DEVICE_KEY]);
  if (!cfg?.apiOrigin) throw new Error('Configure the backend HTTPS origin in EduGuard options first.');
  const headers = { 'content-type': 'application/json' };
  if (token) headers['x-device-token'] = token;
  const response = await fetch(`${originFor(cfg.apiOrigin)}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error(`Backend returned HTTP ${response.status} for ${path}`);
  return response.status === 204 ? null : response.json();
}
async function syncPolicy() {
  const { [DEVICE_KEY]: token } = await local(DEVICE_KEY); if (!token) return;
  const policy = await request('/api/extension/policy', 'GET');
  await refreshDnr(policy);
  await setLocal({ lastPolicySyncAt: new Date().toISOString(), lastError: '' });
}
async function syncEvents() {
  const { [DEVICE_KEY]: token } = await local(DEVICE_KEY); if (!token) return;
  const events = await dbAll(); if (!events.length) return;
  const { [POLICY_KEY]: policy } = await local(POLICY_KEY);
  const batch = events.slice(0, 100);
  // Full URLs are never retained in the outbox; the backend must explicitly
  // enable capture before a URL can be included in an activity request.
  const payload = batch.map(e => {
    const item = { ...e };
    if (policy?.captureFullUrl !== true) delete item.url;
    return item;
  });
  await request('/api/extension/activities/sync', 'POST', { events: payload });
  await dbDelete(batch.map(e => e.eventId));
  await setLocal({ lastSyncAt: new Date().toISOString(), retryAttempt: 0, lastError: '' });
}
async function runSync() {
  try { await syncPolicy(); await syncEvents(); }
  catch (error) {
    const { retryAttempt = 0 } = await local('retryAttempt');
    const next = Math.min(retryAttempt + 1, 8); const delay = Math.min(15 * 60 * 1000, 5000 * (2 ** (next - 1)));
    await setLocal({ retryAttempt: next, lastError: String(error.message || error), nextRetryAt: new Date(Date.now() + delay).toISOString() });
    chrome.alarms.create(SYNC_ALARM, { when: Date.now() + delay });
  }
}
function normalizeHost(input) { try { const url = new URL(input); return ['http:', 'https:'].includes(url.protocol) ? url.hostname.toLowerCase() : null; } catch { return null; } }
function classify(policy, domain) {
  const matching = (policy?.websiteRules || []).filter(rule => { try { return matchesDomainRule(rule, domain); } catch { return false; } });
  if (matching.some(r => r.action === 'block')) return { status: 'blocked', category: matching.find(r => r.action === 'block')?.category || 'uncategorized' };
  if (matching.some(r => r.action === 'allow')) return { status: 'allowed', category: matching.find(r => r.action === 'allow')?.category || 'uncategorized' };
  return { status: 'blocked', category: 'uncategorized' };
}
async function logVisit(details, durationSeconds = 0) {
  if (details.frameId !== 0) return;
  const domain = normalizeHost(details.url); if (!domain) return;
  const { [POLICY_KEY]: policy } = await local(POLICY_KEY);
  const { status, category } = classify(policy, domain);
  const event = { eventId: uuid(), domain, ...(policy?.captureFullUrl === true ? { url: details.url } : {}), occurredAt: new Date(details.timeStamp || Date.now()).toISOString(), durationSeconds: Math.max(0, Math.floor(durationSeconds)), accessStatus: status, category };
  await dbPut(event);
  chrome.alarms.create(SYNC_ALARM, { delayInMinutes: 0.1 });
}
async function finishVisit(prior) {
  if (!prior) return;
  prior.event.durationSeconds = Math.max(0, Math.floor((Date.now() - prior.started) / 1000));
  await dbPut(prior.event);
  chrome.alarms.create(SYNC_ALARM, { delayInMinutes: 0.1 });
}
chrome.webNavigation.onCommitted.addListener(details => {
  if (details.frameId !== 0) return;
  const prior = activeTabs.get(details.tabId);
  if (prior) void finishVisit(prior);
  const domain = normalizeHost(details.url); if (!domain) { activeTabs.delete(details.tabId); return; }
  void (async () => {
    const { [POLICY_KEY]: policy } = await local(POLICY_KEY);
    const { status, category } = classify(policy, domain);
    // A blocked navigation commits the extension redirect, not the attempted URL.
    // Record those attempts in onBeforeNavigate instead.
    if (status === 'blocked') { activeTabs.delete(details.tabId); return; }
    const event = { eventId: uuid(), domain, ...(policy?.captureFullUrl === true ? { url: details.url } : {}), occurredAt: new Date(details.timeStamp || Date.now()).toISOString(), durationSeconds: 0, accessStatus: status, category };
    activeTabs.set(details.tabId, { event, started: Date.now() });
  })();
});
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (details.frameId !== 0) return;
  const domain = normalizeHost(details.url); if (!domain) return;
  void (async () => {
    const { [POLICY_KEY]: policy } = await local(POLICY_KEY);
    const { status } = classify(policy, domain);
    if (status === 'blocked') await logVisit(details, 0);
  })();
});
chrome.tabs.onRemoved.addListener(tabId => {
  const prior = activeTabs.get(tabId);
  if (prior) { void finishVisit(prior); activeTabs.delete(tabId); }
});
chrome.alarms.onAlarm.addListener(alarm => { if ([SYNC_ALARM, POLICY_ALARM].includes(alarm.name)) void runSync(); });
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(POLICY_ALARM, { periodInMinutes: 5 });
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 1 });
  void runSync();
});
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create(POLICY_ALARM, { periodInMinutes: 5 }); chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 1 }); void runSync(); });
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === 'ENROLL') {
      const { [DEVICE_KEY]: existingToken } = await local(DEVICE_KEY);
      if (existingToken) throw new Error('This extension is already enrolled. Contact an administrator before replacing its device enrollment.');
      const result = await request('/api/extension/enroll', 'POST', { code: message.code, device: { name: message.deviceName, os: navigator.userAgent, extensionVersion: chrome.runtime.getManifest().version } });
      if (!result?.deviceToken) throw new Error('Enrollment response did not include deviceToken.');
      await setLocal({ [DEVICE_KEY]: result.deviceToken }); await runSync(); return { ok: true };
    }
    if (message.type === 'SAVE_CONFIG') { await setLocal({ [API_KEY]: { apiOrigin: message.apiOrigin } }); return { ok: true }; }
    if (message.type === 'STATUS') {
      const values = await local([API_KEY, DEVICE_KEY, 'lastPolicySyncAt', 'lastSyncAt', 'lastError', 'nextRetryAt']);
      return { configured: !!values[API_KEY]?.apiOrigin, enrolled: !!values[DEVICE_KEY], ...values };
    }
    if (message.type === 'SYNC_NOW') { await runSync(); return { ok: true }; }
    if (message.type === 'NAVIGATION_EVENT') { await logVisit(message.details, message.durationSeconds || 0); return { ok: true }; }
    throw new Error('Unknown request');
  })().then(sendResponse).catch(error => sendResponse({ error: error.message }));
  return true;
});
