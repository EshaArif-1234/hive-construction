import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDate, formatPKR } from "@/lib/reportUi";

export default function AdminInvestorsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/investors");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load investors.");
        setInvestors([]);
        return;
      }
      setInvestors(Array.isArray(data?.investors) ? data.investors : []);
    } catch {
      setError("Unable to load investors.");
      setInvestors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const verifyInvestor = async (id) => {
    setError("");
    try {
      const res = await fetch(`/api/admin/investors/${id}/verify`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to verify investor.");
        return;
      }
      setInvestors((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: data?.investor?.status || "verified" } : inv))
      );
    } catch {
      setError("Unable to verify investor.");
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return investors.filter((i) => {
      const displayStatus = i.status === "verified" ? "Verified" : "Pending";
      const matchesQuery = q
        ? `${i.fullName} ${i.email} ${i.id}`.toLowerCase().includes(q)
        : true;
      const matchesStatus = status === "All" ? true : displayStatus === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, investors]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, i) => {
          acc.invested += Number(i.totalInvested) || 0;
          acc.profit += Number(i.totalProfit) || 0;
          return acc;
        },
        { invested: 0, profit: 0 }
      ),
    [rows]
  );

  return (
    <>
      <Head>
        <title>Admin Investors | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Investor Profiles
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Investors
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              View profiles, verification status, and investment activity. Open a profile for the full timeline.
            </p>
          </div>
          <Link
            href="/admin/reports/investors"
            className="inline-flex items-center justify-center rounded-md border border-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe"
          >
            Investor activity report
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3">
            <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Listed investors</p>
            <p className="mt-1 text-lg font-bold">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3">
            <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Total invested</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{formatPKR(totals.invested)}</p>
          </div>
          <div className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-3">
            <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Profit received</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-800">{formatPKR(totals.profit)}</p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm outline-none focus:border-hive-taupe"
            placeholder="Search by name, email, id"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm outline-none focus:border-hive-taupe"
          >
            <option value="All">All statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
          </select>
          <div className="rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-slate">
            {loading ? "Loading…" : `Showing ${rows.length}`}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-hive-taupe/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-hive-charcoal">
                <tr>
                  {["Investor", "Status", "Investments", "Invested", "Profit", "Joined", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-widest text-hive-taupe ${
                        h === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className="odd:bg-hive-light even:bg-white/80">
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="text-sm font-semibold text-hive-charcoal">{i.fullName}</p>
                      <p className="mt-0.5 text-xs text-hive-slate">{i.email}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold capitalize">
                      {i.status}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm tabular-nums">
                      {i.investmentCount ?? 0}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold tabular-nums">
                      {formatPKR(i.totalInvested)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold tabular-nums text-emerald-800">
                      {formatPKR(i.totalProfit)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {formatDate(i.createdAt)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/investors/${i.id}`}
                          className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe"
                        >
                          Profile
                        </Link>
                        <button
                          type="button"
                          disabled={i.status === "verified"}
                          onClick={() => verifyInvestor(i.id)}
                          className="rounded-md bg-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-light disabled:opacity-60"
                        >
                          Verify
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border-t px-4 py-10 text-center text-sm text-hive-slate">
                      No investors match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
