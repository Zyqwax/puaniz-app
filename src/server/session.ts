import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

/**
 * Read the current Better Auth session.
 *
 * `cache` dedupes the lookup within a single React render pass; server actions
 * and route handlers each run fresh, which is what we want there.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export type SessionUser = {
  id: string;
  uid: string;
  email: string;
  name: string;
  displayName: string;
  image: string | null;
  photoURL: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
};

/** Session user in the shape the UI already expects (Firebase-ish aliases). */
export const toSessionUser = (
  user: { id: string; email: string; name: string; image?: string | null; emailVerified: boolean },
): SessionUser => ({
  id: user.id,
  uid: user.id,
  email: user.email,
  name: user.name,
  displayName: user.name,
  image: user.image ?? null,
  photoURL: user.image ?? null,
  avatarUrl: user.image ?? null,
  emailVerified: user.emailVerified,
});

/**
 * Server-side authorization gate. Every server action and protected page calls
 * this — the client can never supply a user id.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (!session.user.emailVerified) redirect("/auth");
  return toSessionUser(session.user);
}
