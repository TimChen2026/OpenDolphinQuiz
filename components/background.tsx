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
import { motion } from "framer-motion";
import React, { useId } from "react";

function getAnimationTiming(seed: number) {
  return {
    duration: 1.2 + (seed % 5) * 0.35,
    delay: 5 + (seed % 6),
  };
}

export const Background = () => {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 h-full w-full bg-background pointer-events-none [mask-image:radial-gradient(ellipse_at_center,transparent,white)]" />
      {Array.from({ length: 6 }).map((_, columnIndex) => (
        <div className="flex" key={`grid-column-${columnIndex}`}>
          {Array.from({ length: 10 }).map((_, rowIndex) => (
            <GridBlock
              key={`grid-row-${columnIndex}-${rowIndex}`}
              animationSeed={columnIndex * 10 + rowIndex}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const GridBlock = ({ animationSeed }: { animationSeed: number }) => {
  return (
    <div className="flex flex-col items-start justify-center  w-60">
      <div className="flex items-center justify-center">
        <Dot />
        <SVG animationSeed={animationSeed * 2} />
        {/* <Dot /> */}
      </div>
      <SVGVertical className="ml-3" animationSeed={animationSeed * 2 + 1} />
    </div>
  );
};

const Dot = () => {
  return (
    <div className="h-6 w-6 bg-background flex items-center justify-center rounded-full">
      <div className="h-2 w-2 bg-muted rounded-full" />
    </div>
  );
};

const SVGVertical = ({
  className,
  animationSeed,
}: {
  className?: string;
  animationSeed: number;
}) => {
  const width = 1;
  const height = 140;
  const id = useId();
  const timing = getAnimationTiming(animationSeed);

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-border", className)}
    >
      <path d="M0.5 0.5V479" stroke="currentColor" strokeWidth={2} />
      <motion.path
        d="M0.5 0.5V479"
        stroke={`url(#gradient-${id})`}
        strokeWidth={2}
      />

      <defs>
        <motion.linearGradient
          id={`gradient-${id}`}
          initial={{ x1: 2, y1: -200, x2: 2, y2: -100 }}
          animate={{ x1: 2, y1: 400, x2: 2, y2: 600 }}
          transition={{
            repeat: Infinity,
            duration: timing.duration,
            delay: timing.delay,
          }}
          gradientUnits="userSpaceOnUse"
        >
          <motion.stop offset="0%" stopColor="transparent" />
          <motion.stop offset="50%" stopColor="var(--neutral-200)" />
          <motion.stop offset="100%" stopColor="transparent" />
        </motion.linearGradient>
      </defs>
    </motion.svg>
  );
};

const SVG = ({
  className,
  animationSeed,
}: {
  className?: string;
  animationSeed: number;
}) => {
  const width = 300;
  const height = 1;
  const id = useId();
  const timing = getAnimationTiming(animationSeed);

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-border", className)}
    >
      <path d="M0.5 0.5H479" stroke="currentColor" />
      <motion.path
        d="M0.5 0.5H479"
        stroke={`url(#gradient-${id})`}
        strokeWidth={1}
      />

      <defs>
        <motion.linearGradient
          id={`gradient-${id}`}
          initial={{ x1: -200, y1: 0, x2: -100, y2: 0 }}
          animate={{ x1: 400, y1: 0, x2: 600, y2: 0 }}
          transition={{
            repeat: Infinity,
            duration: timing.duration,
            delay: timing.delay,
          }}
          gradientUnits="userSpaceOnUse"
        >
          <motion.stop offset="0%" stopColor="transparent" />
          <motion.stop offset="50%" stopColor="var(--neutral-200)" />
          <motion.stop offset="100%" stopColor="transparent" />
        </motion.linearGradient>
      </defs>
    </motion.svg>
  );
};

// Use the below rect to debug linear gradient
{
  /* <motion.rect width={width} height={width} fill={`url(#gradient-${id})`} /> */
}
