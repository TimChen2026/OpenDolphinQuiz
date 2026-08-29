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

// 销售经理确认回复页面(Phase 3 Task 3.9 / AC-07)
//
// 销售经理点击询盘邮件中的"确认收到询盘"按钮后打开此页面
// 显示确认信息,点击确认后记录回复时间到项目跟踪信息

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/button";
import { Container } from "@/components/container";

type ConfirmData = {
  projectNumber: string;
  customerName: string;
  theme: string | null;
  managerName: string | null;
  tenantName: string | null;
  inquiryDatetime: string;
  alreadyConfirmed: boolean;
};

function ConfirmContent() {
  const searchParams = useSearchParams();
  const project = searchParams.get("project") ?? "";
  const [data, setData] = useState<ConfirmData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!project) {
      setError("Missing project number parameter");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/quiz/confirm?project=${encodeURIComponent(project)}`);
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.data) {
          setError(json?.error ?? "Project not found");
        } else {
          setData(json.data as ConfirmData);
        }
      } catch {
        setError("Network error, please try again");
      } finally {
        setLoading(false);
      }
    })();
  }, [project]);

  const handleConfirm = async () => {
    setError(null);
    try {
      const res = await fetch("/api/quiz/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Confirmation failed");
        return;
      }
      setConfirmed(true);
    } catch {
      setError("Network error, please try again");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-destructive">{error}</div>
    );
  }

  if (confirmed || data?.alreadyConfirmed) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Confirmation successful
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your reply time has been recorded. Thank you for your prompt follow-up!
        </p>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          {data?.projectNumber}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-16">
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-foreground">
          Confirm inquiry received
        </h1>

        <div className="mt-4 space-y-2 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <p>Project: {data?.projectNumber}</p>
          <p>Customer: {data?.customerName}</p>
          {data?.theme && <p>Topic: {data.theme}</p>}
          <p>
            Inquiry time:{" "}
            {data ? new Date(data.inquiryDatetime).toLocaleString() : "-"}
          </p>
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-muted-foreground">
            Dear {data?.managerName ?? "Sales Manager"},
          </p>
          <p className="mt-2 text-foreground">Thank you for your prompt reply!</p>
          <p className="mt-2 text-muted-foreground">
            We sincerely hope for a pleasant cooperation with the customer and
            success on this project!
          </p>
          <p className="mt-2 font-medium text-foreground">
            {data?.tenantName ?? ""} Team
          </p>

          <div className="mt-6">
            <Button size="lg" onClick={handleConfirm}>
              Confirm replied to customer
            </Button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizConfirmPage() {
  return (
    <Container className="py-12">
      <Suspense
        fallback={
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        }
      >
        <ConfirmContent />
      </Suspense>
    </Container>
  );
}
