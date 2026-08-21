ALTER TABLE "chat_session" ALTER COLUMN "model" SET DATA TYPE varchar(48);--> statement-breakpoint
ALTER TABLE "chat_session" ALTER COLUMN "model" SET DEFAULT 'gemini-2.0-flash-thinking-exp';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;