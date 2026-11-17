'use strict';

const db = require('../db');
const security = require('../middleware/security');
const { provisionRelationship } = require('../services/relationships');

async function create(req, res, next) {
  try {
    const { role, userId, studentId, relationship } = req.body;
    const assignment = await provisionRelationship(db, {
      role,
      userId,
      studentId,
      relationship,
      schoolId: req.schoolId
    });
    if (!assignment) return res.status(404).json({ error: 'Same-school account or student not found' });
    await security.audit(req, 'student.relationship.provision', 'student', studentId, { role, userId });
    return res.status(201).json({ relationship: assignment });
  } catch (error) {
    return next(error);
  }
}

module.exports = { create };
