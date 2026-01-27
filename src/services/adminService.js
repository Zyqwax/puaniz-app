import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const USERS_COLLECTION = "users";
const EXAMS_COLLECTION = "exams";
const POSTS_COLLECTION = "posts";

/**
 * Get admin statistics overview
 * @returns {Promise<object>} Stats object with counts
 */
export const getAdminStats = async () => {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const totalUsers = usersSnapshot.size;

    // Get all exams
    const examsSnapshot = await getDocs(collection(db, EXAMS_COLLECTION));
    const totalExams = examsSnapshot.size;

    // Get unique users who uploaded exams
    const usersWithExams = new Set();
    examsSnapshot.docs.forEach((doc) => {
      usersWithExams.add(doc.data().userId);
    });

    // Get all posts
    const postsSnapshot = await getDocs(collection(db, POSTS_COLLECTION));
    const totalPosts = postsSnapshot.size;

    return {
      totalUsers,
      totalExams,
      usersWithExams: usersWithExams.size,
      totalPosts,
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    return {
      totalUsers: 0,
      totalExams: 0,
      usersWithExams: 0,
      totalPosts: 0,
    };
  }
};

/**
 * Get all users with their details
 * @returns {Promise<Array>} Array of user objects
 */
export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
};

/**
 * Get user exam statistics (exam count and last exam date per user)
 * @returns {Promise<object>} Object with userId as key, {examCount, lastExamDate} as value
 */
export const getUserExamStats = async () => {
  try {
    const examsSnapshot = await getDocs(collection(db, EXAMS_COLLECTION));

    const userStats = {};

    examsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId;
      const createdAt = data.createdAt?.toDate?.() || data.createdAt;

      if (!userStats[userId]) {
        userStats[userId] = {
          examCount: 0,
          lastExamDate: null,
        };
      }

      userStats[userId].examCount++;

      // Update last exam date if this one is newer
      if (createdAt) {
        if (!userStats[userId].lastExamDate || createdAt > userStats[userId].lastExamDate) {
          userStats[userId].lastExamDate = createdAt;
        }
      }
    });

    return userStats;
  } catch (error) {
    console.error("Error getting user exam stats:", error);
    return {};
  }
};

/**
 * Get all exams with details
 * @returns {Promise<Array>} Array of exam objects
 */
export const getAllExams = async () => {
  try {
    const examsSnapshot = await getDocs(collection(db, EXAMS_COLLECTION));
    return examsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all exams:", error);
    return [];
  }
};
