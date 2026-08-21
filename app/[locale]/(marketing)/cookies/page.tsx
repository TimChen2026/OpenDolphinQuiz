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
    title: t('cookies.title'),
    description: t('cookies.description'),
    openGraph: {
      images: [t('cookies.ogImage')],
    },
  };
}

export default function CookiesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        
        <p className="text-muted-foreground mb-8">
          Effective Date: [Date]
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            [Your Company Name] ("[Company]", "we", "our", or "us") uses cookies and similar tracking technologies on our website and services. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.
          </p>
          <p>
            By continuing to use our website, you consent to our use of cookies as described in this policy. If you do not agree to our use of cookies, please adjust your browser settings or discontinue use of our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
          </p>
          <p className="mt-4">
            Similar technologies include web beacons, pixels, local storage, and other tracking technologies. Throughout this policy, we refer to all of these technologies collectively as "cookies."
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
          
          <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and accessibility. You cannot opt-out of these cookies.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Session cookies:</strong> Maintain your session state</li>
            <li><strong>Authentication cookies:</strong> Keep you signed in</li>
            <li><strong>Security cookies:</strong> Protect against CSRF attacks</li>
            <li><strong>Load balancing cookies:</strong> Distribute traffic across servers</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Functional Cookies</h3>
          <p>
            These cookies enable enhanced functionality and personalization. They may be set by us or third-party providers whose services we use.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Preference cookies:</strong> Remember your settings (language, theme)</li>
            <li><strong>Feature cookies:</strong> Enable specific features you've requested</li>
            <li><strong>Personalization cookies:</strong> Customize your experience</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Analytics and Performance Cookies</h3>
          <p>
            These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google Analytics:</strong> Track user behavior and site performance</li>
            <li><strong>Performance monitoring:</strong> Identify site speed issues</li>
            <li><strong>Error tracking:</strong> Log JavaScript errors and issues</li>
            <li><strong>A/B testing:</strong> Test different versions of pages</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Marketing and Advertising Cookies</h3>
          <p>
            These cookies may be set through our site by advertising partners to build a profile of your interests and show relevant ads on other sites.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Remarketing cookies:</strong> Show relevant ads on other platforms</li>
            <li><strong>Social media cookies:</strong> Enable social sharing features</li>
            <li><strong>Conversion tracking:</strong> Measure ad effectiveness</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Specific Cookies We Use</h2>
          <p>Here are the main cookies we use and their purposes:</p>
          
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-4 py-2 text-left">Cookie Name</th>
                  <th className="border border-border px-4 py-2 text-left">Purpose</th>
                  <th className="border border-border px-4 py-2 text-left">Duration</th>
                  <th className="border border-border px-4 py-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-2">session-token</td>
                  <td className="border border-border px-4 py-2">Authentication</td>
                  <td className="border border-border px-4 py-2">30 days</td>
                  <td className="border border-border px-4 py-2">Essential</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">csrf-token</td>
                  <td className="border border-border px-4 py-2">Security</td>
                  <td className="border border-border px-4 py-2">Session</td>
                  <td className="border border-border px-4 py-2">Essential</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">theme</td>
                  <td className="border border-border px-4 py-2">UI preferences</td>
                  <td className="border border-border px-4 py-2">1 year</td>
                  <td className="border border-border px-4 py-2">Functional</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">locale</td>
                  <td className="border border-border px-4 py-2">Language preference</td>
                  <td className="border border-border px-4 py-2">1 year</td>
                  <td className="border border-border px-4 py-2">Functional</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">_ga, _gid</td>
                  <td className="border border-border px-4 py-2">Google Analytics</td>
                  <td className="border border-border px-4 py-2">2 years / 24 hours</td>
                  <td className="border border-border px-4 py-2">Analytics</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Cookies</h2>
          <p>
            We may use third-party services that set their own cookies, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Authentication providers:</strong> Google, GitHub OAuth services</li>
            <li><strong>Payment processors:</strong> Creem payment services</li>
            <li><strong>Analytics providers:</strong> Google Analytics, monitoring services</li>
            <li><strong>Content delivery networks:</strong> Cloudflare, CDN services</li>
            <li><strong>Customer support:</strong> Support widget and chat services</li>
          </ul>
          <p className="mt-4">
            These third parties have their own privacy policies addressing how they use such information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Cookie Choices</h2>
          
          <h3 className="text-xl font-semibold mb-3">Browser Settings</h3>
          <p>
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>View what cookies are stored on your device</li>
            <li>Delete cookies individually or entirely</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies from specific websites</li>
            <li>Block all cookies entirely</li>
            <li>Set preferences for specific websites</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Cookie Management Instructions</h3>
          <p>Here are links to cookie management instructions for popular browsers:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
            <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
            <li><strong>Opera:</strong> Settings → Advanced → Privacy & security → Cookies</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Opt-Out Options</h3>
          <p>
            You can opt-out of specific types of cookies:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google Analytics:</strong> Install the Google Analytics Opt-out Browser Add-on</li>
            <li><strong>Advertising cookies:</strong> Visit <a href="https://optout.aboutads.info" className="text-blue-600 hover:underline">optout.aboutads.info</a></li>
            <li><strong>European users:</strong> Visit <a href="https://www.youronlinechoices.eu" className="text-blue-600 hover:underline">www.youronlinechoices.eu</a></li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">Do Not Track</h3>
          <p>
            Some browsers offer a "Do Not Track" (DNT) setting. We currently do not respond to DNT signals, but we respect your cookie choices as described above.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Impact of Disabling Cookies</h2>
          <p>
            Please note that if you choose to block or delete cookies:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Some parts of our website may not function properly</li>
            <li>You may not be able to access certain features</li>
            <li>You may need to re-enter information more frequently</li>
            <li>Your preferences may not be saved</li>
            <li>You may need to manually adjust settings each visit</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Cookie Policy for Mobile Apps</h2>
          <p>
            If we offer mobile applications, they may use similar tracking technologies. Mobile platforms provide device-level settings to control these technologies. Please refer to your device manufacturer's instructions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Updates to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will post any changes on this page with an updated effective date.
          </p>
          <p className="mt-4">
            We encourage you to review this Cookie Policy periodically to stay informed about our use of cookies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p>
            If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
          </p>
          <ul className="list-none space-y-2 mt-4">
            <li>Email: [Privacy Email]</li>
            <li>Support: [Support Email]</li>
            <li>Website: [Your Website]</li>
            <li>Address: [Your Address]</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
