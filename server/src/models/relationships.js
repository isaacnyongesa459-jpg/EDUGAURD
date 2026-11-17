'use strict';

async function findActiveSameSchoolUser(client, { userId, schoolId, role }) {
  const result = await client.query(
    'SELECT id FROM users WHERE id=$1 AND school_id=$2 AND role=$3 AND active=true FOR SHARE',
    [userId, schoolId, role]
  );
  return result.rows[0] || null;
}

async function findSameSchoolStudent(client, { studentId, schoolId }) {
  const result = await client.query(
    'SELECT id FROM students WHERE id=$1 AND school_id=$2 FOR SHARE',
    [studentId, schoolId]
  );
  return result.rows[0] || null;
}

async function assignParent(client, { userId, studentId, relationship }) {
  const result = await client.query(
    'INSERT INTO parent_students(parent_user_id,student_id,relationship) VALUES($1,$2,$3) ON CONFLICT(parent_user_id,student_id) DO UPDATE SET relationship=EXCLUDED.relationship RETURNING parent_user_id AS "userId",student_id AS "studentId",relationship',
    [userId, studentId, relationship]
  );
  return result.rows[0];
}

async function assignTeacher(client, { userId, studentId }) {
  const result = await client.query(
    'INSERT INTO teacher_students(teacher_user_id,student_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING teacher_user_id AS "userId",student_id AS "studentId"',
    [userId, studentId]
  );
  return result.rows[0] || { userId, studentId };
}

module.exports = { findActiveSameSchoolUser, findSameSchoolStudent, assignParent, assignTeacher };
