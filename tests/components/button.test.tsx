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
import { Button } from "@/components/button";

describe("Button", () => {
  it("renders the default CTA when children are omitted", () => {
    render(<Button />);

    expect(
      screen.getByRole("button", {
        name: "Get Started",
      })
    ).toBeInTheDocument();
  });

  it("applies variant and size classes while preserving custom className", () => {
    render(
      <Button className="tracking-wide" size="lg" variant="outline">
        Upgrade
      </Button>
    );

    const button = screen.getByRole("button", { name: "Upgrade" });

    expect(button).toHaveClass("tracking-wide");
    expect(button).toHaveClass("text-base");
    expect(button).toHaveClass("hover:bg-primary");
  });

  it("supports polymorphic rendering through the as prop", () => {
    render(
      <Button as="a" href="/pricing">
        Pricing
      </Button>
    );

    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });
});
