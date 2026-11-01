import postgres from 'postgres';
import { existsSync } from 'node:fs';

if (!process.env.DATABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const result = await sql.begin(async tx => {
    const tasks = await tx`
      INSERT INTO learning_notifications
        (user_id, school_id, student_id, task_id, category, message, event_key)
      SELECT t.student_id, t.school_id, t.student_id, t.id, 'tasks',
        'Bugün tamamlanması gereken bir çalışma görevin var.',
        'task-due:' || t.id::text || ':' || t.due_date::text
      FROM learning_tasks t
      LEFT JOIN learning_notification_preferences p ON p.user_id=t.student_id
      WHERE t.school_id IS NOT NULL AND t.status='open'
        AND t.due_date=(now() AT TIME ZONE 'Europe/Istanbul')::date
        AND coalesce(p.tasks,true)
      ON CONFLICT (user_id,event_key) DO NOTHING
      RETURNING id`;
    const meetings = await tx`
      INSERT INTO learning_notifications
        (user_id, school_id, student_id, meeting_id, category, message, event_key)
      SELECT m.student_id, m.school_id, m.student_id, m.id, 'meetings',
        'Bugün planlanmış öğrenci takibin var.',
        'meeting-followup:' || m.id::text || ':' || m.followup_date::text
      FROM learning_meetings m
      LEFT JOIN learning_notification_preferences p ON p.user_id=m.student_id
      WHERE m.followup_date=(now() AT TIME ZONE 'Europe/Istanbul')::date
        AND coalesce(p.meetings,true)
      ON CONFLICT (user_id,event_key) DO NOTHING
      RETURNING id`;
    const expired = await tx`
      DELETE FROM learning_notifications
      WHERE created_at < now() - interval '365 days'
      RETURNING id`;
    return { taskReminders: tasks.length, meetingReminders: meetings.length, expiredNotifications: expired.length };
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} finally {
  await sql.end();
}
