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

import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';
import { Container } from "@/components/container";
import { Background } from "@/components/background";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ClientUserProfile, UserProfileResponse } from "@/lib/client-api";

export default function ProfilePage() {
  const session = useSession();
  const locale = useLocale();
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const [userProfile, setUserProfile] = useState<ClientUserProfile | null>(null);

  useEffect(() => {
    if (!session.data?.user?.id) {
      return;
    }

    let isCancelled = false;

    const loadUserProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok || isCancelled) {
          return;
        }

        const data = (await response.json()) as UserProfileResponse;
        if (!isCancelled) {
          setUserProfile(data.user);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    void loadUserProfile();

    return () => {
      isCancelled = true;
    };
  }, [session.data?.user?.id]);

  // Authentication is already handled in the layout
  const user = session.data?.user;
  const displayUser = userProfile || user;
  const initial = displayUser?.name ? displayUser.name.charAt(0).toUpperCase() : displayUser?.email?.charAt(0).toUpperCase() || "U";
  
  // Format registration date
  const formatMemberSince = () => {
    if (!displayUser?.createdAt) return tDashboard('cards.statistics.labels.today');
    const date = new Date(displayUser.createdAt);
    // Use locale for date formatting
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <Container className="relative z-10 py-20">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: "easeOut", duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ease: "easeOut", duration: 0.5, delay: 0.1 }}
            className="bg-card/50 backdrop-blur-md rounded-3xl p-8 border border-border"
          >
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ease: "easeOut", duration: 0.5, delay: 0.2 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl mb-6 ring-4 ring-border/50"
              >
                {displayUser?.image ? (
                  <Image
                    src={displayUser.image}
                    alt={displayUser?.name || "User"}
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initial
                )}
              </motion.div>
              <h2 className="text-3xl font-bold text-card-foreground mb-2">
                {displayUser?.name || t('sections.basicInfo.nameNotSet')}
              </h2>
              <p className="text-lg text-muted-foreground">{displayUser?.email}</p>
            </div>

            {/* Information Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ease: "easeOut", duration: 0.5, delay: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    {t('sections.basicInfo.title')}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <span className="text-sm text-muted-foreground block mb-1">{t('sections.basicInfo.fullName')}</span>
                      <span className="text-lg font-medium text-card-foreground">
                        {displayUser?.name || t('sections.basicInfo.notSet')}
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <span className="text-sm text-muted-foreground block mb-1">{t('sections.basicInfo.email')}</span>
                      <span className="text-lg font-medium text-card-foreground">
                        {displayUser?.email}
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <span className="text-sm text-muted-foreground block mb-1">{t('sections.basicInfo.verificationStatus')}</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-600">
                        {tCommon('status.verified')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Account Information */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ease: "easeOut", duration: 0.5, delay: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    {t('sections.accountSettings.title')}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <span className="text-sm text-muted-foreground block mb-1">{t('sections.accountSettings.accountType')}</span>
                      <span className="text-lg font-medium text-card-foreground">
                        {tCommon('status.active')}
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <span className="text-sm text-muted-foreground block mb-1">{t('sections.accountSettings.memberSince')}</span>
                      <span className="text-lg font-medium text-card-foreground">
                        {formatMemberSince()}
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <span className="text-sm text-muted-foreground block mb-1">{t('sections.basicInfo.accountId')}</span>
                      <span className="text-lg font-medium text-card-foreground font-mono">
                        {displayUser?.id || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}
