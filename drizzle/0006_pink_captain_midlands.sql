CREATE TABLE "password_reset_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "chat_session" ALTER COLUMN "model" SET DEFAULT 'doubao-1-5-thinking-pro-250415';--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;