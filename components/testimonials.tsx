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
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { cn } from "@/lib/utils";
import { InViewDiv } from "./in-view-div";
import { TestimonialColumnContainer } from "./testimonial-column-container";
import Image from "next/image";
import { useTranslations } from 'next-intl';

const TESTIMONIAL_ANIMATION_DELAYS = [
  "0s",
  "0.1s",
  "0.2s",
  "0.3s",
  "0.4s",
  "0.5s",
] as const;

export const Testimonials = () => {
  const t = useTranslations('testimonials');
  
  return (
    <div className="relative z-20 py-10 md:py-40">
      <Heading as="h2">{t('title')}</Heading>
      <Subheading className="text-center max-w-lg mx-auto">
        {t('subtitle')}
      </Subheading>
      <TestimonialGrid />
    </div>
  );
};

interface Testimonial {
  name: string;
  quote: string;
  src: string;
  designation?: string;
}

function Testimonial({
  name,
  quote,
  src,
  designation,
  animationDelay,
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"figure">, keyof Testimonial | "animationDelay"> &
  Testimonial & {
    animationDelay: string;
  }) {
  return (
    <figure
      className={cn(
        "animate-fade-in rounded-3xl bg-card p-8 opacity-0 shadow-derek",
        className
      )}
      style={{
        animationDelay,
      }}
      {...props}
    >
      <div className="flex flex-col items-start">
        <div className="flex gap-2">
          <Image
            src={src}
            width={150}
            height={150}
            className="h-10 w-10 rounded-full"
            alt={name}
          />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              {name}
            </h3>
            <p className="text-sm font-normal text-muted-foreground">
              {designation}
            </p>
          </div>
        </div>
        <p className="text-base text-muted-foreground mt-4">
          {quote}
        </p>
      </div>
    </figure>
  );
}

function TestimonialColumn({
  testimonials,
  className,
  containerClassName,
  shift = 0,
}: {
  testimonials: Testimonial[];
  className?: string;
  containerClassName?: (reviewIndex: number) => string;
  shift?: number;
}) {
  return (
    <TestimonialColumnContainer className={cn(className)} shift={shift}>
      {testimonials.concat(testimonials).map((testimonial, testimonialIndex) => {
        const reviewIndex = testimonialIndex % testimonials.length;
        const animationDelay =
          TESTIMONIAL_ANIMATION_DELAYS[
            testimonialIndex % TESTIMONIAL_ANIMATION_DELAYS.length
          ];

        return (
          <Testimonial
            name={testimonial.name}
            quote={testimonial.quote}
            src={testimonial.src}
            designation={testimonial.designation}
            animationDelay={animationDelay}
            key={`${testimonial.name}-${testimonialIndex}`}
            className={containerClassName?.(reviewIndex)}
          />
        );
      })}
    </TestimonialColumnContainer>
  );
}

function splitArray<T>(array: Array<T>, numParts: number) {
  const result: Array<Array<T>> = [];
  for (let i = 0; i < array.length; i++) {
    const index = i % numParts;
    if (!result[index]) {
      result[index] = [];
    }
    result[index].push(array[i]);
  }
  return result;
}

function TestimonialGrid() {
  const t = useTranslations('testimonials');
  
  // Get all testimonials from translations
  // Using raw to get the array directly
  const items = t.raw('items') as Array<{
    name: string;
    quote: string;
    designation: string;
  }>;
  
  const testimonials = items.map((item, i) => ({
    name: item.name,
    quote: item.quote,
    designation: item.designation,
    src: `https://i.pravatar.cc/150?img=${i + 1}`
  }));
  
  const columns = splitArray(testimonials, 3);
  const column1 = columns[0];
  const column2 = columns[1];
  const column3 = splitArray(columns[2], 2);
  return (
    <InViewDiv className="relative -mx-4 mt-16 grid h-[49rem] max-h-[150vh] grid-cols-1 items-start gap-8 overflow-hidden px-4 sm:mt-20 md:grid-cols-2 lg:grid-cols-3">
      <TestimonialColumn
        testimonials={[...column1, ...column3.flat(), ...column2]}
        containerClassName={(tIndex) =>
          cn(
            tIndex >= column1.length + column3[0].length && "md:hidden",
            tIndex >= column1.length && "lg:hidden"
          )
        }
        shift={10}
      />
      <TestimonialColumn
        testimonials={[...column2, ...column3[1]]}
        className="hidden md:block"
        containerClassName={(tIndex) =>
          tIndex >= column2.length ? "lg:hidden" : ""
        }
        shift={15}
      />
      <TestimonialColumn
        testimonials={column3.flat()}
        className="hidden lg:block"
        shift={10}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background" />
    </InViewDiv>
  );
}
