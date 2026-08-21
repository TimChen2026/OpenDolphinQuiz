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
import { fireEvent, render, screen } from "@testing-library/react";
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
    createdAt: new Date("2025-01-02T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
  },
];

describe("UsersTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits server-side searches through the admin users route", () => {
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

    fireEvent.change(screen.getByPlaceholderText("Search by name or email..."), {
      target: { value: "alice" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(routerReplaceMock).toHaveBeenCalledWith("/en/admin/users?query=alice", {
      scroll: false,
    });
  });

  it("navigates between server-rendered pages without dropping the active query", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(routerPushMock).toHaveBeenCalledWith("/en/admin/users?query=alice&page=3", {
      scroll: false,
    });
    expect(screen.getByText('61 matching users for "alice" | Showing 21-22 of 61')).toBeInTheDocument();
  });

  it("shows an empty-state message when the current server result has no users", () => {
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

    expect(screen.getByText("No users match this search")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
