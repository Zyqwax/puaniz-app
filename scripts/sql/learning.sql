CREATE TABLE IF NOT EXISTS learning_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, title text NOT NULL, subject text,
 due_date date, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')),
 reflection text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learning_tasks_student_idx ON learning_tasks(student_id);
CREATE TABLE IF NOT EXISTS school_audit_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
 actor_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, action text NOT NULL, details text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE school_exams ADD COLUMN IF NOT EXISTS import_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS school_exams_import_hash_idx ON school_exams(school_id, import_hash);

ALTER TABLE learning_tasks ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
UPDATE learning_tasks t SET school_id = m.school_id FROM school_members m WHERE t.school_id IS NULL AND t.author_id <> t.student_id AND m.user_id=t.student_id AND m.role='student';

ALTER TABLE learning_tasks ADD COLUMN IF NOT EXISTS planned_date date;
ALTER TABLE learning_tasks ADD COLUMN IF NOT EXISTS planned_minutes integer NOT NULL DEFAULT 0 CHECK(planned_minutes BETWEEN 0 AND 480);
ALTER TABLE learning_tasks ADD COLUMN IF NOT EXISTS baseline_result_id uuid REFERENCES school_exam_results(id) ON DELETE SET NULL;
ALTER TABLE learning_tasks ADD COLUMN IF NOT EXISTS followup_result_id uuid REFERENCES school_exam_results(id) ON DELETE SET NULL;
ALTER TABLE learning_tasks ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE learning_tasks ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS learning_meetings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
 student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 meeting_date date NOT NULL, followup_date date, note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learning_meetings_student_idx ON learning_meetings(student_id,meeting_date);

ALTER TABLE learning_meetings ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE learning_meetings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS learning_meeting_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), meeting_id uuid NOT NULL REFERENCES learning_meetings(id) ON DELETE CASCADE,
 editor_id text REFERENCES users(id) ON DELETE SET NULL, revision integer NOT NULL, reason text NOT NULL,
 before_snapshot jsonb NOT NULL, after_snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(meeting_id,revision)
);
CREATE TABLE IF NOT EXISTS learning_notification_preferences (
 user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 tasks boolean NOT NULL DEFAULT true, meetings boolean NOT NULL DEFAULT true, results boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS learning_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
 student_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 task_id uuid REFERENCES learning_tasks(id) ON DELETE SET NULL,
 meeting_id uuid REFERENCES learning_meetings(id) ON DELETE SET NULL,
 exam_id uuid REFERENCES school_exams(id) ON DELETE SET NULL,
 category text NOT NULL CHECK(category IN ('tasks','meetings','results')), message text NOT NULL,
 event_key text NOT NULL, read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,event_key)
);
CREATE INDEX IF NOT EXISTS learning_notifications_user_created_idx ON learning_notifications(user_id,created_at DESC);

ALTER TABLE school_exam_results ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE school_exam_results ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS school_result_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), result_id uuid NOT NULL REFERENCES school_exam_results(id) ON DELETE CASCADE,
 editor_id text REFERENCES users(id) ON DELETE SET NULL, revision integer NOT NULL, reason text NOT NULL,
 before_snapshot jsonb NOT NULL, after_snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(result_id,revision)
);
CREATE INDEX IF NOT EXISTS school_exam_results_school_created_idx ON school_exam_results(school_id,created_at DESC,id DESC);

CREATE TABLE IF NOT EXISTS school_class_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
 class_id uuid NOT NULL, actor_id text REFERENCES users(id) ON DELETE SET NULL, action text NOT NULL,
 reason text NOT NULL, before_snapshot jsonb, after_snapshot jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS school_class_revisions_school_class_created_idx ON school_class_revisions(school_id,class_id,created_at DESC);
