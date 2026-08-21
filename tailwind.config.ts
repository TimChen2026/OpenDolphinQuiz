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

/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

type TailwindPluginApi = {
  addBase: (base: Record<string, Record<string, string>>) => void;
  theme: (path: "colors") => Record<string, unknown>;
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    "./mdx-components.tsx",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Noto Serif SC", "Source Han Serif SC", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        navbar: {
          DEFAULT: "hsl(var(--navbar-bg))",
          scrolled: "hsl(var(--navbar-bg-scrolled))",
        },
        hover: {
          DEFAULT: "hsl(var(--hover-bg))",
          foreground: "hsl(var(--hover-foreground))",
        },
      },
      animation: {
        scroll:
          "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        marquee: "marquee var(--marquee-duration) linear infinite",
        "fade-in": "fade-in 0.5s linear forwards",
      },
      boxShadow: {
        derek: `0px 0px 0px 1px hsl(var(--shadow-color) / 0.06),
        0px 1px 1px -0.5px hsl(var(--shadow-color) / 0.06),
        0px 3px 3px -1.5px hsl(var(--shadow-color) / 0.06),
        0px 6px 6px -3px hsl(var(--shadow-color) / 0.06),
        0px 12px 12px -6px hsl(var(--shadow-color) / 0.06),
        0px 24px 24px -12px hsl(var(--shadow-color) / 0.06)`,
        aceternity: `0px 2px 3px -1px hsl(var(--shadow-color) / 0.1), 0px 1px 0px 0px hsl(var(--shadow-color) / 0.02), 0px 0px 0px 1px hsl(var(--shadow-color) / 0.08)`,
        navbar: `0px -2px 0px 0px hsl(var(--shadow-color)), 0px 2px 0px 0px hsl(var(--shadow-color))`,
      },
      keyframes: {
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
        marquee: {
          "100%": {
            transform: "translateY(-50%)",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors, require("@tailwindcss/typography")],
};

function addVariablesForColors({ addBase, theme }: TailwindPluginApi) {
  const allColors = flattenColorPalette(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, String(val)])
  );

  addBase({
    ":root": newVars,
  });
}

export default config;
