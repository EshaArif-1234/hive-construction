import Head from "next/head";

export default function AdminReportsPage() {
  return (
    <>
      <Head>
        <title>Admin Reports | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
          Reporting
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
          Reports
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          Generate investor activity, property status, and profit/loss reports.
          (UI-only for now)
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <h2 className="text-base font-semibold text-hive-charcoal">
              Quick exports
            </h2>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
              >
                Export Investor Report
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Export Property Status Report
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Export Profit/Loss Summary
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
            <h2 className="text-base font-semibold text-hive-taupe">
              Notes
            </h2>
            <p className="mt-3 text-sm leading-6 text-hive-light/80">
              When backend APIs are connected, this page will offer date filters,
              property filters, investor selection, and downloadable PDF/CSV.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
