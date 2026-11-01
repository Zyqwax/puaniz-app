import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  uuid,
  date,
  index,
  uniqueIndex,
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { sql } from "drizzle-orm";
import type { SchoolResultSnapshot } from "@/lib/school-results";
import type { SubjectScore } from "../../types";

/* ── Profile ────────────────────────────────────────────────────────────── */

/**
 * Profile fields that used to live inside the Firestore `users/{uid}` document.
 * Auth-owned fields (name, email, image, emailVerified) stay on `users`.
 */
export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  grade: text("grade"),
  field: text("field"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  targetNet: numeric("target_net"),
  targetRanking: integer("target_ranking"),
  targetDepartment: text("target_department"),
  targetUniversity: text("target_university"),
  goalTyt: numeric("goal_tyt").default("0"),
  goalAyt: numeric("goal_ayt").default("0"),
  welcomeMessage: text("welcome_message"),
  analysisMessage: text("analysis_message"),
  lastAnalysisHash: text("last_analysis_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/* ── Exams ──────────────────────────────────────────────────────────────── */

/**
 * One row per mock exam. Per-subject answers stay in `scores` JSONB because
 * every consumer (charts, analysis helpers, PDF report) treats the payload as
 * an opaque `Record<subjectKey, SubjectScore>`.
 */
export const exams = pgTable(
  "exams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    date: date("date").notNull(),
    type: text("type").notNull(),
    subtype: text("subtype"),
    totalNet: numeric("total_net").notNull().default("0"),
    scores: jsonb("scores").$type<Record<string, SubjectScore>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("exams_user_date_idx").on(t.userId, t.date.desc())],
);

/* ── Topic tracking ─────────────────────────────────────────────────────── */

/**
 * Replaces the `users.topicTracking` nested map. One row per topic the user has
 * touched, so toggling a topic writes a single row instead of the whole doc.
 */
export const userTopicProgress = pgTable(
  "user_topic_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicKey: text("topic_key").notNull(),
    completed: boolean("completed").default(false).notNull(),
    questionCount: integer("question_count").default(0).notNull(),
    repeatCount: integer("repeat_count").default(0).notNull(),
    lastStudied: timestamp("last_studied", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.topicKey] })],
);

/* ── Community ──────────────────────────────────────────────────────────── */

export const forumCategories = pgTable("forum_categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  position: integer("position").notNull().default(0),
  adminOnly: boolean("admin_only").notNull().default(false),
});

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    categorySlug: text("category_slug").notNull().default("genel").references(() => forumCategories.slug),
    kind: text("kind").notNull().default("discussion"),
    pinned: boolean("pinned").notNull().default(false),
    locked: boolean("locked").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    solutionId: uuid("solution_id").references((): AnyPgColumn => comments.id, { onDelete: "set null" }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("posts_created_at_idx").on(t.createdAt.desc()),
    index("forum_posts_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("forum_posts_search_idx").using("gin", sql`to_tsvector('simple', ${t.title} || ' ' || ${t.body})`),
    index("forum_posts_activity_idx").on(t.lastActivityAt.desc(), t.id),
    index("forum_posts_category_idx").on(t.categorySlug, t.lastActivityAt.desc()),
  ],
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tag] }), index("post_tags_tag_idx").on(t.tag)],
);

export const postLikes = pgTable(
  "post_likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    replyToId: uuid("reply_to_id").references((): AnyPgColumn => comments.id, {
      onDelete: "set null",
    }),
    isEdited: boolean("is_edited").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("comments_post_created_idx").on(t.postId, t.createdAt), index("forum_comments_user_created_idx").on(t.userId,t.createdAt.desc())],
);

/* ── Schools & Multi-Tenant ──────────────────────────────────────────────── */

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  city: text("city"),
  district: text("district"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    grade: text("grade").notNull(), // 9, 10, 11, 12, Mezun
    field: text("field"), // SAY, EA, SÖZ, DİL, GENEL
    joinCode: text("join_code").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("classes_school_idx").on(t.schoolId)],
);

