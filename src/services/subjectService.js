import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Get user's completed topics from Firestore
 * @param {string} userId
 * @returns {Promise<Object>} - { "tyt_turkce_0": true, ... }
 */
export const getCompletedTopics = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().completedTopics) {
      return docSnap.data().completedTopics;
    }
    return {};
  } catch (error) {
    console.error("Error getting completed topics:", error);
    return {};
  }
};

/**
 * Toggle a single topic's completed status
 * @param {string} userId
 * @param {string} topicKey - e.g. "tyt_turkce_0"
 * @param {boolean} isCompleted
 */
export const toggleTopic = async (userId, topicKey, isCompleted) => {
  try {
    const docRef = doc(db, "users", userId);
    const update = {};
    update[`completedTopics.${topicKey}`] = isCompleted;
    await setDoc(docRef, update, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error toggling topic:", error);
    return { success: false, error };
  }
};

/**
 * Bulk toggle all topics for a subject
 * @param {string} userId
 * @param {string[]} topicKeys - e.g. ["tyt_turkce_0", "tyt_turkce_1", ...]
 * @param {boolean} isCompleted
 */
export const bulkToggleTopics = async (userId, topicKeys, isCompleted) => {
  try {
    const docRef = doc(db, "users", userId);
    const update = {};
    topicKeys.forEach((key) => {
      update[`completedTopics.${key}`] = isCompleted;
    });
    await setDoc(docRef, update, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error bulk toggling topics:", error);
    return { success: false, error };
  }
};
