import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function IconBuilding() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconCurrency() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, loading }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-hive-taupe/20 bg-hive-light p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:border-hive-taupe/45 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-hive-taupe/5 transition-transform duration-300 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-hive-slate/60">
            {title}
          </p>
          {loading ? (
            <div className="mt-3 h-9 w-24 animate-pulse rounded-md bg-hive-taupe/15" />
          ) : (
            <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-hive-charcoal sm:text-3xl">
              {value}
            </p>
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/admin/dashboard-stats");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data?.message || "Unable to load dashboard.");
          if (!cancelled) setStats(null);
          return;
        }
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) {
          setError("Unable to load dashboard.");
          setStats(null);
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

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-PK", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }, []);

  const propertySubtitle =
    stats &&
    `${stats.propertiesAvailable} available · ${stats.propertiesInProgress} in progress · ${stats.propertiesSold} sold`;

  const investorSubtitle =
    stats && `${stats.investorsPending} pending verification`;

  return (
    <>
      <Head>
        <title>Admin Dashboard | Hive Construction</title>
      </Head>

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-hive-taupe/25 bg-gradient-to-br from-hive-charcoal via-neutral-950 to-hive-charcoal p-8 text-hive-light shadow-xl ring-1 ring-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-hive-taupe/20 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-hive-taupe">
                  Command center
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  {greeting}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                  Monitor listings, investors, and capital at a glance. Use the quick actions
                  below to jump into daily workflows.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">Today</p>
                <p className="mt-1 text-sm font-semibold text-hive-taupe">{dateLabel}</p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error} Stats will appear after you refresh or sign in again.
          </div>
        ) : null}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-hive-charcoal">Performance snapshot</h2>
              <p className="mt-1 text-sm text-hive-slate/80">
                Live counts from your database (updates when you refresh this page).
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Properties"
              value={stats ? String(stats.propertiesTotal) : "—"}
              subtitle={stats ? propertySubtitle : undefined}
              icon={IconBuilding}
              loading={loading}
            />
            <StatCard
              title="Investors"
              value={stats ? String(stats.investorsTotal) : "—"}
              subtitle={stats ? investorSubtitle : undefined}
              icon={IconUsers}
              loading={loading}
            />
            <StatCard
              title="Active capital"
              value={stats ? formatPKR(stats.totalInvestedActive) : "—"}
              subtitle={
                stats
                  ? `${stats.investmentsActiveCount} active investment record(s)`
                  : undefined
              }
              icon={IconCurrency}
              loading={loading}
            />
            <StatCard
              title="Pending review"
              value={stats ? String(stats.investorsPending) : "—"}
              subtitle="Investors awaiting verification"
              icon={IconClipboard}
              loading={loading}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold text-hive-charcoal">Quick actions</h2>
            <div className="grid gap-3 sm:grid-cols-1">
              <QuickAction
                href="/admin/properties"
                title="Manage properties"
                description="Create listings, upload images, update status and pricing."
              />
              <QuickAction
                href="/admin/investors"
                title="Review investors"
                description="Verify pending accounts and monitor your investor base."
              />
              <QuickAction
                href="/admin/investments"
                title="Manage investments"
                description="Track amounts, dates, and distribute profit to investors."
              />
              <QuickAction
                href="/admin/reports"
                title="View reports"
                description="Investor activity, property status, and profit/loss summaries."
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-6">
              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-hive-taupe">
                  Operating checklist
                </h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "Keep property listings accurate and media up to date.",
                    "Verify new investors promptly to unblock portal access.",
                    "Reconcile investment entries against project budgets.",
                    "Export reports for stakeholders when milestones close.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3 text-sm leading-relaxed text-hive-slate">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hive-taupe" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-hive-charcoal to-neutral-950 p-6 text-hive-light shadow-lg ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hive-taupe">
                  Profit framework
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  <span className="font-semibold text-hive-taupe">75%</span> of profit to investors,{" "}
                  <span className="font-semibold text-hive-taupe">25%</span> retained by Hive. Loss
                  scenarios follow your secured-cheque and contractual terms.
                </p>
                <div className="mt-5 flex gap-2 rounded-xl bg-white/5 p-3 text-xs text-white/70">
                  <span className="font-semibold text-hive-taupe">Tip</span>
                  Align exit timelines with the Security &amp; Exit Plan module when publishing
                  updates.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
