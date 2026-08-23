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
import { useSession } from "@/lib/auth-client";
import { QuizRegisterCard } from "./quiz-register-card";
import { QuizPhoneSupplementCard } from "./quiz-phone-supplement-card";

type QuizRegisterGuardProps = {
  /** 已登录(或注册成功)后渲染的内容,通常是 QuizFlowContainer */
  children: React.ReactNode;
  /** 当前问卷模板 ID,客户注册后自动归属该模板所属团队 */
  templateId?: string;
};

/**
 * Quiz 前置注册守卫
 *
 * 职责:
 * - 未登录:渲染 QuizRegisterCard,引导完成注册(手机+邮箱),注册后自动归属问卷所属团队
 * - 已登录但无手机号(如 Google 登录用户):渲染 QuizPhoneSupplementCard(非强制补充)
 * - 已登录且有手机号:直接渲染 children(QuizFlowContainer),进入 Quiz 流程
 * - 注册成功:QuizRegisterCard 调用 onRegistered,触发重新渲染
 *
 * 注意:Better Auth 的 session.user 不含 phone 字段,须通过
 * /api/auth/phone-status 查询 DB 判断手机号是否已填写
 */
export function QuizRegisterGuard({ children, templateId }: QuizRegisterGuardProps) {
  const session = useSession();
  const [forceRefresh, setForceRefresh] = React.useState(false);
  const [hasPhone, setHasPhone] = React.useState<boolean | null>(null);

  // 注册/手机号补充成功后触发重新渲染,确保后续状态已生效
  const handleRegistered = React.useCallback(() => {
    setForceRefresh(true);
  }, []);

  // 已登录时查询 DB 中的手机号状态
  React.useEffect(() => {
    if (!session.data?.user || forceRefresh) {
      return;
    }
    let cancelled = false;
    fetch("/api/auth/phone-status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { hasPhone: false }))
      .then((data) => {
        if (!cancelled) {
          setHasPhone(Boolean(data.hasPhone));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasPhone(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session.data?.user, forceRefresh]);

  // 会话加载中或手机号状态查询中:显示加载占位
  if ((session.isPending || (session.data?.user && hasPhone === null)) && !forceRefresh) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // 已登录(或注册后强制刷新)
  if (session.data?.user || forceRefresh) {
    // 已登录但未填写手机号(如 Google 登录用户):提示补充(非强制)
    if (!forceRefresh && hasPhone === false) {
      return <QuizPhoneSupplementCard onDone={handleRegistered} />;
    }
    return <>{children}</>;
  }

  // 未登录:渲染注册卡片(透传 templateId,注册后自动归属问卷所属团队)
  return <QuizRegisterCard onRegistered={handleRegistered} templateId={templateId} />;
}
