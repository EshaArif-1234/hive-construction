import Head from "next/head";
import InfoCard from "@/components/InfoCard";

export default function AdminDashboardPage() {
  return (
    <>
      <Head>
        <title>Admin Dashboard | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Overview
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Dashboard
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              High-level system metrics and shortcuts for admin operations.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Active Properties" value="3" subtext="Mock data" />
          <InfoCard label="Total Investors" value="12" subtext="Mock data" />
          <InfoCard label="Total Invested" value="PKR 4.2M" subtext="Mock data" />
          <InfoCard label="Pending Verifications" value="2" subtext="Mock data" />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <h2 className="text-base font-semibold text-hive-charcoal">
              Admin responsibilities
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-hive-slate">
              <li>Manage property listings (view / edit / delete)</li>
              <li>Track investor investments and profit distributions</li>
              <li>Maintain cheque security and exit plan enforcement</li>
              <li>Generate investor and profit/loss reports</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
            <h2 className="text-base font-semibold text-hive-taupe">
              Profit sharing rule
            </h2>
            <p className="mt-3 text-sm leading-6 text-hive-light/80">
              75% of profit is distributed among investors and 25% is retained by
              Hive. In case of loss, investors still receive full principal as
              secured via cheque.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
