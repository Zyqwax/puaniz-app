import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as appSchema from "./schema";
import * as authSchema from "./auth-schema";

export const schema = { ...authSchema, ...appSchema };

export type Database = ReturnType<typeof createDb>;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { max: 10, prepare: false });
  return drizzle(client, { schema });
}

// Next.js dev server re-evaluates modules on HMR; reuse the pool instead of
// leaking a new one on every reload.
const globalForDb = globalThis as unknown as { __puanizDb?: Database };

export const db: Database = globalForDb.__puanizDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__puanizDb = db;
}
