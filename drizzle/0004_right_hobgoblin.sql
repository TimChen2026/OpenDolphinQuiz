CREATE TABLE "generation_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(16) NOT NULL,
	"prompt" text NOT NULL,
	"image_url" text,
	"result_url" text,
	"task_id" text,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"metadata" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_history" ADD CONSTRAINT "generation_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;