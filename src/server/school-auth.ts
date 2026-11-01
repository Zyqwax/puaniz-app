import "server-only";

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/server/db";
import { schools, classes, schoolMembers, teacherClasses, schoolSubscriptions } from "@/server/db/schema";
import { requireUser } from "@/server/session";
import type { SchoolMemberInfo } from "@/types";

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (!isSuperAdminEmail(user.email)) {
    throw new Error("Yetkisiz işlem: Yönetici yetkisi gereklidir.");
  }
  return user;
}

export async function getSchoolMemberships(userId: string): Promise<SchoolMemberInfo[]> {
  const memberships = await db
    .select({
      id: schoolMembers.id,
      schoolId: schoolMembers.schoolId,
      schoolName: schools.name,
      role: schoolMembers.role,
      title: schoolMembers.title,
      classId: schoolMembers.classId,
      className: classes.name,
      studentNumber: schoolMembers.studentNumber,
    })
    .from(schoolMembers)
    .innerJoin(schools, eq(schoolMembers.schoolId, schools.id))
    .leftJoin(classes, eq(schoolMembers.classId, classes.id))
    .where(eq(schoolMembers.userId, userId))
    .orderBy(schools.name, schoolMembers.createdAt);

  return memberships.map((membership) => ({
    id: membership.id,
    schoolId: membership.schoolId,
    schoolName: membership.schoolName,
    role: membership.role as "principal" | "teacher" | "student",
    title: membership.title,
    classId: membership.classId,
    className: membership.className,
    studentNumber: membership.studentNumber,
  }));
}

export async function getSchoolMembership(userId: string): Promise<SchoolMemberInfo | null> {
  return (await getSchoolMemberships(userId))[0] ?? null;
}

export async function getUsableInstitutionLicense(schoolId: string) {
  const [license] = await db.select().from(schoolSubscriptions)
    .where(and(eq(schoolSubscriptions.schoolId, schoolId), eq(schoolSubscriptions.status, "active")))
    .orderBy(desc(schoolSubscriptions.createdAt)).limit(1);
  const now = new Date();
  if (!license || license.startsAt > now || license.endsAt <= now) return null;
  if (license.source !== "demo" && !license.paidAt) return null;
  return license;
}

export async function requireUsableInstitutionLicense(schoolId: string) {
  const license = await getUsableInstitutionLicense(schoolId);
  if (!license) throw new Error("Okul lisansı ödeme doğrulanana veya demo erişimi verilene kadar kullanıma açık değil.");
  return license;
}

export async function getUsableSchoolIdsForUser(userId: string) {
  const memberships = await getSchoolMemberships(userId);
  const schoolIds = [...new Set(memberships.map((membership) => membership.schoolId))];
  const usableIds: string[] = [];
  for (const schoolId of schoolIds) {
    if (await getUsableInstitutionLicense(schoolId)) usableIds.push(schoolId);
  }
  return usableIds;
}

export async function requirePrincipal() {
  const user = await requireUser();
  const membership = await getSchoolMembership(user.id);

  if (!membership || membership.role !== "principal") {
    // If super admin, allow access to principal functions as well
    if (isSuperAdminEmail(user.email)) {
      const [firstSchool] = await db.select().from(schools).limit(1);
      if (firstSchool) {
        return {
          user,
          schoolId: firstSchool.id,
          schoolName: firstSchool.name,
          role: "principal" as const,
        };
      }
    }
    throw new Error("Yetkisiz işlem: Okul müdürü yetkisi gereklidir.");
  }

  await requireUsableInstitutionLicense(membership.schoolId);

  return {
    user,
    schoolId: membership.schoolId,
    schoolName: membership.schoolName,
    role: membership.role,
  };
}

export async function requireTeacher(classId?: string) {
  const user = await requireUser();
  const membership = await getSchoolMembership(user.id);

  // Principals and superadmins also have teacher-level read permissions
  if (isSuperAdminEmail(user.email)) {
    return { user, isSuperAdmin: true };
  }

  if (membership?.role === "principal") {
    if (classId) {
      const [target] = await db.select({ id: classes.id }).from(classes).where(and(eq(classes.id, classId), eq(classes.schoolId, membership.schoolId))).limit(1);
      if (!target) throw new Error("Bu sınıfa erişim yetkiniz bulunmuyor.");
    }
    await requireUsableInstitutionLicense(membership.schoolId);
    return { user, schoolId: membership.schoolId, isPrincipal: true };
  }

  if (!membership || membership.role !== "teacher") {
    throw new Error("Yetkisiz işlem: Öğretmen yetkisi gereklidir.");
  }

  await requireUsableInstitutionLicense(membership.schoolId);

  if (classId) {
    const [assigned] = await db
      .select()
      .from(teacherClasses)
      .where(and(eq(teacherClasses.teacherId, user.id), eq(teacherClasses.classId, classId)))
      .limit(1);

    if (!assigned) {
      throw new Error("Bu sınıfa erişim yetkiniz bulunmuyor.");
    }
  }

  return {
    user,
    schoolId: membership.schoolId,
    schoolName: membership.schoolName,
  };
}

export async function getUserRoleContext() {
  const user = await requireUser();
  const isSuper = isSuperAdminEmail(user.email);
  const membership = await getSchoolMembership(user.id);

  return {
    user,
    isSuperAdmin: isSuper,
    membership,
    role: isSuper ? "superadmin" : (membership?.role ?? "student"),
  };
}

export async function requireStudentAccess(studentUserId: string, classId?: string) {
  const user = await requireUser();
  if (studentUserId === user.id && !classId) return user;
  const [student] = await db.select().from(schoolMembers).where(and(eq(schoolMembers.userId, studentUserId), eq(schoolMembers.role, "student"), classId ? eq(schoolMembers.classId, classId) : undefined)).limit(1);
  if (!student?.classId) throw new Error("Öğrenci sınıf kaydı bulunamadı.");
  const context = await requireTeacher(student.classId);
  if (!context.isSuperAdmin && context.schoolId !== student.schoolId) throw new Error("Bu öğrenciye erişiminiz bulunmuyor.");
  return user;
}
