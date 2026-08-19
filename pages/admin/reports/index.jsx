import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, formatPKR } from "@/lib/reportUi";

const REPORT_LINKS = [
  {
    href: "/admin/reports/investors",
    title: "Investor activity",
    description: "Contributions, profit received, cheques, and recent activity per investor.",
    metric: "investors",
  },
  {
    href: "/admin/reports/properties",
    title: "Property status",
    description: "Funding progress, construction stage, listing status, and investor counts.",
    metric: "properties",
  },
  {
    href: "/admin/reports/profit-loss",
    title: "Profit & loss",
    description: "Projected vs distributed profit, Hive share, and loss-scenario flags.",
    metric: "profit",
  },
  {
    href: "/admin/reports/profit-sharing",
    title: "Profit sharing audit",
    description: "Verify 75/25 split configuration and reconcile distribution ledger vs payouts.",
    metric: "audit",
  },
];

export default function AdminReportsHubPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/reports/overview");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data?.message || "Unable to load overview.");
          return;
        }
        if (!cancelled) setOverview(data?.overview || null);
      } catch {
        if (!cancelled) setError("Unable to load overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Admin Reports | Hive Construction</title>
      </Head>

      <div className="space-y-6">
        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Reporting</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">Reports center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-hive-slate">
            Generate detailed reports on investor activity, property status, and profit/loss. View investor
            profiles from the{" "}
            <Link href="/admin/investors" className="font-semibold text-hive-charcoal underline hover:text-hive-taupe">
              Investors
            </Link>{" "}
            section.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Investors", overview?.investors?.total, `${overview?.investors?.verified ?? 0} verified`],
              ["Properties", overview?.properties?.total, "All listings"],
              ["Total invested", formatPKR(overview?.investments?.totalPrincipal), `${overview?.investments?.active ?? 0} active`],
              ["Profit distributed", formatPKR(overview?.profit?.totalDistributed), `${overview?.profit?.totalHiveRecorded ? formatPKR(overview.profit.totalHiveRecorded) + " Hive" : "75/25 split"}`],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">{label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">
                  {loading ? "…" : value ?? "—"}
                </p>
                {!loading && sub ? <p className="mt-1 text-xs text-hive-slate">{sub}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {REPORT_LINKS.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="group rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 transition-all hover:border-hive-taupe/50 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Report</p>
              <h2 className="mt-3 text-lg font-semibold text-hive-charcoal group-hover:text-hive-taupe">
                {report.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-hive-slate">{report.description}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-hive-charcoal group-hover:text-hive-taupe">
                Open report →
              </span>
            </Link>
          ))}
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-charcoal p-6 text-hive-light">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-hive-taupe">Hierarchy</h2>
          <ul className="mt-4 space-y-2 text-sm text-hive-light/85">
            <li>
              <span className="font-semibold text-hive-taupe">Reports</span> → Investor activity / Property status / Profit &amp; loss / Profit sharing audit
            </li>
            <li>
              <span className="font-semibold text-hive-taupe">Investors</span> → Individual profile → Investments, cheques, activity timeline
            </li>
            <li>
              <span className="font-semibold text-hive-taupe">Investments</span> → Per-deal amounts, profit distributions
            </li>
            <li>
              <span className="font-semibold text-hive-taupe">Security</span> → Cheque records linked to investments
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
