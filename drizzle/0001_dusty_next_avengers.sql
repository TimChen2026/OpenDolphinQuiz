CREATE TABLE "chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"model" varchar(32) DEFAULT 'gemini-pro' NOT NULL,
	"total_messages" integer DEFAULT 0 NOT NULL,
	"total_credits_used" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;