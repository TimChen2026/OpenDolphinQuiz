CREATE TABLE "newsletter_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscription_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscription_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
ALTER TABLE "newsletter_subscription" ADD CONSTRAINT "newsletter_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;