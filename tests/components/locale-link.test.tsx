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
import { LocaleLink } from "@/components/locale-link";

const useLocaleMock = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => useLocaleMock(),
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

describe("LocaleLink", () => {
  beforeEach(() => {
    useLocaleMock.mockReturnValue("en");
  });

  it("prefixes internal links with the active locale", () => {
    render(<LocaleLink href="/pricing">Pricing</LocaleLink>);

    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/en/pricing"
    );
  });

  it("does not double-prefix links that already include the locale", () => {
    render(<LocaleLink href="/en/blog">Blog</LocaleLink>);

    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "/en/blog"
    );
  });

  it("passes external urls through unchanged", () => {
    render(<LocaleLink href="https://mksaas.com">External</LocaleLink>);

    expect(screen.getByRole("link", { name: "External" })).toHaveAttribute(
      "href",
      "https://mksaas.com"
    );
  });

  it("passes new-tab attributes through to the rendered link", () => {
    render(
      <LocaleLink href="/docs" target="_blank" rel="noopener noreferrer">
        Docs
      </LocaleLink>
    );

    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "/en/docs"
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
  });
});
