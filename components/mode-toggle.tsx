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

import * as React from "react";
import { useTheme } from "next-themes";
import { MoonIcon } from "lucide-react";
import { IconSunLow } from "@tabler/icons-react";
import { motion } from "framer-motion";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <button
      onClick={() => {
        if (theme === "dark") {
          setTheme("light");
          return;
        }

        setTheme("dark");
      }}
      className="w-10 h-10 flex hover:bg-hover rounded-lg items-center justify-center outline-none focus:ring-0 focus:outline-none active:ring-0 active:outline-none overflow-hidden"
    >
      {theme === "light" && (
        <motion.div
          key={theme}
          initial={{
            x: 40,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
        >
          <IconSunLow className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </motion.div>
      )}

      {theme === "dark" && (
        <motion.div
          key={theme}
          initial={{
            x: 40,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          transition={{
            ease: "easeOut",
            duration: 0.3,
          }}
        >
          <MoonIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </motion.div>
      )}

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
