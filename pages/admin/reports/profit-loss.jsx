import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminReportShell from "@/components/admin/AdminReportShell";
import { downloadCsv, formatPKR } from "@/lib/reportUi";

export default function ProfitLossReportPage() {
  const [query, setQuery] = useState("");
  const [report, setReport] = useState({ summary: {}, properties: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reports/profit-loss");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load report.");
        return;
      }
      setReport({ summary: data.summary || {}, properties: data.properties || [] });
    } catch {
      setError("Unable to load report.");
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
      "profit-loss-report.csv",
      [
        "Property ID",
        "Title",
        "City",
        "Total cost",
        "Expected sale",
        "Gross profit",
        "Loss scenario",
        "Investor share (projected)",
        "Hive share (projected)",
        "Investor profit paid",
        "Unrealized investor profit",
        "Principal raised",
      ],
      rows.map((x) => [
        x.id,
        x.title,
        x.city,
        x.totalCost,
        x.expectedSellingPrice,
        x.grossProjectProfit ?? "",
        x.isLossScenario ? "Yes" : "No",
        x.projectedInvestorShare,
        x.projectedHiveShare,
        x.investorProfitPaid,
        x.unrealizedInvestorProfit,
        x.totalPrincipalRaised,
      ])
    );
  };

  return (
    <>
      <Head>
        <title>Profit & Loss Report | Hive Construction</title>
      </Head>

      <AdminReportShell
        title="Profit & loss report"
        description="Compare projected project profit (from expected sale price) against profit already distributed to investors."
        breadcrumbs={[{ label: "Profit & loss" }]}
        onExport={exportCsv}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Projected gross profit", formatPKR(report.summary.totalProjectedProfit)],
            ["Investor profit paid", formatPKR(report.summary.investorProfitPaid)],
            ["Projected investor share", formatPKR(report.summary.projectedInvestorShare)],
            ["Projected Hive share", formatPKR(report.summary.projectedHiveShare)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-hive-slate/70">{label}</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{loading ? "…" : value ?? "—"}</p>
            </div>
          ))}
        </div>

        {report.summary.lossScenarioCount > 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {report.summary.lossScenarioCount} propert{report.summary.lossScenarioCount === 1 ? "y" : "ies"} flagged
            as loss scenario (expected sale below total cost). Investor principal remains protected per exit plan.
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
                  "Cost",
                  "Expected sale",
                  "Gross profit",
                  "Paid to investors",
                  "Unrealized",
                  "Split",
                  "Flag",
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
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{formatPKR(x.totalCost)}</td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{formatPKR(x.expectedSellingPrice)}</td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">
                    {x.grossProjectProfit != null ? formatPKR(x.grossProjectProfit) : "—"}
                  </td>
                  <td className="border-t px-4 py-3 text-sm font-semibold tabular-nums text-emerald-800">
                    {formatPKR(x.investorProfitPaid)}
                  </td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{formatPKR(x.unrealizedInvestorProfit)}</td>
                  <td className="border-t px-4 py-3 text-xs tabular-nums">
                    {x.investorProfitSharePct}% / {x.hiveProfitSharePct}%
                  </td>
                  <td className="border-t px-4 py-3 text-sm">
                    {x.isLossScenario ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        Loss
                      </span>
                    ) : (
                      <span className="text-hive-slate">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border-t px-4 py-10 text-center text-sm text-hive-slate">
                    No properties found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminReportShell>
    </>
  );
}
