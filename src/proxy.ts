import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic navigation guard only — checks that a session cookie is present,
 * it does not validate it. Real authorization happens in server actions via
 * `requireUser()`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (pathname.startsWith("/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (pathname === "/auth" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webp|jpg|jpeg)$).*)",
  ],
};
