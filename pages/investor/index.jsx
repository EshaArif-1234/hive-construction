import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function IconWallet() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7.5a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 7.5v9A2.25 2.25 0 005.25 18.75h13.5A2.25 2.25 0 0021 16.5V15m0-3h-3.75a1.5 1.5 0 100 3H21m-15-6h6" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125l4.5-4.5 4.5 4.5 7.5-7.5M3 19.5h18" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.25v-6.375A2.625 2.625 0 0017.625 5.25h-11.25A2.625 2.625 0 003.75 7.875v8.25A2.625 2.625 0 006.375 18.75h11.25a2.625 2.625 0 002.625-2.625V14.25zm0 0h-16.5m9-9V3.75a1.5 1.5 0 00-1.5-1.5h-3a1.5 1.5 0 00-1.5 1.5v1.5" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, loading }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-hive-taupe/20 bg-hive-light p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:border-hive-taupe/45 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-hive-taupe/5 transition-transform duration-300 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-hive-slate/60">{title}</p>
          {loading ? (
            <div className="mt-3 h-9 w-24 animate-pulse rounded-md bg-hive-taupe/15" />
          ) : (
            <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-hive-charcoal sm:text-3xl">{value}</p>
          )}
          {subtitle && !loading ? (
            <p className="mt-2 text-xs leading-relaxed text-hive-slate/80">{subtitle}</p>
          ) : loading ? (
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-hive-taupe/10" />
          ) : null}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-hive-charcoal to-neutral-900 text-hive-taupe shadow-inner ring-1 ring-white/10">
          <Icon />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, title, description }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-hive-taupe/15 bg-hive-light px-5 py-4 shadow-sm transition-all hover:border-hive-taupe/40 hover:bg-white hover:shadow-md"
    >
      <div>
        <p className="font-semibold text-hive-charcoal">{title}</p>
        <p className="mt-0.5 text-sm text-hive-slate/75">{description}</p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hive-charcoal text-lg text-hive-taupe transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

function formatPKR(n) {
  if (!Number.isFinite(n)) return "—";
  return `PKR ${Math.round(n).toLocaleString("en-PK")}`;
}

export default function InvestorDashboardPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/investments");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data?.message || "Unable to load dashboard.");
          if (!cancelled) setInvestments([]);
          return;
        }
        if (!cancelled) setInvestments(Array.isArray(data?.investments) ? data.investments : []);
      } catch {
        if (!cancelled) {
          setError("Unable to load dashboard.");
          setInvestments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const totalContributed = investments.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const activeCount = investments.filter((x) => String(x.status || "").toLowerCase() === "active").length;
    const latest = investments[0];
    const latestLabel = latest
      ? `${latest.propertyTitle || "Property"} • ${String(latest.propertyStatus || "draft")}`
      : "No investment yet";
    return { totalContributed, activeCount, latestLabel };
  }, [investments]);

  return (
    <>
      <Head>
        <title>Investor Dashboard | Hive Construction</title>
      </Head>

      <div className="space-y-8">
        {error ? (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error} Dashboard values will appear after refresh.
          </div>
        ) : null}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-hive-charcoal">Performance snapshot</h2>
            <p className="mt-1 text-sm text-hive-slate/80">Live numbers from your investment records.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total contributed" value={formatPKR(stats.totalContributed)} subtitle="Across all investments" icon={IconWallet} loading={loading} />
            <StatCard title="Profit split" value="75% / 25%" subtitle="Investor / Hive framework" icon={IconChart} loading={loading} />
            <StatCard title="Active investments" value={String(stats.activeCount)} subtitle={`${investments.length} total record(s)`} icon={IconBriefcase} loading={loading} />
            <StatCard title="Latest update" value={stats.latestLabel} subtitle="Most recent investment" icon={IconClock} loading={loading} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold text-hive-charcoal">Quick actions</h2>
            <div className="grid gap-3 sm:grid-cols-1">
              <QuickAction href="/investor/investments" title="My investments" description="Review your contributions and status by property." />
              <QuickAction href="/properties" title="Browse properties" description="Explore active projects currently accepting capital." />
              <QuickAction href="/investor/exit-plan" title="Exit plan" description="Understand withdrawal, timelines, and return rules." />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-6">
              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-hive-taupe">Investor checklist</h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "Track funding progress before adding new capital.",
                    "Review property construction status updates weekly.",
                    "Keep payment proofs safely for each transaction.",
                    "Use exit rules and timelines before early withdrawal.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3 text-sm leading-relaxed text-hive-slate">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hive-taupe" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-hive-charcoal to-neutral-950 p-6 text-hive-light shadow-lg ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hive-taupe">Investment note</p>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  Your dashboard now reflects real-time records from your investment account. Use My Investments to view recently created entries right after investing.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
