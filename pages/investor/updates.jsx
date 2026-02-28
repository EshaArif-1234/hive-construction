import Head from "next/head";
import StatusBadge from "@/components/StatusBadge";

const MOCK_UPDATES = [
  {
    id: "up-001",
    type: "Property Status",
    title: "Islamabad Land + Construction",
    status: "In Progress",
    message: "Construction milestone reached: structural work started.",
    date: "2026-02-20",
  },
  {
    id: "up-002",
    type: "Profit Share",
    title: "Profit-share statement",
    status: "Available",
    message: "A new profit-share statement is available for review (mock).",
    date: "2026-02-18",
  },
  {
    id: "up-003",
    type: "Security",
    title: "Cheque security confirmed",
    status: "Available",
    message: "Your principal is secured through cheque guarantee (mock).",
    date: "2026-02-12",
  },
];

export default function InvestorUpdatesPage() {
  return (
    <>
      <Head>
        <title>Updates | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
          Notifications
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
          Updates
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          Investment progress, property status changes, and profit-share updates.
          (Mock data)
        </p>

        <div className="mt-6 grid gap-4">
          {MOCK_UPDATES.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-hive-charcoal">
                    {u.type} • {u.title}
                  </p>
                  <p className="mt-1 text-xs text-hive-slate">{u.date}</p>
                </div>
                <StatusBadge status={u.status} />
              </div>
              <p className="mt-4 text-sm leading-6 text-hive-slate">{u.message}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
