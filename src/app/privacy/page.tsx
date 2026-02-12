import Link from "next/link";

export default function PrivacyPolicyPage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - BillMint",
    "description": "BillMint privacy policy. Learn how we protect your time tracking and invoicing data.",
    "url": "https://billmint.io/privacy",
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
    "image": "https://billmint.io/billmint_og.png",
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
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: February 12, 2026
      </p>

      <div className="mt-10 space-y-10 text-muted-foreground leading-7">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            1. Introduction
          </h2>
          <p className="mt-3">
            BillMint (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
            operates the BillMint.io website and platform (the
            &quot;Service&quot;). This Privacy Policy explains how we collect,
            use, disclose, and protect your personal information when you visit
            our website, create an account, or use our Service.
          </p>
          <p className="mt-3">
            By using the Service, you consent to the data practices described in
            this Privacy Policy. If you do not agree with these practices, please
            do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            2. Information We Collect
          </h2>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            2.1 Information You Provide
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Account information:</strong>{" "}
              name, email address, and password when you create an account, or
              your Google account profile information if you sign in with Google
            </li>
            <li>
              <strong className="text-foreground">Billing information:</strong>{" "}
              payment card details and billing address, processed securely by our
              payment provider Stripe. We do not store your full card number on
              our servers.
            </li>
            <li>
              <strong className="text-foreground">Business data:</strong> client
              names, contact information, project details, time tracking entries,
              invoices, hourly rates, and reports you create within the Service
            </li>
            <li>
              <strong className="text-foreground">Communications:</strong>{" "}
              information you provide when contacting us for support or feedback
            </li>
          </ul>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            2.2 Information Collected Automatically
          </h3>
          <p className="mt-2">
            When you access or use the Service, we automatically collect:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Device information:</strong>{" "}
              browser type and version, operating system, device type, screen
              resolution, and language preferences
            </li>
            <li>
              <strong className="text-foreground">Usage data:</strong> pages
              visited, features used, buttons clicked, time spent on pages,
              navigation patterns, and referring URLs
            </li>
            <li>
              <strong className="text-foreground">Session recordings:</strong>{" "}
              we may record your interactions with the Service (such as mouse
              movements, clicks, scrolls, and page content) to understand how
              users interact with our product and to improve the user experience.
              Sensitive form fields (such as passwords and payment details) are
              automatically masked and are not captured in recordings.
            </li>
            <li>
              <strong className="text-foreground">Log data:</strong> IP address,
              request timestamps, API response codes, and error information for
              debugging and security purposes
            </li>
            <li>
              <strong className="text-foreground">Location data:</strong>{" "}
              approximate geographic location derived from your IP address and
              timezone settings
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            3. How We Use Your Information
          </h2>
          <p className="mt-3">We use the information we collect to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              Provide, operate, and maintain the Service, including time
              tracking, invoicing, and payment processing
            </li>
            <li>
              Create and manage your account, authenticate your identity, and
              maintain session security
            </li>
            <li>
              Process subscription payments, manage billing cycles, and send
              transaction-related communications
            </li>
            <li>
              Send you service-related emails including account verification,
              password reset, invoice delivery, and subscription notifications
            </li>
            <li>
              Analyze usage patterns and user behavior to improve the
              Service&apos;s features, performance, and user experience
            </li>
            <li>
              Monitor and debug technical issues using structured logs and error
              tracking
            </li>
            <li>
              Detect, prevent, and address fraud, abuse, security incidents, and
              technical problems
            </li>
            <li>
              Comply with legal obligations and enforce our Terms of Service
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            4. Cookies and Tracking Technologies
          </h2>
          <p className="mt-3">
            We use cookies and similar tracking technologies to collect and store
            information when you use the Service. Cookies are small data files
            placed on your device by your web browser.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            4.1 Types of Cookies We Use
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">
                Essential cookies (strictly necessary):
              </strong>{" "}
              required for basic functionality such as authentication, session
              management, and security. These cannot be disabled without breaking
              core features.
            </li>
            <li>
              <strong className="text-foreground">Analytics cookies:</strong>{" "}
              used by our analytics provider (PostHog) to understand how visitors
              interact with the Service. These cookies track page views, feature
              usage, and user journeys across sessions. They help us identify
              which features are most used and where users encounter issues.
            </li>
            <li>
              <strong className="text-foreground">
                Session replay cookies:
              </strong>{" "}
              used to record and replay user sessions to understand user
              interactions. These cookies enable us to see how users navigate the
              Service so we can improve the experience.
            </li>
          </ul>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            4.2 Managing Cookies
          </h3>
          <p className="mt-2">
            Most web browsers allow you to control cookies through their settings
            preferences. You can configure your browser to refuse all cookies or
            to indicate when a cookie is being sent. However, if you disable
            essential cookies, some parts of the Service may not function
            properly. You may also opt out of PostHog tracking by enabling your
            browser&apos;s &quot;Do Not Track&quot; setting or by using a
            browser-based opt-out mechanism.
          </p>

          <h3 className="mt-4 text-lg font-medium text-foreground">
            4.3 Do Not Track Signals
          </h3>
          <p className="mt-2">
            We honor Do Not Track (DNT) browser signals. When DNT is enabled,
            our analytics tools will not track your activity.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            5. Third-Party Service Providers
          </h2>
          <p className="mt-3">
            We use trusted third-party service providers to operate the Service.
            These providers may have access to your personal information only to
            perform specific tasks on our behalf and are obligated to protect it.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Supabase:</strong>{" "}
              authentication and database services. Stores your account data,
              business data, and application data. Data is encrypted at rest and
              in transit.
            </li>
            <li>
              <strong className="text-foreground">Stripe:</strong> payment
              processing. Handles all credit card and subscription billing
              securely. Stripe is PCI-DSS Level 1 compliant. See{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-foreground">PostHog:</strong> product
              analytics and session recording. Collects usage data, behavioral
              events, and session recordings to help us improve the product.
              PostHog may create user profiles based on your activity. See{" "}
              <a
                href="https://posthog.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                PostHog&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-foreground">Axiom:</strong> application
              logging and monitoring. Receives structured log data for debugging
              and performance monitoring. Logs are sanitized to remove personally
              identifiable information (PII) before transmission.
            </li>
            <li>
              <strong className="text-foreground">Vercel:</strong> hosting and
              content delivery. Serves the application and may process request
              metadata (IP addresses, headers) as part of normal web hosting. See{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                Vercel&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-foreground">Google:</strong> OAuth
              authentication. If you choose to sign in with Google, we receive
              your name, email address, and profile picture from Google. See{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            6. Data Sharing and Disclosure
          </h2>
          <p className="mt-3">
            We do not sell, rent, or trade your personal information to third
            parties. We may share your information only in the following
            circumstances:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Service providers:</strong>{" "}
              with the third-party vendors listed in Section 5, solely for the
              purpose of providing the Service
            </li>
            <li>
              <strong className="text-foreground">Legal requirements:</strong>{" "}
              when required by applicable law, regulation, subpoena, court order,
              or other legal process
            </li>
            <li>
              <strong className="text-foreground">Safety and protection:</strong>{" "}
              to protect the rights, property, or safety of BillMint, our users,
              or the public, including to enforce our Terms of Service and
              prevent fraud
            </li>
            <li>
              <strong className="text-foreground">Business transfers:</strong> in
              connection with a merger, acquisition, reorganization, bankruptcy,
              or sale of all or a portion of our assets, in which case your
              personal information may be transferred to the acquiring entity
            </li>
            <li>
              <strong className="text-foreground">With your consent:</strong>{" "}
              when you have given us explicit permission to share your
              information for a specific purpose
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            7. Data Security
          </h2>
          <p className="mt-3">
            We implement appropriate technical and organizational measures to
            protect your personal information, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Encryption of data in transit using TLS/SSL</li>
            <li>Encryption of data at rest in our database systems</li>
            <li>
              PII sanitization in application logs to prevent accidental exposure
            </li>
            <li>
              Secure authentication with hashed passwords and session management
            </li>
            <li>
              Regular security monitoring through structured logging and error
              tracking
            </li>
            <li>
              Payment information handled exclusively by PCI-DSS Level 1
              compliant Stripe
            </li>
          </ul>
          <p className="mt-3">
            While we strive to protect your personal information, no method of
            transmission over the internet or electronic storage is 100% secure.
            We cannot guarantee absolute security but are committed to promptly
            addressing any security incidents.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            8. Data Retention
          </h2>
          <p className="mt-3">
            We retain your personal information for as long as your account is
            active or as needed to provide you with the Service. Specifically:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Account data:</strong> retained
              while your account is active and for 30 days after account deletion
              to allow for recovery
            </li>
            <li>
              <strong className="text-foreground">Business data:</strong> time
              entries, invoices, clients, and projects are deleted when you
              delete your account
            </li>
            <li>
              <strong className="text-foreground">Payment records:</strong>{" "}
              transaction records may be retained as required by financial
              regulations and tax law
            </li>
            <li>
              <strong className="text-foreground">Analytics data:</strong>{" "}
              aggregated and anonymized usage data may be retained indefinitely
              for product improvement purposes
            </li>
            <li>
              <strong className="text-foreground">Log data:</strong> application
              logs are retained for up to 30 days for debugging purposes and are
              then automatically purged
            </li>
          </ul>
          <p className="mt-3">
            When you delete your account, we will delete or anonymize your
            personal data within 30 days, except where retention is required by
            law or for legitimate business purposes (such as fraud prevention).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            9. Your Rights
          </h2>
          <p className="mt-3">
            Depending on your location, you may have the following rights
            regarding your personal data:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Right of access:</strong>{" "}
              request a copy of the personal data we hold about you
            </li>
            <li>
              <strong className="text-foreground">Right to rectification:</strong>{" "}
              request correction of inaccurate or incomplete data
            </li>
            <li>
              <strong className="text-foreground">Right to erasure:</strong>{" "}
              request deletion of your personal data (&quot;right to be
              forgotten&quot;)
            </li>
            <li>
              <strong className="text-foreground">
                Right to restrict processing:
              </strong>{" "}
              request that we limit the processing of your data in certain
              circumstances
            </li>
            <li>
              <strong className="text-foreground">
                Right to data portability:
              </strong>{" "}
              request a copy of your data in a structured, commonly used,
              machine-readable format
            </li>
            <li>
              <strong className="text-foreground">Right to object:</strong>{" "}
              object to the processing of your personal data for certain purposes,
              including direct marketing and profiling
            </li>
            <li>
              <strong className="text-foreground">
                Right to withdraw consent:
              </strong>{" "}
              where processing is based on consent, you may withdraw it at any
              time without affecting the lawfulness of prior processing
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us at{" "}
            <a
              href="mailto:privacy@billmint.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              privacy@billmint.com
            </a>
            . We will respond to your request within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            10. International Data Transfers
          </h2>
          <p className="mt-3">
            Your information may be transferred to and processed in countries
            other than your country of residence. Our service providers
            (including Supabase, Stripe, PostHog, Axiom, and Vercel) may store
            and process data in the United States or other jurisdictions. By
            using the Service, you consent to the transfer of your information to
            these countries, which may have different data protection laws than
            your jurisdiction.
          </p>
          <p className="mt-3">
            Where required by applicable law, we ensure appropriate safeguards
            are in place for international data transfers, such as Standard
            Contractual Clauses approved by the European Commission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            11. Legal Basis for Processing (EEA/UK Users)
          </h2>
          <p className="mt-3">
            If you are located in the European Economic Area (EEA) or the United
            Kingdom, our legal basis for processing your personal information
            includes:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">
                Performance of a contract:
              </strong>{" "}
              processing necessary to provide the Service you requested
              (account management, time tracking, invoicing, payment processing)
            </li>
            <li>
              <strong className="text-foreground">Legitimate interests:</strong>{" "}
              processing necessary for our legitimate business interests, such as
              product analytics, fraud prevention, security monitoring, and
              improving the Service, where these interests are not overridden by
              your rights
            </li>
            <li>
              <strong className="text-foreground">Consent:</strong> where you
              have given specific consent for a particular purpose, such as
              receiving marketing communications
            </li>
            <li>
              <strong className="text-foreground">Legal obligation:</strong>{" "}
              processing necessary to comply with applicable laws and regulations
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            12. Children&apos;s Privacy
          </h2>
          <p className="mt-3">
            The Service is not intended for children under the age of 16. We do
            not knowingly collect personal information from children under 16. If
            we become aware that we have collected personal data from a child
            under 16, we will take immediate steps to delete that information. If
            you believe we have inadvertently collected information from a child
            under 16, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            13. Changes to This Policy
          </h2>
          <p className="mt-3">
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or applicable law. We will notify you of
            material changes by posting the updated policy on this page and
            updating the &quot;Last updated&quot; date at the top. For
            significant changes, we may also send you a notification via email.
            Your continued use of the Service after changes are posted
            constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            14. Contact Information
          </h2>
          <p className="mt-3">
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or our data practices, please contact us at:
          </p>
          <ul className="mt-2 list-none space-y-1 pl-0">
            <li>
              Email:{" "}
              <a
                href="mailto:privacy@billmint.com"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                privacy@billmint.com
              </a>
            </li>
            <li>Website: BillMint.io</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
