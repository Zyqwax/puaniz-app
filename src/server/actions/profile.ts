"use server";

import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/server/db";
import { userProfiles } from "@/server/db/schema";
import { users } from "@/server/db/auth-schema";
import { requireUser } from "@/server/session";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import type { UserProfile } from "@/types";
import { toMessage } from "@/server/errors";
import { isSuperAdminEmail, getSchoolMembership } from "@/server/school-auth";

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
  await ensureProfile(user.id);

  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  const base = toUserProfile(row, {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  }) ?? {
    uid: user.id,
    email: user.email,
    name: user.name,
    displayName: user.name,
    avatarUrl: user.image,
    photoURL: user.image,
  };

  const isSuper = isSuperAdminEmail(user.email);
  const membership = await getSchoolMembership(user.id);

  return {
    ...base,
    isSuperAdmin: isSuper,
    role: isSuper ? "superadmin" : (membership?.role ?? "student"),
    schoolMembership: membership,
  };
};

export const updateUserProfile = async (
  data: Omit<Partial<UserProfile>, "targetRanking"> & { targetRanking?: number | null } & Record<string, unknown>,
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

const getProfilePublicId = (imageUrl: string | null | undefined) => {
  if (!imageUrl || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) return null;
  try {
    const url = new URL(imageUrl);
    if (url.hostname !== "res.cloudinary.com") return null;
    const prefix = `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/`;
    if (!url.pathname.startsWith(prefix)) return null;
    let publicId = url.pathname.slice(prefix.length).replace(/^v\d+\//, "");
    if (!publicId.startsWith("profiles/")) return null;
    publicId = decodeURIComponent(publicId).replace(/\.[^/.]+$/, "");
    return publicId && !publicId.includes("..") ? publicId : null;
  } catch {
    return null;
  }
};

/** Save a newly uploaded avatar immediately and remove the user's old Cloudinary asset when credentials are configured. */
export const replaceProfileAvatar = async (input: {
  avatarUrl: string;
  previousAvatarUrl?: string | null;
}): Promise<{ success: boolean; deletedPrevious?: boolean; warning?: string; error?: string }> => {
  try {
    const user = await requireUser();
    const newPublicId = getProfilePublicId(input.avatarUrl);
    if (!newPublicId) return { success: false, error: "Profil fotoğrafı Cloudinary adresi geçersiz." };

    await ensureProfile(user.id);
    const [profile] = await db
      .select({ avatarUrl: userProfiles.avatarUrl })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    const previousUrl = input.previousAvatarUrl || null;
    if (previousUrl && previousUrl !== profile?.avatarUrl && previousUrl !== user.image) {
      return { success: false, error: "Önceki profil fotoğrafı bu hesaba ait değil." };
    }

    await db.update(userProfiles).set({ avatarUrl: input.avatarUrl }).where(eq(userProfiles.userId, user.id));
    await db.update(users).set({ image: input.avatarUrl, updatedAt: new Date() }).where(eq(users.id, user.id));

    const oldPublicId = getProfilePublicId(previousUrl);
    if (!oldPublicId || oldPublicId === newPublicId) return { success: true, deletedPrevious: false };

    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiKey || !apiSecret) {
      return {
        success: true,
        deletedPrevious: false,
        warning: "Fotoğraf kaydedildi. Eski fotoğrafı otomatik silmek için CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET ayarlayın.",
      };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1")
      .update(`invalidate=true&public_id=${oldPublicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");
    const body = new URLSearchParams({
      public_id: oldPublicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
      invalidate: "true",
    });
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/destroy`,
      { method: "POST", body },
    );
    const result = await response.json() as { result?: string; error?: { message?: string } };
    if (!response.ok || (result.result !== "ok" && result.result !== "not found")) {
      console.error("Cloudinary profile image cleanup failed:", result.error?.message || result.result || response.status);
      return { success: true, deletedPrevious: false, warning: "Fotoğraf kaydedildi ancak eski fotoğraf Cloudinary'den silinemedi." };
    }
    return { success: true, deletedPrevious: result.result === "ok" };
  } catch (error) {
    console.error("Error replacing profile avatar:", error);
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
