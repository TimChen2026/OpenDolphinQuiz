ALTER TABLE "projects" ALTER COLUMN "project_status" SET DEFAULT 'follow_up';--> statement-breakpoint
ALTER TABLE "quiz_edges" ADD COLUMN "is_enabled" boolean DEFAULT true NOT NULL;