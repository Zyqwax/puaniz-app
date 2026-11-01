ALTER TABLE "school_subscriptions" DROP CONSTRAINT IF EXISTS "school_subscriptions_status_check";
--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_status_check" CHECK ("status" IN ('pending', 'active', 'cancelled', 'expired', 'suspended'));
--> statement-breakpoint
ALTER TABLE "school_subscriptions" DROP CONSTRAINT IF EXISTS "school_subscriptions_source_check";
--> statement-breakpoint
ALTER TABLE "school_subscriptions" ADD CONSTRAINT "school_subscriptions_source_check" CHECK ("source" IN ('manual', 'contract', 'demo'));
