CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "plan_key" text NOT NULL,
  "plan_version" integer DEFAULT 1 NOT NULL,
  "status" text NOT NULL,
  "source" text DEFAULT 'pilot' NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "accepted_terms_version" text NOT NULL,
  "accepted_at" timestamptz NOT NULL,
  "cancelled_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "subscriptions_status_check" CHECK ("status" IN ('active', 'cancelled', 'expired')),
  CONSTRAINT "subscriptions_source_check" CHECK ("source" IN ('pilot', 'admin')),
  CONSTRAINT "subscriptions_valid_period_check" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_user_created_idx" ON "subscriptions" ("user_id", "created_at" DESC);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_one_active_per_user_idx" ON "subscriptions" ("user_id") WHERE "status" = 'active';
