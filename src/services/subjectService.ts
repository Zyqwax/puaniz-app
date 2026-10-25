import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface TopicTrackingItem {
  completed?: boolean;
  questionCount?: number;
  repeatCount?: number;
  lastStudied?: string | null;
}

export const getTopicTracking = async (
  userId: string
): Promise<Record<string, TopicTrackingItem>> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return {};

    const data = docSnap.data();

    if (data.topicTracking) {
      return data.topicTracking;
    }

    if (data.completedTopics) {
      const migrated: Record<string, TopicTrackingItem> = {};
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

      await setDoc(docRef, { topicTracking: migrated }, { merge: true });
      return migrated;
    }

    return {};
  } catch (error) {
    console.error("Error getting topic tracking:", error);
    return {};
  }
};

export const updateTopicData = async (
  userId: string,
  topicKey: string,
  data: Partial<TopicTrackingItem>
): Promise<{ success: boolean; error?: any }> => {
  try {
    const docRef = doc(db, "users", userId);
    const topicUpdate: TopicTrackingItem = {};

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
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating topic data:", error);
    return { success: false, error };
  }
};

export const incrementRepeat = async (
  userId: string,
  topicKey: string,
  currentCount: number
): Promise<{ success: boolean; newCount?: number; error?: any }> => {
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
      { merge: true }
    );
    return { success: true, newCount };
  } catch (error) {
    console.error("Error incrementing repeat:", error);
    return { success: false, error };
  }
};

export const updateQuestionCount = async (
  userId: string,
  topicKey: string,
  count: number
): Promise<{ success: boolean; error?: any }> => {
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
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating question count:", error);
    return { success: false, error };
  }
};

export const bulkUpdateTopics = async (
  userId: string,
  topicKeys: string[],
  isCompleted: boolean
): Promise<{ success: boolean; error?: any }> => {
  try {
    const docRef = doc(db, "users", userId);
    const topicTrackingUpdate: Record<string, TopicTrackingItem> = {};
    topicKeys.forEach((key) => {
      if (isCompleted) {
        topicTrackingUpdate[key] = {
          completed: true,
          lastStudied: new Date().toISOString(),
        };
      } else {
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
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error bulk updating topics:", error);
    return { success: false, error };
  }
};
