/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * English version of the Cookie Policy. Based on Section 4 (Cookies and Tracking
 * Technologies) and Section 10 (Third-Party Service Providers) of the Privacy
 * Policy, in line with the finalised agreements and consistent with the Privacy
 * Policy and Terms of Service.
 */

import type { LegalDocumentContent } from "@/components/legal/legal-document";

export const cookiesEnContent: LegalDocumentContent = {
  title: "Cookie Policy",
  updated: "Last updated: 2026-8-27 (v1.0)",
  intro: [
    "Chen Huiting (\"CHT\", \"we\" or \"us\") uses cookies and similar tracking technologies on dolphinquiz.com (the \"Website\"). This policy explains what types of cookies we use, what they do, and how you can manage them.",
    "This policy is a companion to the Privacy Policy (https://dolphinquiz.com/privacy); the key terms concerning cookies and tracking technologies are set out in Section 4 of the Privacy Policy. By continuing to use the Website, you agree to the use of cookies as described in this policy. If you do not agree, please disable cookies through your browser settings (see Section 6).",
  ],
  sections: [
    {
      heading: "1. What are cookies and similar technologies",
      blocks: [
        "Cookies are small text files that websites store on your device (computer, phone or tablet) when you visit them. They are widely used to make websites work properly and to provide statistics to website operators.",
        "Similar technologies include local storage, pixel tags, web beacons and similar mechanisms. In this policy, all such technologies are collectively referred to as \"cookies\".",
      ],
    },
    {
      heading: "2. Types of cookies we use",
      blocks: [
        {
          headers: ["Type", "Purpose", "Can be disabled"],
          rows: [
            ["Strictly necessary", "Maintain login and core functionality", "No"],
            ["Functional", "Language preference, personalisation settings", "Yes"],
            ["Analytics", "Anonymous usage statistics, product improvement", "Yes"],
            ["Marketing (optional)", "Targeted advertising and performance measurement", "Yes"],
          ],
        },
        {
          heading: "2.1 Strictly necessary cookies",
          items: [
            "These cookies are essential for the Website to function properly. They are used to maintain login sessions, authentication, security protection (such as CSRF protection) and core functionality. You cannot disable these cookies; disabling them would prevent login and most features from working.",
          ],
        },
        {
          heading: "2.2 Functional cookies",
          items: [
            "These cookies remember your preferences (such as interface language and theme) and enhance your experience. You can disable these cookies, but your preferences may no longer be remembered after doing so.",
          ],
        },
        {
          heading: "2.3 Analytics cookies",
          items: [
            "These cookies collect anonymous usage statistics (such as page views and feature usage) to help us understand how the Website performs and improve our product. Analytics tools we use include Google Analytics, whose privacy policy is available at https://policies.google.com/privacy. You can disable these cookies.",
          ],
        },
        {
          heading: "2.4 Marketing cookies (optional)",
          items: [
            "These cookies are used for targeted advertising and performance measurement, and are only used with your consent. You can disable them or withdraw your consent at any time.",
          ],
        },
      ],
    },
    {
      heading: "3. Third-party cookies and service providers",
      blocks: [
        "The Website relies on the following third-party services, which may set their own cookies or otherwise process data:",
        { list: [
          "Web hosting and application services: Vercel;",
          "Database services: Neon;",
          "Email delivery services: Resend;",
          "Payment processing: Waffo Pancake - payment card data is handled exclusively by it and is not stored on our servers;",
          "Traffic analytics: Google Analytics;",
          "Third-party login: Google Sign-In services.",
        ] },
        "These third-party service providers may be located in the United States; see Section 10 of the Privacy Policy for the arrangements for cross-border data transfers. Each third party's handling of cookies and data is governed by its own privacy policy.",
      ],
    },
    {
      heading: "4. How to manage cookies",
      blocks: [
        {
          heading: "4.1 Browser settings",
          items: [
            "All major browsers allow you to manage, delete or block cookies. Management entry points in common browsers:",
            { list: [
              "Chrome: Settings → Privacy and security → Third-party cookies;",
              "Firefox: Settings → Privacy & Security → Cookies and Site Data;",
              "Safari: Settings → Privacy → Manage Website Data;",
              "Edge: Settings → Cookies and site permissions.",
            ] },
          ],
        },
        {
          heading: "4.2 Cookie preference centre",
          items: [
            "You can also adjust your cookie preferences (for example, disabling non-essential cookies) through your browser settings or our cookie preference centre.",
          ],
        },
        {
          heading: "4.3 Opting out of analytics cookies",
          items: [
            "To opt out of Google Analytics data collection, you can install the official Google Analytics opt-out browser add-on (https://tools.google.com/dlpage/gaoptout).",
          ],
        },
        {
          heading: "4.4 Withdrawing consent",
          items: [
            "For cookies set on the basis of your consent (such as marketing cookies), you may withdraw your consent at any time. Withdrawing consent does not affect the lawfulness of processing based on consent before the withdrawal.",
          ],
        },
      ],
    },
    {
      heading: "5. Consequences of disabling cookies",
      blocks: [
        { list: [
          "Strictly necessary cookies cannot be disabled;",
          "If you disable functional cookies, your language, theme and other preferences may not be remembered and will need to be set again on each visit;",
          "If you disable analytics cookies, we will still provide the service to you, but may be unable to continue improving the product experience;",
          "Disabling marketing cookies does not affect any functionality of the service.",
        ] },
      ],
    },
    {
      heading: "6. Updates to this policy",
      blocks: [
        "We may update this policy from time to time. Where a change constitutes a material adverse change, we will notify you by email or in-app notice at least 14 days before it takes effect; if you do not raise an objection before the effective date and continue to use the service, the change will be deemed accepted. Non-material changes take effect immediately and the version history will be published on the Website. We encourage you to review this policy periodically for the latest version.",
      ],
    },
    {
      heading: "7. Contact and language",
      blocks: [
        "If you have any questions about this policy or our use of cookies, please contact: huiting.chen@outlook.com.",
        "This policy is provided in both Chinese and English. In the event of any discrepancy between the two language versions, the English version shall prevail.",
        "Last updated: 2026-8-27 · Chen Huiting · dolphinquiz.com",
      ],
    },
  ],
};