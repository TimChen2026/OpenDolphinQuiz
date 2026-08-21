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

import clsx from "clsx";
import Image, { type ImageProps } from "next/image";
import React, { useState } from "react";

interface BlurImageProps extends Omit<ImageProps, "alt"> {
  alt?: string;
  objectFit?: React.CSSProperties["objectFit"];
}

export const BlurImage = ({
  height,
  width,
  src,
  className,
  objectFit,
  alt,
  ...rest
}: BlurImageProps) => {
  const [isLoading, setLoading] = useState(true);
  return (
    <Image
      className={clsx(
        "transition duration-300 transform",
        isLoading ? "blur-sm scale-105" : "blur-0 scale-100",
        className
      )}
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      blurDataURL={typeof src === "string" ? src : undefined}
      style={objectFit ? { objectFit, ...rest.style } : rest.style}
      alt={alt ? alt : "Avatar"}
      {...rest}
    />
  );
};
