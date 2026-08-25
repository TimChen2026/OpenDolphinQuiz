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

// 团队成员显示面板
//
// 功能:
// - 显示当前团队所有成员的姓名、邮箱、角色
// - 管理员角色成员显示"管理员"title
// - 仅显示当前用户所在团队的成员信息(API 层已保证数据隔离)
//
// 数据来源:/api/dashboard/team/members (GET)

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 团队成员信息类型(与后端 TeamMemberInfo 对应)
 */
type TeamMember = {
  id: string;
  name: string;
  email: string;
  /** 团队内角色:admin(管理员) | member(普通成员) | customer(客户) */
  teamRole: string;
  /** 是否为团队管理员 */
  isTeamAdmin: boolean;
  /** 用户在系统中的角色 */
  userRole: string;
};

/**
 * 角色标签映射:团队内角色 -> 显示文本
 */
const TEAM_ROLE_LABELS: Record<string, string> = {
  admin: "管理员",
  member: "成员",
  customer: "客户",
};

/**
 * 系统角色标签映射
 */
const USER_ROLE_LABELS: Record<string, string> = {
  admin: "超级管理员",
  sales_director: "销售总监",
  sales_manager: "销售经理",
  user: "用户",
};

export function TeamMembersPanel() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/team/members");
      if (!res.ok) {
        throw new Error("加载团队成员失败");
      }
      const json = (await res.json()) as { members: TeamMember[] };
      setMembers(json.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">团队成员</h3>
        <div className="mt-4 py-8 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">团队成员</h3>
        <div className="mt-4 py-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={fetchMembers}
            className="mt-2 text-sm text-primary hover:underline"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 分隔展示:正式成员(管理员/普通成员)与客户分区,符合实际业务逻辑
  const staffMembers = members.filter((m) => m.teamRole !== "customer");
  const customerMembers = members.filter((m) => m.teamRole === "customer");

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">团队成员</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            本团队共 {members.length} 位成员
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="mt-4 py-6 text-center text-sm text-muted-foreground">
          暂无团队成员
        </p>
      ) : (
        <div className="mt-4">
          {/* 正式成员(管理员/普通成员) */}
          {staffMembers.length > 0 && (
            <ul className="divide-y divide-border">
              {staffMembers.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </ul>
          )}

          {/* 分隔横线 + 客户栏:客户与正式成员分开展示 */}
          {customerMembers.length > 0 && (
            <>
              <div className="my-2 border-t border-border" />
              <p className="pt-1 text-xs font-medium text-muted-foreground">
                客户
              </p>
              <ul className="mt-1 divide-y divide-border">
                {customerMembers.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** 单个团队成员条目(头像/姓名/邮箱/角色标签) */
function MemberRow({ member }: { member: TeamMember }) {
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* 头像占位符 */}
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
              member.isTeamAdmin
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {member.name}
              </p>
              {/* 管理员 title 标签 */}
              {member.isTeamAdmin && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  管理员
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {member.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 团队内角色标签 */}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              member.teamRole === "admin"
                ? "bg-primary/10 text-primary"
                : member.teamRole === "customer"
                  ? "bg-muted text-muted-foreground"
                  : "bg-secondary text-secondary-foreground"
            )}
          >
            {TEAM_ROLE_LABELS[member.teamRole] ?? member.teamRole}
          </span>
          {/* 系统角色标签(如果有特殊角色) */}
          {member.userRole !== "user" && member.userRole !== "admin" && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
              {USER_ROLE_LABELS[member.userRole] ?? member.userRole}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
