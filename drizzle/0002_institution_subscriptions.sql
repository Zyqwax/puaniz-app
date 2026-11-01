CREATE TABLE IF NOT EXISTS "school_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"plan_key" text NOT NULL,
	"plan_version" integer DEFAULT 1 NOT NULL,
	"status" text NOT NULL CHECK ("status" IN ('active', 'cancelled', 'expired', 'suspended')),
	"source" text DEFAULT 'manual' NOT NULL CHECK ("source" IN ('manual', 'contract')),
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"student_limit" integer NOT NULL CHECK ("student_limit" > 0),
	"agreement_reference" text,
	"created_by" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_subscriptions_valid_period" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_subscriptions_school_created_idx" ON "school_subscriptions" USING btree ("school_id", "created_at" DESC);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "school_subscriptions_one_active_per_school_idx" ON "school_subscriptions" USING btree ("school_id") WHERE "status" = 'active';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_subscription_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"subscription_id" uuid REFERENCES "school_subscriptions"("id") ON DELETE SET NULL,
	"actor_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
	"action" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_subscription_events_school_created_idx" ON "school_subscription_events" USING btree ("school_id", "created_at" DESC);
