/* EduGuard demonstration data only. Fictional records, persisted locally in this browser. */
(() => {
  'use strict';
  const KEY = 'eduguard-demo-v3';
  const ago = minutes => new Date(Date.now() - minutes * 60000).toISOString();
  const fresh = () => ({
    school: { id: 'school-demo', name: 'Nairobi International Academy', location: 'Nairobi, Kenya', plan: 'Demonstration workspace' },
    users: [
      { id: 'u-admin', name: 'Amina Wanjiku', role: 'School Administrator', email: 'amina@demo.eduguard.test', initials: 'AW' },
      { id: 'u-teacher', name: 'David Otieno', role: 'Teacher', email: 'david@demo.eduguard.test', initials: 'DO' },
      { id: 'u-parent', name: 'Grace Muthoni', role: 'Parent', email: 'grace@demo.eduguard.test', initials: 'GM' }
    ],
    students: [
      { id: 's-1', name: 'Amara Mwangi', className: 'Year 8 · Blue', guardian: 'Grace Muthoni' },
      { id: 's-2', name: 'Brian Kiptoo', className: 'Year 7 · Green', guardian: 'Peter Kiptoo' },
      { id: 's-3', name: 'Zuri Kamau', className: 'Year 6 · Gold', guardian: 'Grace Muthoni' },
      { id: 's-4', name: 'Nia Achieng', className: 'Year 9 · Blue', guardian: 'Lilian Achieng' }
    ],
    devices: [
      { id: 'D-1048', name: 'Amara · Lenovo 300e', studentId: 's-1', type: 'Windows laptop', os: 'Windows 11', status: 'Online', lastSync: ago(4), policy: 'Secondary Standard' },
      { id: 'D-1051', name: 'Brian · Galaxy A54', studentId: 's-2', type: 'Android smartphone', os: 'Android 14', status: 'Online', lastSync: ago(12), policy: 'Mobile Learning' },
      { id: 'D-1057', name: 'Zuri · iPad 10th Gen', studentId: 's-3', type: 'Tablet', os: 'iPadOS 17', status: 'Offline', lastSync: ago(96), policy: 'Primary Standard' },
      { id: 'D-1062', name: 'Nia · Dell Latitude', studentId: 's-4', type: 'Windows laptop', os: 'Windows 11', status: 'Online', lastSync: ago(2), policy: 'Secondary Standard' }
    ],
    websites: [
      { id: 'w-1', domain: 'classroom.google.com', name: 'Google Classroom', category: 'Learning', action: 'Approved', usage: '4h 18m' },
      { id: 'w-2', domain: 'khanacademy.org', name: 'Khan Academy', category: 'Learning', action: 'Approved', usage: '2h 42m' },
      { id: 'w-3', domain: 'chatgpt.com', name: 'ChatGPT', category: 'AI & research', action: 'Approved', usage: '1h 36m' },
      { id: 'w-4', domain: 'youtube.com', name: 'YouTube', category: 'Media', action: 'Restricted', usage: '48m' },
      { id: 'w-5', domain: 'tiktok.com', name: 'TikTok', category: 'Social', action: 'Blocked', usage: '—' },
      { id: 'w-6', domain: 'facebook.com', name: 'Facebook', category: 'Social', action: 'Blocked', usage: '—' },
      { id: 'w-7', domain: 'instagram.com', name: 'Instagram', category: 'Social', action: 'Blocked', usage: '—' },
      { id: 'w-8', domain: 'wikipedia.org', name: 'Wikipedia', category: 'Research', action: 'Approved', usage: '1h 08m' }
    ],
    applications: [
      { id: 'a-1', name: 'Google Chrome', category: 'Browser', action: 'Allowed', devices: 4 },
      { id: 'a-2', name: 'Microsoft Teams', category: 'Collaboration', action: 'Allowed', devices: 3 },
      { id: 'a-3', name: 'Roblox', category: 'Gaming', action: 'Blocked', devices: 4 },
      { id: 'a-4', name: 'WhatsApp', category: 'Messaging', action: 'Restricted', devices: 2 }
    ],
    activity: [
      { id: 'e-1', studentId: 's-1', deviceId: 'D-1048', site: 'classroom.google.com', category: 'Learning', time: ago(18), duration: '42 min', status: 'Allowed' },
      { id: 'e-2', studentId: 's-2', deviceId: 'D-1051', site: 'tiktok.com', category: 'Social', time: ago(32), duration: '0 min', status: 'Blocked' },
      { id: 'e-3', studentId: 's-4', deviceId: 'D-1062', site: 'khanacademy.org', category: 'Learning', time: ago(51), duration: '28 min', status: 'Allowed' },
      { id: 'e-4', studentId: 's-3', deviceId: 'D-1057', site: 'wikipedia.org', category: 'Research', time: ago(78), duration: '19 min', status: 'Allowed' },
      { id: 'e-5', studentId: 's-1', deviceId: 'D-1048', site: 'youtube.com', category: 'Media', time: ago(104), duration: '0 min', status: 'Blocked' },
      { id: 'e-6', studentId: 's-2', deviceId: 'D-1051', site: 'chatgpt.com', category: 'AI & research', time: ago(141), duration: '17 min', status: 'Allowed' }
    ],
    notifications: [
      { id: 'n-1', title: 'Device needs attention', text: 'Zuri’s iPad has not synchronized for 96 minutes.', kind: 'warning', read: false },
      { id: 'n-2', title: 'Blocked access attempt', text: 'TikTok was blocked on Brian’s Android smartphone.', kind: 'alert', read: false },
      { id: 'n-3', title: 'Weekly report ready', text: 'The week 42 digital safety report is ready to review.', kind: 'info', read: true }
    ],
    settings: { schoolName: 'Nairobi International Academy', syncInterval: '15 minutes', alerts: true }
  });
  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { data = fresh(); }
  const save = () => localStorage.setItem(KEY, JSON.stringify(data));
  const clone = value => JSON.parse(JSON.stringify(value));
  const studentName = id => data.students.find(x => x.id === id)?.name || 'Unassigned';
  const api = {
    get state() { return clone(data); },
    reset() { data = fresh(); save(); },
    me: async () => ({ id: 'demo-admin', name: 'Amina Wanjiku', role: 'School Administrator', initials: 'AW' }),
    summary: async () => ({ devices: data.devices.length, online: data.devices.filter(x => x.status === 'Online').length, students: data.students.length, blocked: data.activity.filter(x => x.status === 'Blocked').length, learning: 68, notifications: data.notifications.filter(x => !x.read).length }),
    toggleDevice(id) { const d = data.devices.find(x => x.id === id); if (d) { d.status = d.status === 'Online' ? 'Offline' : 'Online'; d.lastSync = new Date().toISOString(); save(); } },
    toggleWebsite(id) { const w = data.websites.find(x => x.id === id); if (w) { w.action = w.action === 'Approved' ? 'Blocked' : 'Approved'; save(); } },
    addWebsite(record) { data.websites.unshift({ id: `w-${Date.now()}`, name: record.name, domain: record.domain, category: record.category || 'Custom', action: record.action || 'Approved', usage: '—' }); save(); },
    addStudent(record) { data.students.push({ id: `s-${Date.now()}`, name: record.name, className: record.className || 'Year 7 · Blue', guardian: 'Not assigned' }); save(); },
    assignDevice(id, studentId) { const d = data.devices.find(x => x.id === id); if (d) { d.studentId = studentId; save(); } },
    markRead(id) { const n = data.notifications.find(x => x.id === id); if (n) { n.read = true; save(); } },
    addNotification(title, text) { data.notifications.unshift({ id: `n-${Date.now()}`, title, text, kind: 'info', read: false }); save(); },
    exportReport() { const csv = ['Student,Device,Website,Category,Time,Duration,Status'].concat(data.activity.map(x => [studentName(x.studentId), x.deviceId, x.site, x.category, x.time, x.duration, x.status].map(v => `"${String(v).replaceAll('"', '""')}"`).join(','))).join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'eduguard-demo-report.csv'; a.click(); URL.revokeObjectURL(url); },
    studentName
  };
  const SESSION_KEY = 'eduguard-demo-session';
  const demoAuth = {
    async signIn(_identity, _password) {
      localStorage.setItem(SESSION_KEY, 'true');
      return { mode: 'demo', authenticated: true };
    },
    signOut() { localStorage.removeItem(SESSION_KEY); },
    isAuthenticated() { return localStorage.getItem(SESSION_KEY) === 'true'; }
  };
  window.EduDemoAPI = api;
  window.EduDemoAuth = demoAuth;
  if (typeof window.addEventListener === 'function') window.addEventListener('storage', e => { if (e.key === KEY) location.reload(); });
})();
