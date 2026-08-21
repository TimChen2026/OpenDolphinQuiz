CREATE TABLE "email_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"template_type" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warning_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"yellow_hours" integer DEFAULT 24 NOT NULL,
	"red_hours" integer DEFAULT 48 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warning_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warning_settings" ADD CONSTRAINT "warning_settings_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;