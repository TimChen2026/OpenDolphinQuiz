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

import { requireAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminHeader } from "@/features/admin/components/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 检查管理员权限
  await requireAdmin();

  return (
    <div className="min-h-screen bg-muted">
      <div className="flex">
        {/* 侧边栏 */}
        <AdminSidebar />

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          <AdminHeader />

          <main className="flex-1 p-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}