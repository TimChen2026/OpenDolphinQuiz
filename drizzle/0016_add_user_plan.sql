-- Phase 5 用户套餐字段迁移(AC-15)
-- user 表新增 plan 字段，用于分析模块套餐分级控制：free(默认)/pro/max
ALTER TABLE "user" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;