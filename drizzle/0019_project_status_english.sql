-- 项目状态值英文化:存量中文数据转换为英文,默认值改为 follow_up
-- 跟进 -> follow_up, 获单 -> won, 失单 -> lost
UPDATE "projects" SET "project_status" = 'won' WHERE "project_status" = '获单';--> statement-breakpoint
UPDATE "projects" SET "project_status" = 'lost' WHERE "project_status" = '失单';--> statement-breakpoint
UPDATE "projects" SET "project_status" = 'follow_up' WHERE "project_status" = '跟进';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "project_status" SET DEFAULT 'follow_up';
