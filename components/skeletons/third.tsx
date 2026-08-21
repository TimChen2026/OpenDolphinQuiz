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
import React, { useState } from "react";
import { IconDots, IconPlus } from "@tabler/icons-react";
import { Switch } from "../switch";

export const SkeletonThree = () => {
  return (
    <div className="h-full w-full sm:w-[80%] mx-auto bg-card  shadow-2xl mt-10 group rounded-md">
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background via-background to-transparent w-full pointer-events-none z-[11]" />

      <div className="flex flex-1 w-full h-full flex-col space-y-2 ">
        <div className="flex justify-between border-b border-border pb-2 p-4">
          <p className="text-muted-foreground text-sm font-bold">
            Add LLM
          </p>
          <p className="shadow-derek text-muted-foreground text-sm px-2 py-1 rounded-md flex-shrink-0 flex space-x-1 items-center bg-muted">
            <IconPlus className="h-4 w-4 text-muted-foreground" />{" "}
            <span>Add</span>
          </p>
        </div>
        <div className="flex flex-col space-y-4 p-4">
          <Row title="Groq LLM" updatedAt="23rd March" />
          <Row title="OpenAI GPT0" updatedAt="21st March" active />
          <Row title="Stable DIffusion" updatedAt="3rd May" />
          <Row title="Llama 2" updatedAt="1st April" active />
          <Row title="Claude 200k" updatedAt="2nd June" active />
        </div>
      </div>
    </div>
  );
};

export const Row = ({
  title,
  updatedAt,
  active = false,
}: {
  title: string;
  updatedAt: string;
  active?: boolean;
}) => {
  const [checked, setChecked] = useState(active);
  return (
    <div className="flex justify-between items-center">
      <div className="flex space-x-2 items-center">
        <p className="text-muted-foreground text-xs shadow-aceternity bg-muted px-1 py-0.5 rounded-md">
          {title}
        </p>
        <p className="text-muted-foreground text-xs">{updatedAt}</p>
      </div>
      <div className="flex items-center space-x-1">
        <Switch checked={checked} setChecked={setChecked} />
        <IconDots className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};
