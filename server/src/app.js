const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('node:http' );
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');
const api = require('./routes/api');
const extension = require('./routes/extension');
const root = path.resolve(__dirname, '../..');
function createApp() {
  const app = express(); app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));
  const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000' ).split(',').map(x => x.trim());
  app.use(helmet({ xFrameOptions: false, contentSecurityPolicy: { directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), 'frame-ancestors': null, 'script-src': ["'self'", 'https://cdn.jsdelivr.net'], 'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], 'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'], 'img-src': ["'self'", 'data:'] } } }));
  app.use(cors({ origin(origin, cb) { if (!origin || origins.includes(origin)) return cb(null, true); cb(new Error('Origin not allowed')); }, credentials: true }));
  app.use(express.json({ limit: '256kb' })); app.use(cookieParser());
  app.use('/client', express.static(path.join(root, 'client'), { index: false, dotfiles: 'deny' }));
  app.use('/public', express.static(path.join(root, 'public'), { index: false, dotfiles: 'deny' }));
  app.get('/service-worker.js', (_q, r) => { r.set('Service-Worker-Allowed', '/'); r.sendFile(path.join(root, 'client/service-worker.js')); });
  app.get('/manifest.webmanifest', (_q, r) => r.sendFile(path.join(root, 'manifest.webmanifest')));
  app.get('/manus-routes.json', (_q, r) => r.sendFile(path.join(root, 'manus-routes.json')));
  app.get('/', (_q, r) => r.sendFile(path.join(root, 'index.html')));
  app.use('/api/extension', extension); app.use('/api', api);
  app.use((err, _q, r, _n) => { if (err.message === 'Origin not allowed') return r.status(403).json({ error: 'Origin not allowed' }); console.error(err); r.status(500).json({ error: 'Internal server error' }); });
  return app;
}
function createServer() {
  const app = createApp(), server = http.createServer(app), origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000' ).split(',').map(x => x.trim());
  const io = new Server(server, { cors: { origin: origins, credentials: true } }); app.set('io', io);
  io.use((socket, next) => { try { const cookie = socket.handshake.headers.cookie || ''; const raw = cookie.split(';').map(x => x.trim()).find(x => x.startsWith((process.env.COOKIE_NAME || 'eduguard_session') + '=')); if (!raw) throw Error(); socket.user = jwt.verify(decodeURIComponent(raw.split('=').slice(1).join('=')), process.env.JWT_SECRET); if (!socket.user.schoolId) throw Error(); next(); } catch { next(new Error('Authentication required')); } });
  io.on('connection', socket => { (async () => {
    const u = socket.user;
    if (u.role === 'SCHOOL_ADMIN' || u.role === 'SUPER_ADMIN') { socket.join(`school:${u.schoolId}`); return; }
    if (!['PARENT', 'TEACHER'].includes(u.role)) return;
    const table = u.role === 'PARENT' ? 'parent_students' : 'teacher_students';
    const column = u.role === 'PARENT' ? 'parent_user_id' : 'teacher_user_id';
    const linked = await db.query(`SELECT s.id FROM ${table} x JOIN students s ON s.id=x.student_id WHERE x.${column}=$1 AND s.school_id=$2`, [u.id, u.schoolId]);
    linked.rows.forEach(s => socket.join(`student:${s.id}`));
  })().catch(() => socket.disconnect(true)); });
  return { app, server, io };
}
module.exports = { createApp, createServer };
