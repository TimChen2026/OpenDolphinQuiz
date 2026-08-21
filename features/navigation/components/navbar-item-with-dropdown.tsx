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

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquare, Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface SubItem {
  key: string;
  href: string;
  icon?: string;
}

interface NavBarItemWithDropdownProps {
  href: string;
  target?: "_blank";
  subItems?: SubItem[];
  children: React.ReactNode;
}

const iconMap = {
  MessageSquare: MessageSquare,
  Image: Image,
  Video: Video,
};

export function NavBarItemWithDropdown({
  href,
  target,
  subItems,
  children
}: NavBarItemWithDropdownProps) {
  const t = useTranslations('navigation.main');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  if (!subItems || subItems.length === 0) {
    return (
      <Link
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-hover transition-colors"
      >
        {children}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors",
          isOpen
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-hover"
        )}
      >
        {children}
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1 w-48 bg-popover rounded-lg shadow-navbar border border-border overflow-hidden z-50"
          >
            <div className="py-2">
              {subItems.map((subItem) => {
                const IconComponent = subItem.icon ? iconMap[subItem.icon as keyof typeof iconMap] : null;

                return (
                  <Link
                    key={subItem.key}
                    href={subItem.href}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-hover transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {IconComponent && (
                      <IconComponent className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>{t(subItem.key)}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
