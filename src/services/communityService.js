import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadPostImage } from "./cloudinaryService";

// ...

const POSTS_COLLECTION = "posts";

export const createPost = async (title, text, imageFile, tags = [], user) => {
  let imageUrl = null;

  if (imageFile) {
    imageUrl = await uploadPostImage(imageFile);
  }

  // Combine selected tags with any hashtags found in text (optional, but good for completeness)
  // For now, let's rely on the passed 'tags' array as the primary source of truth for filtering
  // parse hashtags from text and remove #:
  const textTags = (text.match(/#[a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g) || []).map((t) =>
    t.replace("#", ""),
  );
  const allTags = [...new Set([...tags, ...textTags])];

  const postData = {
    userId: user.uid,
    userName: user.displayName || user.email.split("@")[0],
    userPhoto: user.photoURL,
    title,
    text,
    imageUrl,
    likes: [],
    commentsCount: 0,
    tags: allTags,
    createdAt: serverTimestamp(),
  };

  return await addDoc(collection(db, POSTS_COLLECTION), postData);
};

/**
 * Fetches posts with pagination
 * @param {string} tag - Optional hashtag to filter by
 * @returns {Promise<Array>}
 */
export const getPosts = async (tag = null) => {
  let q;

  if (tag) {
    // Note: Using where + orderBy usually requires a composite index in Firestore.
    // To avoid "everything returned" (due to failed query caught silently) or index errors for now,
    // we will sort client-side for filtered results.
    q = query(
      collection(db, POSTS_COLLECTION),
      where("tags", "array-contains", tag),
      limit(20),
    );
  } else {
    q = query(
      collection(db, POSTS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(20),
    );
  }

  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Client-side sort if filtered by tag (since we removed orderBy there)
  if (tag) {
    docs.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }

  return docs;
};

/**
 * Gets a single post by ID
 * @param {string} postId
 * @returns {Promise<object>}
 */
export const getPost = async (postId) => {
  const docRef = doc(db, POSTS_COLLECTION, postId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error("Post not found");
  }
};

/**
 * Toggles like on a post
 * @param {string} postId
 * @param {string} userId
 * @param {boolean} isLiked
 */
export const toggleLike = async (postId, userId, isLiked) => {
  const postRef = doc(db, POSTS_COLLECTION, postId);

  if (isLiked) {
    await updateDoc(postRef, {
      likes: arrayRemove(userId),
    });
  } else {
    await updateDoc(postRef, {
      likes: arrayUnion(userId),
    });
  }
};

/**
 * Adds a comment to a post
 * @param {string} postId
 * @param {string} text
 * @param {object} user
 * @param {string|null} replyToId
 * @param {string|null} replyToUser
 */
export const addComment = async (
  postId,
  text,
  user,
  replyToId = null,
  replyToUser = null,
) => {
  const commentsRef = collection(db, POSTS_COLLECTION, postId, "comments");
  const postRef = doc(db, POSTS_COLLECTION, postId);

  // Add comment
  await addDoc(commentsRef, {
    userId: user.uid,
    userName: user.displayName || user.email.split("@")[0],
    userPhoto: user.photoURL,
    text,
    replyToId,
    replyToUser,
    createdAt: serverTimestamp(),
  });

  // Increment comment count on post
  // Note: For precise counting, transactions or cloud functions are better,
  // but this is sufficient for a simple app.
  const postSnap = await getDoc(postRef);
  const currentCount = postSnap.data().commentsCount || 0;

  await updateDoc(postRef, {
    commentsCount: currentCount + 1,
  });
};

/**
 * Deletes a post
 * @param {string} postId
 */
export const deletePost = async (postId) => {
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
};

/**
 * Deletes a comment
 * @param {string} postId
 * @param {string} commentId
 */
export const deleteComment = async (postId, commentId) => {
  const postRef = doc(db, POSTS_COLLECTION, postId);

  // Delete comment
  await deleteDoc(doc(db, POSTS_COLLECTION, postId, "comments", commentId));

  // Decrement comment count on post
  const postSnap = await getDoc(postRef);
  const currentCount = postSnap.data()?.commentsCount || 1;

  await updateDoc(postRef, {
    commentsCount: Math.max(0, currentCount - 1),
  });
};

/**
 * Edits a comment
 * @param {string} postId
 * @param {string} commentId
 * @param {string} newText
 */
export const editComment = async (postId, commentId, newText) => {
  const commentRef = doc(db, POSTS_COLLECTION, postId, "comments", commentId);
  await updateDoc(commentRef, {
    text: newText,
    isEdited: true,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Gets comments for a post
 * @param {string} postId
 * @returns {Promise<Array>}
 */
export const getComments = async (postId) => {
  const q = query(
    collection(db, POSTS_COLLECTION, postId, "comments"),
    orderBy("createdAt", "asc"), // Oldest first
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
