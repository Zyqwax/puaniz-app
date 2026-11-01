"use server";

import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  schools,
  classes,
  schoolMembers,
  schoolSubscriptions,
  schoolExams,
  schoolExamResults,
} from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { getSchoolMembership, getUsableSchoolIdsForUser } from "@/server/school-auth";
import { toMessage } from "@/server/errors";
import type { SchoolMemberInfo, SchoolStudentExamResult } from "@/types";

export async function joinSchoolClass(input: {
  joinCode: string;
  studentNumber: string;
}): Promise<{ success: boolean; membership?: SchoolMemberInfo; error?: string }> {
  try {
    const user = await requireUser();
    const cleanCode = input.joinCode.trim().toUpperCase();
    const cleanNum = input.studentNumber.trim();

    if (!cleanCode || !cleanNum) {
      return { success: false, error: "Katılım kodu ve okul numarası gereklidir." };
    }

    // 1. Find class by join code
    const [targetClass] = await db
      .select({
        id: classes.id,
        name: classes.name,
        schoolId: classes.schoolId,
        schoolName: schools.name,
      })
      .from(classes)
      .innerJoin(schools, eq(classes.schoolId, schools.id))
      .where(eq(classes.joinCode, cleanCode))
      .limit(1);

    if (!targetClass) {
      return { success: false, error: "Geçersiz sınıf kodu. Lütfen öğretmeninizden veya müdürünüzden kodu kontrol etmesini isteyin." };
    }

    const member = await db.transaction(async (tx) => {
      // Serialize seat checks with both other enrollments and manual license changes.
      await tx.select({ id: schools.id }).from(schools).where(eq(schools.id, targetClass.schoolId)).for("update");

      const [existingMember] = await tx.select({ id: schoolMembers.id }).from(schoolMembers)
        .where(and(eq(schoolMembers.schoolId, targetClass.schoolId), eq(schoolMembers.userId, user.id))).limit(1);
      if (existingMember) throw new Error("Bu okula zaten kayıtlısınız.");

      const [duplicateNumber] = await tx.select({ id: schoolMembers.id }).from(schoolMembers)
        .where(and(eq(schoolMembers.schoolId, targetClass.schoolId), eq(schoolMembers.studentNumber, cleanNum))).limit(1);
      if (duplicateNumber) throw new Error("Bu okul numarası ile kayıtlı başka bir öğrenci bulunmaktadır.");

      const now = new Date();
      const [license] = await tx.select().from(schoolSubscriptions)
        .where(and(eq(schoolSubscriptions.schoolId, targetClass.schoolId), eq(schoolSubscriptions.status, "active")))
        .limit(1);
      if (!license || license.startsAt > now || license.endsAt <= now || (license.source !== "demo" && !license.paidAt)) {
        throw new Error("Okul lisansı ödeme doğrulanana veya demo erişimi verilene kadar öğrenci katılımına açık değil.");
      }
      if (license.startsAt <= now && license.endsAt > now) {
        const [usage] = await tx.select({ students: sql<number>`count(*)::int` }).from(schoolMembers)
          .where(and(eq(schoolMembers.schoolId, targetClass.schoolId), eq(schoolMembers.role, "student")));
        if (Number(usage?.students ?? 0) >= license.studentLimit) throw new Error("Okulun öğrenci kontenjanı dolu. Okul yöneticinizle iletişime geçin.");
      }

      const [created] = await tx.insert(schoolMembers).values({
        schoolId: targetClass.schoolId,
        userId: user.id,
        role: "student",
        classId: targetClass.id,
        studentNumber: cleanNum,
      }).returning();

      await tx.update(schoolExamResults).set({ studentUserId: user.id, classId: targetClass.id })
        .where(and(eq(schoolExamResults.schoolId, targetClass.schoolId), eq(schoolExamResults.studentNumber, cleanNum)));
      return created;
    });

    return {
      success: true,
      membership: {
        id: member.id,
        schoolId: targetClass.schoolId,
        schoolName: targetClass.schoolName,
        role: "student",
        classId: targetClass.id,
        className: targetClass.name,
        studentNumber: cleanNum,
      },
    };
  } catch (err) {
    console.error("joinSchoolClass error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function getMySchoolInfo(): Promise<SchoolMemberInfo | null> {
  try {
    const user = await requireUser();
    return await getSchoolMembership(user.id);
  } catch (err) {
    console.error("getMySchoolInfo error:", err);
    return null;
  }
}

export async function getMySchoolExams(): Promise<SchoolStudentExamResult[]> {
  try {
    const user = await requireUser();
    const licensedSchoolIds = await getUsableSchoolIdsForUser(user.id);
    if (licensedSchoolIds.length === 0) return [];

    const results = await db
      .select({
        id: schoolExamResults.id,
        schoolExamId: schoolExamResults.schoolExamId,
        examName: schoolExams.name,
        examDate: schoolExams.date,
        examType: schoolExams.type,
        studentNumber: schoolExamResults.studentNumber,
        studentName: schoolExamResults.studentName,
        scores: schoolExamResults.scores,
        totalNet: schoolExamResults.totalNet,
        rankInClass: schoolExamResults.rankInClass,
        rankInSchool: schoolExamResults.rankInSchool,
      })
      .from(schoolExamResults)
      .innerJoin(schoolExams, eq(schoolExamResults.schoolExamId, schoolExams.id))
      .where(and(eq(schoolExamResults.studentUserId, user.id), inArray(schoolExamResults.schoolId, licensedSchoolIds)))
      .orderBy(desc(schoolExams.date));

    return results.map((r) => ({
      id: r.id,
      schoolExamId: r.schoolExamId,
      examName: r.examName,
      examDate: r.examDate,
      examType: r.examType,
      studentNumber: r.studentNumber,
      studentName: r.studentName,
      scores: r.scores,
      totalNet: Number(r.totalNet),
      rankInClass: r.rankInClass,
      rankInSchool: r.rankInSchool,
    }));
  } catch (err) {
    console.error("getMySchoolExams error:", err);
    return [];
  }
}

export async function leaveSchool(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    // Unlink exams
    await db
      .update(schoolExamResults)
      .set({ studentUserId: null })
      .where(eq(schoolExamResults.studentUserId, user.id));

    // Delete membership
    await db
      .delete(schoolMembers)
      .where(and(eq(schoolMembers.userId, user.id), eq(schoolMembers.role, "student")));

    return { success: true };
  } catch (err) {
    console.error("leaveSchool error:", err);
    return { success: false, error: toMessage(err) };
  }
}
