import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminReportShell from "@/components/admin/AdminReportShell";
import { downloadCsv, formatDate, formatPKR } from "@/lib/reportUi";

export default function ProfitSharingReportPage() {
  const [query, setQuery] = useState("");
  const [report, setReport] = useState({ summary: {}, properties: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reports/profit-sharing");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load profit sharing audit.");
        return;
      }
      setReport({ summary: data.summary || {}, properties: data.properties || [] });
    } catch {
      setError("Unable to load profit sharing audit.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return report.properties;
    return report.properties.filter((x) =>
      `${x.title} ${x.city} ${x.id}`.toLowerCase().includes(q)
    );
  }, [query, report.properties]);

  const exportCsv = () => {
    downloadCsv(
      "profit-sharing-audit.csv",
      [
        "Property",
        "Investor %",
        "Hive %",
        "Share config valid",
        "Investor profit paid",
        "Ledger investor total",
        "Hive profit recorded",
        "Distribution events",
        "Ledger balanced",
      ],
      rows.map((x) => [
        x.title,
        x.investorProfitSharePct,
        x.hiveProfitSharePct,
        x.profitShareValid ? "Yes" : "No",
        x.investorProfitPaid,
        x.ledgerInvestorTotal,
        x.ledgerHiveTotal,
        x.distributionEventCount,
        x.investorPaidMatchesLedger ? "Yes" : "No",
      ])
    );
  };

  return (
    <>
      <Head>
        <title>Profit Sharing Audit | Hive Construction</title>
      </Head>

      <AdminReportShell
        title="Profit sharing audit (75% / 25%)"
        description="Verifies each property uses a valid 75/25 investor/Hive split and reconciles bulk distributions against investor payouts."
        breadcrumbs={[{ label: "Profit sharing" }]}
        onExport={exportCsv}
      >
        <div className="rounded-xl border border-hive-taupe/20 bg-neutral-50 p-4 text-sm text-hive-slate">
          <p className="font-semibold text-hive-charcoal">How profit is calculated</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed">
            <li>Total project profit is split: 75% to the investor pool, 25% to Hive.</li>
            <li>The investor pool is divided among investors by each stake in the funding pool.</li>
            <li>Bulk distribute on Investments records both investor payouts and Hive share in the ledger.</li>
          </ol>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Investor profit paid", formatPKR(report.summary.investorProfitPaid)],
            ["Hive profit recorded", formatPKR(report.summary.hiveProfitRecorded)],
            ["Distribution events", report.summary.totalDistributedEvents ?? 0],
            ["Config issues", report.summary.invalidShareConfig ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-hive-slate/70">{label}</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{loading ? "…" : value ?? "—"}</p>
            </div>
          ))}
        </div>

        {report.summary.ledgerMismatch > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {report.summary.ledgerMismatch} propert
            {report.summary.ledgerMismatch === 1 ? "y has" : "ies have"} investor payouts that do not match
            the distribution ledger. Review manual profit entries on Investments.
          </div>
        ) : null}

        <div className="mt-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search property"
            className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-hive-taupe/20">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-hive-charcoal text-left text-xs uppercase tracking-widest text-hive-taupe">
              <tr>
                {[
                  "Property",
                  "Split",
                  "Config",
                  "Investors paid",
                  "Hive recorded",
                  "Events",
                  "Balanced",
                ].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id} className="odd:bg-hive-light even:bg-white/80">
                  <td className="border-t px-4 py-3">
                    <p className="text-sm font-semibold">{x.title}</p>
                    <p className="text-xs text-hive-slate">{x.city}</p>
                  </td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">
                    {x.investorProfitSharePct}% / {x.hiveProfitSharePct}%
                  </td>
                  <td className="border-t px-4 py-3 text-sm">
                    {x.profitShareValid ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
                        Valid
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        Invalid
                      </span>
                    )}
                  </td>
                  <td className="border-t px-4 py-3 text-sm font-semibold tabular-nums text-emerald-800">
                    {formatPKR(x.investorProfitPaid)}
                  </td>
                  <td className="border-t px-4 py-3 text-sm font-semibold tabular-nums">
                    {formatPKR(x.ledgerHiveTotal)}
                  </td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{x.distributionEventCount}</td>
                  <td className="border-t px-4 py-3 text-sm">
                    {x.distributionEventCount === 0 ? (
                      <span className="text-hive-slate">—</span>
                    ) : x.investorPaidMatchesLedger ? (
                      <span className="text-emerald-700">Yes</span>
                    ) : (
                      <span className="font-semibold text-amber-700">Review</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border-t px-4 py-10 text-center text-sm text-hive-slate">
                    No properties found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {rows.some((x) => x.recentDistributions?.length > 0) ? (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-hive-charcoal">Recent distribution events</h2>
            <div className="mt-4 grid gap-3">
              {rows.flatMap((x) =>
                (x.recentDistributions || []).map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4 text-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-semibold text-hive-charcoal">{x.title}</p>
                        <p className="text-xs text-hive-slate">{formatDate(d.distributedAt)}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p>
                          Project profit: <span className="font-semibold">{formatPKR(d.totalProjectProfit)}</span>
                        </p>
                        <p>
                          Investors {d.investorProfitSharePct}%:{" "}
                          <span className="font-semibold text-emerald-800">{formatPKR(d.investorPoolAmount)}</span>
                        </p>
                        <p>
                          Hive {d.hiveProfitSharePct}%:{" "}
                          <span className="font-semibold">{formatPKR(d.hiveAmount)}</span>
                        </p>
                      </div>
                    </div>
                    {d.note ? <p className="mt-2 text-xs text-hive-slate">{d.note}</p> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </AdminReportShell>
    </>
  );
}
