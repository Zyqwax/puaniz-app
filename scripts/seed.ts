/**
 * Dev seed: creates a verified test account so the email-verification gate can
 * be bypassed locally. Login still goes through Better Auth, so this account
 * has no password — use the register flow for a usable login.
 *
 * Run with: pnpm db:seed
 */
process.loadEnvFile?.(".env.local");

const { default: postgres } = await import("postgres");

const SEED_EMAIL = process.env.SEED_EMAIL ?? "test@test.com";

const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });

const main = async () => {
  const existing = await sql<{ id: string; email: string }[]>`
    select id, email from users where email = ${SEED_EMAIL} limit 1
  `;

  if (existing.length > 0) {
    console.log(`Seed user already exists: ${existing[0].id} (${existing[0].email})`);
    return;
  }

  const id = crypto.randomUUID();
  const avatar =
    "https://ui-avatars.com/api/?name=Test+Kullanici&background=2F6BFF&color=fff&bold=true";

  await sql`
    insert into users (id, name, email, email_verified, image, created_at, updated_at)
    values (${id}, ${"Test Kullanıcı"}, ${SEED_EMAIL}, true, ${avatar}, now(), now())
  `;

  console.log(`Created seed user: ${id} (${SEED_EMAIL})`);
};

try {
  await main();
} finally {
  await sql.end();
}

export {};
