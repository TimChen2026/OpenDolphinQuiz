CREATE TABLE "unsubscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"unsubscribed_at" timestamp DEFAULT now() NOT NULL,
	"source" text,
	"token" text,
	CONSTRAINT "unsubscribers_email_unique" UNIQUE("email")
);
