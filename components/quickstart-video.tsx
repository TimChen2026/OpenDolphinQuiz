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

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Quick Start Guide 演示视频的 Mux Playback ID(更换视频时替换此 ID 即可)
// 官方 iframe 嵌入格式: https://player.mux.com/{PLAYBACK_ID}
const MUX_PLAYBACK_URL =
  "https://player.mux.com/sHMBfaVVFJYyZRfSAvi9zNcNbDe1573fHOM01UDvfuik";

type QuickstartVideoProps = {
  title: string;
  openLabel: string;
  ariaVideoLabel: string;
  ariaCloseLabel: string;
};

// Quickstart 文档页的演示视频按钮 + 弹窗播放器
// 文案由各语言的 MDX 文稿通过 props 传入,组件本身不依赖翻译文件
export function QuickstartVideo({
  title,
  openLabel,
  ariaVideoLabel,
  ariaCloseLabel,
}: QuickstartVideoProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 打开时锁定页面滚动,关闭后恢复
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC 键关闭弹窗
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-lg border-2 transition-all hover:opacity-80 border-primary text-primary"
      >
        {openLabel}
      </button>

      {/* 视频弹窗:点击遮罩关闭,点击内容区阻止冒泡;关闭时卸载 iframe 以停止播放 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={ariaVideoLabel}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={ariaCloseLabel}
            >
              <X className="h-7 w-7" />
            </button>
            {/* 16:9 视频容器,自动播放 */}
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl">
              <iframe
                src={`${MUX_PLAYBACK_URL}?autoplay=true`}
                title={title}
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
