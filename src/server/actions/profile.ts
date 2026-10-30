"use server";

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { userProfiles } from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import type { UserProfile } from "@/types";
import { toMessage } from "@/server/errors";

type ProfileRow = typeof userProfiles.$inferSelect;

const toUserProfile = (row: ProfileRow | undefined, base: { id: string; email: string; name: string; image: string | null }): UserProfile | null => {
  if (!row) return null;
  return {
    uid: row.userId,
    email: base.email,
    name: base.name,
    displayName: base.name,
    avatarUrl: row.avatarUrl ?? base.image,
    photoURL: row.avatarUrl ?? base.image,
    bio: row.bio ?? undefined,
    field: row.field ?? undefined,
    grade: row.grade ?? undefined,
    targetNet: row.targetNet ? Number(row.targetNet) : undefined,
    targetRanking: row.targetRanking ?? undefined,
    targetDepartment: row.targetDepartment ?? undefined,
    targetUniversity: row.targetUniversity ?? undefined,
    goals: {
      tyt: Number(row.goalTyt ?? 0),
      ayt: Number(row.goalAyt ?? 0),
    },
    welcomeMessage: row.welcomeMessage ?? undefined,
    analysisMessage: row.analysisMessage ?? undefined,
    lastAnalysisHash: row.lastAnalysisHash ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const ensureProfile = async (userId: string) => {
  await db.insert(userProfiles).values({ userId }).onConflictDoNothing();
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  return toUserProfile(row, { id: user.id, email: user.email, name: user.name, image: user.image });
};

export const updateUserProfile = async (
  data: Partial<UserProfile> & Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await requireUser();
    await ensureProfile(user.id);

    const patch: Partial<typeof userProfiles.$inferInsert> = {};

    const setString = (
      key: keyof typeof userProfiles.$inferInsert,
      value: unknown,
    ) => {
      if (value === undefined) return;
      (patch as Record<string, unknown>)[key] = value === null ? null : String(value);
    };

    const setNumber = (
      key: keyof typeof userProfiles.$inferInsert,
      value: unknown,
    ) => {
      if (value === undefined) return;
      (patch as Record<string, unknown>)[key] =
        value === null || value === "" ? null : Number(value);
    };

    setString("grade", data.grade);
    setString("field", data.field);
    setString("bio", data.bio);
    setString("avatarUrl", data.avatarUrl ?? data.photoURL);
    setString("targetDepartment", data.targetDepartment);
    setString("targetUniversity", data.targetUniversity);
    setString("welcomeMessage", data.welcomeMessage);
    setString("analysisMessage", data.analysisMessage);
    setString("lastAnalysisHash", data.lastAnalysisHash);
    setNumber("targetNet", data.targetNet);
    setNumber("targetRanking", data.targetRanking);

    const goals = data.goals as { tyt?: number; ayt?: number } | undefined;
    if (goals) {
      if (goals.tyt !== undefined) patch.goalTyt = String(goals.tyt);
      if (goals.ayt !== undefined) patch.goalAyt = String(goals.ayt);
    }

    if (Object.keys(patch).length > 0) {
      await db.update(userProfiles).set(patch).where(eq(userProfiles.userId, user.id));
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: toMessage(error) };
  }
};

export const getUserGoals = async (): Promise<{ tyt: number; ayt: number }> => {
  const profile = await getUserProfile();
  return profile?.goals ?? { tyt: 0, ayt: 0 };
};

export const updateUserGoals = async (goals: { tyt: number; ayt: number }) =>
  updateUserProfile({ goals });

export const updateUserWelcomeMessage = async (message: string) =>
  updateUserProfile({ welcomeMessage: message });

/**
 * Deletes the auth user; every app table cascades from `users.id`.
 */
export const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await requireUser();
    await auth.api.deleteUser({
      headers: await headers(),
      body: {},
    });
    // Fallback: if the auth flow did not remove the row, drop it directly.
    const [stillThere] = await db
      .select({ id: userProfiles.userId })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);
    if (stillThere) {
      const { users } = await import("@/server/db/auth-schema");
      await db.delete(users).where(eq(users.id, user.id));
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: toMessage(error) };
  }
};
