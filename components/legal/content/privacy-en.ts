/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Privacy Policy (English, Revised v2). Content is identical to the docx in
 * the agreements folder; do not modify the wording.
 */

import type { LegalDocumentContent } from "@/components/legal/legal-document";

export const privacyEnContent: LegalDocumentContent = {
  title: "Privacy Policy",
  updated: "Last updated: 2026-8-26 (v2.0)",
  intro: [
    "Chen Huiting (\"CHT\", \"we\", \"us\", or \"me\") respects and protects your privacy. This Privacy Policy (this \"Policy\") explains how we collect, use, store, and share your personal information when you use DolphinQuiz (the \"Service\"), and the rights you have under applicable law.",
    "Please read this Policy carefully before using the Service. By using the Service, you confirm that you have read and agree to this Policy. We may update this Policy from time to time; the effect of updates is governed by Section 12.",
  ],
  sections: [
    {
      heading: "1. Data Controller, Identity Statement, and Scope",
      blocks: [
        "The data controller of the Service is:",
        "Name: Chen Huiting (CHT)",
        "Status: an individual operating the Service as an individual developer, based in the Hong Kong Special Administrative Region of China, with service infrastructure (website hosting, database, email, payment processing) located outside the mainland territory of the People's Republic of China",
        "Privacy contact email: huiting.chen@outlook.com",
        "Data Protection Officer (DPO): not appointed at this time (as an individual developer, the data processing affairs are currently handled directly by me)",
        "EU representative: not yet appointed under Article 27 of the GDPR; we will appoint one when the applicable threshold is met and update this Policy.",
        "Special statement: you acknowledge that CHT provides the Service as an individual developer and is not a registered company or legal entity. As data controller, CHT processes personal data strictly within the scope and in the manner disclosed in this Policy.",
        "Scope: this Policy applies to two categories of data subjects: (a) registered users (education institutions and their staff); and (b) quiz respondents (Guests) — potential customers who submit names, contact details, and other information through user quizzes. Respondent information is collected by the quiz operator (our user) as an independent controller, and we act as a processor in accordance with Section 11.5 of the Terms of Service.",
      ],
    },
    {
      heading: "2. Personal Information We Collect",
      blocks: [
        {
          heading: "2.1 Information Provided by Registered Users",
          items: [
            "Account information: name, email address, password (stored as an encrypted hash), phone number, team/company name.",
            "Payment information: transaction amount, payment status, transaction time. We do not store full card numbers — card data is handled exclusively by the payment processor Waffo Pancake (see Section 5).",
            "Communication records: emails, tickets, and feedback you send to support.",
            "Other business-related fields: such as your institution name and job title.",
          ],
        },
        {
          heading: "2.2 Information Submitted by Quiz Respondents (Guests)",
          items: [
            "Information submitted through user quizzes: such as name, contact details, education-stage preferences, and other fields configured in the quiz. The scope of collection is determined by the quiz operator, who is responsible for establishing a lawful basis; we merely store and display the information on their instructions.",
          ],
        },
        {
          heading: "2.3 Information Collected Automatically",
          items: [
            { list: [
              "Device and network: IP address, device model, operating system, browser type, time zone.",
              "Usage behavior: page views, feature usage, operation logs, session duration.",
              "Log data: request time, error logs, performance data.",
              "Location information: collected with your consent, used to improve service experience.",
              "Third-party sign-in: basic profile information authorized when you sign in with Google.",
            ] },
          ],
        },
      ],
    },
    {
      heading: "3. How We Use Your Personal Information",
      blocks: [
        {
          headers: ["Purpose", "Legal Basis (GDPR)"],
          rows: [
            ["Providing and maintaining the Service", "Contract performance"],
            ["Billing and payment processing", "Contract performance"],
            ["Customer support", "Contract performance / legitimate interests"],
            ["Service notifications (billing, security, policy updates)", "Contract performance / legitimate interests"],
            ["Security and fraud prevention", "Legitimate interests / legal obligation"],
            ["Product optimization and analytics", "Legitimate interests / consent"],
            ["Legal compliance", "Legal obligation"],
            ["Marketing communications (optional)", "Consent"],
          ],
        },
        "If you are located in the People's Republic of China, the processing of your personal information is also carried out under the corresponding legal bases of the Personal Information Protection Law of the PRC.",
        "We may aggregate or de-identify data for statistical analysis. Such data cannot be linked to a specific individual.",
      ],
    },
    {
      heading: "4. Cookies and Tracking Technologies",
      blocks: [
        {
          headers: ["Type", "Purpose", "Can be disabled"],
          rows: [
            ["Strictly necessary", "Maintaining login and core functionality", "No"],
            ["Functional", "Language preferences, personalization", "Yes"],
            ["Analytics", "Anonymous usage statistics, product optimization", "Yes"],
            ["Marketing (optional)", "Targeted advertising and measurement", "Yes"],
          ],
        },
        "Analytics tools used: Google Analytics and similar; Google Analytics Privacy Policy: https://policies.google.com/privacy",
        "You can adjust your preferences through your browser settings or our Cookie management center.",
      ],
    },
    {
      heading: "5. Sharing and Disclosure of Personal Information",
      blocks: [
        "We do not sell your personal information, including \"sale\" as defined by applicable law (e.g., CCPA).",
        "We share your information only in the following circumstances:",
        { list: [
          "Service providers: hosting, database, email, payment, and analytics vendors, bound by confidentiality and data protection undertakings. Payment card data is handled exclusively by the payment processor Waffo Pancake and is not stored on our servers.",
          "Legal and regulatory requirements: pursuant to law, court orders, or lawful requests from competent authorities.",
          "Business transactions: in the event of a merger or acquisition, we will notify you in advance and ensure the continuation of protection obligations.",
          "With your consent: for other purposes upon your explicit prior consent.",
        ] },
      ],
    },
    {
      heading: "6. Data Security Measures",
      blocks: [
        { list: [
          "Encryption in transit: TLS / HTTPS.",
          "Storage security: sensitive data such as passwords are encrypted or hashed.",
          "Access control: principle of least privilege.",
          "Periodic security audits and vulnerability scans.",
        ] },
        "In the event of a security incident affecting your personal data, we will, in accordance with Articles 33 and 34 of the GDPR, report to the relevant supervisory authority within 72 hours of becoming aware and notify affected individuals where there is a high risk; for security incidents involving respondent data, we will notify the relevant quiz operator (user) within 72 hours and assist them in fulfilling their notification obligations.",
        "Please keep your account credentials safe and do not share them with others.",
      ],
    },
    {
      heading: "7. Retention Periods",
      blocks: [
        "After account deletion or subscription cancellation, your account data will be deleted or anonymized within 90 days.",
        {
          headers: ["Data type", "Retention period", "Disposal at expiry"],
          rows: [
            ["Account information", "During the term of use; 90 days after deletion", "Deleted or anonymized"],
            ["Respondent data", "While the quiz exists; 90 days after quiz deletion or user account deletion", "Deleted or anonymized"],
            ["Transaction records", "Only the minimum period required by applicable accounting/tax law, and only the minimum necessary fields", "Deleted"],
            ["Support records", "90 days after account deletion", "Securely deleted"],
            ["Security audit logs", "6 months", "Securely deleted"],
          ],
        },
      ],
    },
    {
      heading: "8. Your Data Rights",
      blocks: [
        "To exercise the following rights, contact us at huiting.chen@outlook.com; we will respond within 30 calendar days. Quiz respondents may also contact us directly regarding information they have submitted, and we will notify the relevant quiz operator to handle the request.",
        {
          headers: ["Right", "Description"],
          rows: [
            ["Right to information", "Know what data we collect and use"],
            ["Right of access", "Obtain a copy of your personal information"],
            ["Right to rectification", "Correct inaccurate or incomplete information"],
            ["Right to erasure", "Request deletion of data under specified conditions"],
            ["Right to restriction", "Request suspension of processing in specified circumstances"],
            ["Right to portability", "Obtain your data in a machine-readable format"],
            ["Right to object", "Object to processing based on legitimate interests or for marketing"],
            ["Right to withdraw consent", "Withdraw consent-based processing authorization"],
          ],
        },
        "If you believe we have not handled your request properly, you have the right to lodge a complaint with the data protection authority of your jurisdiction.",
      ],
    },
    {
      heading: "9. Marketing Communications and Unsubscribing",
      blocks: [
        "With your consent, we may send marketing messages by email, SMS, or in-app notification.",
        "You may unsubscribe at any time: click the unsubscribe link in any email; disable marketing preferences in account settings; or contact huiting.chen@outlook.com.",
        "Service-essential notifications (billing, security, policy updates) are not affected by marketing unsubscription.",
      ],
    },
    {
      heading: "10. International Data Transfers",
      blocks: [
        "Our Service relies on the following third-party service providers; your data may be transferred to and stored in their countries/regions:",
        "Website hosting and application services: Vercel (United States); database services: Neon (United States); email delivery services: Resend (United States); payment processing: Waffo Pancake (as described in its privacy policy); traffic analytics: Google Analytics (United States).",
        "For services offered to you from the EU/EEA or the UK, we transfer data on the basis of the European Commission's Standard Contractual Clauses (SCCs); where appropriate, we also rely on the EU-US Data Privacy Framework (DPF). We have not yet completed SCC execution with all recipients, nor have we appointed an EU representative under Article 27 of the GDPR; we will complete these arrangements as the business scales, and in the meantime continue to take commercially reasonable measures to ensure a level of data protection no lower than that required by applicable law.",
        "Where data transfers occur to Brazil, Switzerland, or other jurisdictions with localization requirements, the transfer mechanisms required by local law apply.",
      ],
    },
    {
      heading: "11. Children and Minors",
      blocks: [
        "The Service is aimed at education institutions, and their quizzes may involve information about minor students or their parents. We do not knowingly collect personal information from minors.",
        "Where a quiz is designed to collect information from minors below the applicable digital age of consent in the relevant jurisdiction (16 in most EU member states; subject to local law), the quiz operator (user) must ensure that consent has been obtained from the parents or guardians and that a link to a privacy notice is provided at the start of the quiz or on the information-entry page.",
        "Quiz operators should avoid collecting special categories of information — such as racial or ethnic origin, health status, or religious beliefs — through quizzes, unless they have a clear lawful basis and appropriate safeguards in place.",
        "If we discover that minors' information has been collected without the necessary consent, we will delete that information. If you are a parent or guardian and believe your child has provided personal information to us or to our users, please contact huiting.chen@outlook.com.",
      ],
    },
    {
      heading: "12. Updates to This Policy",
      blocks: [
        "We may update this Policy from time to time. Materially adverse changes will be notified to you by email or in-app notification at least 14 days before taking effect; if you do not object before the effective date and continue to use the Service, you are deemed to have accepted them. Non-material changes take effect immediately, with a version history published on the website. We recommend that you review this Policy regularly for the latest version.",
      ],
    },
    {
      heading: "13. Language Precedence and Contact",
      blocks: [
        "This Policy is provided in both Chinese and English versions. In case of any discrepancy between the two versions, the English version shall prevail.",
        "If you have any questions, comments, or requests regarding this Policy, please contact:",
        { list: [
          "Privacy contact email: huiting.chen@outlook.com",
          "General support: huiting.chen@outlook.com",
        ] },
        "Last updated: 2026-8-26 · Chen Huiting · dolphinquiz.com",
      ],
    },
  ],
};
