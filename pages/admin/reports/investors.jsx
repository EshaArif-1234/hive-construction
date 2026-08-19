import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminReportShell from "@/components/admin/AdminReportShell";
import { downloadCsv, formatDate, formatPKR } from "@/lib/reportUi";

export default function InvestorActivityReportPage() {
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [report, setReport] = useState({ summary: {}, investors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/admin/reports/investors${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load report.");
        return;
      }
      setReport({ summary: data.summary || {}, investors: data.investors || [] });
    } catch {
      setError("Unable to load report.");
    } finally {
      setLoading(false);
    }
  }, [status, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return report.investors;
    return report.investors.filter((x) =>
      `${x.fullName} ${x.email} ${x.id}`.toLowerCase().includes(q)
    );
  }, [query, report.investors]);

  const exportCsv = () => {
    downloadCsv(
      "investor-activity-report.csv",
      [
        "Investor ID",
        "Name",
        "Email",
        "Status",
        "Joined",
        "Investments",
        "Total invested",
        "Profit received",
        "Cheques",
      ],
      rows.map((x) => [
        x.id,
        x.fullName,
        x.email,
        x.status,
        formatDate(x.joinedAt),
        x.investmentCount,
        x.totalInvested,
        x.totalProfit,
        x.chequesCount,
      ])
    );
  };

  return (
    <>
      <Head>
        <title>Investor Activity Report | Hive Construction</title>
      </Head>

      <AdminReportShell
        title="Investor activity report"
        description="Detailed view of each investor's contributions, profit received, security cheques, and recent deals."
        breadcrumbs={[{ label: "Investor activity" }]}
        onExport={exportCsv}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Investors", report.summary.totalInvestors],
            ["Investments", report.summary.totalInvestments],
            ["Total invested", formatPKR(report.summary.totalInvested)],
            ["Profit paid", formatPKR(report.summary.totalProfit)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3">
              <p className="text-[10px] font-semibold uppercase text-hive-slate/70">{label}</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{loading ? "…" : value ?? "—"}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search investor"
            className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-hive-taupe/20">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-hive-charcoal text-left text-xs uppercase tracking-widest text-hive-taupe">
              <tr>
                {["Investor", "Status", "Investments", "Invested", "Profit", "Cheques", "Joined", ""].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id} className="odd:bg-hive-light even:bg-white/80">
                  <td className="border-t px-4 py-3">
                    <p className="text-sm font-semibold">{x.fullName}</p>
                    <p className="text-xs text-hive-slate">{x.email}</p>
                  </td>
                  <td className="border-t px-4 py-3 text-sm capitalize">{x.status}</td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{x.investmentCount}</td>
                  <td className="border-t px-4 py-3 text-sm font-semibold tabular-nums">{formatPKR(x.totalInvested)}</td>
                  <td className="border-t px-4 py-3 text-sm font-semibold tabular-nums text-emerald-800">{formatPKR(x.totalProfit)}</td>
                  <td className="border-t px-4 py-3 text-sm tabular-nums">{x.chequesCount}</td>
                  <td className="border-t px-4 py-3 text-sm">{formatDate(x.joinedAt)}</td>
                  <td className="border-t px-4 py-3 text-right">
                    <Link href={`/admin/investors/${x.id}`} className="text-xs font-semibold text-hive-charcoal underline">
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border-t px-4 py-10 text-center text-sm text-hive-slate">
                    No investors match filters.
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
