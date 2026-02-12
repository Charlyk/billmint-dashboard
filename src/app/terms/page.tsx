import Link from "next/link";

export default function TermsOfServicePage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service - BillMint",
    "description": "Terms and conditions for using BillMint time tracking and invoicing platform.",
    "url": "https://billmint.io/terms",
    "isPartOf": {
      "@type": "WebSite",
      "name": "BillMint",
      "url": "https://billmint.io",
    },
    "dateModified": "2026-02-12",
    "publisher": {
      "@type": "Organization",
      "name": "BillMint",
      "url": "https://billmint.io",
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to home
      </Link>

      <h1 className="mt-8 text-4xl font-bold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: February 12, 2026
      </p>

      <div className="mt-10 space-y-10 text-muted-foreground leading-7">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p className="mt-3">
            By accessing or using BillMint (&quot;the Service&quot;), operated by
            BillMint (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), you
            agree to be bound by these Terms of Service (&quot;Terms&quot;) and
            our{" "}
            <Link
              href="/privacy"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              Privacy Policy
            </Link>
            . If you do not agree to these Terms, you may not access or use the
            Service.
          </p>
          <p className="mt-3">
            We reserve the right to update these Terms at any time. Material
            changes will be communicated by updating the &quot;Last updated&quot;
            date and, where appropriate, notifying you by email. Your continued
            use of the Service after any changes constitutes acceptance of the
            revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            2. Description of Service
          </h2>
          <p className="mt-3">
            BillMint is a time tracking and invoicing platform designed for
            freelancers and small teams. The Service allows you to track working
            hours, manage clients and projects, create and send professional
            invoices, generate reports, and process payments through integrated
            payment providers.
          </p>
          <p className="mt-3">
            We reserve the right to modify, suspend, or discontinue any part of
            the Service at any time, with or without notice. We will not be
            liable to you or any third party for any modification, suspension, or
            discontinuation of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            3. Account Registration and Security
          </h2>
          <p className="mt-3">
            To use certain features of the Service, you must create an account.
            When registering, you agree to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              Provide accurate, current, and complete information during
              registration
            </li>
            <li>
              Maintain and promptly update your account information to keep it
              accurate
            </li>
            <li>
              Maintain the confidentiality of your password and account
              credentials
            </li>
            <li>
              Accept responsibility for all activities that occur under your
              account
            </li>
            <li>
              Notify us immediately of any unauthorized use of your account or
              any other breach of security
            </li>
          </ul>
          <p className="mt-3">
            You may sign up using an email address and password, or through a
            third-party authentication provider (such as Google). You must be at
            least 16 years old to create an account. We reserve the right to
            suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            4. Subscription Plans and Pricing
          </h2>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            4.1 Plans
          </h3>
          <p className="mt-2">
            The Service offers multiple subscription tiers, including a free tier
            and paid plans. Features available to you depend on your subscription
            level. Details of current plans and pricing are available on our{" "}
            <Link
              href="/#pricing"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              pricing page
            </Link>
            .
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            4.2 Billing and Payment
          </h3>
          <p className="mt-2">
            Paid subscriptions are billed in advance on a monthly basis. Payments
            are processed securely through Stripe. By subscribing to a paid plan,
            you authorize us to charge your payment method on a recurring basis
            until you cancel. You are responsible for providing a valid payment
            method and keeping your billing information up to date.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            4.3 Price Changes
          </h3>
          <p className="mt-2">
            We may change our subscription pricing from time to time. Price
            changes will be communicated to you at least 30 days in advance and
            will apply at the start of your next billing cycle. If you do not
            agree with a price change, you may cancel your subscription before
            the change takes effect.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            4.4 Refunds
          </h3>
          <p className="mt-2">
            If you are not satisfied with the Service, you may request a full
            refund within the first 14 days of your initial paid subscription. To
            request a refund, contact us at{" "}
            <a
              href="mailto:support@billmint.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              support@billmint.com
            </a>
            . After the 14-day period, subscription fees are non-refundable.
            Partial-month refunds are not provided for cancellations made
            mid-billing cycle.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            4.5 Cancellation
          </h3>
          <p className="mt-2">
            You may cancel your subscription at any time through your account
            settings. Upon cancellation, your subscription will remain active
            until the end of your current billing period. After that, your
            account will revert to the free tier and you will retain access to
            your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            5. Acceptable Use
          </h2>
          <p className="mt-3">
            You agree to use the Service only for lawful purposes and in
            accordance with these Terms. You agree not to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              Use the Service for any purpose that is unlawful or prohibited by
              these Terms
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Service, its
              servers, or any systems or networks connected to the Service
            </li>
            <li>
              Interfere with, disrupt, or create an undue burden on the Service
              or its infrastructure
            </li>
            <li>
              Upload or transmit viruses, malware, or any other malicious or
              destructive code
            </li>
            <li>
              Use the Service to send unsolicited communications, spam, or bulk
              messages
            </li>
            <li>
              Reverse engineer, decompile, disassemble, or otherwise attempt to
              discover the source code of the Service
            </li>
            <li>
              Use automated means (bots, scrapers, crawlers) to access or
              interact with the Service without our written permission
            </li>
            <li>
              Impersonate any person or entity, or falsely state or
              misrepresent your affiliation with any person or entity
            </li>
            <li>
              Use the Service to store or transmit content that is defamatory,
              obscene, fraudulent, or that infringes the rights of others
            </li>
          </ul>
          <p className="mt-3">
            We reserve the right to investigate and take appropriate action
            against anyone who violates these provisions, including suspending or
            terminating their account and reporting to law enforcement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            6. Your Data and Content
          </h2>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            6.1 Ownership
          </h3>
          <p className="mt-2">
            You retain full ownership of all data and content you upload, create,
            or store within the Service, including but not limited to client
            information, time entries, invoices, project details, and reports
            (&quot;Your Data&quot;). We do not claim any ownership rights over
            Your Data.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            6.2 License to Us
          </h3>
          <p className="mt-2">
            By using the Service, you grant us a limited, non-exclusive,
            worldwide license to use, store, process, and display Your Data
            solely for the purpose of providing and improving the Service. This
            license ends when you delete Your Data or close your account.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            6.3 Data Portability
          </h3>
          <p className="mt-2">
            You may export Your Data at any time through the features provided in
            the Service or by contacting us. We will provide your data in a
            commonly used, machine-readable format upon request.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            6.4 Your Responsibility
          </h3>
          <p className="mt-2">
            You are solely responsible for the accuracy, quality, and legality of
            Your Data and for ensuring that your use of the Service complies with
            all applicable laws, including data protection and privacy laws that
            apply to the data of your clients.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            7. Intellectual Property
          </h2>
          <p className="mt-3">
            All content, features, functionality, design, code, graphics, logos,
            trademarks, and trade names of the Service are the exclusive property
            of BillMint and are protected by copyright, trademark, and other
            intellectual property laws. You may not copy, modify, distribute,
            sell, or lease any part of the Service or its content without our
            prior written consent.
          </p>
          <p className="mt-3">
            &quot;BillMint&quot; and the BillMint logo are trademarks of
            BillMint. You may not use our trademarks without our prior written
            permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            8. Privacy and Analytics
          </h2>
          <p className="mt-3">
            Your use of the Service is also governed by our{" "}
            <Link
              href="/privacy"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              Privacy Policy
            </Link>
            , which describes how we collect, use, and protect your personal
            information.
          </p>
          <p className="mt-3">
            By using the Service, you acknowledge and agree that we use cookies
            and analytics tools (including PostHog) to collect usage data,
            behavioral events, and session recordings to improve the Service. For
            more information on how we use cookies and tracking technologies,
            please see Section 4 of our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            9. Third-Party Services
          </h2>
          <p className="mt-3">
            The Service integrates with third-party services including Stripe for
            payment processing, Supabase for data storage, and Google for
            authentication. Your use of these third-party services is subject to
            their respective terms of service and privacy policies. We are not
            responsible for the practices or content of third-party services.
          </p>
          <p className="mt-3">
            The Service may contain links to third-party websites or resources
            that are not owned or controlled by us. We are not responsible for
            the content, privacy policies, or practices of any third-party
            websites.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            10. Disclaimer of Warranties
          </h2>
          <p className="mt-3">
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
            OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
            NON-INFRINGEMENT.
          </p>
          <p className="mt-3">
            We do not warrant that the Service will be uninterrupted, error-free,
            secure, or free of viruses or other harmful components. We do not
            warrant that the results obtained from use of the Service will be
            accurate or reliable. You use the Service at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            11. Limitation of Liability
          </h2>
          <p className="mt-3">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BILLMINT AND ITS
            OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, AND LICENSORS
            SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS
            OF PROFITS, DATA, BUSINESS OPPORTUNITIES, OR GOODWILL, ARISING OUT
            OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE,
            REGARDLESS OF THE CAUSE OF ACTION OR THE THEORY OF LIABILITY.
          </p>
          <p className="mt-3">
            OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR
            RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF
            (A) THE AMOUNTS YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING
            THE CLAIM, OR (B) ONE HUNDRED EUROS (&euro;100).
          </p>
          <p className="mt-3">
            Some jurisdictions do not allow the exclusion or limitation of
            certain damages. In such jurisdictions, our liability is limited to
            the maximum extent permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            12. Indemnification
          </h2>
          <p className="mt-3">
            You agree to indemnify, defend, and hold harmless BillMint and its
            officers, directors, employees, agents, and affiliates from and
            against any and all claims, damages, losses, liabilities, costs, and
            expenses (including reasonable attorney&apos;s fees) arising out of or
            related to: (a) your use of the Service; (b) your violation of these
            Terms; (c) your violation of any rights of another party, including
            your clients; or (d) Your Data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            13. Termination
          </h2>
          <p className="mt-3">
            We may suspend or terminate your access to the Service at any time,
            with or without cause, and with or without notice, including if we
            reasonably believe you have violated these Terms. Upon termination:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Your right to use the Service ceases immediately</li>
            <li>
              We may delete Your Data after a reasonable retention period (30
              days), unless required by law to retain it
            </li>
            <li>
              Provisions of these Terms that by their nature should survive
              termination will survive, including Sections 6, 7, 10, 11, 12, 14,
              and 15
            </li>
          </ul>
          <p className="mt-3">
            You may delete your account at any time through your account
            settings. Account deletion is permanent and cannot be undone after
            the 30-day recovery period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            14. Governing Law and Dispute Resolution
          </h2>
          <p className="mt-3">
            These Terms shall be governed by and construed in accordance with the
            laws of Romania, without regard to its conflict of law provisions.
            Any disputes arising under or in connection with these Terms shall be
            subject to the exclusive jurisdiction of the courts of Romania.
          </p>
          <p className="mt-3">
            Before filing any formal legal proceedings, you agree to first
            attempt to resolve any dispute informally by contacting us at{" "}
            <a
              href="mailto:legal@billmint.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              legal@billmint.com
            </a>
            . We will attempt to resolve the dispute within 30 days.
          </p>
          <p className="mt-3">
            If you are a consumer in the European Union, you may also be entitled
            to submit a dispute to the European Commission&apos;s Online Dispute
            Resolution (ODR) platform at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            15. General Provisions
          </h2>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            15.1 Entire Agreement
          </h3>
          <p className="mt-2">
            These Terms, together with the Privacy Policy, constitute the entire
            agreement between you and BillMint regarding your use of the Service
            and supersede all prior agreements and understandings.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            15.2 Severability
          </h3>
          <p className="mt-2">
            If any provision of these Terms is held to be invalid or
            unenforceable, that provision will be modified to the minimum extent
            necessary to make it enforceable, and the remaining provisions will
            continue in full force and effect.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            15.3 Waiver
          </h3>
          <p className="mt-2">
            Our failure to enforce any right or provision of these Terms will not
            be considered a waiver of that right or provision. A waiver of any
            default is not a waiver of any subsequent default.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            15.4 Assignment
          </h3>
          <p className="mt-2">
            You may not assign or transfer your rights or obligations under these
            Terms without our prior written consent. We may assign our rights and
            obligations without restriction.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            15.5 Force Majeure
          </h3>
          <p className="mt-2">
            We shall not be liable for any failure or delay in performing our
            obligations where such failure or delay results from circumstances
            beyond our reasonable control, including but not limited to natural
            disasters, acts of government, internet disruptions, or third-party
            service outages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            16. Contact Information
          </h2>
          <p className="mt-3">
            If you have any questions about these Terms of Service, please
            contact us at:
          </p>
          <ul className="mt-2 list-none space-y-1 pl-0">
            <li>
              Email:{" "}
              <a
                href="mailto:legal@billmint.com"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                legal@billmint.com
              </a>
            </li>
            <li>Website: BillMint.io</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
