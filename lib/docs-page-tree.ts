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

import type { ReactNode } from 'react';
import type { Folder, Node, Root } from 'fumadocs-core/page-tree';

const zhNavLabels: Record<string, string> = {
  Docs: '文档',
  'Getting Started': '入门指南',
  Guides: '指南',
  Authentication: '认证',
  Payments: '支付',
  'AI Features': 'AI 功能',
  Email: '邮件',
  Admin: '后台管理',
};

function translateName(locale: string, name: ReactNode): ReactNode {
  if (locale !== 'zh' || typeof name !== 'string') {
    return name;
  }

  return zhNavLabels[name] ?? name;
}

function localizeFolder(locale: string, folder: Folder): Folder {
  return {
    ...folder,
    name: translateName(locale, folder.name),
    index: folder.index
      ? {
          ...folder.index,
          name: translateName(locale, folder.index.name),
        }
      : undefined,
    children: folder.children.map((child) => localizeNode(locale, child)),
  };
}

function localizeNode(locale: string, node: Node): Node {
  if (node.type === 'folder') {
    return localizeFolder(locale, node);
  }

  return {
    ...node,
    name: translateName(locale, node.name),
  };
}

export function localizeDocsPageTree(locale: string, tree: Root): Root {
  if (locale !== 'zh') {
    return tree;
  }

  return {
    ...tree,
    name: translateName(locale, tree.name),
    children: tree.children.map((child) => localizeNode(locale, child)),
    fallback: tree.fallback
      ? localizeDocsPageTree(locale, tree.fallback)
      : undefined,
  };
}
