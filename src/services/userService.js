import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Generic User Profile Functions
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return { goals: { tyt: 0, ayt: 0 }, welcomeMessage: null };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, "users", userId);
    // Remove undefined fields to avoid errors
    const cleanData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await setDoc(userRef, cleanData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error };
  }
};

// Backwards compatibility / Specific helpers
export const getUserGoals = async (userId) => {
  const profile = await getUserProfile(userId);
  return profile?.goals || { tyt: 0, ayt: 0 };
};

export const updateUserGoals = async (userId, goals) => {
  return updateUserProfile(userId, { goals });
};

export const updateUserWelcomeMessage = async (userId, message) => {
  return updateUserProfile(userId, { welcomeMessage: message });
};
