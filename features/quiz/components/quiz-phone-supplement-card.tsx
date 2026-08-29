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

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/button";
import { FormTextField } from "@/features/forms/components/form-text-field";
import { PHONE_PATTERN } from "@/lib/phone";

type QuizPhoneSupplementCardProps = {
  /** 补充完成(保存或跳过)后回调,进入 Quiz 流程 */
  onDone: () => void;
};

// 手机号校验(非强制,仅填写时校验格式)
const supplementPhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Please enter a valid phone number"),
});

type SupplementPhoneInput = z.infer<typeof supplementPhoneSchema>;

/**
 * Quiz 前置手机号补充卡片(非强制)
 *
 * 场景:Google 登录用户无手机号,进入 Quiz 前建议补充便于销售经理联系
 * - 填写手机号 → 调用 /api/auth/supplement-phone 加密保存 → onDone
 * - 点击"跳过" → 直接 onDone(不强制)
 */
export function QuizPhoneSupplementCard({
  onDone,
}: QuizPhoneSupplementCardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<SupplementPhoneInput>({
    resolver: zodResolver(supplementPhoneSchema),
    defaultValues: { phone: "" },
  });

  async function onSubmit(values: SupplementPhoneInput) {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/supplement-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: values.phone }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to save phone number, please retry");
        return;
      }

      onDone();
    } catch {
      setError("Network error, please retry");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-background p-6 sm:p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            Add your phone number (optional)
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your phone number so our sales manager can reach you. You can
            also skip this step.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormTextField
              control={form.control}
              name="phone"
              label="Phone number"
              placeholder="Enter your phone number"
              autoComplete="tel"
            />

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save and continue"}
            </Button>
            <Button
              className="w-full"
              type="button"
              variant="simple"
              onClick={onDone}
              disabled={isLoading}
            >
              Skip
            </Button>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
