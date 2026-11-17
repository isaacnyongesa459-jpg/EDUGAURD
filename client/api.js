/* Same-origin EduGuard API client. Session credentials remain in HttpOnly cookies. */
(() => {
  'use strict';
  const bodyMethods = new Set(['POST', 'PATCH', 'DELETE', 'PUT']);
  let csrfToken = null;
  let schoolId = '';
  function messageFor(status, payload) {
    const detail = payload && (payload.message || payload.error || payload.detail);
    if (detail) return String(detail);
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return 'You do not have permission to do that.';
    if (status === 404) return 'This service or record is not available.';
    if (status === 429) return 'Too many requests. Please wait and try again.';
    if (status >= 500) return 'The EduGuard service is temporarily unavailable. Please try again later.';
    return 'The request could not be completed. Please check your input and try again.';
  }
  function scoped(path) {
    if (!schoolId) return path;
    const url = new URL(path, location.origin);
    url.searchParams.set('schoolId', schoolId);
    return url.pathname + url.search;
  }
  function scopedBody(data) {
    return schoolId && data && typeof data === 'object' ? { ...data, schoolId } : data;
  }
  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    if (bodyMethods.has(method)) {
      if (!csrfToken) await refreshCsrf();
      headers.set('X-CSRF-Token', csrfToken);
    }
    let response;
    try { response = await fetch(path, { ...options, method, headers, credentials: 'same-origin', cache: 'no-store' }); }
    catch (_) { throw new Error('Could not reach the EduGuard API. Check your connection and try again.'); }
    const type = response.headers.get('content-type') || '';
    let payload = null;
    if (type.includes('application/json')) { try { payload = await response.json(); } catch (_) {} }
    else if (response.status !== 204) {
      const text = await response.text().catch(() => '');
      if (text && response.ok) throw new Error('The API returned an unexpected response.');
    }
    if (!response.ok) {
      if (response.status === 403 && bodyMethods.has(method)) csrfToken = null;
      throw new Error(messageFor(response.status, payload));
    }
    if (payload?.csrfToken && path === '/api/auth/csrf') csrfToken = payload.csrfToken;
    return payload;
  }
  async function refreshCsrf() {
    const payload = await request('/api/auth/csrf');
    csrfToken = payload?.csrfToken || null;
    if (!csrfToken) throw new Error('Secure sign-in is not configured on this server.');
    return csrfToken;
  }
  const json = data => JSON.stringify(data);
  const get = path => request(scoped(path));
  window.EduAPI = {
    request, csrf: refreshCsrf,
    setSchoolId: id => { schoolId = id || ''; },
    login: async (email, password) => {
      const result = await request('/api/auth/login', { method: 'POST', body: json({ email, password }) });
      csrfToken = null;
      await refreshCsrf();
      return result;
    },
    me: () => request('/api/auth/me'),
    logout: () => request('/api/auth/logout', { method: 'POST', body: json({}) }),
    summary: () => get('/api/dashboard/summary'),
    activity: () => get('/api/activity'),
    students: () => get('/api/students'),
    addStudent: data => request('/api/students', { method: 'POST', body: json(scopedBody(data)) }),
    devices: () => get('/api/devices'),
    addDevice: data => request('/api/devices', { method: 'POST', body: json(scopedBody(data)) }),
    setDeviceStatus: (id, status) => request(scoped(`/api/devices/${encodeURIComponent(id)}/status`), { method: 'PATCH', body: json({ status }) }),
    rules: () => get('/api/rules'),
    addRule: data => request('/api/rules', { method: 'POST', body: json(scopedBody(data)) }),
    deleteRule: id => request(scoped(`/api/rules/${encodeURIComponent(id)}`), { method: 'DELETE' }),
    notifications: () => get('/api/notifications'),
    readNotification: id => request(scoped(`/api/notifications/${encodeURIComponent(id)}/read`), { method: 'PATCH', body: json({}) }),
    trends: range => get(`/api/reports/trends?range=${encodeURIComponent(range)}`),
    users: () => get('/api/users'),
    addUser: data => request('/api/users', { method: 'POST', body: json(scopedBody(data)) }),
    linkStudent: data => request(scoped('/api/relationships'), { method: 'POST', body: json(data) }),
    schools: () => request('/api/schools'),
    addSchool: data => request('/api/schools', { method: 'POST', body: json(data) })
  };
})();
