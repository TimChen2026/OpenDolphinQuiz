CREATE TABLE "quiz_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"node_id" text NOT NULL,
	"option_label" text NOT NULL,
	"option_text" text NOT NULL,
	"target_node_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"result_theme" text,
	"result_manager_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"parent_id" text,
	"level" text NOT NULL,
	"question" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"result_theme" text,
	"result_manager_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tenant_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_edges" ADD CONSTRAINT "quiz_edges_node_id_quiz_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."quiz_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_nodes" ADD CONSTRAINT "quiz_nodes_template_id_quiz_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."quiz_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_templates" ADD CONSTRAINT "quiz_templates_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;