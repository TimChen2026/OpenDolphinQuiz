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

import * as React from "react";
import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type BaseProps = {
  label: string;
  description?: string;
  className?: string;
};

type FormTextFieldProps<TFieldValues extends FieldValues> = BaseProps &
  React.InputHTMLAttributes<HTMLInputElement> & {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>;
    component?: React.ElementType<React.InputHTMLAttributes<HTMLInputElement>>;
  };

const inputClasses =
  "block w-full rounded-md border-0 bg-input px-4 py-1.5 text-foreground shadow-aceternity placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  className,
  component: Component = "input",
  description,
  ...props
}: FormTextFieldProps<TFieldValues>) {
  const InputComponent = Component as React.ComponentType<
    React.InputHTMLAttributes<HTMLInputElement>
  >;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-foreground" htmlFor={name}>
            {label}
          </FormLabel>
          <FormControl>
            <div className="mt-2">
              <InputComponent
                id={name}
                placeholder={placeholder}
                className={className ? className : inputClasses}
                {...field}
                {...props}
              />
            </div>
          </FormControl>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const textareaClasses =
  "block w-full resize-none rounded-md border-0 bg-input px-4 py-2 text-foreground shadow-aceternity placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

type FormTextareaFieldProps<TFieldValues extends FieldValues> = BaseProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    control: Control<TFieldValues>;
    name: Path<TFieldValues>;
  };

export function FormTextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  className,
  description,
  rows = 5,
  ...props
}: FormTextareaFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-foreground" htmlFor={name}>
            {label}
          </FormLabel>
          <FormControl>
            <div className="mt-2">
              <textarea
                id={name}
                placeholder={placeholder}
                rows={rows}
                className={className ? className : textareaClasses}
                {...field}
                {...props}
              />
            </div>
          </FormControl>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