export const schoolMembers = pgTable(
  "school_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'principal' | 'teacher' | 'student'
    title: text("title"),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    studentNumber: text("student_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("school_members_user_idx").on(t.userId),
    index("school_members_school_idx").on(t.schoolId),
    index("school_members_class_idx").on(t.classId),
    uniqueIndex("school_student_number_idx").on(t.schoolId, t.studentNumber),
  ],
);

export const teacherClasses = pgTable(
  "teacher_classes",
  {
    teacherId: text("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.teacherId, t.classId] })],
);

export const schoolExams = pgTable(
  "school_exams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // TYT | AYT
    date: date("date").notNull(),
    importHash: text("import_hash"),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("school_exams_school_date_idx").on(t.schoolId, t.date.desc()), uniqueIndex("school_exams_import_hash_idx").on(t.schoolId, t.importHash)],
);

export const schoolExamResults = pgTable(
  "school_exam_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolExamId: uuid("school_exam_id")
      .notNull()
      .references(() => schoolExams.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    studentNumber: text("student_number").notNull(),
    studentName: text("student_name").notNull(),
    studentUserId: text("student_user_id").references(() => users.id, { onDelete: "set null" }),
    scores: jsonb("scores").$type<Record<string, SubjectScore>>().notNull().default({}),
    totalNet: numeric("total_net").notNull().default("0"),
    revision: integer("revision").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    rankInClass: integer("rank_in_class"),
    rankInSchool: integer("rank_in_school"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("school_exam_results_school_created_idx").on(t.schoolId,t.createdAt.desc(),t.id.desc()),
    index("school_exam_results_exam_idx").on(t.schoolExamId),
    index("school_exam_results_student_user_idx").on(t.studentUserId),
    index("school_exam_results_school_number_idx").on(t.schoolId, t.studentNumber),
  ],
);

/* ── Student Study Sessions & Activities ─────────────────────────────────── */

export const studySessions = pgTable(
  "study_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(25),
    questionCount: integer("question_count").notNull().default(0),
    notes: text("notes"),
    date: date("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("study_sessions_user_date_idx").on(t.userId, t.date.desc()),
  ],
);

/* ── Teacher Coaching Feedback ───────────────────────────────────────────── */

export const teacherFeedback = pgTable(
  "teacher_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentUserId: text("student_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("teacher_feedback_student_idx").on(t.studentUserId, t.createdAt.desc()),
  ],
);

/* ── Contact Messages (public contact form inbox) ───────────────────────── */

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    organization: text("organization"),
    // general | school | bug | suggestion
    type: text("type").notNull().default("general"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    // new | read | replied | archived
    status: text("status").notNull().default("new"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("contact_messages_status_created_idx").on(t.status, t.createdAt.desc())],
);



/* Forum user state and moderation */
export const forumUserTopics = pgTable("forum_user_topics", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  following: boolean("following").notNull().default(false),
  bookmarked: boolean("bookmarked").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.userId, t.postId] })]);

