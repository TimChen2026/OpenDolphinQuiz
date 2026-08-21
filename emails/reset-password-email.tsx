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
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  resetUrl: string;
  userEmail?: string;
}

export const ResetPasswordEmail = ({
  resetUrl,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password for DolphinQuiz</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Password Reset Request</Heading>
          
          <Text style={text}>
            We received a request to reset your password for your DolphinQuiz account.
            Click the button below to reset it.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>
          
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>

          <Text style={warning}>
            ⚠️ This link will expire in 1 hour for security reasons.
          </Text>

          <Text style={footer}>
            If you didn&apos;t request a password reset, you can safely ignore this email.
            Your password won&apos;t be changed.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 10px',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const buttonContainer = {
  margin: '27px 0',
};

const link = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const warning = {
  color: '#ff6b6b',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '20px 0',
  fontWeight: '500',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '30px 0 0',
};
