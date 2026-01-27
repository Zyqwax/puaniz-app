import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { generateWelcomeMessage } from "./aiService";
import { updateUserWelcomeMessage } from "./userService";

const EXAMS_COLLECTION = "exams";

export const addExam = async (userId, examData) => {
  try {
    const docRef = await addDoc(collection(db, EXAMS_COLLECTION), {
      userId,
      ...examData,
      createdAt: serverTimestamp(),
    });
    // Trigger background update for welcome message
    // We don't await this to keep UI fast, or we could if we want to ensure consistency
    getUserExams(userId).then(async (exams) => {
      if (exams.length > 0) {
        // Exams are already sorted by date desc in getUserExams
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

import { updateDoc } from "firebase/firestore";

export const updateExam = async (examId, updatedData) => {
  try {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(docRef, updatedData);
    return { success: true };
  } catch (error) {
    console.error("Error updating exam: ", error);
    return { success: false, error };
  }
};

export const getUserExams = async (userId) => {
  try {
    const q = query(collection(db, EXAMS_COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const exams = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    // Sort client-side to avoid needing a composite index immediately
    return exams.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error getting exams: ", error);
    return [];
  }
};

export const calculateNet = (correct, incorrect) => {
  return correct - incorrect / 4;
};

export const deleteExam = async (examId) => {
  try {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting exam: ", error);
    return { success: false, error };
  }
};
