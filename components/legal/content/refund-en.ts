/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * English version of the Refund Policy. Based on Sections 5.5, 6, 7, 8, 13,
 * 14.1 and 15.1 of the Terms of Service, in line with the finalised agreements
 * and consistent with the Terms of Service and Privacy Policy.
 */

import type { LegalDocumentContent } from "@/components/legal/legal-document";

export const refundEnContent: LegalDocumentContent = {
  title: "Refund Policy",
  updated: "Last updated: 2026-8-27 (v1.0)",
  intro: [
    "This policy explains the conditions and procedures for refunds of subscription fees for DolphinQuiz (the \"Service\", operated by individual developer Chen Huiting, \"CHT\" or \"we\", at dolphinquiz.com). This policy is a companion document that elaborates on Section 7 of the Terms of Service (https://dolphinquiz.com/terms); in the event of any inconsistency between this policy and the Terms of Service, the Terms of Service shall prevail.",
    "Because our digital service has an intangible nature with immediate delivery, access to the service is activated immediately upon payment confirmation, and subscription fees are generally non-refundable, except in the circumstances set out below.",
  ],
  sections: [
    {
      heading: "1. When a refund is available",
      blocks: [
        { list: [
          "7-day guarantee for new subscribers: first-time subscribers may request a full refund within 7 days of the first charge, provided that usage does not exceed 20% of the maximum number of potential customers included in the plan.",
          "Duplicate charges: refunds in full for duplicate charges resulting from a billing error.",
          "Verified service interruption (over 72 hours): for extended outages caused by our fault, a pro-rata refund or extension will be provided.",
          "Statutory rights: where applicable law grants a right of withdrawal or refund (such as the EU/UK 14-day cooling-off period), such rights are reserved.",
        ] },
      ],
    },
    {
      heading: "2. When a refund is not available",
      blocks: [
        { list: [
          "Fees for subscription periods already used (except under the refundable circumstances in Section 1).",
          "Refund requests for annual subscription fees made more than 30 days after the initial purchase.",
          "Accounts that have been closed for breach of the Terms of Service or the acceptable use policy.",
        ] },
      ],
    },
    {
      heading: "3. How to request a refund",
      blocks: [
        "To request a refund, please email huiting.chen@outlook.com and provide the following information:",
        { list: [
          "Your account email address;",
          "The transaction ID of the order;",
          "The reason for the refund (please include any relevant screenshots or supporting evidence).",
        ] },
        "We will confirm receipt of your request and reply with our decision within 2 business days; once a refund is approved, it will be issued to the original payment method within 5-10 business days.",
      ],
    },
    {
      heading: "4. Refund method and timing",
      blocks: [
        "Refunds are always issued to the original payment method (processed through the payment processor Waffo Pancake) and usually arrive within 5-10 business days; the exact timing depends on your payment service provider. Delays caused by the payment processor are not considered a breach by us.",
        "If a chargeback is upheld following the dispute process, the relevant order is treated as cancelled, and we are entitled to deduct from any refund due or future charges any fees charged by the payment processor in connection with the dispute as well as currency conversion losses.",
      ],
    },
    {
      heading: "5. The difference between cancelling your subscription and a refund",
      blocks: [
        "Cancelling your subscription stops future charges: your subscription remains active until the end of the current billing cycle and will not be charged again in subsequent billing cycles. Cancellation is not the same as a refund; whether you qualify for a refund is determined under Sections 1 and 2 of this policy.",
        "You may cancel your subscription at any time by either of the following:",
        { list: [
          "Online (recommended): Account Settings → Subscription → Cancel Subscription;",
          "Email: send a cancellation request from your registered email to huiting.chen@outlook.com, and we will contact you and send a confirmation email as soon as possible.",
        ] },
        "After cancellation or deregistration, your account data will be retained for 90 days and then deleted or anonymised in accordance with the Privacy Policy.",
      ],
    },
    {
      heading: "6. Billing disputes and chargebacks",
      blocks: [
        "If you believe a charge is incorrect, please first email huiting.chen@outlook.com and contact us before raising a dispute with your bank. We undertake to respond within 2 business days and to resolve any confirmed billing error within 5 business days.",
        "In the event of a chargeback, we will cooperate with the payment processor's dispute process.",
      ],
    },
    {
      heading: "7. Refunds in the event of termination of the service",
      blocks: [
        "If we terminate the service for reasons other than your breach, we will refund the prepaid and unused portion on a pro-rata basis.",
        "If your account is terminated for breach of the Terms of Service or the acceptable use policy, you will not be entitled to any refund of fees already paid, and we reserve the right to recover all resulting losses and costs from you.",
      ],
    },
    {
      heading: "8. Reservation of statutory rights",
      blocks: [
        "This policy does not affect any non-vestable rights you hold under mandatory consumer protection and data protection laws of your habitual residence.",
      ],
    },
    {
      heading: "9. Updates to this policy",
      blocks: [
        "We may update this policy from time to time. Where a change constitutes a material adverse change, we will notify you by email and/or in-app notice at least 14 days before it takes effect; if you do not raise an objection before the effective date and continue to use the service, the change will be deemed accepted. If you do not agree, you may deregister your account at any time and receive a pro-rata refund of the prepaid and unused portion. Non-material changes (such as typographical corrections or clarifications) take effect immediately and the version history will be published on the Website.",
      ],
    },
    {
      heading: "10. Contact and language",
      blocks: [
        "If you have any questions about refunds, billing or cancelling your subscription, please contact:",
        { list: [
          "Refund requests: huiting.chen@outlook.com",
          "Billing enquiries: huiting.chen@outlook.com",
          "Cancellations: huiting.chen@outlook.com or via Account Settings",
        ] },
        "This policy is provided in both Chinese and English. In the event of any discrepancy between the two language versions, the English version shall prevail.",
        "Last updated: 2026-8-27 · Chen Huiting · dolphinquiz.com",
      ],
    },
  ],
};