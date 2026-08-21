CREATE TABLE "subscription_credit_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"user_id" text NOT NULL,
	"plan_key" varchar(64) NOT NULL,
	"credits_per_grant" integer NOT NULL,
	"interval_months" integer NOT NULL,
	"grants_remaining" integer NOT NULL,
	"total_credits_remaining" integer NOT NULL,
	"next_grant_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_credit_schedule_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
ALTER TABLE "subscription_credit_schedule" ADD CONSTRAINT "subscription_credit_schedule_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_credit_schedule" ADD CONSTRAINT "subscription_credit_schedule_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_credit_schedule_next_grant_idx" ON "subscription_credit_schedule" USING btree ("next_grant_at");