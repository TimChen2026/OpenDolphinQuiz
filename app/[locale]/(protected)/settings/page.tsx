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
