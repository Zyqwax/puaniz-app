"use server";

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { schoolMembers, schools, schoolSubscriptions, schoolSubscriptionEvents } from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { getSchoolMemberships, requireSuperAdmin } from "@/server/school-auth";
import { isSchoolPlanKey, SCHOOL_PLANS, type SchoolPlanKey } from "@/lib/school-plans";

type LicenseRow = typeof schoolSubscriptions.$inferSelect;

function effectiveStatus(row: LicenseRow | undefined, now = new Date()) {
  if (!row) return "not_configured" as const;
  if ((row.status === "pending" || row.status === "awaiting_payment") && row.endsAt <= now) return "expired" as const;
  if (row.status !== "active") return row.status;
  if (row.startsAt > now) return "scheduled" as const;
  if (row.endsAt <= now) return "expired" as const;
  return "active" as const;
}

function currentLicenseBySchool(rows: LicenseRow[]) {
  const grouped = new Map<string, LicenseRow[]>();
  for (const row of rows) grouped.set(row.schoolId, [...(grouped.get(row.schoolId) ?? []), row]);
  return new Map([...grouped].map(([schoolId, schoolRows]) => [
    schoolId,
    schoolRows.find((row) => row.status === "pending" && row.endsAt > new Date())
      ?? schoolRows.find((row) => row.status === "awaiting_payment" && row.endsAt > new Date())
      ?? schoolRows.find((row) => row.status === "active")
      ?? schoolRows[0],
  ]));
}

