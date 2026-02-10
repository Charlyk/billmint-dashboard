import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
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
        Last updated: February 10, 2026
      </p>

      <div className="mt-10 space-y-10 text-muted-foreground leading-7">
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p className="mt-3">
            By accessing or using BillMint (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, you may not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            2. Description of Service
          </h2>
          <p className="mt-3">
            BillMint is a billing and invoicing platform that helps freelancers
            and businesses manage clients, track time, generate invoices, and
            process payments. We reserve the right to modify, suspend, or
            discontinue any part of the Service at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            3. User Accounts &amp; Responsibilities
          </h2>
          <p className="mt-3">
            You are responsible for maintaining the confidentiality of your
            account credentials. You agree to provide accurate and complete
            information when creating your account and to keep that information
            up to date. You are solely responsible for all activity that occurs
            under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            4. Acceptable Use
          </h2>
          <p className="mt-3">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Use the Service for any unlawful purpose</li>
            <li>
              Attempt to gain unauthorized access to any part of the Service
            </li>
            <li>Interfere with or disrupt the integrity of the Service</li>
            <li>
              Upload or transmit viruses, malware, or other malicious code
            </li>
            <li>
              Use the Service to send unsolicited communications or spam
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            5. Intellectual Property
          </h2>
          <p className="mt-3">
            All content, features, and functionality of the Service — including
            but not limited to text, graphics, logos, and software — are the
            exclusive property of BillMint and are protected by copyright,
            trademark, and other intellectual property laws. You retain ownership
            of any data you upload to the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            6. Payment &amp; Billing
          </h2>
          <p className="mt-3">
            Certain features of the Service require a paid subscription. By
            subscribing, you agree to pay the applicable fees. All fees are
            non-refundable unless otherwise stated. We may change our pricing
            with reasonable notice. Continued use of the Service after a price
            change constitutes acceptance of the new pricing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            7. Limitation of Liability
          </h2>
          <p className="mt-3">
            To the maximum extent permitted by law, BillMint and its officers,
            directors, employees, and agents shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages
            arising out of or related to your use of the Service. Our total
            liability shall not exceed the amount you paid us in the twelve
            months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            8. Warranty Disclaimer
          </h2>
          <p className="mt-3">
            The Service is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis without warranties of any kind, whether express
            or implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            9. Termination
          </h2>
          <p className="mt-3">
            We may terminate or suspend your access to the Service at any time,
            with or without cause, and with or without notice. Upon termination,
            your right to use the Service ceases immediately. You may also
            delete your account at any time through your account settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            10. Governing Law
          </h2>
          <p className="mt-3">
            These Terms shall be governed by and construed in accordance with
            the laws of Romania, without regard to its conflict of law
            provisions. Any disputes arising under these Terms shall be subject
            to the exclusive jurisdiction of the courts of Romania.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            11. Changes to Terms
          </h2>
          <p className="mt-3">
            We reserve the right to update these Terms at any time. We will
            notify you of material changes by posting the updated terms on this
            page and updating the &quot;Last updated&quot; date. Your continued
            use of the Service after changes are posted constitutes acceptance of
            the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            12. Contact Information
          </h2>
          <p className="mt-3">
            If you have any questions about these Terms of Service, please
            contact us at{" "}
            <a
              href="mailto:legal@billmint.com"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              legal@billmint.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
