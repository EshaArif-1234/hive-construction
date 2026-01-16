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

export default function TermsAndConditionsPage() {
  return (
    <>
      <Head>
        <title>Terms & Conditions | Hive Construction Ventures</title>
        <meta
          name="description"
          content="Read the Terms & Conditions for Hive Construction Ventures Advisor System, including investment terms, profit-sharing policy, exit policy, security guarantees, and account responsibilities."
        />
        <link rel="canonical" href="/terms-and-conditions" />
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Legal
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-hive-charcoal sm:text-5xl">
              Terms & Conditions
            </h1>
            <p className="mt-5 text-base leading-7 text-hive-slate sm:text-lg">
              These Terms & Conditions govern your access to and use of Hive
              Construction Ventures Advisor System (the “Platform”). Please read
              them carefully.
            </p>
          </div>

          <div className="mt-10 grid gap-6">
            <SectionCard title="1. Introduction">
              <Subheading>Purpose of these Terms</Subheading>
              <p>
                The purpose of these Terms is to define the legal rights and
                responsibilities of users and Hive Construction Ventures in
                relation to the Platform and any investment opportunities
                presented through it.
              </p>

              <Subheading>Acceptance of Terms</Subheading>
              <p>
                By registering, accessing, or using the Platform, you confirm
                that you have read, understood, and agree to be bound by these
                Terms.
              </p>
            </SectionCard>

            <SectionCard title="2. User Eligibility">
              <Subheading>Eligibility Requirements</Subheading>
              <p>
                To register as an investor, you must be legally capable of
                entering into a binding agreement and meet any eligibility
                requirements communicated by Hive Construction Ventures.
              </p>

              <Subheading>Verification and Approval</Subheading>
              <p>
                Registration may be subject to verification, due diligence, and
                approval. Hive Construction Ventures may request identity and
                supporting documentation and may approve or reject applications
                at its discretion.
              </p>
            </SectionCard>

            <SectionCard title="3. Investment Terms">
              <Subheading>Investment Amount Flexibility</Subheading>
              <p>
                Investors may invest any amount as permitted for a specific
                opportunity. Minimum/maximum amounts may apply depending on the
                project.
              </p>

              <Subheading>Profit-Sharing Policy</Subheading>
              <p>
                Profit sharing is governed by the project’s documented terms.
                Unless stated otherwise, profit sharing is based on the agreed
                ratio described in these Terms.
              </p>

              <Subheading>Company Contribution</Subheading>
              <p>
                Hive Construction Ventures may contribute the remaining amount
                required for a project where applicable, as described in the
                project documentation.
              </p>
            </SectionCard>

            <SectionCard title="4. Profit & Loss Policy">
              <Subheading>Profit Distribution</Subheading>
              <p>
                Unless otherwise agreed in writing for a specific project,
                profits are distributed as follows:
              </p>
              <ul className="list-disc pl-5">
                <li>75% of profit to investors</li>
                <li>25% of profit to Hive Construction Ventures</li>
              </ul>

              <Subheading>Loss Scenario</Subheading>
              <p>
                In a loss scenario, the investor receives the original
                investment amount back according to the project’s security and
                protection terms.
              </p>
            </SectionCard>

            <SectionCard title="5. Exit Policy">
              <Subheading>Property Sold Before One Year</Subheading>
              <p>
                If a property is sold before one year, profit and exit handling
                will be processed according to the project’s documented sale
                timeline and settlement terms.
              </p>

              <Subheading>Property Sold After One Year</Subheading>
              <p>
                If a property is sold after one year, profit and exit handling
                will be processed according to the project’s documented sale
                timeline and settlement terms.
              </p>

              <Subheading>Early Withdrawal</Subheading>
              <p>
                Early withdrawals may be subject to conditions, documentation,
                and administrative processing. Hive Construction Ventures may
                approve or decline early withdrawals based on project status
                and contractual obligations.
              </p>
            </SectionCard>

            <SectionCard title="6. Security & Guarantees">
              <Subheading>Cheque-Based Security</Subheading>
              <p>
                The Platform may provide cheque-based security where applicable
                as part of investor protection mechanisms.
              </p>

              <Subheading>Investment Protection Terms</Subheading>
              <p>
                Security and protection terms vary by project and are governed
                by written documentation and the Platform’s stated procedures.
              </p>
            </SectionCard>

            <SectionCard title="7. Account Responsibilities">
              <Subheading>Credentials and Access</Subheading>
              <p>
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activity that occurs under your
                account.
              </p>

              <Subheading>Misuse and Consequences</Subheading>
              <p>
                Any misuse of the Platform, fraudulent activity, or unauthorized
                access may result in suspension or termination of your account
                and may lead to legal action.
              </p>
            </SectionCard>

            <SectionCard title="8. Modifications">
              <Subheading>Right to Update Terms</Subheading>
              <p>
                Hive Construction Ventures reserves the right to modify these
                Terms at any time. Updated Terms will be posted on the Platform
                and become effective upon posting unless otherwise stated.
              </p>
            </SectionCard>

            <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
              <p className="text-sm font-semibold text-hive-taupe">Note</p>
              <p className="mt-2 text-sm leading-6 text-hive-light/80">
                This page is provided for general informational purposes and
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