function parseDate(value: string, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export async function getMyInstitutionLicenses() {
  const user = await requireUser();
  const memberships = await getSchoolMemberships(user.id);
  if (memberships.length === 0) return [];

  const schoolIds = [...new Set(memberships.map((m) => m.schoolId))];
  const [licenses, counts] = await Promise.all([
    db.select().from(schoolSubscriptions).where(inArray(schoolSubscriptions.schoolId, schoolIds)).orderBy(desc(schoolSubscriptions.createdAt)),
    db.select({ schoolId: schoolMembers.schoolId, students: count(schoolMembers.id) }).from(schoolMembers)
      .where(and(inArray(schoolMembers.schoolId, schoolIds), eq(schoolMembers.role, "student"))).groupBy(schoolMembers.schoolId),
  ]);
  const latestBySchool = currentLicenseBySchool(licenses);
  const countBySchool = new Map(counts.map((row) => [row.schoolId, Number(row.students)]));
  const now = new Date();

  return memberships.map((membership) => {
    const license = latestBySchool.get(membership.schoolId);
    const isPrincipal = membership.role === "principal";
    const plan = license && isSchoolPlanKey(license.planKey) ? SCHOOL_PLANS[license.planKey] : null;
    return {
      membershipId: membership.id,
      schoolId: membership.schoolId,
      schoolName: membership.schoolName,
      role: membership.role,
      title: membership.title,
      className: membership.className,
      studentNumber: membership.role === "student" ? membership.studentNumber : null,
      plan: plan ? { key: license!.planKey, name: plan.name, features: plan.features } : null,
      status: effectiveStatus(license, now),
      startsAt: license?.startsAt ?? null,
      endsAt: license?.endsAt ?? null,
      studentCount: isPrincipal ? countBySchool.get(membership.schoolId) ?? 0 : null,
      studentLimit: isPrincipal ? license?.studentLimit ?? null : null,
      amountKurus: isPrincipal ? license?.amountKurus ?? null : null,
      agreementReference: isPrincipal ? license?.agreementReference ?? null : null,
      paidAt: isPrincipal ? license?.paidAt ?? null : null,
      source: license?.source ?? null,
    };
  });
}

export async function getInstitutionLicenseOverview() {
  await requireSuperAdmin();
  const [allSchools, licenses, counts] = await Promise.all([
    db.select().from(schools).orderBy(schools.name),
    db.select().from(schoolSubscriptions).orderBy(desc(schoolSubscriptions.createdAt)),
    db.select({ schoolId: schoolMembers.schoolId, students: count(schoolMembers.id) }).from(schoolMembers)
      .where(eq(schoolMembers.role, "student")).groupBy(schoolMembers.schoolId),
  ]);
  const latestBySchool = currentLicenseBySchool(licenses);
  const countBySchool = new Map(counts.map((row) => [row.schoolId, Number(row.students)]));
  const now = new Date();
  return allSchools.map((school) => {
    const license = latestBySchool.get(school.id);
    const plan = license && isSchoolPlanKey(license.planKey) ? SCHOOL_PLANS[license.planKey] : null;
    return {
      id: school.id,
      name: school.name,
      city: school.city,
      district: school.district,
      studentCount: countBySchool.get(school.id) ?? 0,
      plan: plan ? { key: license!.planKey, name: plan.name, features: plan.features } : null,
      status: effectiveStatus(license, now),
      startsAt: license?.startsAt ?? null,
      endsAt: license?.endsAt ?? null,
      studentLimit: license?.studentLimit ?? null,
      amountKurus: license?.amountKurus ?? null,
      agreementReference: license?.agreementReference ?? null,
      paidAt: license?.paidAt ?? null,
      source: license?.source ?? null,
    };
  });
}

export async function setManualInstitutionLicense(input: {
  schoolId: string;
  planKey: string;
  startsAt: string;
  endsAt: string;
  studentLimit: number;
  amountKurus: number;
  agreementReference?: string;
}) {
  const actor = await requireSuperAdmin();
  if (!isSchoolPlanKey(input.planKey)) throw new Error("Kurum planı geçersiz.");
  if (!Number.isInteger(input.studentLimit) || input.studentLimit < 1 || input.studentLimit > 10000) throw new Error("Öğrenci kontenjanı 1 ile 10.000 arasında olmalıdır.");
  if (!Number.isInteger(input.amountKurus) || input.amountKurus < 1 || input.amountKurus > 100_000_000) throw new Error("Lisans tutarı 0,01 TL ile 1.000.000 TL arasında olmalıdır.");
  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt, true);
  if (!startsAt || !endsAt || endsAt <= startsAt) throw new Error("Başlangıç ve bitiş tarihlerini kontrol edin.");
  if (startsAt > new Date()) throw new Error("Lisans teklifi başlangıcı ileri bir tarih olamaz; başlangıç geldiğinde teklifi oluşturun.");
  const agreementReference = input.agreementReference?.trim() || null;
  if (agreementReference && agreementReference.length > 120) throw new Error("Sözleşme referansı en fazla 120 karakter olabilir.");

  const planKey: SchoolPlanKey = input.planKey;
  const now = new Date();
  await db.transaction(async (tx) => {
    const [school] = await tx.select({ id: schools.id }).from(schools).where(eq(schools.id, input.schoolId)).for("update");
    if (!school) throw new Error("Okul bulunamadı.");
    const [studentRows] = await tx.select({ students: count(schoolMembers.id) }).from(schoolMembers)
      .where(and(eq(schoolMembers.schoolId, input.schoolId), eq(schoolMembers.role, "student")));
    const existingStudents = Number(studentRows?.students ?? 0);
    if (existingStudents > input.studentLimit) throw new Error(`Bu okulda ${existingStudents} öğrenci var. Kontenjan en az bu sayı olmalıdır.`);

    const previous = await tx.select().from(schoolSubscriptions)
      .where(and(eq(schoolSubscriptions.schoolId, input.schoolId), inArray(schoolSubscriptions.status, ["pending", "awaiting_payment"]))).for("update");
    for (const old of previous) {
      const expired = old.endsAt <= now;
      await tx.update(schoolSubscriptions).set({ status: expired ? "expired" : "cancelled", cancelledAt: expired ? old.cancelledAt : now })
        .where(eq(schoolSubscriptions.id, old.id));
      await tx.insert(schoolSubscriptionEvents).values({
        schoolId: input.schoolId,
        subscriptionId: old.id,
        actorId: actor.id,
        action: expired ? "expired_on_replacement" : "replaced_by_license_offer",
        details: JSON.stringify({ replacementPlan: planKey }),
      });
    }

    const [created] = await tx.insert(schoolSubscriptions).values({
      schoolId: input.schoolId,
      planKey,
      planVersion: SCHOOL_PLANS[planKey].version,
      status: "pending",
      source: "manual",
      startsAt,
      endsAt,
      studentLimit: input.studentLimit,
      amountKurus: input.amountKurus,
      agreementReference,
      createdBy: actor.id,
    }).returning({ id: schoolSubscriptions.id });
    await tx.insert(schoolSubscriptionEvents).values({
      schoolId: input.schoolId,
      subscriptionId: created.id,
      actorId: actor.id,
      action: "license_offer_created",
      details: JSON.stringify({ planKey, startsAt, endsAt, studentLimit: input.studentLimit, amountKurus: input.amountKurus, agreementReference }),
    });
  });
  revalidatePath("/dashboard/admin/school-subscriptions");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/principal/subscription");
  return { success: true as const };
}

