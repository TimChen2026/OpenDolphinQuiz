CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_name_unique" UNIQUE("name")
);--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_member_team_user_unique" UNIQUE("team_id","user_id")
);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "account_type" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
