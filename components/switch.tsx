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

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useId } from "react";
export const Switch = ({
  checked,
  setChecked,
}: {
  checked: boolean;
  setChecked: (checked: boolean) => void;
}) => {
  const id = useId();
  return (
    <form className="flex space-x-4  antialiased items-center">
      <label
        htmlFor={id}
        className={cn(
          "h-4  px-1 w-[40px]  flex items-center border border-transparent shadow-[inset_0px_0px_12px_rgba(0,0,0,0.25)] rounded-full  relative cursor-pointer transition duration-200",
          checked ? "bg-primary" : "bg-muted border-border"
        )}
      >
        <motion.div
          initial={{
            width: "10px",
            x: checked ? -2 : 20,
          }}
          animate={{
            height: ["12px", "10px", "12px"],
            width: ["12px", "18px", "12px", "12px"],
            x: checked ? 20 : -2,
          }}
          transition={{
            duration: 0.3,
            delay: 0.1,
          }}
          key={String(checked)}
          className={cn("h-[20px] block rounded-full bg-background shadow-md z-10")}
        ></motion.div>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="hidden"
          id={id}
        />
      </label>
    </form>
  );
};
