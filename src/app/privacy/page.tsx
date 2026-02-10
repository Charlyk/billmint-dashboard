import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
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
        Last updated: February 10, 2026
      </p>

      <div className="mt-10 space-y-10 text-muted-foreground leading-7">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            1. Introduction
          </h2>
          <p className="mt-3">
            BillMint (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is
            committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when
            you use our billing and invoicing platform (&quot;the Service&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <p className="mt-3">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Account information:</strong>{" "}
              name, email address, and password when you create an account
            </li>
            <li>
              <strong className="text-foreground">Billing information:</strong>{" "}
              payment method details processed securely through our payment
              provider (Stripe)
            </li>
            <li>
              <strong className="text-foreground">Client data:</strong> client
              names, contact information, and project details you enter into the
              Service
            </li>
            <li>
              <strong className="text-foreground">Usage data:</strong> time
              tracking entries, invoices, and reports you generate
            </li>
          </ul>
          <p className="mt-3">
            We also automatically collect certain information when you use the
            Service, such as your IP address, browser type, operating system, and
            pages visited.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            3. How We Use Your Information
          </h2>
          <p className="mt-3">We use the information we collect to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Provide, maintain, and improve the Service</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>
              Monitor and analyze trends, usage, and activities in connection
              with the Service
            </li>
            <li>
              Detect, investigate, and prevent fraudulent transactions and other
              illegal activities
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            4. Data Sharing &amp; Disclosure
          </h2>
          <p className="mt-3">
            We do not sell your personal information. We may share your
            information only in the following circumstances:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Service providers:</strong>{" "}
              with third-party vendors who assist us in operating the Service
              (e.g., payment processing, hosting)
            </li>
            <li>
              <strong className="text-foreground">Legal requirements:</strong>{" "}
              when required by law, regulation, or legal process
            </li>
            <li>
              <strong className="text-foreground">Protection of rights:</strong>{" "}
              to protect the rights, property, or safety of BillMint, our users,
              or the public
            </li>
            <li>
              <strong className="text-foreground">Business transfers:</strong>{" "}
              in connection with a merger, acquisition, or sale of assets
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            5. Data Security
          </h2>
          <p className="mt-3">
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. However, no method of
            transmission over the internet or electronic storage is completely
            secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            6. Data Retention
          </h2>
          <p className="mt-3">
            We retain your personal information for as long as your account is
            active or as needed to provide you with the Service. We may also
            retain and use your information to comply with legal obligations,
            resolve disputes, and enforce our agreements. When you delete your
            account, we will delete or anonymize your personal data within 30
            days, except where retention is required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            7. Your Rights
          </h2>
          <p className="mt-3">
            Depending on your location, you may have the following rights
            regarding your personal data:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong className="text-foreground">Access:</strong> request a copy
              of the personal data we hold about you
            </li>
            <li>
              <strong className="text-foreground">Correction:</strong> request
              that we correct inaccurate or incomplete data
            </li>
            <li>
              <strong className="text-foreground">Deletion:</strong> request that
              we delete your personal data
            </li>
            <li>
              <strong className="text-foreground">Portability:</strong> request a
              portable copy of your data in a structured format
            </li>
            <li>
              <strong className="text-foreground">Objection:</strong> object to
              the processing of your personal data in certain circumstances
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us using the
            information provided below.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            8. Cookies &amp; Tracking
          </h2>
          <p className="mt-3">
            We use essential cookies to keep you signed in and to remember your
            preferences. We do not use third-party advertising cookies. You can
            configure your browser to refuse cookies, but some features of the
            Service may not function properly without them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            9. Third-Party Services
          </h2>
          <p className="mt-3">
            The Service may contain links to third-party websites or integrate
            with third-party services (such as Stripe for payment processing).
            We are not responsible for the privacy practices of these third
            parties. We encourage you to review their privacy policies before
            providing any personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            10. Children&apos;s Privacy
          </h2>
          <p className="mt-3">
            The Service is not intended for children under the age of 16. We do
            not knowingly collect personal information from children. If we
            become aware that we have collected data from a child under 16, we
            will take steps to delete that information promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            11. Changes to This Policy
          </h2>
          <p className="mt-3">
            We may update this Privacy Policy from time to time. We will notify
            you of material changes by posting the updated policy on this page
            and updating the &quot;Last updated&quot; date. Your continued use of
            the Service after changes are posted constitutes acceptance of the
            revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            12. Contact Information
          </h2>
          <p className="mt-3">
            If you have any questions about this Privacy Policy or our data
            practices, please contact us at{" "}
            <a
              href="mailto:privacy@billmint.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              privacy@billmint.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
