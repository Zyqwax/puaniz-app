/**
 * Dev seed: creates a verified test account so the email-verification gate can
 * be bypassed locally. Login still goes through Better Auth, so this account
 * has no password — use the register flow for a usable login.
 *
 * Run with: pnpm db:seed
 */
process.loadEnvFile?.(".env.local");

const { default: postgres } = await import("postgres");
const { hashPassword } = await import("better-auth/crypto");

const SEED_EMAIL = process.env.SEED_EMAIL ?? "test@test.com";
const SEED_PASSWORD = process.env.SEED_PASSWORD;
if (!SEED_PASSWORD) throw new Error("SEED_PASSWORD ortam değişkeni tanımlanmalıdır.");

const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });

const main = async () => {
  const existing = await sql<{ id: string; email: string }[]>`
    select id, email from users where email = ${SEED_EMAIL} limit 1
  `;

  const hashedPassword = await hashPassword(SEED_PASSWORD);

  if (existing.length > 0) {
    const userId = existing[0].id;
    const existingAccount = await sql`
      select id from accounts where user_id = ${userId} and provider_id = 'credential' limit 1
    `;

    if (existingAccount.length === 0) {
      await sql`
        insert into accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
        values (${crypto.randomUUID()}, ${userId}, 'credential', ${userId}, ${hashedPassword}, now(), now())
      `;
      console.log(`Set password for existing seed user: ${SEED_EMAIL}`);
    } else {
      await sql`
        update accounts set password = ${hashedPassword}, updated_at = now()
        where user_id = ${userId} and provider_id = 'credential'
      `;
      console.log(`Updated password for existing seed user: ${SEED_EMAIL}`);
    }
    return;
  }

  const id = crypto.randomUUID();
  const avatar =
    "https://ui-avatars.com/api/?name=Test+Kullanici&background=2F6BFF&color=fff&bold=true";

  await sql`
    insert into users (id, name, email, email_verified, image, created_at, updated_at)
    values (${id}, ${"Test Kullanıcı"}, ${SEED_EMAIL}, true, ${avatar}, now(), now())
  `;

  await sql`
    insert into accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
    values (${crypto.randomUUID()}, ${id}, 'credential', ${id}, ${hashedPassword}, now(), now())
  `;

  console.log(`Created seed user: ${SEED_EMAIL}`);
};

try {
  await main();
} finally {
  await sql.end();
}

export {};
