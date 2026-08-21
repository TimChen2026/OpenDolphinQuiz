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

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames } from '@/i18n.config';
import type { Locale } from '@/i18n.config';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    let path = pathname;

    for (const loc of locales) {
      if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
        path = pathname.slice(loc.length + 1) || '/';
        break;
      }
    }

    const normalizedPath = path === '/' ? '' : path;
    router.push(`/${newLocale}${normalizedPath}`);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-all duration-200",
          "border border-border",
          "bg-popover text-popover-foreground",
          "hover:bg-hover",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{localeNames[locale as Locale]}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 py-1 min-w-[150px]",
            "bg-popover text-popover-foreground",
            "border border-border",
            "rounded-lg shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            "z-50"
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {locales.map((loc) => {
            const isActive = loc === locale;
            return (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm",
                  "hover:bg-hover",
                  "transition-colors duration-150",
                  isActive && "bg-accent text-accent-foreground"
                )}
                role="menuitem"
              >
                <span className={cn(
                  "font-medium",
                  isActive ? "text-accent-foreground" : "text-muted-foreground"
                )}>
                  {localeNames[loc]}
                </span>
                {isActive && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
