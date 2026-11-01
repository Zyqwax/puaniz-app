"use server";

import { eq, desc, and } from "drizzle-orm";
import { db } from "@/server/db";
import { studySessions, exams } from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { toMessage } from "@/server/errors";
import type { StudySessionItem, StudyStats } from "@/types";

export interface LogStudyInput {
  subject: string;
  durationMinutes: number;
  questionCount?: number;
  notes?: string;
  date?: string;
}

export async function logStudySession(
  input: LogStudyInput,
): Promise<{ success: boolean; session?: StudySessionItem; error?: string }> {
  try {
    const user = await requireUser();
    const cleanSubject = input.subject?.trim();
    if (!cleanSubject) {
      return { success: false, error: "Ders seçimi zorunludur." };
    }

    const duration = Math.max(1, Math.min(720, Math.round(Number(input.durationMinutes) || 25)));
    const questions = Math.max(0, Math.round(Number(input.questionCount) || 0));
    const studyDate = input.date?.trim() || new Date().toISOString().split("T")[0];

    const [created] = await db
      .insert(studySessions)
      .values({
        userId: user.id,
        subject: cleanSubject,
        durationMinutes: duration,
        questionCount: questions,
        notes: input.notes?.trim() || null,
        date: studyDate,
      })
      .returning();

    return {
      success: true,
      session: {
        id: created.id,
        userId: created.userId,
        subject: created.subject,
        durationMinutes: created.durationMinutes,
        questionCount: created.questionCount,
        notes: created.notes,
        date: created.date,
        createdAt: created.createdAt,
      },
    };
  } catch (err) {
    console.error("logStudySession error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function getMyStudyStats(): Promise<StudyStats> {
  try {
    const user = await requireUser();
    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch user's study sessions
    const sessions = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, user.id))
      .orderBy(desc(studySessions.createdAt))
      .limit(50);

    let todayMinutes = 0;
    let todayQuestions = 0;
    let totalMinutes = 0;
    let totalQuestions = 0;

    const activityDates = new Set<string>();

    for (const s of sessions) {
      totalMinutes += s.durationMinutes;
      totalQuestions += s.questionCount;
      activityDates.add(s.date);

      if (s.date === todayStr) {
        todayMinutes += s.durationMinutes;
        todayQuestions += s.questionCount;
      }
    }

    // Also factor in exam dates into activity streak
    const userExams = await db
      .select({ date: exams.date })
      .from(exams)
      .where(eq(exams.userId, user.id))
      .orderBy(desc(exams.date))
      .limit(30);

    for (const e of userExams) {
      if (e.date) activityDates.add(e.date);
    }

    // Calculate streak
    let currentStreak = 0;
    const checkDate = new Date();

    const todayFormatted = checkDate.toISOString().split("T")[0];
    const workedToday = activityDates.has(todayFormatted);

    if (!workedToday) {
      // Check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayFormatted = checkDate.toISOString().split("T")[0];
      if (activityDates.has(yesterdayFormatted)) {
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
        while (activityDates.has(checkDate.toISOString().split("T")[0])) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    } else {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
      while (activityDates.has(checkDate.toISOString().split("T")[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    return {
      todayMinutes,
      todayQuestions,
      totalMinutes,
      totalQuestions,
      currentStreak,
      recentSessions: sessions.slice(0, 5).map((s) => ({
        id: s.id,
        userId: s.userId,
        subject: s.subject,
        durationMinutes: s.durationMinutes,
        questionCount: s.questionCount,
        notes: s.notes,
        date: s.date,
        createdAt: s.createdAt,
      })),
    };
  } catch (err) {
    console.error("getMyStudyStats error:", err);
    return {
      todayMinutes: 0,
      todayQuestions: 0,
      totalMinutes: 0,
      totalQuestions: 0,
      currentStreak: 0,
      recentSessions: [],
    };
  }
}

export async function deleteStudySession(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    await db
      .delete(studySessions)
      .where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, user.id)));
    return { success: true };
  } catch (err) {
    return { success: false, error: toMessage(err) };
  }
}
