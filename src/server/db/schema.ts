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
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("posts_created_at_idx").on(t.createdAt.desc())],
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
  (t) => [index("comments_post_created_idx").on(t.postId, t.createdAt)],
);
