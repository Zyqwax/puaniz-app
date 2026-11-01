"use server";

import { and, desc, eq, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { getSchoolMembership, isSuperAdminEmail } from "@/server/school-auth";
import { getCurrentSubscription, PILOT_PLAN_KEY, PILOT_TERMS_VERSION } from "@/server/subscription";

export async function getMySubscription() {
  const user = await requireUser();
  try {
    const [latest] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.createdAt)).limit(1);
    const [anySubscription] = await db.select({ id: subscriptions.id }).from(subscriptions)
      .where(eq(subscriptions.userId, user.id)).limit(1);
    const hasSchoolMembership = Boolean(await getSchoolMembership(user.id));
    const eligibleForGift = !anySubscription && !hasSchoolMembership && !isSuperAdminEmail(user.email);
    return { available: true as const, subscription: latest ?? null, eligibleForGift };
  } catch (error) {
    console.error("Subscription table unavailable:", error);
    return { available: false as const, subscription: null, eligibleForGift: false };
  }
}

export async function activatePremiumPilot(acceptedTerms: boolean) {
  const user = await requireUser();
  if (acceptedTerms !== true) throw new Error("Kampanya koşullarını onaylamalısınız.");
  if (isSuperAdminEmail(user.email) || (await getSchoolMembership(user.id))) {
    throw new Error("Bu bireysel plan okul hesapları için sunulmuyor.");
  }

  const now = new Date();
  const existing = await getCurrentSubscription(user.id);
  if (existing) return { success: true as const, endsAt: existing.endsAt.toISOString() };
  const [previousPremium] = await db.select({ id: subscriptions.id }).from(subscriptions)
    .where(eq(subscriptions.userId, user.id)).limit(1);
  if (previousPremium) throw new Error("İlk ay Premium hediyeni daha önce kullanmışsın. Yardım için bizimle iletişime geçebilirsin.");

  const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  try {
    await db.transaction(async (tx) => {
      await tx.update(subscriptions).set({ status: "expired" })
        .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"), lte(subscriptions.endsAt, now)));
      await tx.insert(subscriptions).values({
        userId: user.id,
        planKey: PILOT_PLAN_KEY,
        planVersion: 1,
        status: "active",
        source: "pilot",
        startsAt: now,
        endsAt,
        acceptedTermsVersion: PILOT_TERMS_VERSION,
        acceptedAt: now,
      });
    });
  } catch (error) {
    // A parallel request may have activated the same user's pilot first.
    try {
      const raced = await getCurrentSubscription(user.id);
      if (raced) return { success: true as const, endsAt: raced.endsAt.toISOString() };
    } catch {
      // Keep database details in server logs rather than returning them to the browser.
    }
    console.error("Premium pilot activation failed:", error);
    throw new Error("Premium hediyesi şu anda etkinleştirilemedi. Lütfen biraz sonra yeniden dene.");
  }

  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/student/analysis");
  return { success: true as const, endsAt: endsAt.toISOString() };
}

export async function cancelMyPilot() {
  const user = await requireUser();
  const active = await getCurrentSubscription(user.id);
  if (!active) return { success: true as const };
  if (active.source !== "pilot") throw new Error("Bu abonelik bu ekrandan iptal edilemiyor.");

  await db.update(subscriptions).set({ status: "cancelled", cancelledAt: new Date() })
    .where(and(eq(subscriptions.id, active.id), eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")));
  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/student/analysis");
  return { success: true as const };
}
