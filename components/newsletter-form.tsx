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

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";

export function NewsletterForm() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Successfully subscribed!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to subscribe");
      }
    } catch {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-foreground mb-4">
        {t('footer.newsletter.title')}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {t('footer.newsletter.description')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('footer.newsletter.placeholder')}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            disabled={status === "loading" || status === "success"}
            required
          />
          <Button
            type="submit"
            variant="simple"
            className="px-4 py-2 text-sm"
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? t('common.loading') : t('footer.newsletter.subscribe')}
          </Button>
        </div>

        {message && (
          <p className={`text-xs ${
            status === "success" ? "text-green-600" : "text-red-600"
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
