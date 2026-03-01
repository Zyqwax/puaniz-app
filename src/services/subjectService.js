import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Get user's topic tracking data from Firestore
 * Supports migration from old completedTopics format
 * @param {string} userId
 * @returns {Promise<Object>} - { "tyt_turkce_0": { completed, questionCount, repeatCount, lastStudied }, ... }
 */
export const getTopicTracking = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return {};

    const data = docSnap.data();

    // If new topicTracking format exists, use it
    if (data.topicTracking) {
      return data.topicTracking;
    }

    // Migrate from old completedTopics format
    if (data.completedTopics) {
      const migrated = {};
      Object.entries(data.completedTopics).forEach(([key, value]) => {
        if (value) {
          migrated[key] = {
            completed: true,
            questionCount: 0,
            repeatCount: 0,
            lastStudied: new Date().toISOString(),
          };
        }
      });

      // Save migrated data
      await setDoc(docRef, { topicTracking: migrated }, { merge: true });
      return migrated;
    }

    return {};
  } catch (error) {
    console.error("Error getting topic tracking:", error);
    return {};
  }
};

/**
 * Update a single topic's tracking data
 * @param {string} userId
 * @param {string} topicKey - e.g. "tyt_turkce_0"
 * @param {Object} data - { completed?, questionCount?, repeatCount? }
 */
export const updateTopicData = async (userId, topicKey, data) => {
  try {
    const docRef = doc(db, "users", userId);
    const topicUpdate = {};

    if (data.completed !== undefined) {
      topicUpdate.completed = data.completed;
    }
    if (data.questionCount !== undefined) {
      topicUpdate.questionCount = data.questionCount;
    }
    if (data.repeatCount !== undefined) {
      topicUpdate.repeatCount = data.repeatCount;
    }
    topicUpdate.lastStudied = new Date().toISOString();

    await setDoc(
      docRef,
      { topicTracking: { [topicKey]: topicUpdate } },
      { merge: true },
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating topic data:", error);
    return { success: false, error };
  }
};

/**
 * Increment repeat count for a topic
 * @param {string} userId
 * @param {string} topicKey
 * @param {number} currentCount
 */
export const incrementRepeat = async (userId, topicKey, currentCount) => {
  try {
    const docRef = doc(db, "users", userId);
    const newCount = currentCount + 1;
    await setDoc(
      docRef,
      {
        topicTracking: {
          [topicKey]: {
            repeatCount: newCount,
            lastStudied: new Date().toISOString(),
          },
        },
      },
      { merge: true },
    );
    return { success: true, newCount };
  } catch (error) {
    console.error("Error incrementing repeat:", error);
    return { success: false, error };
  }
};

/**
 * Update question count for a topic
 * @param {string} userId
 * @param {string} topicKey
 * @param {number} count
 */
export const updateQuestionCount = async (userId, topicKey, count) => {
  try {
    const docRef = doc(db, "users", userId);
    await setDoc(
      docRef,
      {
        topicTracking: {
          [topicKey]: {
            questionCount: count,
            lastStudied: new Date().toISOString(),
          },
        },
      },
      { merge: true },
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating question count:", error);
    return { success: false, error };
  }
};

/**
 * Bulk toggle all topics for a subject (mark all / reset all)
 * @param {string} userId
 * @param {string[]} topicKeys
 * @param {boolean} isCompleted
 */
export const bulkUpdateTopics = async (userId, topicKeys, isCompleted) => {
  try {
    const docRef = doc(db, "users", userId);
    const topicTrackingUpdate = {};
    topicKeys.forEach((key) => {
      if (isCompleted) {
        topicTrackingUpdate[key] = {
          completed: true,
          lastStudied: new Date().toISOString(),
        };
        // Note: With merge:true, writing a nested object merges keys inside.
        // So this will preserve existing questionCount and repeatCount if they exist.
      } else {
        // Reset everything
        topicTrackingUpdate[key] = {
          completed: false,
          questionCount: 0,
          repeatCount: 0,
          lastStudied: null,
        };
      }
    });
    await setDoc(
      docRef,
      { topicTracking: topicTrackingUpdate },
      { merge: true },
    );
    return { success: true };
  } catch (error) {
    console.error("Error bulk updating topics:", error);
    return { success: false, error };
  }
};

// ---- Legacy functions (backward compatibility) ----

/**
 * @deprecated Use getTopicTracking instead
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
 * @deprecated Use updateTopicData instead
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
 * @deprecated Use bulkUpdateTopics instead
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
