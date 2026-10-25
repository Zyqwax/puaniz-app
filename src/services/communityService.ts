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
  DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadPostImage } from "./cloudinaryService";

const POSTS_COLLECTION = "posts";

export const createPost = async (
  title: string,
  text: string,
  imageFile: File | null,
  tags: string[] = [],
  user: any
): Promise<DocumentReference> => {
  let imageUrl: string | null = null;

  if (imageFile) {
    imageUrl = await uploadPostImage(imageFile);
  }

  const textTags = (text.match(/#[a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g) || []).map((t) =>
    t.replace("#", "")
  );
  const allTags = [...new Set([...tags, ...textTags])];

  const postData = {
    userId: user.uid,
    userName: user.displayName || user.email.split("@")[0],
    userPhoto: user.photoURL || null,
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

export const getPosts = async (tag: string | null = null): Promise<any[]> => {
  let q;

  if (tag) {
    q = query(
      collection(db, POSTS_COLLECTION),
      where("tags", "array-contains", tag),
      limit(20)
    );
  } else {
    q = query(
      collection(db, POSTS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }

  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs.map((d: any) => ({
    id: d.id,
    ...d.data(),
  }));

  if (tag) {
    docs.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }

  return docs;
};

export const getPost = async (postId: string): Promise<any> => {
  const docRef = doc(db, POSTS_COLLECTION, postId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error("Post not found");
  }
};

export const toggleLike = async (
  postId: string,
  userId: string,
  isLiked: boolean
): Promise<void> => {
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

export const addComment = async (
  postId: string,
  text: string,
  user: any,
  replyToId: string | null = null,
  replyToUser: string | null = null
): Promise<void> => {
  const commentsRef = collection(db, POSTS_COLLECTION, postId, "comments");
  const postRef = doc(db, POSTS_COLLECTION, postId);

  await addDoc(commentsRef, {
    userId: user.uid,
    userName: user.displayName || user.email.split("@")[0],
    userPhoto: user.photoURL || null,
    text,
    replyToId,
    replyToUser,
    createdAt: serverTimestamp(),
  });

  const postSnap = await getDoc(postRef);
  const currentCount = postSnap.data()?.commentsCount || 0;

  await updateDoc(postRef, {
    commentsCount: currentCount + 1,
  });
};

export const deletePost = async (postId: string): Promise<void> => {
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
};

export const deleteComment = async (
  postId: string,
  commentId: string
): Promise<void> => {
  const postRef = doc(db, POSTS_COLLECTION, postId);

  await deleteDoc(doc(db, POSTS_COLLECTION, postId, "comments", commentId));

  const postSnap = await getDoc(postRef);
  const currentCount = postSnap.data()?.commentsCount || 1;

  await updateDoc(postRef, {
    commentsCount: Math.max(0, currentCount - 1),
  });
};

export const editComment = async (
  postId: string,
  commentId: string,
  newText: string
): Promise<void> => {
  const commentRef = doc(db, POSTS_COLLECTION, postId, "comments", commentId);
  await updateDoc(commentRef, {
    text: newText,
    isEdited: true,
    updatedAt: serverTimestamp(),
  });
};

export const getComments = async (postId: string): Promise<any[]> => {
  const q = query(
    collection(db, POSTS_COLLECTION, postId, "comments"),
    orderBy("createdAt", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d: any) => ({
    id: d.id,
    ...d.data(),
  }));
};
