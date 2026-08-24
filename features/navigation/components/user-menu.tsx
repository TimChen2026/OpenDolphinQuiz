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

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import {
  IconUser,
  IconLogout,
  IconLayoutDashboard,
  IconShield,
  IconSettings,
} from "@tabler/icons-react";

export function UserMenu() {
  const session = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamName, setTeamName] = useState<string | null>(null);
  // 账号类型:customer = 客户(Guest),member = 正式用户
  const [accountType, setAccountType] = useState<string | null>(null);
  // 客户升级对话框状态
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeTeamName, setUpgradeTeamName] = useState("");
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    // 检查用户是否是管理员
    const checkAdminStatus = async () => {
      if (session.data?.user?.id) {
        try {
          const response = await fetch('/api/user/admin-status');
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);
          }
        } catch (error) {
          console.error('Failed to check admin status:', error);
        }
      }
    };
    
    checkAdminStatus();
  }, [session.data?.user?.id]);

  useEffect(() => {
    // 获取用户归属团队名称与账号类型(团队信息显示在用户面板中)
    const fetchTeamName = async () => {
      if (session.data?.user?.id) {
        try {
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const data = await response.json();
            setTeamName(data.teamName ?? null);
            setAccountType(data.user?.accountType ?? null);
          }
        } catch (error) {
          console.error('Failed to fetch team name:', error);
        }
      }
    };
    
    fetchTeamName();
  }, [session.data?.user?.id]);

  // 客户升级为正式用户:输入团队名后调用升级 API
  const handleUpgrade = async () => {
    const trimmed = upgradeTeamName.trim();
    if (!trimmed) {
      setUpgradeError(t('auth.upgrade.errors.teamNameRequired'));
      return;
    }
    setUpgradeError(null);
    setUpgrading(true);
    try {
      const response = await fetch('/api/auth/customer-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setUpgradeError(data.error || t('auth.upgrade.errors.upgradeFailed'));
        return;
      }
      // 升级成功后关闭对话框并刷新页面
      setIsUpgradeOpen(false);
      setUpgradeTeamName("");
      router.refresh();
    } catch {
      setUpgradeError(t('auth.upgrade.errors.upgradeFailed'));
    } finally {
      setUpgrading(false);
    }
  };

  if (session.isPending) {
    return (
      <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session.data?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/login`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('common.actions.signIn')}
        </Link>
        <Link
          href={`/${locale}/signup`}
          className="bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity"
        >
          {t('common.actions.signUp')}
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const user = session.data.user;
  const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs ring-1 ring-transparent hover:ring-blue-500/50 transition-all"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={24}
            height={24}
            className="h-full w-full rounded-full object-cover"
            unoptimized
          />
        ) : (
          initial
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 min-w-[12rem] max-w-[18rem] bg-popover rounded-lg shadow-navbar border border-border py-1 z-20">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground break-words">
                {user.name || user.email}
              </p>
              {user.name && (
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  {user.email}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('navigation.main.plan')}:{" "}
                {user.plan
                  ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1)
                  : "Free"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('navigation.main.team')}:{" "}
                {teamName ?? "—"}
              </p>
            </div>

            {/* 客户(Guest)登录后:仅可访问问卷,可升级为正式用户 */}
            {accountType === "customer" ? (
              <>
                <Link
                  href={`/${locale}/quiz`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-hover transition-colors"
                >
                  <IconLayoutDashboard className="w-4 h-4" />
                  {t('navigation.main.quiz')}
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsUpgradeOpen(true);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-hover transition-colors text-left"
                >
                  <IconShield className="w-4 h-4" />
                  {t('auth.upgrade.upgradeLink')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-hover transition-colors"
                >
                  <IconLayoutDashboard className="w-4 h-4" />
                  {t('navigation.main.dashboard')}
                </Link>

                <Link
                  href={`/${locale}/settings`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-hover transition-colors"
                >
                  <IconSettings className="w-4 h-4" />
                  {t('navigation.main.settings')}
                </Link>

                {isAdmin && (
                  <Link
                    href={`/${locale}/admin`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-hover transition-colors"
                  >
                    <IconShield className="w-4 h-4" />
                    {t('Admin.sidebar.title')}
                  </Link>
                )}

                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-hover transition-colors"
                >
                  <IconUser className="w-4 h-4" />
                  {t('navigation.main.profile')}
                </Link>
              </>
            )}

            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-hover transition-colors text-left"
              >
                <IconLogout className="w-4 h-4" />
                {t('common.actions.signOut')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 客户升级为正式用户对话框 */}
      {isUpgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border border-border">
            <h3 className="text-lg font-semibold mb-2">
              {t('auth.upgrade.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('auth.upgrade.description')}
            </p>
            <input
              type="text"
              value={upgradeTeamName}
              onChange={(e) => {
                setUpgradeTeamName(e.target.value);
                if (e.target.value.trim()) {
                  setUpgradeError(null);
                }
              }}
              placeholder={t('auth.upgrade.teamNamePlaceholder')}
              autoComplete="organization"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {upgradeError && (
              <p className="text-sm text-destructive mt-2">{upgradeError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsUpgradeOpen(false);
                  setUpgradeTeamName("");
                  setUpgradeError(null);
                }}
                disabled={upgrading}
                className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-hover transition-colors disabled:opacity-40"
              >
                {t('common.actions.cancel')}
              </button>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {upgrading
                  ? t('auth.upgrade.upgrading')
                  : t('auth.upgrade.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
