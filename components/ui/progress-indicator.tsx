"use client";

/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This file is part of the DolphinQuiz project.
 *
 * DolphinQuiz is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License.
 */

import React from "react";
import { motion } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 交互式进度指示器(含返回/继续操作按钮)
 *
 * 取代问卷手机预览中原「顶部细进度条 + 底部继续按钮」。
 * 组件为受控组件:步骤(step)与展开状态(isExpanded)由父组件根据节点等级驱动,
 * 配色通过 props 注入,沿用原预览样式的进度填充色(s.accent)、轨道色(s.progressTrack)
 * 与按钮色(s.btnBg / s.btnText),从而保持整体风格一致。
 * 步骤映射:step 1 → 进阶 P1、step 2 → P2、step 3 → P3/P4(结果页保持满格)。
 */
interface ProgressIndicatorProps {
  /** 当前步骤 1-3,由父组件按节点等级映射 */
  step: number;
  /** 是否展开(仅显示主按钮);为 false 时额外显示返回按钮 */
  isExpanded?: boolean;
  /** 进度覆盖层颜色(默认沿用原「继续」按钮蓝,通常传 s.accent) */
  accent?: string;
  /** 未激活圆点颜色(默认浅灰,通常传 s.progressTrack) */
  track?: string;
  /** 主按钮背景色(通常传 s.btnBg) */
  btnBg?: string;
  /** 主按钮文字色(通常传 s.btnText) */
  btnText?: string;
  onBack?: () => void;
  onContinue?: () => void;
}

const DEFAULT_ACCENT = "#006cff";
const DEFAULT_TRACK = "#d4d4d8";

const ProgressIndicator = ({
  step,
  isExpanded = true,
  accent = DEFAULT_ACCENT,
  track = DEFAULT_TRACK,
  btnBg = DEFAULT_ACCENT,
  btnText = "#ffffff",
  onContinue,
  onBack,
}: ProgressIndicatorProps) => {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      {/* 步骤圆点 + 进度覆盖层 */}
      <div className="relative flex items-center gap-6 py-1">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className={cn(
              "relative z-10 h-2 w-2 rounded-full",
              dot <= step && "bg-white"
            )}
            style={dot <= step ? undefined : { background: track }}
          />
        ))}
        <motion.div
          initial={false}
          animate={{
            width: step === 1 ? "24px" : step === 2 ? "60px" : "100px",
          }}
          className="absolute -left-[8px] top-1/2 h-3 -translate-y-1/2 rounded-full"
          style={{ background: accent }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            mass: 0.8,
            bounce: 0.25,
            duration: 0.6,
          }}
        />
      </div>

      {/* 操作按钮 */}
      <div className="w-full">
        <motion.div
          className="flex items-center gap-2"
          animate={{
            justifyContent: isExpanded ? "stretch" : "space-between",
          }}
        >
          {!isExpanded && (
            <motion.button
              initial={{ opacity: 0, width: 0, scale: 0.8 }}
              animate={{ opacity: 1, width: 64, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 15,
                mass: 0.8,
                bounce: 0.25,
                duration: 0.6,
                opacity: { duration: 0.2 },
              }}
              onClick={onBack}
              className="flex w-16 flex-1 items-center justify-center rounded-full bg-gray-100 px-4 py-3 text-sm font-semibold text-black transition-colors hover:border hover:bg-gray-50"
            >
              返回
            </motion.button>
          )}
          <motion.button
            onClick={onContinue}
            animate={{ flex: isExpanded ? 1 : "inherit" }}
            className={cn(
              "rounded-full px-4 py-3 text-sm font-semibold transition-colors",
              !isExpanded ? "w-44" : "w-full"
            )}
            style={{ background: btnBg, color: btnText }}
          >
            <div className="flex items-center justify-center gap-2 font-semibold">
              {step === 3 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 15,
                    mass: 0.5,
                    bounce: 0.4,
                  }}
                >
                  <CircleCheck size={16} />
                </motion.div>
              )}
              {step === 3 ? "完成" : "继续"}
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressIndicator;