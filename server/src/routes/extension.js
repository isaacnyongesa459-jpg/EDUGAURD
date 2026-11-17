const express = require('express');
const crypto = require('node:crypto');
const { z } = require('zod');
const db = require('../db');

const router = express.Router();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

function deviceAuth(req, res, next) {
  const token = req.get('x-device-token');
  if (!token) return res.status(401).json({ error: 'Device token required' });
  db.query('SELECT id,school_id,status FROM devices WHERE device_token_hash=$1', [hash(token)])
    .then(result => {
      if (!result.rowCount || result.rows[0].status !== 'active') {
        return res.status(401).json({ error: 'Invalid or inactive device' });
      }
      req.device = result.rows[0];
      next();
    })
    .catch(next);
}

const enrollmentSchema = z.object({
  code: z.string().min(20),
  device: z.object({
    name: z.string().min(1).max(120),
    os: z.string().min(1).max(80),
    extensionVersion: z.string().max(50).optional()
  })
});
const activityEventSchema = z.object({
  eventId: z.string().min(1).max(200),
  domain: z.string().min(1).max(253).optional(),
  url: z.string().url().max(2048).optional(),
  applicationName: z.string().min(1).max(200).optional(),
  occurredAt: z.string().datetime(),
  durationSeconds: z.number().int().min(0).max(86400),
  accessStatus: z.enum(['allowed', 'blocked']),
  category: z.string().min(1).max(100)
}).refine(event => Boolean(event.domain || event.applicationName), {
  message: 'Each event must include a domain or applicationName',
  path: ['domain']
});
const activityBatchSchema = z.object({ events: z.array(activityEventSchema).max(500) });

router.post('/enroll', async (req, res, next) => {
  try {
    const body = enrollmentSchema.parse(req.body);
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        "SELECT id FROM devices WHERE enrollment_code_hash=$1 AND enrollment_expires_at>now() AND status='pending' FOR UPDATE",
        [hash(body.code)]
      );
      if (!result.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Enrollment code invalid, expired, or already used' });
      }
      const token = crypto.randomBytes(32).toString('hex');
      await client.query(
        "UPDATE devices SET enrollment_code_hash=NULL,enrollment_expires_at=NULL,device_token_hash=$1,status='active',name=$2,operating_system=$3,extension_version=$4,last_seen_at=now() WHERE id=$5",
        [hash(token), body.device.name, body.device.os, body.device.extensionVersion || null, result.rows[0].id]
      );
      await client.query('COMMIT');
      return res.json({ deviceToken: token });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Invalid enrollment request' });
    return next(error);
  }
});

router.get('/policy', deviceAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id,domain,category,action,url_match AS "urlMatch",capture_full_url AS "captureFullUrl",created_at FROM website_rules WHERE school_id=$1',
      [req.device.school_id]
    );
    await db.query('UPDATE devices SET last_seen_at=now() WHERE id=$1', [req.device.id]);
    const websiteRules = result.rows.map(rule => ({
      id: rule.id,
      domain: rule.domain,
      action: rule.action,
      category: rule.category,
      ...(rule.urlMatch === 'path' ? { urlMatch: 'path' } : {})
    }));
    const revision = result.rows.reduce((latest, rule) => Math.max(latest, new Date(rule.created_at).getTime() || 0), 0);
    return res.json({ revision: String(revision), defaultAction: 'deny', captureFullUrl: false, websiteRules, applicationRules: [] });
  } catch (error) {
    return next(error);
  }
});

router.post('/activities/sync', deviceAuth, async (req, res, next) => {
  try {
    const body = activityBatchSchema.parse(req.body);
    const assignments = await db.query(
      'SELECT student_id FROM device_assignments WHERE device_id=$1',
      [req.device.id]
    );
    if (!assignments.rowCount) return res.status(403).json({ error: 'Device is not assigned to a student' });
    if (assignments.rowCount !== 1) {
      return res.status(409).json({ error: 'Device has multiple student assignments; an administrator must resolve this before activity sync.' });
    }

    const studentId = assignments.rows[0].student_id;
    let inserted = 0;
    for (const event of body.events) {
      const result = await db.query(
        'INSERT INTO activity_logs(school_id,student_id,device_id,event_id,domain,application_name,occurred_at,duration_seconds,access_status,category) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(device_id,event_id) DO NOTHING',
        [req.device.school_id, studentId, req.device.id, event.eventId, event.domain || null, event.applicationName || null, event.occurredAt, event.durationSeconds, event.accessStatus, event.category]
      );
      inserted += result.rowCount;
    }

    await db.query('UPDATE devices SET last_seen_at=now() WHERE id=$1', [req.device.id]);
    if (inserted) {
      const io = req.app.get('io');
      if (io) {
        const notification = { type: 'activity-changed' };
        io.to(`student:${studentId}`).emit('activity:changed', notification);
        io.to(`school:${req.device.school_id}`).emit('activity:changed', notification);
      }
    }
    return res.json({ received: body.events.length, inserted, deduplicated: body.events.length - inserted });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: 'Invalid activity batch', details: error.flatten() });
    return next(error);
  }
});

module.exports = router;
