import Head from "next/head";
import Link from "next/link";
import FeatureItem from "@/components/FeatureItem";
import Section from "@/components/Section";
import WebsiteFooter from "@/components/WebsiteFooter";

export default function AboutUsPage() {
  return (
    <>
      <Head>
        <title>About Hive Construction Ventures</title>
        <meta
          name="description"
          content="Learn about Hive Construction Ventures Advisor System—our mission, vision, and investment model built around transparency, secured participation, and investor trust."
        />
        <link rel="canonical" href="/about-us" />
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              About
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-hive-charcoal sm:text-5xl">
              About Hive Construction Ventures
            </h1>
            <p className="mt-5 text-base leading-7 text-hive-slate sm:text-lg">
              Hive Construction Ventures Advisor System is built to help investors participate in real estate development with a professional, transparent, and security-first investment process.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6 shadow-sm">
              <p className="text-xs font-semibold text-hive-charcoal">Profit Sharing</p>
              <p className="mt-2 text-sm text-hive-slate">75% Investors • 25% Hive</p>
            </div>
            <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6 shadow-sm">
              <p className="text-xs font-semibold text-hive-charcoal">Transparency</p>
              <p className="mt-2 text-sm text-hive-slate">Clear statements & milestone reporting</p>
            </div>
            <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6 shadow-sm">
              <p className="text-xs font-semibold text-hive-charcoal">Investor Trust</p>
              <p className="mt-2 text-sm text-hive-slate">Security-first participation model</p>
            </div>
          </div>
        </div>
      </section>

      <Section
        id="company-overview"
        eyebrow="Company Overview"
        title="A construction company with an investor-first approach"
        description="Hive Construction Ventures focuses on real estate development opportunities that are structured for clarity and investor confidence."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureItem
            icon="🏠"
            title="Residential home construction"
            description="We build residential projects designed for real market demand and efficient execution."
          />
          <FeatureItem
            icon="🧱"
            title="Land purchase & development"
            description="We identify land opportunities, verify documentation, and develop structured projects."
          />
          <FeatureItem
            icon="💼"
            title="Property sale & profit sharing"
            description="We manage sale execution and distribute profits through a transparent sharing model."
          />
        </div>
      </Section>

      <Section
        id="investment-model"
        eyebrow="Our Investment Model"
        title="Structured participation with security and transparency"
        description="Our model is designed to allow investors to participate at any level while keeping the process clear and documented."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <h3 className="text-base font-semibold text-hive-charcoal">
              How investment works
            </h3>
            <div className="mt-4 space-y-3 text-sm text-hive-slate">
              <p>
                Investors can invest <span className="font-semibold">any amount</span> based on their preference.
              </p>
              <p>
                The remaining amount required for the deal is covered by <span className="font-semibold">Hive</span>.
              </p>
              <p>
                Profit is shared with a fixed ratio: <span className="font-semibold">75% investors</span> and <span className="font-semibold">25% Hive</span>.
              </p>
              <p>
                Even in case of a loss scenario, the <span className="font-semibold">original investment is guaranteed</span> back under agreed terms.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
            <p className="text-sm font-semibold text-hive-taupe">
              Investment Philosophy
            </p>
            <p className="mt-3 text-sm leading-6 text-hive-light/80">
              We believe investor trust is built through documentation, predictable profit-sharing rules, and disciplined execution. Our advisory system prioritizes transparency at every stage.
            </p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-lg bg-hive-slate p-4">
                <p className="text-xs font-semibold text-hive-taupe">Transparency</p>
                <p className="mt-1 text-sm text-hive-light/80">
                  Clear milestones, updates, and statements.
                </p>
              </div>
              <div className="rounded-lg bg-hive-slate p-4">
                <p className="text-xs font-semibold text-hive-taupe">Security</p>
                <p className="mt-1 text-sm text-hive-light/80">
                  Structured investor protection mechanisms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="mission-vision"
        eyebrow="Mission & Vision"
        title="Built for long-term investor confidence"
        description="Our mission and vision guide every investment opportunity we structure and every project we execute."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Mission
            </p>
            <h3 className="mt-3 text-lg font-semibold text-hive-charcoal">
              Secure, transparent, and profitable investments
            </h3>
            <p className="mt-3 text-sm leading-6 text-hive-slate">
              We provide a structured advisory system that protects investor participation, ensures transparency in profit sharing, and targets profitable outcomes through disciplined execution.
            </p>
          </div>

          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Vision
            </p>
            <h3 className="mt-3 text-lg font-semibold text-hive-charcoal">
              Becoming a trusted real estate investment partner
            </h3>
            <p className="mt-3 text-sm leading-6 text-hive-slate">
              To be recognized as a professional, trusted partner for investors seeking construction and property-based opportunities with clear terms and responsible business practices.
            </p>
          </div>
        </div>
      </Section>

      <Section
        id="why-choose"
        eyebrow="Why Choose Hive"
        title="Investor protection and ethical execution"
        description="A professional approach focused on fairness, visibility, and structured exit plans."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureItem
            icon="🛡️"
            title="Investor protection"
            description="Security-focused investment structure designed to safeguard principal."
          />
          <FeatureItem
            icon="📊"
            title="Real-time tracking"
            description="Project milestones and progress updates designed for transparency."
          />
          <FeatureItem
            icon="🚪"
            title="Fair exit plans"
            description="Structured exit outcomes with documented terms and clear processes."
          />
          <FeatureItem
            icon="🤝"
            title="Ethical business model"
            description="Built on integrity, documentation, and long-term investor trust."
          />
        </div>
      </Section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-hive-charcoal p-8 text-hive-light">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ready to invest with confidence?
                </h2>
                <p className="mt-3 text-sm leading-6 text-hive-light/80">
                  Join Hive Construction Ventures and explore structured, transparent construction investment opportunities.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                <Link
                  href="#"
                  className="inline-flex items-center justify-center rounded-md bg-hive-taupe px-6 py-3 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
                >
                  Join as an Investor
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-md border border-hive-taupe px-6 py-3 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </>
  );
}
