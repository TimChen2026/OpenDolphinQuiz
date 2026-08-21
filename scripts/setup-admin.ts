#!/usr/bin/env tsx

/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This file is part of the DolphinQuiz project.
 *
 * DolphinQuiz is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * DolphinQuiz is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/**
 * 管理员初始化脚本
 * 用于设置第一个管理员账号
 * 
 * 使用方法:
 * 1. 设置环境变量 ADMIN_EMAIL
 * 2. 运行: pnpm admin:setup
 * 或直接运行: ADMIN_EMAIL=admin@example.com pnpm admin:setup
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import { resolve } from "path";
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// 定义 user 表结构（复制自 schema）
const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

async function setupAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.error("❌ 请设置环境变量 ADMIN_EMAIL");
    console.log("例如: ADMIN_EMAIL=admin@example.com pnpm admin:setup");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ 未找到 DATABASE_URL 环境变量");
    console.log("请确保 .env.local 文件中设置了 DATABASE_URL");
    process.exit(1);
  }

  // 创建数据库连接
  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient);

  try {
    console.log("🔍 正在查找用户:", adminEmail);
    
    // 检查用户是否存在
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (existingUser.length === 0) {
      console.error(`❌ 用户 ${adminEmail} 不存在`);
      console.log("请先使用此邮箱注册一个账号，然后再运行此脚本");
      await queryClient.end();
      process.exit(1);
    }

    const currentUser = existingUser[0];
    console.log(`✓ 找到用户: ${currentUser.name} (当前角色: ${currentUser.role})`);
    
    if (currentUser.role === "admin") {
      console.log(`✅ 用户 ${adminEmail} 已经是管理员`);
      await queryClient.end();
      process.exit(0);
    }

    // 更新用户为管理员
    console.log("📝 正在更新用户角色...");
    await db
      .update(user)
      .set({ 
        role: "admin",
        updatedAt: new Date()
      })
      .where(eq(user.email, adminEmail));

    console.log(`✅ 成功将用户 ${adminEmail} 设置为管理员`);
    console.log("🚀 现在你可以访问 /admin 路径来进入管理后台");
    
  } catch (error) {
    console.error("❌ 设置管理员失败:", error);
    await queryClient.end();
    process.exit(1);
  }

  // 关闭数据库连接
  await queryClient.end();
  process.exit(0);
}

// 运行脚本
setupAdmin();
