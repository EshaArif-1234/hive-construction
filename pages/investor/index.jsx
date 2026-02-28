import Head from "next/head";
import Link from "next/link";
import InfoCard from "@/components/InfoCard";

export default function InvestorDashboardPage() {
  return (
    <>
      <Head>
        <title>Investor Dashboard | Hive Construction</title>
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Investor Portal
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-3 text-sm leading-6 text-hive-slate">
              Track your contributions, profit-share calculations, investment
              updates, and exit plan. (Frontend only — mock data)
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Total Contributed" value="PKR 1,100,000" />
              <InfoCard label="Profit Share" value="75% (Investors)" />
              <InfoCard label="Active Investments" value="2" />
              <InfoCard label="Latest Update" value="Islamabad-01: In Progress" />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/investor/investments"
                className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-6 py-3 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
              >
                View My Investments
              </Link>
              <Link
                href="/properties"
                className="inline-flex items-center justify-center rounded-md border border-hive-charcoal px-6 py-3 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Browse Available Properties
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
