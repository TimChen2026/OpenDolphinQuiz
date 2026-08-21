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

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/button";
import { LocaleLink } from "@/components/locale-link";
import { FormShell } from "@/features/forms/components/form-shell";
import { AuthMessageCard } from "@/features/forms/components/auth-message-card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/features/forms/components/input";
import { toast } from "sonner";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    // Verify token validity
    fetch(`/api/auth/verify-reset-token?token=${token}`)
      .then(res => res.json())
      .then(data => {
        setIsValidToken(data.valid);
      })
      .catch(() => {
        setIsValidToken(false);
      });
  }, [token]);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (response.ok) {
        toast.success("Password reset successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to reset password");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <AuthMessageCard
        title="Verifying..."
        description="Please wait while we verify your reset link."
      >
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      </AuthMessageCard>
    );
  }

  if (isValidToken === false) {
    return (
      <AuthMessageCard
        title="Invalid or Expired Link"
        description="This password reset link is invalid or has expired."
      >
        <p className="text-sm text-muted-foreground">
          Please request a new password reset link.
        </p>
        <LocaleLink href="/forgot-password">
          <Button className="w-full">
            Request New Link
          </Button>
        </LocaleLink>
        <LocaleLink href="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </LocaleLink>
      </AuthMessageCard>
    );
  }

  return (
    <FormShell<ResetPasswordInput>
      form={form}
      title="Reset your password"
      description="Enter your new password below."
      onSubmit={onSubmit}
      submitText="Reset Password"
      submitLoadingText="Resetting..."
      isLoading={isLoading}
      footer={
        <div className="text-center">
          <LocaleLink
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Login
          </LocaleLink>
        </div>
      }
    >
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>New Password</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="Enter new password"
                disabled={isLoading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="Confirm new password"
                disabled={isLoading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormShell>
  );
}
