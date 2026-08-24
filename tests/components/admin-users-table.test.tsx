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

import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import messages from "@/messages/en.json";
import { UsersTable } from "@/features/admin/components/users-table";

const { routerPushMock, routerReplaceMock } = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
  routerReplaceMock: vi.fn(),
}));

function getNestedValue(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
}

function interpolate(message: string, values?: Record<string, string | number>) {
  if (!values) {
    return message;
  }

  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, message);
}

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => {
    const root = namespace
      ? (getNestedValue(messages as Record<string, unknown>, namespace) as Record<string, unknown>)
      : (messages as Record<string, unknown>);

    const translate = (path: string, values?: Record<string, string | number>) => {
      const value = getNestedValue(root, path);

      if (typeof value !== "string") {
        throw new Error(`Missing translation for ${namespace ?? "root"}:${path}`);
      }

      return interpolate(value, values);
    };

    translate.raw = (path: string) => getNestedValue(root, path);

    return translate;
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/admin/users",
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
  }),
}));

vi.mock("@/features/admin/actions/user-actions", () => ({
  updateUserRole: vi.fn(),
  banUser: vi.fn(),
  updateUserCredits: vi.fn(),
  // 挂载时加载全部团队,用于筛选栏团队下拉与团队切换
  listAllTeams: vi.fn().mockResolvedValue([
    { id: "team_1", name: "Acme" },
    { id: "team_2", name: "Globex" },
  ]),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const users = [
  {
    id: "user_1",
    name: "Alice Builder",
    email: "alice@example.com",
    emailVerified: true,
    credits: 120,
    role: "user",
    banned: false,
    banReason: null,
    banExpires: null,
    planKey: "starter_monthly",
    plan: "free",
    accountType: "member",
    teamName: "Acme",
    teamId: "team_1",
    isSuperAdmin: false,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
  {
    id: "user_2",
    name: "Bob Operator",
    email: "bob@example.com",
    emailVerified: false,
    credits: 80,
    role: "admin",
    banned: false,
    banReason: null,
    banExpires: null,
    planKey: "pro_monthly",
    plan: "pro",
    accountType: "member",
    teamName: null,
    teamId: null,
    isSuperAdmin: false,
    createdAt: new Date("2025-01-02T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
  },
  {
    id: "user_3",
    name: "Carol Guest",
    email: "carol@example.com",
    emailVerified: true,
    credits: 0,
    role: "user",
    banned: false,
    banReason: null,
    banExpires: null,
    planKey: "free",
    plan: "free",
    accountType: "customer",
    teamName: "Acme",
    teamId: "team_1",
    isSuperAdmin: false,
    createdAt: new Date("2025-01-03T00:00:00.000Z"),
    updatedAt: new Date("2025-01-03T00:00:00.000Z"),
  },
];

describe("UsersTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits server-side searches through the admin users route", async () => {
    render(
      <UsersTable
        currentPage={1}
        pageSize={20}
        query=""
        totalPages={3}
        totalUsers={41}
        users={users}
      />
    );

    // 等待挂载时的团队列表异步加载完成,避免未包装的 setState 警告
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.change(screen.getByPlaceholderText("Search by name or email..."), {
      target: { value: "alice" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(routerReplaceMock).toHaveBeenCalledWith("/en/admin/users?query=alice", {
      scroll: false,
    });
  });

  it("navigates between server-rendered pages without dropping the active query", async () => {
    render(
      <UsersTable
        currentPage={2}
        pageSize={20}
        query="alice"
        totalPages={4}
        totalUsers={61}
        users={users}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(routerPushMock).toHaveBeenCalledWith("/en/admin/users?query=alice&page=3", {
      scroll: false,
    });
    expect(screen.getByText('61 matching users for "alice" | Showing 21-23 of 61')).toBeInTheDocument();
  });

  it("shows an empty-state message when the current server result has no users", async () => {
    render(
      <UsersTable
        currentPage={1}
        pageSize={20}
        query="nobody"
        totalPages={1}
        totalUsers={0}
        users={[]}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("No users match this search")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("shows each user's team name in the Team column, with edit control for members of a team", async () => {
    render(
      <UsersTable
        currentPage={1}
        pageSize={20}
        query=""
        totalPages={1}
        totalUsers={2}
        users={users.slice(0, 2)}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // 有团队的用户显示团队名,无团队的用户显示占位符(限定在表格内,排除团队筛选下拉选项)
    const table = screen.getByRole("table");
    expect(within(table).getByText("Acme")).toBeInTheDocument();
    expect(within(table).getByText("—")).toBeInTheDocument();
    // 团队列的编辑按钮(供超级管理员修改团队信息)
    expect(screen.getByTitle("Edit Team")).toBeInTheDocument();
  });

  it("shows customer accounts as Guest role instead of User", async () => {
    render(
      <UsersTable
        currentPage={1}
        pageSize={20}
        query=""
        totalPages={1}
        totalUsers={3}
        users={users}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // 客户账号(customer)显示 Guest 徽章,而非 User 下拉框(限定在表格内,排除筛选栏选项)
    const table = screen.getByRole("table");
    expect(within(table).getByText("Guest")).toBeInTheDocument();
    // 客户不显示角色下拉框:3 个用户中仅 2 个成员有角色下拉
    const roleSelects = within(table)
      .getAllByRole("combobox")
      .filter((el) => (el as HTMLSelectElement).value === "user" || (el as HTMLSelectElement).value === "admin");
    expect(roleSelects).toHaveLength(2);
  });

  it("filters by team and resets all filters with the Show all button", async () => {
    render(
      <UsersTable
        currentPage={1}
        pageSize={20}
        query=""
        totalPages={1}
        totalUsers={3}
        users={users}
      />
    );

    // 等待团队列表异步加载完成(团队下拉选项渲染后才可选中)
    await screen.findByRole("option", { name: "Acme" });

    // 选择团队后 team 参数持久化到 URL
    const teamSelect = screen.getByLabelText("All teams");
    fireEvent.change(teamSelect, { target: { value: "team_1" } });
    expect(routerPushMock).toHaveBeenCalledWith("/en/admin/users?team=team_1", {
      scroll: false,
    });

    // 显示所有按钮:重置全部筛选条件,恢复无筛选状态
    fireEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(routerPushMock).toHaveBeenCalledWith("/en/admin/users", { scroll: false });
  });

  it("shows S-Admin for super admin and T-Admin for team admin in the role column", async () => {
    const superAdmin = {
      ...users[0],
      id: "user_4",
      name: "Dana Super",
      email: "dana@example.com",
      role: "admin",
      isSuperAdmin: true,
      teamName: "Acme",
      teamId: "team_1",
    };
    render(
      <UsersTable
        currentPage={1}
        pageSize={20}
        query=""
        totalPages={1}
        totalUsers={4}
        users={[...users, superAdmin]}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // 角色列下拉的当前选中值:普通用户 User、团队管理员 T-Admin、超级管理员 S-Admin
    const table = screen.getByRole("table");
    const roleSelects = within(table)
      .getAllByRole("combobox")
      .filter((el) => {
        const select = el as HTMLSelectElement;
        return select.value === "user" || select.value === "admin";
      });
    const selectedLabels = roleSelects.map((el) => {
      const select = el as HTMLSelectElement;
      return select.options[select.selectedIndex].text;
    });
    expect(selectedLabels).toContain("User");
    expect(selectedLabels).toContain("T-Admin");
    expect(selectedLabels).toContain("S-Admin");
  });
});
