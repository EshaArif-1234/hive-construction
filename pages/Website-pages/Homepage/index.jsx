import Head from "next/head";
import Link from "next/link";
import FeatureItem from "@/components/FeatureItem";
import PropertyCard from "@/components/PropertyCard";
import Section from "@/components/Section";
import StepItem from "@/components/StepItem";
import WebsiteFooter from "@/components/WebsiteFooter";

const featuredProperties = [
  {
    imageLabel: "Property Image",
    location: "Lahore • Residential Build",
    status: "Available",
  },
  {
    imageLabel: "Property Image",
    location: "Islamabad • Land + Construction",
    status: "Available",
  },
  {
    imageLabel: "Property Image",
    location: "Karachi • Residential Sale",
    status: "Sold",
  },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Hive Construction Ventures Advisor System</title>
        <meta
          name="description"
          content="Hive Construction Ventures Advisor System is a construction investment platform focused on secured, transparent profit-sharing opportunities backed by cheque guarantee and real-time tracking."
        />
        <meta
          name="keywords"
          content="construction investment, real estate investment, profit sharing, secured investment, property development"
        />
        <link rel="canonical" href="/" />
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                Construction Investment Platform
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-hive-charcoal sm:text-5xl">
                Hive Construction Ventures Advisor System
              </h1>
              <p className="mt-5 text-base leading-7 text-hive-slate sm:text-lg">
                Invest in secured construction and land opportunities with transparent profit sharing and real-time tracking. Your original investment is protected, and profits are distributed with clarity.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-6 py-3 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                >
                  View Properties
                </Link>
                <Link
                  href="#become-investor"
                  className="inline-flex items-center justify-center rounded-md border border-hive-taupe bg-hive-light px-6 py-3 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-taupe"
                >
                  Become an Investor
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-hive-taupe/20 bg-hive-light p-4">
                  <p className="text-xs font-semibold text-hive-charcoal">Profit Split</p>
                  <p className="mt-1 text-sm text-hive-slate">75% Investor / 25% Hive</p>
                </div>
                <div className="rounded-xl border border-hive-taupe/20 bg-hive-light p-4">
                  <p className="text-xs font-semibold text-hive-charcoal">Security</p>
                  <p className="mt-1 text-sm text-hive-slate">Cheque guarantee</p>
                </div>
                <div className="rounded-xl border border-hive-taupe/20 bg-hive-light p-4">
                  <p className="text-xs font-semibold text-hive-charcoal">Tracking</p>
                  <p className="mt-1 text-sm text-hive-slate">Real-time visibility</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-hive-taupe/20 bg-gradient-to-br from-hive-light to-hive-light p-6 shadow-sm">
              <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
                <p className="text-sm font-semibold text-hive-taupe">
                  Trust • Transparency • Professionalism
                </p>
                <p className="mt-4 text-sm leading-6 text-hive-light/80">
                  A modern advisory system for construction investment: structured deals, verified documentation, and clear profit distribution.
                </p>
                <div className="mt-6 grid gap-3">
                  <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                    <span className="text-sm text-hive-light/90">Investment Type</span>
                    <span className="text-sm font-semibold text-hive-taupe">Secured</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                    <span className="text-sm text-hive-light/90">Reporting</span>
                    <span className="text-sm font-semibold text-hive-taupe">Live Updates</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                    <span className="text-sm text-hive-light/90">Profit Sharing</span>
                    <span className="text-sm font-semibold text-hive-taupe">Transparent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section
        id="about"
        eyebrow="About Hive"
        title="A short overview of Hive Construction Ventures"
        description="Hive Construction Ventures focuses on residential construction, land purchase, and structured investment opportunities. We prioritize secure participation, documented processes, and transparent profit distribution."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureItem
            icon="H"
            title="Residential construction"
            description="Targeted builds designed for strong demand and optimized resale timelines."
          />
          <FeatureItem
            icon="V"
            title="Land purchase opportunities"
            description="Carefully selected land acquisitions with clear legal documentation."
          />
          <FeatureItem
            icon="C"
            title="Investor-first advisory"
            description="A professional advisory system that supports informed investment decisions."
          />
        </div>
      </Section>

      <Section
        id="how-it-works"
        eyebrow="How It Works"
        title="A simple, transparent investment flow"
        description="A clear step-by-step process from registration to profit distribution."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <StepItem
            step="1"
            title="Investor registers"
            description="Create an account and complete your investor profile."
          />
          <StepItem
            step="2"
            title="Invests in property"
            description="Select a listed property and place your secured investment."
          />
          <StepItem
            step="3"
            title="Construction & sale"
            description="Hive executes the build, manages progress, and completes the sale."
          />
          <StepItem
            step="4"
            title="Profit sharing"
            description="Profit distribution: 75% Investor, 25% Hive, with transparent statements."
          />
        </div>
      </Section>

      <Section
        id="why-invest"
        eyebrow="Why Invest With Hive"
        title="Designed for trust, clarity, and long-term confidence"
        description="Professional controls and transparency built into every investment cycle."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureItem
            icon="✓"
            title="Secured investment (cheque guarantee)"
            description="Structured security to protect your original investment amount."
          />
          <FeatureItem
            icon="%"
            title="Transparent profit sharing"
            description="Clear profit split and documented distribution for every deal."
          />
          <FeatureItem
            icon="↻"
            title="Real-time investment tracking"
            description="Monitor project milestones, progress updates, and sale status."
          />
          <FeatureItem
            icon="↩"
            title="Return of original investment"
            description="Guaranteed return of your original investment under agreed terms."
          />
        </div>
      </Section>

      <Section
        id="featured-properties"
        eyebrow="Featured Properties"
        title="Explore active and completed opportunities"
        description="A curated list of opportunities showing availability and key details."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProperties.map((p) => (
            <PropertyCard
              key={`${p.location}-${p.status}`}
              imageLabel={p.imageLabel}
              location={p.location}
              status={p.status}
            />
          ))}
        </div>
      </Section>

      <Section
        id="become-investor"
        eyebrow="Investor Benefits"
        title="Built for serious investors who expect transparency"
        description="Simple investor benefits with clear outcomes and reporting."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureItem
            icon="🔒"
            title="Security-first structure"
            description="Investor security mechanisms designed to protect principal." 
          />
          <FeatureItem
            icon="📈"
            title="Clear performance reporting"
            description="Progress updates and transparent documentation at every stage." 
          />
          <FeatureItem
            icon="🧾"
            title="Professional documentation"
            description="Formalized statements and clear profit-sharing calculations." 
          />
        </div>
      </Section>

      <WebsiteFooter />
    </>
  );
}
