-- Explicit guardian/teacher relationships. Device assignment is deliberately not an authorization relationship.
CREATE TABLE IF NOT EXISTS parent_students (
  parent_user_id uuid NOT NULL REFERENCES parents(user_id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'guardian',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(parent_user_id, student_id)
);
CREATE INDEX IF NOT EXISTS parent_students_student_idx ON parent_students(student_id);
CREATE TABLE IF NOT EXISTS teacher_students (
  teacher_user_id uuid NOT NULL REFERENCES teachers(user_id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(teacher_user_id, student_id)
);
CREATE INDEX IF NOT EXISTS teacher_students_student_idx ON teacher_students(student_id);
-- Composite assignment ensures device and student belong to the same school.
ALTER TABLE devices ADD CONSTRAINT devices_id_school_unique UNIQUE(id,school_id);
ALTER TABLE students ADD CONSTRAINT students_id_school_unique UNIQUE(id,school_id);
ALTER TABLE device_assignments ADD COLUMN IF NOT EXISTS school_id uuid;
UPDATE device_assignments da SET school_id=d.school_id FROM devices d WHERE d.id=da.device_id AND da.school_id IS NULL;
ALTER TABLE device_assignments ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE device_assignments ADD CONSTRAINT device_assignments_device_school_fk FOREIGN KEY(device_id,school_id) REFERENCES devices(id,school_id) ON DELETE CASCADE;
ALTER TABLE device_assignments ADD CONSTRAINT device_assignments_student_school_fk FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE CASCADE;
ALTER TABLE activity_logs ADD CONSTRAINT activity_student_school_fk FOREIGN KEY(student_id,school_id) REFERENCES students(id,school_id) ON DELETE CASCADE;
ALTER TABLE activity_logs ADD CONSTRAINT activity_device_school_fk FOREIGN KEY(device_id,school_id) REFERENCES devices(id,school_id) ON DELETE CASCADE;
