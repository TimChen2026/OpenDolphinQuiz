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
import Link from "next/link";
import React from "react";

// DolphinQuiz 品牌 Logo（正式设计图，源文件:项目需求文档/附图 dolphinquiz_logo-N.jpg，已复制到 public/ 供站点引用）
// imgClassName 可覆盖图片尺寸，默认 h-8 用于导航栏等，footer 等场景可传入更大尺寸
// variant="text" 时仅显示品牌文字（导航栏场景），链接能力保持不变
export const Logo = ({
  imgClassName = "h-8 w-auto object-contain",
  variant = "image",
}: {
  imgClassName?: string;
  variant?: "image" | "text";
}) => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm mr-4 text-foreground px-2 py-1 relative z-20"
    >
      {variant === "text" ? (
        <span className="font-medium text-foreground">DolphinQuiz</span>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dolphinquiz-logo.jpg"
            alt="DolphinQuiz"
            width={96}
            height={33}
            className={imgClassName}
          />
        </>
      )}
    </Link>
  );
};
