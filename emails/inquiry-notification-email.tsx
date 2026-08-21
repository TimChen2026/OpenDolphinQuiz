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

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import type { InquiryEmailContent } from "@/lib/quiz/internal-email";

// 询盘通知邮件(Internal Email)组件
// 用于客户完成 Quiz 后通知销售经理,含客户信息、项目编号、Quiz 路径摘要

interface InquiryNotificationEmailProps {
  content: InquiryEmailContent;
}

export const InquiryNotificationEmail = ({
  content,
}: InquiryNotificationEmailProps) => {
  const pathLines = content.pathSummary.split("\n");

  return (
    <Html>
      <Head />
      <Preview>{content.subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>新询盘通知</Heading>

          <Text style={text}>
            您收到一条新的客户询盘,请尽快跟进回复。
          </Text>

          <Hr style={hr} />

          {/* 客户信息 */}
          <Section style={section}>
            <Heading style={h2}>客户信息</Heading>
            <Text style={text}>
              <strong>客户姓名:</strong> {content.customerName}
            </Text>
            <Text style={text}>
              <strong>联系电话:</strong> {content.customerPhone}
            </Text>
            <Text style={text}>
              <strong>邮箱地址:</strong> {content.customerEmail}
            </Text>
          </Section>

          {/* 项目信息 */}
          <Section style={section}>
            <Heading style={h2}>项目信息</Heading>
            <Text style={text}>
              <strong>项目编号:</strong> {content.projectName}
            </Text>
            <Text style={text}>
              <strong>询盘时间(UTC):</strong> {content.inquiryTimeIso}
            </Text>
            {content.theme && (
              <Text style={text}>
                <strong>关联主题:</strong> {content.theme}
              </Text>
            )}
          </Section>

          {/* Quiz 选择路径 */}
          <Section style={section}>
            <Heading style={h2}>客户 Quiz 选择路径</Heading>
            {pathLines.map((line, index) => (
              <Text key={index} style={pathLine}>
                {line}
              </Text>
            ))}
          </Section>

          {/* 销售经理信息 */}
          {content.managerName && (
            <Section style={section}>
              <Heading style={h2}>负责人信息</Heading>
              <Text style={text}>
                <strong>销售经理:</strong> {content.managerName}
              </Text>
              {content.managerEmail && (
                <Text style={text}>
                  <strong>经理邮箱:</strong> {content.managerEmail}
                </Text>
              )}
            </Section>
          )}

          {/* 确认回复按钮 */}
          {content.confirmUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={content.confirmUrl}>
                确认收到询盘
              </Button>
              <Text style={footer}>
                点击上方按钮确认您已收到此询盘通知,系统将记录您的确认时间。
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            此邮件由 DolphinQuiz 系统自动发送,请勿直接回复。
            如有任何问题,请联系销售总监。
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InquiryNotificationEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const h2 = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "0 0 12px",
};

const text = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 10px",
};

const pathLine = {
  color: "#555",
  fontSize: "13px",
  lineHeight: "22px",
  margin: "0 0 6px",
  fontFamily: "monospace",
};

const section = {
  margin: "20px 0",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "20px 0",
};

const buttonContainer = {
  margin: "27px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#000",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#898989",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "10px 0 0",
};
