import Head from "next/head";
import WebsiteFooter from "@/components/WebsiteFooter";

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-hive-taupe/20 bg-hive-light">
      <div className="border-b border-hive-taupe/20 px-6 py-4">
        <h2 className="text-base font-semibold text-hive-charcoal">{title}</h2>
      </div>
      <div className="space-y-3 px-6 py-5 text-sm leading-6 text-hive-slate">
        {children}
      </div>
    </section>
  );
}

function Subheading({ children }) {
  return (
    <h3 className="pt-2 text-sm font-semibold text-hive-charcoal">{children}</h3>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Hive Construction Ventures</title>
        <meta
          name="description"
          content="Privacy Policy for Hive Construction Ventures Advisor System. Learn how we collect, use, and protect personal and investment-related information."
        />
        <link rel="canonical" href="/privacy-policy" />
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Legal
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-hive-charcoal sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-5 text-base leading-7 text-hive-slate sm:text-lg">
              This Privacy Policy explains how Hive Construction Ventures Advisor
              System (the “Platform”) collects, uses, stores, and protects your
              information.
            </p>
          </div>

          <div className="mt-10 grid gap-6">
            <SectionCard title="1. Introduction">
              <Subheading>Commitment to User Privacy</Subheading>
              <p>
                We are committed to protecting your privacy and handling your
                data in a transparent and responsible manner. We only collect
                information necessary to operate the Platform and provide
                investment-related services.
              </p>
            </SectionCard>

            <SectionCard title="2. Information We Collect">
              <Subheading>Personal Details</Subheading>
              <p>
                We may collect personal details such as your name, email
                address, phone number, and other contact information.
              </p>

              <Subheading>Investment-Related Data</Subheading>
              <p>
                We may collect information related to your investment activity
                on the Platform (e.g., selected opportunities, transaction
                records, project status updates, and reporting data).
              </p>

              <Subheading>Login Credentials</Subheading>
              <p>
                We collect account credentials required for authentication and
                security. Passwords should never be shared. (Passwords are
                expected to be stored securely using industry-standard hashing
                mechanisms.)
              </p>
            </SectionCard>

            <SectionCard title="3. How We Use Information">
              <Subheading>Account Management</Subheading>
              <p>
                We use your information to create and manage your account,
                perform verification, and provide support.
              </p>

              <Subheading>Investment Tracking</Subheading>
              <p>
                We use investment-related information to provide investment
                tracking, project milestone updates, and performance reporting.
              </p>

              <Subheading>Notifications and Reports</Subheading>
              <p>
                We may send notifications and reports related to your account,
                investments, and policy updates.
              </p>
            </SectionCard>

            <SectionCard title="4. Data Protection">
              <Subheading>Secure Storage Practices</Subheading>
              <p>
                We apply reasonable technical and organizational measures to
                protect data against unauthorized access, alteration,
                disclosure, or destruction.
              </p>

              <Subheading>Limited Access</Subheading>
              <p>
                Access to user information is limited to authorized personnel
                and only for legitimate operational purposes.
              </p>
            </SectionCard>

            <SectionCard title="5. Third-Party Disclosure">
              <Subheading>No Unauthorized Sharing</Subheading>
              <p>
                We do not sell or share your personal information with
                unauthorized third parties. If third-party services are used
                for operational purposes (e.g., hosting, analytics), they are
                expected to comply with appropriate confidentiality and
                security requirements.
              </p>
            </SectionCard>

            <SectionCard title="6. Cookies & Tracking">
              <Subheading>Usage for Performance and Experience</Subheading>
              <p>
                The Platform may use cookies or similar technologies to support
                performance, improve user experience, and understand usage
                patterns.
              </p>
            </SectionCard>

            <SectionCard title="7. User Rights">
              <Subheading>Access and Update Information</Subheading>
              <p>
                You may request access to and correction of your personal
                information, subject to verification.
              </p>

              <Subheading>Request Account Deletion</Subheading>
              <p>
                You may request deletion of your account. Some information may
                be retained if required for legal, compliance, or operational
                purposes.
              </p>
            </SectionCard>

            <SectionCard title="8. Policy Updates">
              <Subheading>Notification of Changes</Subheading>
              <p>
                We may update this Privacy Policy from time to time. We will
                post changes on the Platform and may notify users when
                appropriate.
              </p>
            </SectionCard>

            <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
              <p className="text-sm font-semibold text-hive-taupe">Note</p>
              <p className="mt-2 text-sm leading-6 text-hive-light/80">
                This Privacy Policy is provided for informational purposes and
                does not constitute legal advice. Please consult a qualified
                professional for legal guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </>
  );
}