export async function cancelManualInstitutionLicense(schoolId: string) {
  const actor = await requireSuperAdmin();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).for("update");
    const [license] = await tx.select().from(schoolSubscriptions)
      .where(and(eq(schoolSubscriptions.schoolId, schoolId), inArray(schoolSubscriptions.status, ["active", "pending", "awaiting_payment"])))
      .orderBy(desc(schoolSubscriptions.createdAt)).limit(1).for("update");
    if (!license) throw new Error("Aktif kurum lisansı veya bekleyen teklif bulunamadı.");
    await tx.update(schoolSubscriptions).set({ status: "cancelled", cancelledAt: now }).where(eq(schoolSubscriptions.id, license.id));
    await tx.insert(schoolSubscriptionEvents).values({
      schoolId,
      subscriptionId: license.id,
      actorId: actor.id,
      action: "manual_license_cancelled",
      details: JSON.stringify({ cancelledAt: now }),
    });
  });
  revalidatePath("/dashboard/admin/school-subscriptions");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/principal/subscription");
  revalidatePath("/dashboard/admin/school-subscriptions");
  return { success: true as const };
}

export async function requestInstitutionPayment(schoolId: string, accepted: boolean) {
  const user = await requireUser();
  if (accepted !== true) throw new Error("Kurum lisansı başlatma koşulunu onaylamalısınız.");
  const memberships = await getSchoolMemberships(user.id);
  if (!memberships.some((membership) => membership.schoolId === schoolId && membership.role === "principal")) {
    throw new Error("Bu okulun lisansını başlatma yetkiniz bulunmuyor.");
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    const [school] = await tx.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).for("update");
    if (!school) throw new Error("Okul bulunamadı.");
    const [offer] = await tx.select().from(schoolSubscriptions)
      .where(and(eq(schoolSubscriptions.schoolId, schoolId), eq(schoolSubscriptions.status, "pending")))
      .orderBy(desc(schoolSubscriptions.createdAt)).limit(1).for("update");
    if (!offer) throw new Error("Başlatılmayı bekleyen kurum lisansı bulunamadı.");
    if (offer.endsAt <= now) throw new Error("Bu lisans teklifinin süresi dolmuş. Okul yöneticinizden yeni teklif isteyin.");
    if (!offer.amountKurus || offer.amountKurus < 1) throw new Error("Bu teklif için geçerli bir ödeme tutarı bulunmuyor. Okul yöneticinizle iletişime geçin.");
    await tx.update(schoolSubscriptions).set({ status: "awaiting_payment" }).where(eq(schoolSubscriptions.id, offer.id));
    await tx.insert(schoolSubscriptionEvents).values({
      schoolId,
      subscriptionId: offer.id,
      actorId: user.id,
      action: "principal_requested_payment",
      details: JSON.stringify({ requestedAt: now, amountKurus: offer.amountKurus, paymentCollected: false, acceptanceVersion: "institution-payment-request-v1" }),
    });
  });
  revalidatePath("/dashboard/principal/subscription");
  revalidatePath("/dashboard/principal/subscription/cart");
  revalidatePath("/dashboard/admin/school-subscriptions");
  return { success: true as const };
}

