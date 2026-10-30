import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/server/db";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/server/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      void sendPasswordResetEmail({ to: user.email, url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendVerificationEmail({ to: user.email, url });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    deleteUser: { enabled: true },
  },
  // `nextCookies` must stay last so cookies set from server actions reach the
  // client.
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
