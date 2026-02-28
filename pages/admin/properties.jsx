import Head from "next/head";
import { useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

const MOCK_PROPERTIES = [
  {
    id: "lahore-01",
    title: "Lahore Residential Build",
    location: "Lahore",
    status: "Available",
    totalCost: "PKR 8,500,000",
  },
  {
    id: "islamabad-01",
    title: "Islamabad Land + Construction",
    location: "Islamabad",
    status: "In Progress",
    totalCost: "PKR 12,500,000",
  },
  {
    id: "karachi-01",
    title: "Karachi Residential Sale",
    location: "Karachi",
    status: "Sold",
    totalCost: "PKR 9,700,000",
  },
];

export default function AdminPropertiesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MOCK_PROPERTIES.filter((p) => {
      const matchesQuery = q
        ? `${p.title} ${p.location} ${p.id}`.toLowerCase().includes(q)
        : true;

      const matchesStatus = status === "All" ? true : p.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  return (
    <>
      <Head>
        <title>Admin Properties | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Property Management
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Properties
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              View, edit, or delete property listings. (UI only for now)
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            Add Property
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
            placeholder="Search by title, location, or id"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
          >
            <option value="All">All statuses</option>
            <option value="Available">Available</option>
            <option value="In Progress">In Progress</option>
            <option value="Sold">Sold</option>
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
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="odd:bg-hive-light even:bg-hive-light">
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-hive-charcoal">
                          {p.title}
                        </p>
                        <p className="mt-1 text-xs text-hive-slate">{p.id}</p>
                      </div>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {p.location}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold text-hive-charcoal">
                      {p.totalCost}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          Delete
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
                      No properties match your filters.
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