export async function confirmInstitutionPayment(schoolId: string, paymentReference: string) {
  const actor = await requireSuperAdmin();
  const reference = paymentReference.trim();
  if (reference.length < 3 || reference.length > 120) throw new Error("Ödeme referansı 3 ile 120 karakter arasında olmalıdır.");
  const now = new Date();
  await db.transaction(async (tx) => {
    const [school] = await tx.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).for("update");
    if (!school) throw new Error("Okul bulunamadı.");
    const [offer] = await tx.select().from(schoolSubscriptions)
      .where(and(eq(schoolSubscriptions.schoolId, schoolId), eq(schoolSubscriptions.status, "awaiting_payment")))
      .orderBy(desc(schoolSubscriptions.createdAt)).limit(1).for("update");
    if (!offer) throw new Error("Ödeme onayı bekleyen lisans bulunamadı.");
    if (!offer.amountKurus || offer.amountKurus < 1) throw new Error("Lisans için ödeme tutarı tanımlı değil.");
    if (offer.endsAt <= now) throw new Error("Teklifin süresi dolmuş. Önce yeni bir lisans teklifi oluşturun.");
    const activeRows = await tx.select().from(schoolSubscriptions)
      .where(and(eq(schoolSubscriptions.schoolId, schoolId), eq(schoolSubscriptions.status, "active"))).for("update");
    for (const active of activeRows) {
      const expired = active.endsAt <= now;
      await tx.update(schoolSubscriptions).set({ status: expired ? "expired" : "cancelled", cancelledAt: expired ? active.cancelledAt : now })
        .where(eq(schoolSubscriptions.id, active.id));
      await tx.insert(schoolSubscriptionEvents).values({
        schoolId,
        subscriptionId: active.id,
        actorId: actor.id,
        action: expired ? "expired_on_paid_offer_activation" : "replaced_by_paid_offer",
        details: JSON.stringify({ activatedOfferId: offer.id }),
      });
    }
    await tx.update(schoolSubscriptions).set({ status: "active", paidAt: now, paymentReference: reference })
      .where(eq(schoolSubscriptions.id, offer.id));
    await tx.insert(schoolSubscriptionEvents).values({
      schoolId,
      subscriptionId: offer.id,
      actorId: actor.id,
      action: "payment_confirmed_and_license_activated",
      details: JSON.stringify({ paidAt: now, amountKurus: offer.amountKurus, paymentReference: reference }),
    });
  });
  revalidatePath("/dashboard/admin/school-subscriptions");
  revalidatePath("/dashboard/principal/subscription");
  revalidatePath("/dashboard/principal/subscription/cart");
  revalidatePath("/dashboard/student/school-exams");
  return { success: true as const };
}

export async function grantInstitutionDemo(schoolId: string, planKeyInput: string, durationDays = 14) {
  const actor = await requireSuperAdmin();
  if (!isSchoolPlanKey(planKeyInput)) throw new Error("Kurum planı geçersiz.");
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 90) throw new Error("Demo süresi 1 ile 90 gün arasında olmalıdır.");
  const planKey: SchoolPlanKey = planKeyInput;
  const now = new Date();
  const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    const [school] = await tx.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).for("update");
    if (!school) throw new Error("Okul bulunamadı.");
    const [studentRows] = await tx.select({ students: count(schoolMembers.id) }).from(schoolMembers)
      .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.role, "student")));
    const existingStudents = Number(studentRows?.students ?? 0);
    if (existingStudents > 10000) throw new Error("Okul mevcut öğrenci sayısı demo kontenjan üst sınırını aşıyor.");
    const [anyLicense] = await tx.select({ id: schoolSubscriptions.id }).from(schoolSubscriptions)
      .where(eq(schoolSubscriptions.schoolId, schoolId)).limit(1);
    if (!anyLicense) throw new Error("Önce okul için lisans teklifi tanımlayın; ardından demo erişimi verebilirsiniz.");
    const previous = await tx.select().from(schoolSubscriptions)
      .where(and(eq(schoolSubscriptions.schoolId, schoolId), inArray(schoolSubscriptions.status, ["active", "pending", "awaiting_payment"]))).for("update");
    const studentLimit = Math.max(existingStudents, 50, ...previous.map((row) => row.studentLimit));
    for (const old of previous) {
      await tx.update(schoolSubscriptions).set({ status: "cancelled", cancelledAt: now }).where(eq(schoolSubscriptions.id, old.id));
      await tx.insert(schoolSubscriptionEvents).values({
        schoolId,
        subscriptionId: old.id,
        actorId: actor.id,
        action: "replaced_by_demo_license",
        details: JSON.stringify({ demoPlan: planKey }),
      });
    }
    const [created] = await tx.insert(schoolSubscriptions).values({
      schoolId,
      planKey,
      planVersion: SCHOOL_PLANS[planKey].version,
      status: "active",
      source: "demo",
      startsAt: now,
      endsAt,
      studentLimit,
      amountKurus: 0,
      agreementReference: null,
      createdBy: actor.id,
    }).returning({ id: schoolSubscriptions.id });
    await tx.insert(schoolSubscriptionEvents).values({
      schoolId,
      subscriptionId: created.id,
      actorId: actor.id,
      action: "demo_license_granted",
      details: JSON.stringify({ planKey, startsAt: now, endsAt, durationDays, studentLimit }),
    });
  });
  revalidatePath("/dashboard/admin/school-subscriptions");
  revalidatePath("/dashboard/principal/subscription");
  return { success: true as const };
}
