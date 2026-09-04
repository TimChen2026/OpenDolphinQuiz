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
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import messages from "@/messages/en.json";
import { LoginForm } from "@/features/auth/components/login-form";
import { SignupForm } from "@/features/auth/components/signup-form";

const routerPushMock = vi.fn();

// 可变查询参数:测试间通过 mockSearchParams.set() 控制 useSearchParams 返回值
const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));

function getNestedValue(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
}

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace?: string) => {
    const root = namespace
      ? (getNestedValue(messages as Record<string, unknown>, namespace) as Record<string, unknown>)
      : (messages as Record<string, unknown>);

    return (path: string) => {
      const value = getNestedValue(root, path);

      if (typeof value !== "string") {
        throw new Error(`Missing translation for ${namespace ?? "root"}:${path}`);
      }

      return value;
    };
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
  useSearchParams: () => navigationMocks.searchParams,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
}));

describe("auth forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.searchParams = new URLSearchParams();
  });

  it("hides the Google button on login when Google auth is disabled", () => {
    render(<LoginForm showGoogleAuth={false} />);

    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
  });

  it("hides the Google button on signup when Google auth is disabled", () => {
    render(<SignupForm showGoogleAuth={false} />);

    expect(screen.queryByRole("button", { name: "Continue with Google" })).not.toBeInTheDocument();
  });

  it("still renders the Google button when Google auth is enabled", () => {
    render(<LoginForm showGoogleAuth />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
  });

  it("redirects back to the callbackURL after successful login", async () => {
    const { signIn } = await import("@/lib/auth-client");
    vi.mocked(signIn.email).mockResolvedValue({
      data: { user: { emailVerified: true } },
      error: null,
    } as never);
    navigationMocks.searchParams = new URLSearchParams(
      "callbackURL=%2Fquiz%3Ft%3Dabc%26style%3Dyale"
    );

    render(<LoginForm showGoogleAuth={false} />);

    await userEvent.type(screen.getByLabelText("Email address"), "guest@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd!123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(routerPushMock).toHaveBeenCalledWith("/quiz?t=abc&style=yale");
    });
  });

  it("redirects to the homepage when callbackURL is absent or unsafe", async () => {
    const { signIn } = await import("@/lib/auth-client");
    vi.mocked(signIn.email).mockResolvedValue({
      data: { user: { emailVerified: true } },
      error: null,
    } as never);
    // 开放重定向防护:外站地址必须被忽略
    navigationMocks.searchParams = new URLSearchParams(
      "callbackURL=https%3A%2F%2Fevil.example.com"
    );

    render(<LoginForm showGoogleAuth={false} />);

    await userEvent.type(screen.getByLabelText("Email address"), "guest@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd!123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(routerPushMock).toHaveBeenCalledWith("/en/");
    });
  });

  it("passes the quiz URL to Google social sign-in when callbackURL is present", async () => {
    const { signIn } = await import("@/lib/auth-client");
    vi.mocked(signIn.social).mockResolvedValue({} as never);
    navigationMocks.searchParams = new URLSearchParams(
      "callbackURL=%2Fquiz%3Ft%3Dabc%26style%3Dyale"
    );

    render(<LoginForm showGoogleAuth />);

    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
      expect(signIn.social).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/quiz?t=abc&style=yale",
      });
    });
  });
});
