import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { UserProfile } from "@/types";

export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { uid: userId, ...docSnap.data() } as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<UserProfile> & Record<string, any>
): Promise<{ success: boolean; error?: any }> => {
  try {
    const userRef = doc(db, "users", userId);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    await setDoc(userRef, cleanData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error };
  }
};

export const getUserGoals = async (
  userId: string
): Promise<{ tyt: number; ayt: number }> => {
  const profile: any = await getUserProfile(userId);
  return profile?.goals || { tyt: 0, ayt: 0 };
};

export const updateUserGoals = async (
  userId: string,
  goals: { tyt: number; ayt: number }
) => {
  return updateUserProfile(userId, { goals });
};

export const updateUserWelcomeMessage = async (
  userId: string,
  message: string
) => {
  return updateUserProfile(userId, { welcomeMessage: message });
};

export const deleteUserAccountData = async (
  userId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const batch = writeBatch(db);

    const userRef = doc(db, "users", userId);
    batch.delete(userRef);

    const examsQuery = query(
      collection(db, "exams"),
      where("userId", "==", userId)
    );
    const examsSnap = await getDocs(examsQuery);
    examsSnap.docs.forEach((d: any) => batch.delete(d.ref));

    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", userId)
    );
    const postsSnap = await getDocs(postsQuery);
    postsSnap.docs.forEach((d: any) => batch.delete(d.ref));

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error deleting user account data:", error);
    return { success: false, error };
  }
};
