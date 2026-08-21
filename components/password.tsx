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

import { EyeIcon, EyeOffIcon } from "lucide-react";
import React, { forwardRef, useState } from "react";

import { cn } from "@/lib/utils";

type PasswordProps = React.InputHTMLAttributes<HTMLInputElement>;

const Password = forwardRef<HTMLInputElement, PasswordProps>(
  ({ className, type, ...props }, ref) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : type ?? "password"}
        ref={ref}
        className={cn(
          "block w-full rounded-md border-0 bg-input px-4 pr-10 py-1.5 text-foreground shadow-aceternity placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
          className
        )}
      />
      <div className="absolute right-3 top-[30%]">
        {!show && (
          <EyeIcon
            onClick={() => setShow(true)}
            className="text-muted-foreground cursor-pointer h-4"
          />
        )}
        {show && (
          <EyeOffIcon
            onClick={() => setShow(false)}
            className="text-muted-foreground cursor-pointer h-4"
          />
        )}
      </div>
    </div>
  );
});

Password.displayName = "Password";

export default Password;
