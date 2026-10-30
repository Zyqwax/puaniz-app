"use server";

import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/server/db";
import { comments, postLikes, postTags, posts } from "@/server/db/schema";
import { users } from "@/server/db/auth-schema";
import { requireUser, getSession } from "@/server/session";
import { toMessage } from "@/server/errors";

const POSTS_LIMIT = 20;

export interface PostView {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  title: string;
  text: string;
  imageUrl: string | null;
  tags: string[];
  likes: string[];
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  createdAt: string;
  canEdit: boolean;
}

export interface CommentView {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  text: string;
  replyToId: string | null;
  replyToUserId: string | null;
  replyToUser: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
}

const likesCountSql = sql<number>`(
  select count(*)::int from ${postLikes} where ${postLikes.postId} = ${posts.id}
)`;

const commentsCountSql = sql<number>`(
  select count(*)::int from ${comments} where ${comments.postId} = ${posts.id}
)`;

const tagsSql = sql<string[]>`coalesce((
  select array_agg(${postTags.tag}) from ${postTags} where ${postTags.postId} = ${posts.id}
), '{}')`;

const likedByMeSql = (userId: string | null) =>
  userId
    ? sql<boolean>`(
        select exists(
          select 1 from ${postLikes}
          where ${postLikes.postId} = ${posts.id} and ${postLikes.userId} = ${userId}
        )
      )`
    : sql<boolean>`false`;

const postSelection = (userId: string | null) => ({
  id: posts.id,
  userId: posts.userId,
  authorName: users.name,
  authorImage: users.image,
  title: posts.title,
  body: posts.body,
  imageUrl: posts.imageUrl,
  createdAt: posts.createdAt,
  likesCount: likesCountSql,
  commentsCount: commentsCountSql,
  tags: tagsSql,
  likedByMe: likedByMeSql(userId),
});

type PostRow = {
  id: string;
  userId: string;
  authorName: string;
  authorImage: string | null;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  likedByMe: boolean;
};

const toPostView = (row: PostRow, viewerId: string | null): PostView => ({
  id: row.id,
  userId: row.userId,
  userName: row.authorName,
  userPhoto: row.authorImage,
  title: row.title,
  text: row.body,
  imageUrl: row.imageUrl,
  tags: row.tags ?? [],
  likes: [],
  likesCount: row.likesCount,
  likedByMe: row.likedByMe,
  commentsCount: row.commentsCount,
  createdAt: row.createdAt.toISOString(),
  canEdit: viewerId === row.userId,
});

const extractHashtags = (text: string) =>
  (text.match(/#[a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g) ?? []).map((tag) => tag.replace("#", ""));

/**
 * The image is uploaded to Cloudinary from the browser (client-side resize +
 * unsigned preset). The resulting URL is passed in here.
 */
export const createPost = async (
  title: string,
  text: string,
  imageUrl: string | null,
  tags: string[] = [],
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const user = await requireUser();

    const allTags = [...new Set([...tags, ...extractHashtags(text)])].filter(Boolean);

    const newId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(posts)
        .values({ userId: user.id, title, body: text, imageUrl })
        .returning({ id: posts.id });

      if (allTags.length > 0) {
        await tx
          .insert(postTags)
          .values(allTags.map((tag) => ({ postId: row.id, tag })))
          .onConflictDoNothing();
      }

      return row.id;
    });

    return { success: true, id: newId };
  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error: toMessage(error) };
  }
};

export const getPosts = async (tag?: string | null): Promise<PostView[]> => {
  const session = await getSession();
  const viewerId = session?.user.id ?? null;

  const selection = postSelection(viewerId);

  const rows = tag
    ? await db
        .select(selection)
        .from(posts)
        .innerJoin(users, eq(users.id, posts.userId))
        .innerJoin(postTags, eq(postTags.postId, posts.id))
        .where(eq(postTags.tag, tag))
        .orderBy(desc(posts.createdAt))
        .limit(POSTS_LIMIT)
    : await db
        .select(selection)
        .from(posts)
        .innerJoin(users, eq(users.id, posts.userId))
        .orderBy(desc(posts.createdAt))
        .limit(POSTS_LIMIT);

  return rows.map((row) => toPostView(row, viewerId));
};

