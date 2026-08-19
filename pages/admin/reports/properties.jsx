import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminReportShell from "@/components/admin/AdminReportShell";
import { downloadCsv, formatPKR } from "@/lib/reportUi";

export default function PropertyStatusReportPage() {
  const [listingStatus, setListingStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [report, setReport] = useState({ summary: {}, properties: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (listingStatus !== "all") params.set("listingStatus", listingStatus);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/admin/reports/properties${qs}`);
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
  }, [listingStatus]);

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
      "property-status-report.csv",
      [
        "Property ID",
        "Title",
        "City",
        "Listing",
        "Construction",
        "Total cost",
        "Raised",
        "Progress %",
        "Investors",
        "Fully funded",
        "Profit distributed",
      ],
      rows.map((x) => [
        x.id,
        x.title,
        x.city,
        x.listingStatusLabel,
        x.constructionStatusLabel,
        x.totalCost,
        x.fundingCollected,
        x.fundingProgressPct.toFixed(1),
        x.investorCount,
        x.isFullyFunded ? "Yes" : "No",
        x.profitDistributed,
      ])
    );
  };

  return (
    <>
      <Head>
        <title>Property Status Report | Hive Construction</title>
      </Head>

      <AdminReportShell
        title="Property status report"
        description="Funding progress, construction stage, listing status, and profit distributed per property."
        breadcrumbs={[{ label: "Property status" }]}
        onExport={exportCsv}
      >
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            ["Properties", report.summary.totalProperties],
            ["Active listings", report.summary.activeListings],
            ["Fully funded", report.summary.fullyFundedCount],
            ["Total raised", formatPKR(report.summary.totalRaised)],
            ["Profit paid", formatPKR(report.summary.totalProfitDistributed)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-hive-slate/70">{label}</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{loading ? "…" : value ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search property"
            className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={listingStatus}
            onChange={(e) => setListingStatus(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">All listings</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-hive-taupe/20">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-hive-charcoal text-left text-xs uppercase tracking-widest text-hive-taupe">
              <tr>
                {["Property", "Status", "Construction", "Cost", "Raised", "Progress", "Investors", ""].map((h) => (
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
                  <td className="border-t px-4 py-3 text-sm">{x.listingStatusLabel}</td>
                  <td className="border-t px-4 py-3 text-sm">{x.constructionStatusLabel}</td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{formatPKR(x.totalCost)}</td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{formatPKR(x.fundingCollected)}</td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">
                    {x.fundingProgressPct.toFixed(1)}%
                    {x.isFullyFunded ? (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                        Full
                      </span>
                    ) : null}
                  </td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{x.investorCount}</td>
                  <td className="border-t px-4 py-3 text-right">
                    <Link href={`/properties/${x.id}`} className="text-xs font-semibold underline" target="_blank">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border-t px-4 py-10 text-center text-sm text-hive-slate">
                    No properties match filters.
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
