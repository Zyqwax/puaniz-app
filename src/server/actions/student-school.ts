"use server";

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  schools,
  classes,
  schoolMembers,
  schoolExams,
  schoolExamResults,
} from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { getSchoolMembership } from "@/server/school-auth";
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

    // 2. Check if student already has a membership in this school
    const [existingMember] = await db
      .select()
      .from(schoolMembers)
      .where(
        and(
          eq(schoolMembers.schoolId, targetClass.schoolId),
          eq(schoolMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (existingMember) {
      return { success: false, error: "Bu okula zaten kayıtlısınız." };
    }

    // 3. Check if another user registered with this student number in this school
    const [duplicateNumber] = await db
      .select()
      .from(schoolMembers)
      .where(
        and(
          eq(schoolMembers.schoolId, targetClass.schoolId),
          eq(schoolMembers.studentNumber, cleanNum),
        ),
      )
      .limit(1);

    if (duplicateNumber) {
      return { success: false, error: "Bu okul numarası ile kayıtlı başka bir öğrenci bulunmaktadır." };
    }

    // 4. Create membership
    const [member] = await db
      .insert(schoolMembers)
      .values({
        schoolId: targetClass.schoolId,
        userId: user.id,
        role: "student",
        classId: targetClass.id,
        studentNumber: cleanNum,
      })
      .returning();

    // 5. Automatic retroactive link: match previously uploaded school exams
    await db
      .update(schoolExamResults)
      .set({
        studentUserId: user.id,
        classId: targetClass.id,
      })
      .where(
        and(
          eq(schoolExamResults.schoolId, targetClass.schoolId),
          eq(schoolExamResults.studentNumber, cleanNum),
        ),
      );

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
      .where(eq(schoolExamResults.studentUserId, user.id))
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
