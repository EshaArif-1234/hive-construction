import Head from "next/head";
import { useMemo, useState } from "react";

const MOCK_INVESTMENTS = [
  {
    id: "invst-001",
    investor: "Ali Raza",
    property: "lahore-01",
    amount: "PKR 500,000",
    date: "2026-01-12",
    profitShare: "75%",
  },
  {
    id: "invst-002",
    investor: "Sara Khan",
    property: "islamabad-01",
    amount: "PKR 250,000",
    date: "2026-02-06",
    profitShare: "75%",
  },
  {
    id: "invst-003",
    investor: "Usman Ahmed",
    property: "islamabad-01",
    amount: "PKR 350,000",
    date: "2026-02-14",
    profitShare: "75%",
  },
];

export default function AdminInvestmentsPage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MOCK_INVESTMENTS.filter((x) => {
      if (!q) return true;
      return `${x.investor} ${x.property} ${x.id}`.toLowerCase().includes(q);
    });
  }, [query]);

  return (
    <>
      <Head>
        <title>Admin Investments | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Investment Data
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Investments
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              Track investor contributions, dates, and profit distribution.
              (UI-only for now)
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            Add Investment
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
            placeholder="Search by investor, property, id"
          />

          <div className="rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-slate">
            Profit split:
            <span className="ml-2 font-semibold text-hive-charcoal">
              75% Investors / 25% Hive
            </span>
          </div>

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
                    Investment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Investor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id}>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <p className="text-sm font-semibold text-hive-charcoal">
                        {x.id}
                      </p>
                      <p className="mt-1 text-xs text-hive-slate">
                        Profit share: {x.profitShare}
                      </p>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {x.investor}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold text-hive-charcoal">
                      {x.property}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold text-hive-charcoal">
                      {x.amount}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {x.date}
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
                          Distribute Profit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border-t border-hive-taupe/20 px-4 py-10 text-center text-sm text-hive-slate"
                    >
                      No investments match your search.
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
