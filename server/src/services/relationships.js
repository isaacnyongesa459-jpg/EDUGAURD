'use strict';

const model = require('../models/relationships');

async function provisionRelationship(db, { userId, role, studentId, schoolId, relationship }) {
  const client = await db.pool.connect();
  let open = false;
  try {
    await client.query('BEGIN');
    open = true;
    const user = await model.findActiveSameSchoolUser(client, { userId, schoolId, role });
    const student = await model.findSameSchoolStudent(client, { studentId, schoolId });
    if (!user || !student) {
      await client.query('ROLLBACK');
      open = false;
      return null;
    }
    const assignment = role === 'PARENT'
      ? await model.assignParent(client, { userId, studentId, relationship: relationship || 'guardian' })
      : await model.assignTeacher(client, { userId, studentId });
    await client.query('COMMIT');
    open = false;
    return assignment;
  } catch (error) {
    if (open) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { provisionRelationship };
