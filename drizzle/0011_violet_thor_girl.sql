CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"project_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"visit_date" date,
	"visit_time" time,
	"visit_datetime" timestamp,
	"inquiry_date" date,
	"inquiry_time" time,
	"inquiry_datetime" timestamp NOT NULL,
	"theme" text,
	"phone" text,
	"email" text,
	"region" text,
	"manager_id" text,
	"reply_date" date,
	"reply_time" time,
	"reply_datetime" timestamp,
	"project_status" text DEFAULT '跟进' NOT NULL,
	"project_amount" numeric,
	"over_3_days" boolean,
	"duration_hours" numeric,
	"interval_hours" numeric,
	"notification_time" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_project_number_unique" UNIQUE("project_number")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;