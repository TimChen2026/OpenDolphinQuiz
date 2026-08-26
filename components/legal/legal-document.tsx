/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * 协议文档(服务条款/隐私政策)的统一渲染组件。
 * 内容以结构化数据(LegalDocumentContent)传入,组件负责排版,数据源与展示分离。
 */

export type LegalParagraph = string | { list: string[] };

export interface LegalTable {
  headers: string[];
  rows: string[][];
}

export interface LegalSubSection {
  heading: string;
  items: LegalParagraph[];
}

/** 章节内有序块:段落、表格或子节,按文档原始顺序排列 */
export type LegalBlock = LegalParagraph | LegalTable | LegalSubSection;

export interface LegalSection {
  heading: string;
  /** 有序内容块(优先使用,精确还原文档顺序) */
  blocks?: LegalBlock[];
  /** 兼容字段:未提供 blocks 时按 paragraphs → table → subsections 顺序渲染 */
  paragraphs?: LegalParagraph[];
  subsections?: LegalSubSection[];
  table?: LegalTable;
}

export interface LegalDocumentContent {
  /** 文档标题 */
  title: string;
  /** 更新日期说明 */
  updated: string;
  /** 开篇段落(标题与更新日期之间) */
  intro?: string[];
  /** 正文章节 */
  sections: LegalSection[];
}

interface LegalDocumentProps {
  content: LegalDocumentContent;
}

function ParagraphBlock({ paragraph }: { paragraph: LegalParagraph }) {
  if (typeof paragraph === "string") {
    return <p>{paragraph}</p>;
  }
  return (
    <ul className="list-disc space-y-2 pl-6">
      {paragraph.list.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function TableBlock({ table }: { table: LegalTable }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50">
            {table.headers.map((header, index) => (
              <th
                key={index}
                className="border-b px-4 py-2.5 text-left font-semibold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2.5 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockRenderer({ block }: { block: LegalBlock }) {
  if (typeof block === "string" || "list" in (block as { list?: string[] })) {
    return <ParagraphBlock paragraph={block as LegalParagraph} />;
  }
  if ("headers" in block && "rows" in block) {
    return <TableBlock table={block as LegalTable} />;
  }
  const subsection = block as LegalSubSection;
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-lg font-semibold">{subsection.heading}</h3>
      {subsection.items.map((paragraph, itemIndex) => (
        <div key={itemIndex} className="mb-3 space-y-3">
          <ParagraphBlock paragraph={paragraph} />
        </div>
      ))}
    </div>
  );
}

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold">{section.heading}</h2>

      {section.blocks
        ? section.blocks.map((block, index) => (
            <BlockRenderer key={index} block={block} />
          ))
        : (
          <>
            {section.paragraphs?.map((paragraph, index) => (
              <div key={index} className="mb-3 space-y-3">
                <ParagraphBlock paragraph={paragraph} />
              </div>
            ))}

            {section.table && <TableBlock table={section.table} />}

            {section.subsections?.map((subsection, index) => (
              <div key={index} className="mt-5">
                <h3 className="mb-2 text-lg font-semibold">{subsection.heading}</h3>
                {subsection.items.map((paragraph, itemIndex) => (
                  <div key={itemIndex} className="mb-3 space-y-3">
                    <ParagraphBlock paragraph={paragraph} />
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
    </section>
  );
}

export function LegalDocument({ content }: LegalDocumentProps) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="mb-8 text-4xl font-bold">{content.title}</h1>

        <p className="mb-8 text-muted-foreground">{content.updated}</p>

        {content.intro?.map((paragraph, index) => (
          <p key={index} className="mb-6">
            {paragraph}
          </p>
        ))}

        {content.sections.map((section, index) => (
          <SectionBlock key={index} section={section} />
        ))}
      </div>
    </div>
  );
}
