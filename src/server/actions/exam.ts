"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { exams } from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { after } from "next/server";
import { generateWelcomeMessage } from "@/server/actions/ai";
import { updateUserWelcomeMessage } from "@/server/actions/profile";
import type { ExamRecord } from "@/types";
import { toMessage } from "@/server/errors";

type ExamRow = typeof exams.$inferSelect;

const toExamRecord = (row: ExamRow): ExamRecord => ({
  id: row.id,
  userId: row.userId,
  name: row.name,
  type: row.type,
  subtype: row.subtype ?? undefined,
  date: row.date,
  totalNet: Number(row.totalNet),
  scores: row.scores,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export type ExamInput = {
  name: string;
  date: string;
  type: string;
  subtype?: string;
  scores: Record<string, { d: number; y: number; net: number }>;
  totalNet: number;
};

export const addExam = async (
  examData: ExamInput,
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const user = await requireUser();

    const [row] = await db
      .insert(exams)
      .values({
        userId: user.id,
        name: examData.name,
        date: examData.date,
        type: examData.type,
        subtype: examData.subtype ?? null,
        totalNet: String(examData.totalNet),
        scores: examData.scores,
      })
      .returning({ id: exams.id });

    // Regenerate the AI welcome message in the background so the save returns fast.
    after(async () => {
      try {
        const recent = await getUserExams();
        if (recent.length === 0) return;
        const message = await generateWelcomeMessage(
          recent.slice(0, 3).map((e) => ({ date: e.date, net: e.totalNet, type: e.type })),
        );
        await updateUserWelcomeMessage(message);
      } catch (err) {
        console.error("Failed to update welcome message:", err);
      }
    });

    return { success: true, id: row.id };
  } catch (error) {
    console.error("Error adding exam:", error);
    return { success: false, error: toMessage(error) };
  }
};

export const updateExam = async (
  examId: string,
  updatedData: Partial<ExamInput>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await requireUser();

    const patch: Partial<typeof exams.$inferInsert> = {};
    if (updatedData.name !== undefined) patch.name = updatedData.name;
    if (updatedData.date !== undefined) patch.date = updatedData.date;
    if (updatedData.type !== undefined) patch.type = updatedData.type;
    if (updatedData.subtype !== undefined) patch.subtype = updatedData.subtype ?? null;
    if (updatedData.totalNet !== undefined) patch.totalNet = String(updatedData.totalNet);
    if (updatedData.scores !== undefined) patch.scores = updatedData.scores;

    const updated = await db
      .update(exams)
      .set(patch)
      .where(and(eq(exams.id, examId), eq(exams.userId, user.id)))
      .returning({ id: exams.id });

    if (updated.length === 0) {
      return { success: false, error: "Deneme bulunamadı." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating exam:", error);
    return { success: false, error: toMessage(error) };
  }
};

export const getUserExams = async (): Promise<ExamRecord[]> => {
  try {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(exams)
      .where(eq(exams.userId, user.id))
      .orderBy(desc(exams.date), desc(exams.createdAt));

    return rows.map(toExamRecord);
  } catch (error) {
    console.error("Error getting exams:", error);
    return [];
  }
};

export const deleteExam = async (
  examId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await requireUser();
    await db.delete(exams).where(and(eq(exams.id, examId), eq(exams.userId, user.id)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting exam:", error);
    return { success: false, error: toMessage(error) };
  }
};
