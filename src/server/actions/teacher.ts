"use server";

import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/auth-schema";
import {
  classes,
  schoolMembers,
  teacherClasses,
  schoolExams,
  schoolExamResults,
  teacherFeedback,
} from "@/server/db/schema";
import { requireStudentAccess, requireTeacher } from "@/server/school-auth";
import { requireUser } from "@/server/session";
import { toMessage } from "@/server/errors";
import type { ClassItem, TeacherFeedbackItem } from "@/types";

export async function getTeacherAssignedClasses(): Promise<ClassItem[]> {
  try {
    const { user, isSuperAdmin, isPrincipal, schoolId } = await requireTeacher();

    let classRows: typeof classes.$inferSelect[];

    if (isSuperAdmin || isPrincipal) {
      classRows = await db
        .select()
        .from(classes)
        .where(schoolId ? eq(classes.schoolId, schoolId) : undefined)
        .orderBy(classes.grade, classes.name);
    } else {
      classRows = await db
        .select({
          id: classes.id,
          schoolId: classes.schoolId,
          name: classes.name,
          grade: classes.grade,
          field: classes.field,
          joinCode: classes.joinCode,
          createdAt: classes.createdAt,
        })
        .from(teacherClasses)
        .innerJoin(classes, eq(teacherClasses.classId, classes.id))
        .where(eq(teacherClasses.teacherId, user.id))
        .orderBy(classes.grade, classes.name);
    }

    if (classRows.length === 0) return [];

    const classIds = classRows.map((c) => c.id);

    const counts = await db
      .select({
        classId: schoolMembers.classId,
        count: sql<number>`count(${schoolMembers.id})::int`,
      })
      .from(schoolMembers)
      .where(and(eq(schoolMembers.role, "student"), inArray(schoolMembers.classId, classIds)))
      .groupBy(schoolMembers.classId);

    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c.classId) countMap.set(c.classId, c.count);
    }

    return classRows.map((c) => ({
      id: c.id,
      schoolId: c.schoolId,
      name: c.name,
      grade: c.grade,
      field: c.field,
      joinCode: c.joinCode,
      studentCount: countMap.get(c.id) ?? 0,
      createdAt: c.createdAt,
    }));
  } catch (err) {
    console.error("getTeacherAssignedClasses error:", err);
    return [];
  }
}

export async function getClassDetailForTeacher(classId: string) {
  try {
    await requireTeacher(classId);

    const [classInfo] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    if (!classInfo) return null;

    // Students in this class
    const students = await db
      .select({
        memberId: schoolMembers.id,
        userId: schoolMembers.userId,
        name: users.name,
        email: users.email,
        studentNumber: schoolMembers.studentNumber,
      })
      .from(schoolMembers)
      .innerJoin(users, eq(schoolMembers.userId, users.id))
      .where(and(eq(schoolMembers.classId, classId), eq(schoolMembers.role, "student")))
      .orderBy(schoolMembers.studentNumber);

    // Exam history for this class
    const examResults = await db
      .select({
        examId: schoolExams.id,
        examName: schoolExams.name,
        examType: schoolExams.type,
        examDate: schoolExams.date,
        totalNet: schoolExamResults.totalNet,
        studentNumber: schoolExamResults.studentNumber,
        studentName: schoolExamResults.studentName,
        rankInClass: schoolExamResults.rankInClass,
        rankInSchool: schoolExamResults.rankInSchool,
      })
      .from(schoolExamResults)
      .innerJoin(schoolExams, eq(schoolExamResults.schoolExamId, schoolExams.id))
      .where(eq(schoolExamResults.classId, classId))
      .orderBy(desc(schoolExams.date), schoolExamResults.rankInClass);

    return {
      classInfo,
      students,
      examResults,
    };
  } catch (err) {
    console.error("getClassDetailForTeacher error:", err);
    return null;
  }
}

export async function addTeacherFeedback(input: {
  studentUserId: string;
  classId?: string;
  note: string;
}): Promise<{ success: boolean; feedback?: TeacherFeedbackItem; error?: string }> {
  try {
    await requireTeacher(input.classId);
    const user = await requireStudentAccess(input.studentUserId, input.classId);
    const cleanNote = input.note?.trim();
    if (!cleanNote) {
      return { success: false, error: "Geri bildirim notu boş olamaz." };
    }

    const [created] = await db
      .insert(teacherFeedback)
      .values({
        teacherId: user.id,
        studentUserId: input.studentUserId,
        classId: input.classId || null,
        note: cleanNote,
      })
      .returning();

    return {
      success: true,
      feedback: {
        id: created.id,
        teacherId: created.teacherId,
        teacherName: user.name,
        studentUserId: created.studentUserId,
        classId: created.classId,
        note: created.note,
        createdAt: created.createdAt,
      },
    };
  } catch (err) {
    console.error("addTeacherFeedback error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function getStudentFeedbacks(studentUserId: string): Promise<TeacherFeedbackItem[]> {
  try {
    await requireStudentAccess(studentUserId);
    const feedbacks = await db
      .select({
        id: teacherFeedback.id,
        teacherId: teacherFeedback.teacherId,
        teacherName: users.name,
        studentUserId: teacherFeedback.studentUserId,
        classId: teacherFeedback.classId,
        className: classes.name,
        note: teacherFeedback.note,
        createdAt: teacherFeedback.createdAt,
      })
      .from(teacherFeedback)
      .innerJoin(users, eq(teacherFeedback.teacherId, users.id))
      .leftJoin(classes, eq(teacherFeedback.classId, classes.id))
      .where(eq(teacherFeedback.studentUserId, studentUserId))
      .orderBy(desc(teacherFeedback.createdAt));

    return feedbacks;
  } catch (err) {
    console.error("getStudentFeedbacks error:", err);
    return [];
  }
}

export async function getMyTeacherFeedbacks(): Promise<TeacherFeedbackItem[]> {
  try {
    const user = await requireUser();
    return await getStudentFeedbacks(user.id);
  } catch (err) {
    console.error("getMyTeacherFeedbacks error:", err);
    return [];
  }
}
