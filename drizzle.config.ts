import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read Next.js env files; load `.env.local` manually.
process.loadEnvFile?.(".env.local");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (expected in .env.local)");
}

export default defineConfig({
  schema: ["./src/server/db/auth-schema.ts", "./src/server/db/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