export const getPost = async (postId: string): Promise<PostView | null> => {
  const session = await getSession();
  const viewerId = session?.user.id ?? null;

  const [row] = await db
    .select(postSelection(viewerId))
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(eq(posts.id, postId))
    .limit(1);

  if (!row) return null;

  return toPostView(row, viewerId);
};

export const deletePost = async (postId: string): Promise<{ success: boolean }> => {
  const user = await requireUser();
  await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.userId, user.id)));
  return { success: true };
};

export const toggleLike = async (
  postId: string,
  isLiked: boolean,
): Promise<{ success: boolean; likesCount?: number }> => {
  try {
    const user = await requireUser();

    if (isLiked) {
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)));
    } else {
      await db
        .insert(postLikes)
        .values({ postId, userId: user.id })
        .onConflictDoNothing();
    }

    const [row] = await db
      .select({ value: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    return { success: true, likesCount: Number(row?.value ?? 0) };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false };
  }
};

const commentSelection = () => {
  const replyParent = alias(comments, "reply_parent");
  const replyAuthor = alias(users, "reply_author");
  return {
    id: comments.id,
    postId: comments.postId,
    userId: comments.userId,
    authorName: users.name,
    authorImage: users.image,
    body: comments.body,
    replyToId: comments.replyToId,
    replyToUserId: replyParent.userId,
    isEdited: comments.isEdited,
    createdAt: comments.createdAt,
    updatedAt: comments.updatedAt,
    replyToUserName: replyAuthor.name,
  };
};

type CommentRow = {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorImage: string | null;
  body: string;
  replyToId: string | null;
  replyToUserId: string | null;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  replyToUserName: string | null;
};

const toCommentView = (row: CommentRow, viewerId: string | null): CommentView => ({
  id: row.id,
  postId: row.postId,
  userId: row.userId,
  userName: row.authorName,
  userPhoto: row.authorImage,
  text: row.body,
  replyToId: row.replyToId,
  replyToUserId: row.replyToUserId,
  replyToUser: row.replyToUserName,
  isEdited: row.isEdited,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  canEdit: viewerId === row.userId,
});

export const getComments = async (postId: string): Promise<CommentView[]> => {
  const session = await getSession();
  const viewerId = session?.user.id ?? null;
  const replyParent = alias(comments, "reply_parent");
  const replyAuthor = alias(users, "reply_author");

  const rows = await db
    .select(commentSelection())
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .leftJoin(replyParent, eq(replyParent.id, comments.replyToId))
    .leftJoin(replyAuthor, eq(replyAuthor.id, replyParent.userId))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));

  return rows.map((row) => toCommentView(row, viewerId));
};

/** One round trip for the post plus its comment thread. */
export const getPostWithComments = async (postId: string) => {
  const [post, postComments] = await Promise.all([getPost(postId), getComments(postId)]);
  if (!post) return null;
  return { ...post, comments: postComments };
};

export const addComment = async (
  postId: string,
  text: string,
  replyToId: string | null = null,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await requireUser();
    await db.insert(comments).values({
      postId,
      userId: user.id,
      body: text,
      replyToId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: toMessage(error) };
  }
};

export const editComment = async (
  commentId: string,
  newText: string,
): Promise<{ success: boolean }> => {
  const user = await requireUser();
  await db
    .update(comments)
    .set({ body: newText, isEdited: true })
    .where(and(eq(comments.id, commentId), eq(comments.userId, user.id)));
  return { success: true };
};

export const deleteComment = async (
  commentId: string,
): Promise<{ success: boolean }> => {
  const user = await requireUser();
  await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.userId, user.id)));
  return { success: true };
};
