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

// 询盘通知邮件(Internal Email)组件(兜底,无自定义模板时使用)
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
          <Heading style={h1}>New inquiry notification</Heading>

          <Text style={text}>
            You have received a new customer inquiry. Please follow up and reply
            as soon as possible.
          </Text>

          <Hr style={hr} />

          {/* 客户信息 Customer information */}
          <Section style={section}>
            <Heading style={h2}>Customer information</Heading>
            <Text style={text}>
              <strong>Customer name:</strong> {content.customerName}
            </Text>
            <Text style={text}>
              <strong>Phone number:</strong> {content.customerPhone}
            </Text>
            <Text style={text}>
              <strong>Email:</strong> {content.customerEmail}
            </Text>
          </Section>

          {/* 项目信息 Project information */}
          <Section style={section}>
            <Heading style={h2}>Project information</Heading>
            <Text style={text}>
              <strong>Project number:</strong> {content.projectName}
            </Text>
            <Text style={text}>
              <strong>Inquiry time (UTC):</strong> {content.inquiryTimeIso}
            </Text>
            {content.theme && (
              <Text style={text}>
                <strong>Related topic:</strong> {content.theme}
              </Text>
            )}
          </Section>

          {/* Quiz 选择路径 Selected path */}
          <Section style={section}>
            <Heading style={h2}>Customer quiz selection path</Heading>
            {pathLines.map((line, index) => (
              <Text key={index} style={pathLine}>
                {line}
              </Text>
            ))}
          </Section>

          {/* 销售经理信息 Sales manager information */}
          {content.managerName && (
            <Section style={section}>
              <Heading style={h2}>Responsible person</Heading>
              <Text style={text}>
                <strong>Sales manager:</strong> {content.managerName}
              </Text>
              {content.managerEmail && (
                <Text style={text}>
                  <strong>Manager email:</strong> {content.managerEmail}
                </Text>
              )}
            </Section>
          )}

          {/* 确认回复按钮 Confirm reply button */}
          {content.confirmUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={content.confirmUrl}>
                Confirm receipt of inquiry
              </Button>
              <Text style={footer}>
                Click the button above to confirm you have received this
                inquiry; the system will record your confirmation time.
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            This email was sent automatically by DolphinQuiz. Please do not
            reply directly. If you have any questions, please contact the sales
            director.
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
