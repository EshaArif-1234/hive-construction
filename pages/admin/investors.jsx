import Head from "next/head";
import { useMemo, useState } from "react";

const MOCK_INVESTORS = [
  {
    id: "inv-001",
    name: "Ali Raza",
    email: "ali@example.com",
    status: "Verified",
    joined: "2026-01-10",
  },
  {
    id: "inv-002",
    name: "Sara Khan",
    email: "sara@example.com",
    status: "Pending",
    joined: "2026-02-05",
  },
  {
    id: "inv-003",
    name: "Usman Ahmed",
    email: "usman@example.com",
    status: "Verified",
    joined: "2026-02-12",
  },
];

export default function AdminInvestorsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MOCK_INVESTORS.filter((i) => {
      const matchesQuery = q
        ? `${i.name} ${i.email} ${i.id}`.toLowerCase().includes(q)
        : true;
      const matchesStatus = status === "All" ? true : i.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

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
            Showing <span className="font-semibold text-hive-charcoal">{rows.length}</span>
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
                        {i.name}
                      </p>
                      <p className="mt-1 text-xs text-hive-slate">{i.id}</p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {i.email}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold text-hive-charcoal">
                      {i.status}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {i.joined}
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
