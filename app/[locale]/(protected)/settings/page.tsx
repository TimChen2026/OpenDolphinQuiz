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

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Background } from "@/components/background";
import { Button } from "@/components/button";
import { Container } from "@/components/container";
import { normalizeProfileName } from "@/lib/account-settings";
import {
  validatePassword,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/password-validation";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string;
};

type SaveState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

export default function SettingsPage() {
  const session = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(null);

  // 修改密码相关状态
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordState, setChangePasswordState] = useState<SaveState>(null);

  // 实时校验新密码强度
  const passwordValidation = newPassword
    ? validatePassword(newPassword)
    : { isValid: false, errors: [], score: 0 };

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = (await response.json()) as { user: UserProfile };
      setUserProfile(data.user);
      setName(data.user.name);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session.data?.user?.id) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, session.data?.user?.id]);

  const handleSaveProfile = async () => {
    const normalizedName = normalizeProfileName(name);

    if (!normalizedName || normalizedName.length < 2) {
      setSaveState({
        type: "error",
        message: t("sections.profile.validation"),
      });
      return;
    }

    setIsSaving(true);
    setSaveState(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("sections.profile.saveError"));
      }

      setUserProfile((previous) =>
        previous
          ? {
              ...previous,
              ...data.user,
            }
          : data.user
      );
      setName(data.user.name);
      setSaveState({
        type: "success",
        message: t("sections.profile.saveSuccess"),
      });
      router.refresh();
    } catch (error) {
      setSaveState({
        type: "error",
        message:
          error instanceof Error ? error.message : t("sections.profile.saveError"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const handleChangePassword = async () => {
    setChangePasswordState(null);

    // 前端校验
    if (!currentPassword) {
      setChangePasswordState({
        type: "error",
        message: t("sections.security.password.currentRequired"),
      });
      return;
    }

    if (!newPassword) {
      setChangePasswordState({
        type: "error",
        message: t("sections.security.password.newRequired"),
      });
      return;
    }

    if (!passwordValidation.isValid) {
      setChangePasswordState({
        type: "error",
        message: passwordValidation.errors[0],
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordState({
        type: "error",
        message: t("sections.security.password.passwordsDontMatch"),
      });
      return;
    }

    if (currentPassword === newPassword) {
      setChangePasswordState({
        type: "error",
        message: t("sections.security.password.sameAsOld"),
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("sections.security.password.changeFailed"));
      }

      setChangePasswordState({
        type: "success",
        message: t("sections.security.password.changeSuccess"),
      });

      // 清空表单
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setChangePasswordState({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : t("sections.security.password.changeFailed"),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const displayUser = userProfile ?? session.data?.user;
  const memberSince = displayUser?.createdAt
    ? new Date(displayUser.createdAt).toLocaleDateString(
        locale === "zh" ? "zh-CN" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : tDashboard("cards.statistics.labels.today");

  if (loading && !displayUser) {
    return (
      <div className="relative min-h-screen">
        <Background />
        <Container className="relative z-10 py-20">
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">{tCommon("status.loading")}</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Background />
      <Container className="relative z-10 py-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: "easeOut", duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          <div className="mb-12">
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-6xl">
              {t("title")}
            </h1>
            <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.section
              id="profile"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ease: "easeOut", duration: 0.5, delay: 0.1 }}
              className="rounded-3xl border border-border bg-card/50 p-6 backdrop-blur-md lg:col-span-3"
            >
              <h2 className="text-2xl font-semibold text-card-foreground">
                {t("sections.profile.title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("sections.profile.description")}
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="settings-name"
                    className="mb-2 block text-sm font-medium text-card-foreground"
                  >
                    {t("sections.profile.nameLabel")}
                  </label>
                  <input
                    id="settings-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
                    placeholder={t("sections.profile.namePlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">
                    {t("sections.profile.emailLabel")}
                  </label>
                  <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-muted-foreground">
                    {displayUser?.email}
                  </div>
                </div>

                {saveState && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      saveState.type === "success"
                        ? "border-green-500/30 bg-green-500/10 text-green-600"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    {saveState.message}
                  </div>
                )}

                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving
                    ? t("sections.profile.saving")
                    : t("sections.profile.save")}
                </Button>
              </div>
            </motion.section>

            <motion.section
              id="security"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ease: "easeOut", duration: 0.5, delay: 0.2 }}
              className="rounded-3xl border border-border bg-card/50 p-6 backdrop-blur-md lg:col-span-3"
            >
              <h2 className="text-2xl font-semibold text-card-foreground">
                {t("sections.security.title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("sections.security.description")}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    {t("sections.security.emailStatus")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-card-foreground">
                    {displayUser?.emailVerified
                      ? tCommon("status.verified")
                      : tCommon("status.pending")}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    {t("sections.security.memberSince")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-card-foreground">
                    {memberSince}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    {t("sections.security.accountId")}
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-card-foreground">
                    {displayUser?.id}
                  </p>
                </div>
              </div>

              {/* 修改密码区域 */}
              <div className="mt-8 border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-card-foreground">
                  {t("sections.security.password.title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("sections.security.password.description")}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="current-password"
                      className="mb-2 block text-sm font-medium text-card-foreground"
                    >
                      {t("sections.security.password.currentLabel")}
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
                      placeholder={t("sections.security.password.currentPlaceholder")}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-sm font-medium text-card-foreground"
                    >
                      {t("sections.security.password.newLabel")}
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
                      placeholder={t("sections.security.password.newPlaceholder")}
                    />
                    {/* 密码强度指示器 */}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${getPasswordStrengthColor(passwordValidation.score)}`}
                              style={{ width: `${(passwordValidation.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getPasswordStrengthLabel(passwordValidation.score)}
                          </span>
                        </div>
                        {/* 密码规则提示 */}
                        {!passwordValidation.isValid && (
                          <ul className="mt-2 space-y-0.5">
                            {passwordValidation.errors.map((error, index) => (
                              <li key={index} className="text-xs text-red-500">
                                • {error}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-medium text-card-foreground"
                    >
                      {t("sections.security.password.confirmLabel")}
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary"
                      placeholder={t("sections.security.password.confirmPlaceholder")}
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {t("sections.security.password.passwordsDontMatch")}
                      </p>
                    )}
                  </div>
                </div>

                {/* 修改密码状态提示 */}
                {changePasswordState && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                      changePasswordState.type === "success"
                        ? "border-green-500/30 bg-green-500/10 text-green-600"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    {changePasswordState.message}
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword
                      ? t("sections.security.password.changing")
                      : t("sections.security.password.change")}
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/profile`)}
                >
                  {t("sections.security.viewProfile")}
                </Button>
                <Button variant="simple" onClick={handleSignOut}>
                  {t("sections.security.signOut")}
                </Button>
              </div>
            </motion.section>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
