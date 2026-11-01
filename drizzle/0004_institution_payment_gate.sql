ALTER TABLE "school_subscriptions" DROP CONSTRAINT IF EXISTS "school_subscriptions_status_check";
--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_status_check" CHECK ("status" IN ('pending', 'awaiting_payment', 'active', 'cancelled', 'expired', 'suspended'));
--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD COLUMN IF NOT EXISTS "amount_kurus" integer;
--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD COLUMN IF NOT EXISTS "payment_reference" text;
--> statement-breakpoint
UPDATE "school_subscriptions"
SET "status" = 'awaiting_payment'
WHERE "status" = 'active' AND "source" <> 'demo' AND "paid_at" IS NULL;