export const forumReports = pgTable("forum_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: text("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forumModerationLog = pgTable("forum_moderation_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forumNotifications = pgTable("forum_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forumReplyLikes = pgTable("forum_reply_likes", {
  commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({columns:[t.commentId,t.userId]})]);

/* Academic development workflow */
export const learningTasks = pgTable("learning_tasks", {
  schoolId: uuid("school_id").references(() => schools.id, { onDelete: "cascade" }),
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject"),
  dueDate: date("due_date"),
  status: text("status").notNull().default("open"),
  reflection: text("reflection"),
  plannedDate: date("planned_date"),
  plannedMinutes: integer("planned_minutes").notNull().default(0),
  baselineResultId: uuid("baseline_result_id").references(() => schoolExamResults.id, { onDelete: "set null" }),
  followupResultId: uuid("followup_result_id").references(() => schoolExamResults.id, { onDelete: "set null" }),
  reviewNote: text("review_note"),
  revision: integer("revision").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("learning_tasks_student_idx").on(t.studentId)]);
export const schoolAuditLog = pgTable("school_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const schoolClassRevisions = pgTable("school_class_revisions", {
 id: uuid("id").primaryKey().defaultRandom(),
 schoolId: uuid("school_id").notNull().references(() => schools.id, {onDelete:"cascade"}),
 classId: uuid("class_id").notNull(),
 actorId: text("actor_id").references(() => users.id, {onDelete:"set null"}),
 action: text("action").notNull(),
 reason: text("reason").notNull(),
 before: jsonb("before_snapshot").$type<Record<string, unknown> | null>(),
 after: jsonb("after_snapshot").$type<Record<string, unknown> | null>(),
 createdAt: timestamp("created_at", {withTimezone:true}).notNull().defaultNow(),
}, t => [index("school_class_revisions_school_class_created_idx").on(t.schoolId,t.classId,t.createdAt.desc())]);

export const learningMeetings = pgTable("learning_meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  meetingDate: date("meeting_date").notNull(),
  followupDate: date("followup_date"),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("learning_meetings_student_idx").on(t.studentId,t.meetingDate)]);

type MeetingSnapshot = {note:string;meetingDate:string;followupDate:string|null};
export const learningMeetingRevisions = pgTable("learning_meeting_revisions", {
 id: uuid("id").primaryKey().defaultRandom(),
 meetingId: uuid("meeting_id").notNull().references(() => learningMeetings.id, { onDelete: "cascade" }),
 editorId: text("editor_id").references(() => users.id, { onDelete: "set null" }),
 revision: integer("revision").notNull(), reason: text("reason").notNull(),
 before: jsonb("before_snapshot").$type<MeetingSnapshot>().notNull(),
 after: jsonb("after_snapshot").$type<MeetingSnapshot>().notNull(),
 createdAt: timestamp("created_at", { withTimezone:true }).notNull().defaultNow(),
}, t=>[uniqueIndex("learning_meeting_revisions_meeting_id_revision_key").on(t.meetingId,t.revision)]);
export const learningNotificationPreferences = pgTable("learning_notification_preferences", {
 userId: text("user_id").primaryKey().references(()=>users.id,{onDelete:"cascade"}),
 tasks: boolean("tasks").notNull().default(true), meetings: boolean("meetings").notNull().default(true), results: boolean("results").notNull().default(true),
});
export const learningNotifications = pgTable("learning_notifications", {
 id:uuid("id").primaryKey().defaultRandom(),
 userId:text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
 schoolId:uuid("school_id").notNull().references(()=>schools.id,{onDelete:"cascade"}),
 studentId:text("student_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
 taskId:uuid("task_id").references(()=>learningTasks.id,{onDelete:"set null"}),
 meetingId:uuid("meeting_id").references(()=>learningMeetings.id,{onDelete:"set null"}),
 examId:uuid("exam_id").references(()=>schoolExams.id,{onDelete:"set null"}),
 category:text("category").$type<'tasks'|'meetings'|'results'>().notNull(), message:text("message").notNull(), eventKey:text("event_key").notNull(),
 read:boolean("read").notNull().default(false),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("learning_notifications_user_id_event_key_key").on(t.userId,t.eventKey),index("learning_notifications_user_created_idx").on(t.userId,t.createdAt.desc())]);

export const schoolResultRevisions = pgTable("school_result_revisions", {
 id:uuid("id").primaryKey().defaultRandom(),
 resultId:uuid("result_id").notNull().references(()=>schoolExamResults.id,{onDelete:"cascade"}),
 editorId:text("editor_id").references(()=>users.id,{onDelete:"set null"}),
 revision:integer("revision").notNull(),reason:text("reason").notNull(),
 before:jsonb("before_snapshot").$type<SchoolResultSnapshot>().notNull(),
 after:jsonb("after_snapshot").$type<SchoolResultSnapshot>().notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("school_result_revisions_result_id_revision_key").on(t.resultId,t.revision)]);
