import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";

export const PILOT_PLAN_KEY = "student-premium-pilot";
export const PILOT_TERMS_VERSION = "pilot-terms-v1";

export async function getCurrentSubscription(userId: string) {
  const now = new Date();
  const [row] = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"), gt(subscriptions.endsAt, now)))
    .orderBy(desc(subscriptions.createdAt)).limit(1);
  return row ?? null;
}

export async function hasPremiumAccess(userId: string) {
  return Boolean(await getCurrentSubscription(userId));
}
