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

import { render, screen } from "@testing-library/react";
import pricingMessages from "@/messages/en.json";
import { Pricing } from "@/components/pricing";
import { PricingTable } from "@/app/[locale]/(marketing)/pricing/pricing-table";

const routerPushMock = vi.fn();

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
  useLocale: () => "en",
  useTranslations: () => {
    const translate = (path: string, values?: Record<string, string | number>) => {
      const value = getNestedValue(pricingMessages.pricing as Record<string, unknown>, path);

      if (typeof value !== "string") {
        throw new Error(`Missing translation for ${path}`);
      }

      return interpolate(value, values);
    };

    translate.raw = (path: string) =>
      getNestedValue(pricingMessages.pricing as Record<string, unknown>, path);

    return translate;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      user: null,
    },
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    span: ({
      children,
      layoutId,
      ...props
    }: React.PropsWithChildren<
      React.HTMLAttributes<HTMLSpanElement> & { layoutId?: string }
    >) => {
      void layoutId;
      return <span {...props}>{children}</span>;
    },
  },
}));

describe("marketing pricing", () => {
  it("renders only the configured plans on the pricing cards", () => {
    render(<Pricing />);

    // 需求文档 1.5：免费版、Pro版、Max版，具体内容 MVP 阶段后敲定
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Max" })).toBeInTheDocument();
    // Free 套餐的 price 也是 "Free"，Pro 和 Max 套餐的 price 是 "TBA"
    expect(screen.getAllByText("Free")).toHaveLength(2);
    expect(screen.getAllByText("TBA")).toHaveLength(2);
    expect(screen.queryByText("Enterprise")).not.toBeInTheDocument();
    expect(screen.queryByText("Professional")).not.toBeInTheDocument();
  });

  it("keeps the comparison table aligned with the real billing catalog", () => {
    render(<PricingTable />);

    expect(screen.getByRole("columnheader", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Pro" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Max" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Enterprise" })).not.toBeInTheDocument();
  });
});
