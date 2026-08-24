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

"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import {
  Ban,
  User,
  MoreVertical,
  Mail,
  Calendar,
  Search,
  Trash2,
  Pencil,
  ArrowRightLeft,
} from "lucide-react";
import {
  updateUserRole,
  updateUserPlan,
  updateUserTeamName,
  updateUserTeamMembership,
  listAllTeams,
  banUser,
  deleteUser,
} from "@/features/admin/actions/user-actions";
import { toast } from "sonner";
import type { AdminUserListItem } from "@/lib/admin-user-directory";

type User = AdminUserListItem;

interface UsersTableProps {
  users: User[];
  query: string;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalUsers: number;
  role?: string;
  plan?: string;
  accountType?: string;
  emailVerified?: string;
  team?: string;
}

export function UsersTable({
  users: initialUsers,
  query,
  currentPage,
  pageSize,
  totalPages,
  totalUsers,
  role = "",
  plan = "",
  accountType = "",
  emailVerified = "",
  team = "",
}: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState(query);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teamEditUser, setTeamEditUser] = useState<User | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [transferTeamUser, setTransferTeamUser] = useState<User | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [allTeams, setAllTeams] = useState<{ id: string; name: string }[]>([]);
  const t = useTranslations("Admin.users");
  const hasResults = users.length > 0;

  // 筛选控件可选项(值与 URL 参数一致)
  const roleOptions = [
    { value: "admin", label: t("admin") },
    { value: "sales_director", label: t("filters.salesDirector") },
    { value: "sales_manager", label: t("filters.salesManager") },
    { value: "user", label: t("filters.user") },
  ];
  const planOptions = [
    { value: "free", label: t("planFree") },
    { value: "pro", label: t("planPro") },
    { value: "max", label: t("planMax") },
  ];
  const accountTypeOptions = [
    { value: "member", label: t("filters.member") },
    { value: "customer", label: t("filters.guest") },
  ];
  const emailVerifiedOptions = [
    { value: "true", label: t("filters.verified") },
    { value: "false", label: t("filters.unverified") },
  ];
  const pageStart = totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = totalUsers === 0 ? 0 : Math.min(totalUsers, pageStart + users.length - 1);
  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const halfWindow = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - halfWindow);
    let end = start + maxButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - maxButtons + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  // 加载所有团队列表(筛选栏 + 团队切换共用,挂载时一次加载)
  useEffect(() => {
    listAllTeams()
      .then((teams) => setAllTeams(teams))
      .catch(() => toast.error("加载团队列表失败"));
  }, []);

  const createUsersUrl = (
    nextQuery: string,
    nextPage: number,
    filters?: {
      role?: string;
      plan?: string;
      accountType?: string;
      emailVerified?: string;
      team?: string;
    }
  ) => {
    const params = new URLSearchParams();

    if (nextQuery) {
      params.set("query", nextQuery);
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }

    // 筛选条件随 URL 持久化(刷新/分享后保持),未显式传入时沿用当前筛选
    const activeFilters = filters ?? { role, plan, accountType, emailVerified, team };
    if (activeFilters.role) {
      params.set("role", activeFilters.role);
    }
    if (activeFilters.plan) {
      params.set("plan", activeFilters.plan);
    }
    if (activeFilters.accountType) {
      params.set("accountType", activeFilters.accountType);
    }
    if (activeFilters.emailVerified) {
      params.set("emailVerified", activeFilters.emailVerified);
    }
    if (activeFilters.team) {
      params.set("team", activeFilters.team);
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  // 筛选条件变更:更新对应参数并回到第 1 页
  const handleFilterChange = (
    key: "role" | "plan" | "accountType" | "emailVerified" | "team",
    value: string
  ) => {
    const nextFilters = {
      role: key === "role" ? value : role,
      plan: key === "plan" ? value : plan,
      accountType: key === "accountType" ? value : accountType,
      emailVerified: key === "emailVerified" ? value : emailVerified,
      team: key === "team" ? value : team,
    };
    router.push(createUsersUrl(query, 1, nextFilters), { scroll: false });
  };

  // 显示所有:清空全部筛选条件,恢复无筛选状态
  const handleClearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedSearchTerm = searchTerm.trim();
    router.replace(createUsersUrl(normalizedSearchTerm, 1), { scroll: false });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    router.replace(pathname, { scroll: false });
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) {
      return;
    }

    router.push(createUsersUrl(query, pageNumber), { scroll: false });
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((currentUsers) =>
        currentUsers.map((existingUser) =>
          existingUser.id === userId ? { ...existingUser, role: newRole } : existingUser
        )
      );
      toast.success(t("roleUpdated"));
    } catch {
      toast.error(t("roleUpdateFailed"));
    }
  };

  const handleUpdatePlan = async (userId: string, newPlan: string) => {
    try {
      await updateUserPlan(userId, newPlan);
      setUsers((currentUsers) =>
        currentUsers.map((existingUser) =>
          existingUser.id === userId ? { ...existingUser, plan: newPlan } : existingUser
        )
      );
      toast.success(t("planUpdated"));
    } catch {
      toast.error(t("planUpdateFailed"));
    }
  };

  const handleBanUser = async (userId: string, banned: boolean, reason?: string) => {
    try {
      await banUser(userId, banned, reason);
      setUsers((currentUsers) =>
        currentUsers.map((existingUser) =>
          existingUser.id === userId
            ? { ...existingUser, banned, banReason: reason || null }
            : existingUser
        )
      );
      toast.success(banned ? t("userBanned") : t("userUnbanned"));
    } catch {
      toast.error(t("banFailed"));
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(t("deleteConfirm", { name: userName }));
    if (!confirmed) return;

    try {
      await deleteUser(userId);
      setUsers((currentUsers) =>
        currentUsers.filter((existingUser) => existingUser.id !== userId)
      );
      toast.success(t("userDeleted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteFailed"));
    }
  };

  const handleSaveTeam = async (userId: string, newTeamName: string) => {
    try {
      await updateUserTeamName(userId, newTeamName);
      setUsers((currentUsers) =>
        currentUsers.map((existingUser) =>
          existingUser.id === userId ? { ...existingUser, teamName: newTeamName } : existingUser
        )
      );
      toast.success(t("teamUpdated"));
      setIsTeamModalOpen(false);
      setTeamEditUser(null);
    } catch {
      toast.error(t("teamUpdateFailed"));
    }
  };

  const handleTransferTeam = async (userId: string, targetTeamInput: string) => {
    try {
      const result = await updateUserTeamMembership(userId, targetTeamInput);
      setUsers((currentUsers) =>
        currentUsers.map((existingUser) =>
          existingUser.id === userId ? { ...existingUser, teamName: result.teamName } : existingUser
        )
      );
      toast.success(`已切换到团队:${result.teamName}`);
      setIsTransferModalOpen(false);
      setTransferTeamUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "切换团队失败");
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" variant="outline">
            {t("searchAction")}
          </Button>
          {query ? (
            <Button type="button" size="sm" variant="simple" onClick={handleClearSearch}>
              {t("clearSearch")}
            </Button>
          ) : null}
        </div>
      </form>

      {/* 筛选栏:角色/账号类型/套餐/邮箱验证状态/团队(多条件叠加,与服务端查询一致) */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={role}
          onChange={(e) => handleFilterChange("role", e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("filters.allRoles")}</option>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={accountType}
          onChange={(e) => handleFilterChange("accountType", e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("filters.allTypes")}</option>
          {accountTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={plan}
          onChange={(e) => handleFilterChange("plan", e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("filters.allPlans")}</option>
          {planOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={emailVerified}
          onChange={(e) => handleFilterChange("emailVerified", e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("filters.allStatus")}</option>
          {emailVerifiedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* 团队筛选:选项来自全部团队 */}
        <select
          value={team}
          onChange={(e) => handleFilterChange("team", e.target.value)}
          aria-label={t("filters.allTeams")}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("filters.allTeams")}</option>
          {allTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* 显示所有:重置全部筛选条件 */}
        <Button type="button" size="sm" variant="simple" onClick={handleClearFilters}>
          {t("filters.showAll")}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {query
          ? t("matchingUsers", { count: totalUsers, query })
          : t("totalUsers", { count: totalUsers })}
        {hasResults ? ` | ${t("pageSummary", { from: pageStart, to: pageEnd, total: totalUsers })}` : ""}
      </div>

      {/* 用户表格 */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("user")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("team")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("role")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("plan")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("joined")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-hover">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-6">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {user.name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-foreground">
                        {user.teamName ?? t("noTeam")}
                      </div>
                      {user.teamName ? (
                        <button
                          onClick={() => {
                            setTeamEditUser(user);
                            setIsTeamModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-hover text-muted-foreground"
                          title={t("editTeam")}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setTransferTeamUser(user);
                          setIsTransferModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-hover text-muted-foreground"
                        title="切换团队"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.accountType === "customer" ? (
                      // 客户(Guest):角色固定为 Guest,不可修改为 user/admin
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        Guest
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="px-3 py-1 text-sm rounded-lg border border-border bg-background text-foreground"
                      >
                        <option value="user">User</option>
                        {/* 超级管理员显示 S-Admin,团队管理员显示 T-Admin */}
                        <option value="admin">
                          {user.isSuperAdmin ? "S-Admin" : "T-Admin"}
                        </option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.plan}
                      onChange={(e) => handleUpdatePlan(user.id, e.target.value)}
                      className="px-3 py-1 text-sm rounded-lg border border-border bg-background text-foreground"
                    >
                      <option value="free">{t("planFree")}</option>
                      <option value="pro">{t("planPro")}</option>
                      <option value="max">{t("planMax")}</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {user.banned ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        {t("banned")}
                      </span>
                    ) : user.emailVerified ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {t("active")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                        {t("unverified")}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (user.banned) {
                            handleBanUser(user.id, false);
                          } else {
                            const reason = prompt(t("banReason"));
                            if (reason) {
                              handleBanUser(user.id, true, reason);
                            }
                          }
                        }}
                        className={`p-1.5 rounded hover:bg-hover ${
                          user.banned
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                        title={user.banned ? t("unban") : t("ban")}
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-hover text-muted-foreground"
                        title={t("viewDetails")}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1.5 rounded hover:bg-hover text-red-500 hover:text-red-600"
                        title={t("deleteUser")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!hasResults ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    {query ? t("emptySearchState") : t("emptyState")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {totalUsers > 0 && (
          <nav
            className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary"
            aria-label={t("pagination.page", { current: currentPage, total: totalPages })}
          >
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-border text-muted-foreground hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("pagination.previous")}
            </button>

            <div className="flex items-center gap-2">
              {pageNumbers[0] > 1 && (
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-hover ${currentPage === 1 ? "bg-foreground text-background" : "text-muted-foreground"}`}
                >
                  1
                </button>
              )}
              {pageNumbers[0] > 2 && <span className="text-sm text-muted-foreground">...</span>}

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-hover ${
                    currentPage === pageNumber ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="text-sm text-muted-foreground">...</span>
              )}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-hover ${currentPage === totalPages ? "bg-foreground text-background" : "text-muted-foreground"}`}
                >
                  {totalPages}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-border text-muted-foreground hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("pagination.next")}
            </button>
          </nav>
        )}
      </div>

      {/* 用户详情模态框 */}
      {isEditModalOpen && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
      {isTeamModalOpen && teamEditUser && (
        <TeamEditModal
          user={teamEditUser}
          onClose={() => {
            setIsTeamModalOpen(false);
            setTeamEditUser(null);
          }}
          onSave={handleSaveTeam}
        />
      )}
      {isTransferModalOpen && transferTeamUser && (
        <TransferTeamModal
          user={transferTeamUser}
          allTeams={allTeams}
          onClose={() => {
            setIsTransferModalOpen(false);
            setTransferTeamUser(null);
          }}
          onTransfer={handleTransferTeam}
        />
      )}
    </div>
  );
}

function UserDetailModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const t = useTranslations("Admin.users");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {t("userDetails")}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                {t("name")}
              </label>
              <p className="mt-1 text-foreground">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                {t("email")}
              </label>
              <p className="mt-1 text-foreground">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                {t("role")}
              </label>
              <p className="mt-1 text-foreground">
                {user.accountType === "customer"
                  ? "Guest"
                  : user.isSuperAdmin
                    ? "S-Admin"
                    : user.role === "admin"
                      ? "T-Admin"
                      : user.role}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                {t("plan")}
              </label>
              <p className="mt-1 text-foreground">
                {user.plan === "max"
                  ? t("planMax")
                  : user.plan === "pro"
                    ? t("planPro")
                    : t("planFree")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                {t("joined")}
              </label>
              <p className="mt-1 text-foreground">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">
                {t("lastActive")}
              </label>
              <p className="mt-1 text-foreground">
                {new Date(user.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {user.banned && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>{t("banReason")}:</strong> {user.banReason}
              </p>
              {user.banExpires && (
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  <strong>{t("banExpires")}:</strong> {new Date(user.banExpires).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TeamEditModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (userId: string, newTeamName: string) => Promise<void> | void;
}) {
  const t = useTranslations("Admin.users");
  const [teamName, setTeamName] = useState(user.teamName ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = teamName.trim();
    if (!trimmed) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(user.id, trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {t("editTeam")}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              {t("teamName")}
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={t("teamNamePlaceholder")}
              className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("teamNameHint")}
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 团队切换模态框(超级管理员专属)
 *
 * 允许超级管理员将用户切换到任意现有团队,
 * 或输入新的团队名称创建新团队并将用户加入。
 */
function TransferTeamModal({
  user,
  allTeams,
  onClose,
  onTransfer,
}: {
  user: User;
  allTeams: { id: string; name: string }[];
  onClose: () => void;
  onTransfer: (userId: string, targetTeamInput: string) => Promise<void> | void;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [customTeamName, setCustomTeamName] = useState("");
  const [mode, setMode] = useState<"select" | "create">("select");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    let targetTeamInput = "";

    if (mode === "select") {
      if (!selectedTeamId) {
        toast.error("请选择目标团队");
        return;
      }
      targetTeamInput = selectedTeamId;
    } else {
      const trimmed = customTeamName.trim();
      if (!trimmed) {
        toast.error("请输入新团队名称");
        return;
      }
      targetTeamInput = trimmed;
    }

    setIsSaving(true);
    try {
      await onTransfer(user.id, targetTeamInput);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          切换用户团队
        </h2>

        <div className="mb-4 p-3 bg-secondary rounded-lg">
          <p className="text-sm text-muted-foreground">
            用户:<span className="font-medium text-foreground">{user.name}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            当前团队:<span className="font-medium text-foreground">{user.teamName ?? "无"}</span>
          </p>
        </div>

        {/* 切换模式 */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("select")}
            className={`px-3 py-1.5 text-sm rounded-md ${
              mode === "select"
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            选择现有团队
          </button>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`px-3 py-1.5 text-sm rounded-md ${
              mode === "create"
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            创建新团队
          </button>
        </div>

        <div className="space-y-4">
          {mode === "select" ? (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                目标团队
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">请选择团队</option>
                {allTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {allTeams.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  暂无团队,请使用「创建新团队」选项
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                新团队名称
              </label>
              <input
                type="text"
                value={customTeamName}
                onChange={(e) => setCustomTeamName(e.target.value)}
                placeholder="输入新团队名称"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            提示:切换后,如果目标团队无成员,该用户将自动成为管理员
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "处理中..." : "确认切换"}
          </Button>
        </div>
      </div>
    </div>
  );
}
