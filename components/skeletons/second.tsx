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
import { stagger, useAnimate } from "framer-motion";
import React, { useState } from "react";

export const SkeletonTwo = () => {
  const [scope, animate] = useAnimate();
  const [animating, setAnimating] = useState(false);

  const handleAnimation = async () => {
    if (animating) return;

    setAnimating(true);
    await animate(
      ".message",
      {
        opacity: [0, 1],
        y: [20, 0],
      },
      {
        delay: stagger(0.5),
      }
    );
    setAnimating(false);
  };
  return (
    <div className="relative h-full w-full mt-4">
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background via-background to-transparent w-full pointer-events-none" />
      <div className="p-4 border border-border bg-muted rounded-[32px] h-full z-20">
        <div className="p-2 bg-card border border-border rounded-[24px] h-full">
          <div className="w-20 rounded-full bg-muted/80 mx-auto h-6" />
          <div
            onMouseEnter={handleAnimation}
            ref={scope}
            className="content mt-4 w-[90%] mx-auto"
          >
            <UserMessage>
              Hello chat! Give me all the links from this website -
              https://ui.aceternity.com
            </UserMessage>
            <AIMessage>Why don&apos;t you do it yourself?</AIMessage>
            <UserMessage>
              Umm.. Because I&apos;m paying $20/mo for your services?
            </UserMessage>
            <AIMessage>You think I work for the money?</AIMessage>
            <UserMessage>Who do you think you are?</UserMessage>
            <AIMessage>I&apos; batman.</AIMessage>
            <AIMessage>
              Now Playing <br />{" "}
              <span className="italic">Something in the way - Nirvana</span>
            </AIMessage>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="message bg-muted text-foreground p-2 sm:p-4 text-[10px] sm:text-xs my-4 rounded-md">
      {children}
    </div>
  );
};
const AIMessage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="message bg-foreground text-background p-2 sm:p-4 text-[10px] sm:text-xs my-4 rounded-md">
      {children}
    </div>
  );
};
