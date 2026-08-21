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

/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import type { Locale } from "@/i18n.config";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });

  return {
    title: t('refund.title'),
    description: t('refund.description'),
    openGraph: {
      images: [t('refund.ogImage')],
    },
  };
}

export default function RefundPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        
        <p className="text-muted-foreground mb-8">
          Effective Date: [Date]
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
          <p>
            At [Your Company Name], we strive to ensure customer satisfaction with our products and services. This Refund Policy outlines the conditions under which you may request a refund and the process for doing so.
          </p>
          <p>
            We believe in the quality of our service and want you to be completely satisfied with your purchase. If you're not satisfied, we're here to help.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Refund Eligibility</h2>
          
          <h3 className="text-xl font-semibold mb-3">Full Refunds Are Available For:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Technical Issues:</strong> Service failures preventing access or use of core features</li>
            <li><strong>Billing Errors:</strong> Duplicate charges, incorrect amounts, or unauthorized transactions</li>
            <li><strong>Non-Delivery:</strong> Failure to provide purchased services or products</li>
            <li><strong>Misrepresentation:</strong> Service significantly different from advertised capabilities</li>
            <li><strong>Account Issues:</strong> Extended inability to access your paid account (&gt;48 hours)</li>
            <li><strong>Pre-Launch Purchases:</strong> Cancellations before service activation</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Partial Refunds May Be Considered For:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Service interruptions or degraded performance</li>
            <li>Features temporarily unavailable</li>
            <li>Quality issues not meeting reasonable expectations</li>
            <li>Partial month of unused subscription service</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Refunds Are NOT Available For:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Change of Mind:</strong> Simply deciding you no longer want the service</li>
            <li><strong>Used Services:</strong> Credits, tokens, or resources already consumed</li>
            <li><strong>User Error:</strong> Mistakes in usage or misunderstanding of features</li>
            <li><strong>External Factors:</strong> Issues with third-party integrations or services</li>
            <li><strong>Terms Violations:</strong> Account suspension due to Terms of Service violations</li>
            <li><strong>Late Requests:</strong> Refund requests beyond the specified timeframe</li>
            <li><strong>Custom Work:</strong> Completed custom development or consulting services</li>
            <li><strong>Downloaded Content:</strong> Digital products already downloaded or accessed</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Refund Request Timeframe</h2>
          
          <h3 className="text-xl font-semibold mb-3">Standard Products and Services:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>One-time purchases:</strong> Within 30 days of purchase</li>
            <li><strong>Subscriptions:</strong> Within 14 days of renewal</li>
            <li><strong>Annual plans:</strong> Within 30 days of purchase</li>
            <li><strong>Digital downloads:</strong> Within 7 days if not accessed</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Special Circumstances:</h3>
          <p>
            Extended timeframes may apply for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Service outages lasting more than 72 hours</li>
            <li>Documented billing errors</li>
            <li>Legal requirements in your jurisdiction</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. How to Request a Refund</h2>
          
          <h3 className="text-xl font-semibold mb-3">Step 1: Contact Support</h3>
          <p>
            Send an email to [Support Email] with the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your account email address</li>
            <li>Order number or transaction ID</li>
            <li>Date of purchase</li>
            <li>Detailed reason for refund request</li>
            <li>Any relevant screenshots or documentation</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Step 2: Review Process</h3>
          <p>
            Our support team will:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Acknowledge your request within 1-2 business days</li>
            <li>Review your eligibility based on this policy</li>
            <li>Request additional information if needed</li>
            <li>Attempt to resolve issues before processing refund</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Step 3: Resolution</h3>
          <p>
            Once approved, refunds are processed as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Decision communicated within 5 business days</li>
            <li>Refunds issued to original payment method</li>
            <li>Processing time: 5-10 business days</li>
            <li>Bank processing may add 3-5 additional days</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Refund Methods</h2>
          
          <h3 className="text-xl font-semibold mb-3">Original Payment Method</h3>
          <p>
            Refunds are typically issued to the original payment method:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
            <li><strong>PayPal:</strong> 3-5 business days</li>
            <li><strong>Bank Transfer:</strong> 5-7 business days</li>
            <li><strong>Cryptocurrency:</strong> Not refundable due to transaction nature</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Alternative Options</h3>
          <p>
            In certain cases, we may offer:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account credits for future use</li>
            <li>Service extensions or upgrades</li>
            <li>Transfer to different products/services</li>
            <li>Charitable donation of refund amount</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Subscription Cancellations</h2>
          
          <h3 className="text-xl font-semibold mb-3">Cancellation vs. Refund</h3>
          <p>
            Cancelling a subscription is different from requesting a refund:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Cancellation:</strong> Stops future charges, service continues until end of billing period</li>
            <li><strong>Refund:</strong> Returns payment for unused or unsatisfactory service</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Pro-Rated Refunds</h3>
          <p>
            For eligible subscription refunds:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Annual plans: Pro-rated for unused months</li>
            <li>Monthly plans: Generally no pro-rating</li>
            <li>Usage-based plans: Refund for unused credits only</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Dispute Resolution</h2>
          
          <p>
            If you disagree with our refund decision:
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Internal Review</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Request escalation to management</li>
            <li>Provide additional documentation</li>
            <li>Allow 5 business days for review</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">External Options</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>File a dispute with your payment provider</li>
            <li>Contact consumer protection agencies</li>
            <li>Seek resolution through small claims court</li>
            <li>Report to Better Business Bureau (if applicable)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Special Circumstances</h2>
          
          <h3 className="text-xl font-semibold mb-3">Promotional Offers</h3>
          <p>
            Products purchased with promotional discounts:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Refunded at the discounted price paid</li>
            <li>May have different refund terms</li>
            <li>Bundle deals refunded proportionally</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Enterprise Accounts</h3>
          <p>
            Business and enterprise customers may have:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Custom refund terms in their contracts</li>
            <li>Service level agreement (SLA) credits</li>
            <li>Different dispute resolution procedures</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Free Trials</h3>
          <p>
            Free trial conversions:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full refund if charged before trial ends</li>
            <li>Refund for accidental conversion within 48 hours</li>
            <li>No refund after actively using paid features</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Fraudulent Refund Requests</h2>
          <p>
            We reserve the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Deny refunds for suspected fraudulent activity</li>
            <li>Suspend accounts with excessive refund requests</li>
            <li>Report fraudulent behavior to authorities</li>
            <li>Pursue legal action for chargebacks deemed fraudulent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Policy Modifications</h2>
          <p>
            We reserve the right to modify this refund policy at any time. Changes will be:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Posted on this page with updated effective date</li>
            <li>Communicated via email for significant changes</li>
            <li>Applied to new purchases after the effective date</li>
            <li>Honored under previous terms for existing purchases</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
          <p>
            For refund requests and questions about this policy:
          </p>
          <ul className="list-none space-y-2 mt-4">
            <li><strong>Support Email:</strong> [Support Email]</li>
            <li><strong>Billing Disputes:</strong> [Billing Email]</li>
            <li><strong>Response Time:</strong> 1-2 business days</li>
            <li><strong>Business Hours:</strong> [Your Business Hours]</li>
            <li><strong>Website:</strong> [Your Website]</li>
          </ul>
          
          <p className="mt-6 p-4 bg-primary/10 rounded-lg">
            <strong>Note:</strong> This refund policy is part of our commitment to customer satisfaction. We encourage you to contact us with any concerns before requesting a refund, as we may be able to resolve your issue quickly.
          </p>
        </section>
      </div>
    </div>
  );
}
