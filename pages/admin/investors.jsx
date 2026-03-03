import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

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
      const res = await fetch("/api/admin/investors", {
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load investors.");
        setInvestors([]);
        return;
      }

      setInvestors(Array.isArray(data?.investors) ? data.investors : []);
    } catch (e) {
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
      const res = await fetch(`/api/admin/investors/${id}/verify`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to verify investor.");
        return;
      }

      setInvestors((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: data?.investor?.status || "verified" } : inv))
      );
    } catch (e) {
      setError("Unable to verify investor.");
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return investors.filter((i) => {
      const displayName = i.fullName || "";
      const displayStatus = i.status === "verified" ? "Verified" : "Pending";

      const matchesQuery = q
        ? `${displayName} ${i.email} ${i.id}`.toLowerCase().includes(q)
        : true;
      const matchesStatus = status === "All" ? true : displayStatus === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, investors]);

  return (
    <>
      <Head>
        <title>Admin Investors | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
          Investor Profiles
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
          Investors
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          View investor profiles and handle verification. (UI only for now)
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
            placeholder="Search by name, email, id"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
          >
            <option value="All">All statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
          </select>

          <div className="rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-slate">
            {loading ? (
              <span className="font-semibold text-hive-charcoal">Loading...</span>
            ) : (
              <>
                Showing <span className="font-semibold text-hive-charcoal">{rows.length}</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-hive-taupe/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-hive-charcoal">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Investor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id}>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="text-sm font-semibold text-hive-charcoal">
                        {i.fullName}
                      </p>
                      <p className="mt-1 text-xs text-hive-slate">{i.id}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {i.email}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold text-hive-charcoal">
                      {i.status === "verified" ? "Verified" : "Pending"}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {formatDate(i.createdAt)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          disabled={i.status === "verified"}
                          onClick={() => verifyInvestor(i.id)}
                          className="rounded-md bg-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                        >
                          Verify
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="border-t border-hive-taupe/20 px-4 py-10 text-center text-sm text-hive-slate"
                    >
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
