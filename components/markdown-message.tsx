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

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReactNode } from "react";

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownMessage({ content, isStreaming }: MarkdownMessageProps) {
  return (
    <div className="markdown-content prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义渲染组件
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-4 mb-2 text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-3 mb-2 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mt-2 mb-1 text-foreground">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 text-foreground leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 text-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 text-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="ml-2 text-foreground">{children}</li>
          ),
          code: ({ inline, children }: { inline?: boolean; children?: ReactNode }) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-muted-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="block p-3 rounded-lg bg-muted text-sm font-mono overflow-x-auto">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-border pl-4 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline hover:text-foreground"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-card divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 whitespace-nowrap text-sm text-foreground">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-4 border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-1 h-4 ml-1 bg-muted-foreground animate-pulse" />
      )}
    </div>
  );
}