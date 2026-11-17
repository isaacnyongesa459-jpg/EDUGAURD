'use strict';

const express = require('express');
const { z } = require('zod');
const security = require('../middleware/security');
const controller = require('../controllers/relationships');

const router = express.Router();
const assignmentSchema = z.object({
  role: z.enum(['PARENT', 'TEACHER']),
  userId: z.string().uuid(),
  studentId: z.string().uuid(),
  relationship: z.string().min(1).max(80).optional()
});

router.post('/', security.roles('SCHOOL_ADMIN'), security.validate(assignmentSchema), controller.create);

module.exports = router;
