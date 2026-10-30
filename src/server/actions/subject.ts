"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { userTopicProgress } from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { toMessage } from "@/server/errors";

export interface TopicTrackingItem {
  completed?: boolean;
  questionCount?: number;
  repeatCount?: number;
  lastStudied?: string | null;
}

const toTrackingItem = (row: typeof userTopicProgress.$inferSelect): TopicTrackingItem => ({
  completed: row.completed,
  questionCount: row.questionCount,
  repeatCount: row.repeatCount,
  lastStudied: row.lastStudied ? row.lastStudied.toISOString() : null,
});

export const getTopicTracking = async (): Promise<Record<string, TopicTrackingItem>> => {
  try {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(userTopicProgress)
      .where(eq(userTopicProgress.userId, user.id));

    return Object.fromEntries(rows.map((row) => [row.topicKey, toTrackingItem(row)]));
  } catch (error) {
    console.error("Error getting topic tracking:", error);
    return {};
  }
};

/** Single-statement upsert so concurrent toggles cannot clobber each other. */
const upsertTopic = async (
  userId: string,
  topicKey: string,
  values: TopicTrackingItem,
) => {
  const completed = values.completed ?? false;
  const questionCount = values.questionCount ?? 0;
  const repeatCount = values.repeatCount ?? 0;
  const lastStudied = values.lastStudied ? new Date(values.lastStudied) : new Date();

  await db
    .insert(userTopicProgress)
    .values({ userId, topicKey, completed, questionCount, repeatCount, lastStudied })
    .onConflictDoUpdate({
      target: [userTopicProgress.userId, userTopicProgress.topicKey],
      set: {
        // Only overwrite the fields that were actually provided.
        ...(values.completed !== undefined ? { completed } : {}),
        ...(values.questionCount !== undefined ? { questionCount } : {}),
        ...(values.repeatCount !== undefined ? { repeatCount } : {}),
        lastStudied,
      },
    });
};

export const updateTopicData = async (
  topicKey: string,
  data: Partial<TopicTrackingItem>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await requireUser();
    await upsertTopic(user.id, topicKey, data);
    return { success: true };
  } catch (error) {
    console.error("Error updating topic data:", error);
    return { success: false, error: toMessage(error) };
  }
};

/**
 * Increments atomically in SQL, so the client no longer has to pass the
 * current count back (and cannot desync it).
 */
export const incrementRepeat = async (
  topicKey: string,
): Promise<{ success: boolean; newCount?: number; error?: string }> => {
  try {
    const user = await requireUser();
    const [row] = await db
      .insert(userTopicProgress)
      .values({ userId: user.id, topicKey, repeatCount: 1, lastStudied: new Date() })
      .onConflictDoUpdate({
        target: [userTopicProgress.userId, userTopicProgress.topicKey],
        set: {
          repeatCount: sql`${userTopicProgress.repeatCount} + 1`,
          lastStudied: new Date(),
        },
      })
      .returning({ repeatCount: userTopicProgress.repeatCount });
    return { success: true, newCount: row.repeatCount };
  } catch (error) {
    console.error("Error incrementing repeat:", error);
    return { success: false, error: toMessage(error) };
  }
};

export const updateQuestionCount = async (
  topicKey: string,
  count: number,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await requireUser();
    await upsertTopic(user.id, topicKey, { questionCount: count });
    return { success: true };
  } catch (error) {
    console.error("Error updating question count:", error);
    return { success: false, error: toMessage(error) };
  }
};

export const bulkUpdateTopics = async (
  topicKeys: string[],
  isCompleted: boolean,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (topicKeys.length === 0) return { success: true };
    const user = await requireUser();
    const now = new Date();

    const rows = topicKeys.map((topicKey) => ({
      userId: user.id,
      topicKey,
      completed: isCompleted,
      questionCount: 0,
      repeatCount: 0,
      lastStudied: isCompleted ? now : null,
    }));

    // Completing keeps whatever question/repeat counts exist; resetting zeroes them.
    const conflictSet = isCompleted
      ? {
          completed: true,
          lastStudied: now,
        }
      : {
          completed: false,
          questionCount: 0,
          repeatCount: 0,
          lastStudied: null,
        };

    await db
      .insert(userTopicProgress)
      .values(rows)
      .onConflictDoUpdate({
        target: [userTopicProgress.userId, userTopicProgress.topicKey],
        set: conflictSet,
      });

    return { success: true };
  } catch (error) {
    console.error("Error bulk updating topics:", error);
    return { success: false, error: toMessage(error) };
  }
};

/** Removes tracking rows for topics that no longer exist in the catalog. */
export const pruneTopics = async (validKeys: string[]) => {
  const user = await requireUser();
  await db
    .delete(userTopicProgress)
    .where(
      and(
        eq(userTopicProgress.userId, user.id),
        inArray(userTopicProgress.topicKey, validKeys),
      ),
    );
};
