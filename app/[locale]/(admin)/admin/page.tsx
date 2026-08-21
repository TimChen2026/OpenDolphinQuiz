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

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

export default async function AdminPage() {
  // 获取统计数据
  const [totalUsers, activeUsers] = await Promise.all([
    // 总用户数
    db.select({ count: sql<number>`count(*)` }).from(user),
    // 活跃用户数（30天内）
    db.select({ count: sql<number>`count(*)` }).from(user)
      .where(sql`${user.updatedAt} > NOW() - INTERVAL '30 days'`),
  ]);

  // 获取最近的用户
  const recentUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(sql`${user.createdAt} desc`)
    .limit(5);

  const stats = {
    totalUsers: totalUsers[0].count,
    activeUsers: activeUsers[0].count,
  };

  return <AdminDashboard stats={stats} recentUsers={recentUsers} />;
}
