import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { posts } from "@/server/db/schema";
import { users } from "@/server/db/auth-schema";

/**
 * Server-component read used for page metadata. Forum posts are public, so this
 * deliberately skips the session lookup.
 */
export const getPostMeta = async (postId: string) => {
  const [row] = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      imageUrl: posts.imageUrl,
      authorName: users.name,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(and(eq(posts.id, postId), eq(posts.hidden, false)))
    .limit(1);

  return row ?? null;
};
