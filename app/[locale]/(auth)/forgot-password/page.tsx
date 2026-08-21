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

import { useState } from "react";
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEmailSent(true);
        toast.success("Password reset email sent!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to send reset email");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthMessageCard
        title="Check your email"
        description="We&apos;ve sent you a password reset link. Please check your email."
      >
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive an email? Check your spam folder or try again.
        </p>
        <Button
          variant="outline"
          onClick={() => setEmailSent(false)}
          className="w-full"
        >
          Try Again
        </Button>
        <LocaleLink href="/login">
          <Button variant="simple" className="w-full">
            Back to Login
          </Button>
        </LocaleLink>
      </AuthMessageCard>
    );
  }

  return (
    <FormShell<ForgotPasswordInput>
      form={form}
      title="Forgot password?"
      description="Enter your email address and we&apos;ll send you a reset link."
      onSubmit={onSubmit}
      submitText="Send Reset Link"
      submitLoadingText="Sending..."
      isLoading={isLoading}
      footer={
        <div className="text-center">
          <LocaleLink
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Remember your password? Sign in
          </LocaleLink>
        </div>
      }
    >
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="Enter your email"
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
