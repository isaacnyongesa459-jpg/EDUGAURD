/* Static GitHub Pages demo data only. It contains no real student records and never calls a server. */
(() => {
  'use strict';

  const ago = minutes => new Date(Date.now() - minutes * 60_000).toISOString();
  const user = {
    id: 'demo-guardian',
    role: 'PARENT',
    fullName: 'Demo Guardian',
    email: 'demo@example.test',
    schoolName: 'Sample School (fictional)'
  };
  const students = [
    { id: 'sample-learner-1', fullName: 'Sample Learner One', className: 'Year 7', active: true },
    { id: 'sample-learner-2', fullName: 'Sample Learner Two', className: 'Year 5', active: true }
  ];
  const devices = [
    { id: 'sample-device-1', name: 'Sample Chromebook One', operatingSystem: 'ChromeOS', studentId: students[0].id, lastSeenAt: ago(18), status: 'active' },
    { id: 'sample-device-2', name: 'Sample Chromebook Two', operatingSystem: 'ChromeOS', studentId: students[1].id, lastSeenAt: ago(42), status: 'active' }
  ];
  const activities = [
    { id: 'sample-event-1', studentName: students[0].fullName, deviceId: devices[0].name, domain: 'learning.example', occurredAt: ago(35), durationSeconds: 840, accessStatus: 'allowed', category: 'Learning' },
    { id: 'sample-event-2', studentName: students[1].fullName, deviceId: devices[1].name, domain: 'video.example', occurredAt: ago(72), durationSeconds: 95, accessStatus: 'blocked', category: 'Entertainment' },
    { id: 'sample-event-3', studentName: students[0].fullName, deviceId: devices[0].name, domain: 'library.example', occurredAt: ago(130), durationSeconds: 510, accessStatus: 'allowed', category: 'Learning' }
  ];
  const cloneRows = list => list.map(row => ({ ...row }));
  const readOnly = () => Promise.reject(new Error('Read-only demo: changes and account sign-in are disabled.'));

  window.EduDemoAPI = Object.freeze({
    csrf: async () => ({ csrfToken: 'demo-only' }),
    me: async () => ({ user: { ...user } }),
    logout: async () => ({ ok: true }),
    setSchoolId: () => {},
    summary: async () => ({ activityEvents: activities.length, blockedEvents: activities.filter(row => row.accessStatus === 'blocked').length, activeDevices: devices.length, students: students.length, unreadNotifications: 0 }),
    activity: async () => ({ activities: cloneRows(activities) }),
    students: async () => ({ students: cloneRows(students) }),
    devices: async () => ({ devices: cloneRows(devices) }),
    notifications: async () => ({ notifications: [] }),
    login: readOnly,
    addStudent: readOnly,
    addDevice: readOnly,
    setDeviceStatus: readOnly,
    addRule: readOnly,
    deleteRule: readOnly,
    readNotification: readOnly,
    addUser: readOnly,
    linkStudent: readOnly,
    addSchool: readOnly
  });
})();
