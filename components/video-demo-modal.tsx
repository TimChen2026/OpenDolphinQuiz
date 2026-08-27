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
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

// Mux 视频嵌入地址(Playback ID 由用户提供,更换视频时替换此 ID 即可)
// 官方 iframe 嵌入格式: https://player.mux.com/{PLAYBACK_ID}
const MUX_PLAYBACK_URL =
  "https://player.mux.com/W1TZ01s7G278myTLezwurGtoTMy00VISEZL1Di6C98HzU";

// 首页"介绍短片"按钮 + 视频弹窗播放器
// 弹窗为 fixed 悬浮层,不改变页面原有布局;关闭时卸载 iframe 以停止播放
export function VideoDemoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("home.video");

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
        {t("open")}
      </button>

      {/* 视频弹窗:点击遮罩关闭,点击内容区阻止冒泡 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("ariaVideoLabel")}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t("ariaClose")}
            >
              <X className="h-7 w-7" />
            </button>
            {/* 16:9 视频容器,自动播放 */}
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl">
              <iframe
                src={`${MUX_PLAYBACK_URL}?autoplay=true`}
                title={t("title")}
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
