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

// 内部管理页(Phase 3 验收修订 2.1.9)
//
// 功能:
// - 用户角色(RBAC)权限分配和控制(管理员专属)
// - 询盘上限提醒邮件模板修改(严格按需求文档图 2.1.7.7-1/2)
// - 说明提醒模板在程序中的位置
//
// 作为管理后台的子页面，(admin) 布局已经执行 requireAdmin 权限校验。

import { InternalAdminView } from "@/features/admin/internal-admin-view";

export default function AdminInternalPage() {
  return <InternalAdminView />;
}