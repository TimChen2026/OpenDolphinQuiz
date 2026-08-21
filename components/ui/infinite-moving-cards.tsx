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

import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

export const InfiniteMovingCards = ({
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  children,
}: {
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  children: React.ReactNode;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current || hasInitialized.current) {
      return;
    }

    const scrollerContent = Array.from(scrollerRef.current.children);
    scrollerContent.forEach((item) => {
      const duplicatedItem = item.cloneNode(true);
      scrollerRef.current?.appendChild(duplicatedItem);
    });

    hasInitialized.current = true;
    scrollerRef.current.dataset.ready = "true";
  }, []);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const animationDirection = direction === "left" ? "forwards" : "reverse";
    containerRef.current.style.setProperty("--animation-direction", animationDirection);
  }, [direction]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const duration = speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";
    containerRef.current.style.setProperty("--animation-duration", duration);
  }, [speed]);
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 group max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]"
      )}
    >
      <div
        ref={scrollerRef}
        className={cn(
          " flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          "data-[ready=true]:animate-scroll data-[ready=true]:[animation-play-state:running]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
      >
        {children}
      </div>
    </div>
  );
};
