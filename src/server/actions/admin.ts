"use server";

import crypto from "node:crypto";
import { eq, count, sql, desc } from "drizzle-orm";
import { db } from "@/server/db";
import { users, accounts } from "@/server/db/auth-schema";
import {
  schools,
  classes,
  schoolMembers,
  schoolExams,
  userProfiles,
} from "@/server/db/schema";
import { requireSuperAdmin } from "@/server/school-auth";
import { hashPassword } from "better-auth/crypto";
import { toMessage } from "@/server/errors";
import type { School } from "@/types";

export interface CreateSchoolInput {
  name: string;
  code?: string;
  city?: string;
  district?: string;
}

export interface CreateStaffInput {
  schoolId: string;
  name: string;
  email: string;
  role: "principal" | "teacher";
  title?: string;
}

function generateReadablePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Pz!${pass}`;
}

export async function createSchool(
  input: CreateSchoolInput,
): Promise<{ success: boolean; schoolId?: string; error?: string }> {
  try {
    await requireSuperAdmin();

    const code =
      input.code?.trim().toUpperCase() ||
      `OKL-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const [created] = await db
      .insert(schools)
      .values({
        name: input.name.trim(),
        code,
        city: input.city?.trim() || null,
        district: input.district?.trim() || null,
      })
      .returning({ id: schools.id });

    return { success: true, schoolId: created.id };
  } catch (err) {
    console.error("createSchool error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function getSchools(): Promise<School[]> {
  try {
    await requireSuperAdmin();

    const allSchools = await db.select().from(schools).orderBy(schools.name);

    const counts = await db
      .select({
        schoolId: schoolMembers.schoolId,
        role: schoolMembers.role,
        count: count(schoolMembers.id),
      })
      .from(schoolMembers)
      .groupBy(schoolMembers.schoolId, schoolMembers.role);

    const classCounts = await db
      .select({
        schoolId: classes.schoolId,
        count: count(classes.id),
      })
      .from(classes)
      .groupBy(classes.schoolId);

    const countsBySchool = new Map<string, { students: number; teachers: number }>();
    for (const c of counts) {
      const cur = countsBySchool.get(c.schoolId) ?? { students: 0, teachers: 0 };
      if (c.role === "student") cur.students += Number(c.count);
      if (c.role === "teacher" || c.role === "principal") cur.teachers += Number(c.count);
      countsBySchool.set(c.schoolId, cur);
    }

    const classCountsMap = new Map<string, number>();
    for (const cc of classCounts) {
      classCountsMap.set(cc.schoolId, Number(cc.count));
    }

    return allSchools.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      city: s.city,
      district: s.district,
      createdAt: s.createdAt,
      studentCount: countsBySchool.get(s.id)?.students ?? 0,
      teacherCount: countsBySchool.get(s.id)?.teachers ?? 0,
      classCount: classCountsMap.get(s.id) ?? 0,
    }));
  } catch (err) {
    console.error("getSchools error:", err);
    return [];
  }
}

export async function createStaffAccount(input: CreateStaffInput): Promise<{
  success: boolean;
  credentials?: { email: string; password: string; name: string; role: string };
  error?: string;
}> {
  try {
    await requireSuperAdmin();

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanName = input.name.trim();

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingUser) {
      return { success: false, error: "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var." };
    }

    const rawPassword = generateReadablePassword();
    const hashedPassword = await hashPassword(rawPassword);
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();

    // 1. Create user
    await db.insert(users).values({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      emailVerified: true,
    });

    // 2. Create credential account
    await db.insert(accounts).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });

    // 3. Create initial profile
    await db.insert(userProfiles).values({
      userId,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2F6BFF&color=fff&bold=true`,
    });

    // 4. Add to school members
    await db.insert(schoolMembers).values({
      schoolId: input.schoolId,
      userId,
      role: input.role,
      title: input.title?.trim() || (input.role === "principal" ? "Okul Müdürü" : "Öğretmen"),
    });

    return {
      success: true,
      credentials: {
        email: cleanEmail,
        password: rawPassword,
        name: cleanName,
        role: input.role === "principal" ? "Müdür" : "Öğretmen",
      },
    };
  } catch (err) {
    console.error("createStaffAccount error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function getSchoolStaffAndClasses(schoolId: string) {
  try {
    await requireSuperAdmin();

    const [school] = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    if (!school) return null;

    const members = await db
      .select({
        id: schoolMembers.id,
        userId: schoolMembers.userId,
        name: users.name,
        email: users.email,
        role: schoolMembers.role,
        title: schoolMembers.title,
        createdAt: schoolMembers.createdAt,
      })
      .from(schoolMembers)
      .innerJoin(users, eq(schoolMembers.userId, users.id))
      .where(eq(schoolMembers.schoolId, schoolId));

    const schoolClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(classes.name);

    const schoolExamsList = await db
      .select({
        id: schoolExams.id,
        name: schoolExams.name,
        type: schoolExams.type,
        date: schoolExams.date,
        createdAt: schoolExams.createdAt,
      })
      .from(schoolExams)
      .where(eq(schoolExams.schoolId, schoolId))
      .orderBy(desc(schoolExams.date));

    return {
      school,
      principals: members.filter((m) => m.role === "principal"),
      teachers: members.filter((m) => m.role === "teacher"),
      classes: schoolClasses,
      exams: schoolExamsList,
    };
  } catch (err) {
    console.error("getSchoolStaffAndClasses error:", err);
    return null;
  }
}

export async function deleteSchool(
  schoolId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    await db.delete(schools).where(eq(schools.id, schoolId));
    return { success: true };
  } catch (err) {
    console.error("deleteSchool error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function removeStaffMember(
  memberId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    await db.delete(schoolMembers).where(eq(schoolMembers.id, memberId));
    return { success: true };
  } catch (err) {
    console.error("removeStaffMember error:", err);
    return { success: false, error: toMessage(err) };
  }
}
