-- Phase 4 审计日志表迁移(AC-13)
-- 记录用户登录/登出/导出/删除/更新/创建等操作，用于安全审计
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "action_type" text NOT NULL,
  "description" text NOT NULL,
  "details" text,
  "ip_address" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);