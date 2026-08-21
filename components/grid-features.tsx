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
import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";
import { useTranslations } from 'next-intl';

export const GridFeatures = () => {
  const t = useTranslations('gridFeatures');
  
  const features = [
    {
      title: t('aiReady.title'),
      description: t('aiReady.description'),
      icon: <IconTerminal2 />,
    },
    {
      title: t('creem.title'),
      description: t('creem.description'),
      icon: <IconCurrencyDollar />,
    },
    {
      title: t('auth.title'),
      description: t('auth.description'),
      icon: <IconEaseInOut />,
    },
    {
      title: t('deploy.title'),
      description: t('deploy.description'),
      icon: <IconCloud />,
    },
    {
      title: t('typescript.title'),
      description: t('typescript.description'),
      icon: <IconRouteAltLeft />,
    },
    {
      title: t('database.title'),
      description: t('database.description'),
      icon: <IconHelp />,
    },
    {
      title: t('seo.title'),
      description: t('seo.description'),
      icon: <IconAdjustmentsBolt />,
    },
    {
      title: t('vibeCoding.title'),
      description: t('vibeCoding.description'),
      icon: <IconHeart />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  relative z-10 py-10">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
};

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group border-border",
        (index === 0 || index === 4) && "lg:border-l",
        index < 4 && "lg:border-b"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover:opacity-100 transition duration-200 group absolute inset-0 h-full w-full bg-gradient-to-t from-muted to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover:opacity-100 transition duration-200 group absolute inset-0 h-full w-full bg-gradient-to-b from-muted to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10">{icon}</div>
      <h3 className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 w-1 rounded-tr-full rounded-br-full bg-border group-hover:bg-primary transition duration-200" />
        <span className="group-hover:translate-x-2 transition duration-200 inline-block">
          {title}
        </span>
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
