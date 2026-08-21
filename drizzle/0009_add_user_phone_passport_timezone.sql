ALTER TABLE "user" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "passport_status" text DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "passport_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "passport_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "timezone" text;
