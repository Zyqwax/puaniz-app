import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { generateWelcomeMessage } from "./aiService";
import { updateUserWelcomeMessage } from "./userService";
import { ExamRecord } from "@/types";

const EXAMS_COLLECTION = "exams";

export const addExam = async (
  userId: string,
  examData: Omit<ExamRecord, "id" | "createdAt" | "userId">
): Promise<{ success: boolean; id?: string; error?: any }> => {
  try {
    const docRef = await addDoc(collection(db, EXAMS_COLLECTION), {
      userId,
      ...examData,
      createdAt: serverTimestamp(),
    });

    getUserExams(userId).then(async (exams) => {
      if (exams.length > 0) {
        const recentExams = exams.slice(0, 3).map((e) => ({
          date: e.date,
          net: e.totalNet,
          type: e.type,
        }));
        try {
          const message = await generateWelcomeMessage(recentExams);
          await updateUserWelcomeMessage(userId, message);
        } catch (err) {
          console.error("Failed to update welcome message:", err);
        }
      }
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding exam: ", error);
    return { success: false, error };
  }
};

export const updateExam = async (
  examId: string,
  updatedData: Partial<ExamRecord>
): Promise<{ success: boolean; error?: any }> => {
  try {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(docRef, updatedData as any);
    return { success: true };
  } catch (error) {
    console.error("Error updating exam: ", error);
    return { success: false, error };
  }
};

export const getUserExams = async (userId: string): Promise<ExamRecord[]> => {
  try {
    const q = query(collection(db, EXAMS_COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const exams = querySnapshot.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    })) as ExamRecord[];

    return exams.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error getting exams: ", error);
    return [];
  }
};

export const calculateNet = (correct: number, incorrect: number): number => {
  return correct - incorrect / 4;
};

export const deleteExam = async (
  examId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting exam: ", error);
    return { success: false, error };
  }
};
