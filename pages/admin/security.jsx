import Head from "next/head";
import InfoCard from "@/components/InfoCard";

export default function AdminSecurityPage() {
  return (
    <>
      <Head>
        <title>Admin Security & Exit Plan | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
          Investment Security
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
          Security & Exit Plan
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          Manage cheque security and exit plan rules for all investments.
          (UI-only for now)
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoCard
            label="Cheque Security"
            value="Enabled"
            subtext="Investor principal is secured via cheque guarantee (admin managed)."
          />
          <InfoCard
            label="Exit Plan"
            value="Active"
            subtext="Rules applied based on sale timeline and withdrawal timing."
          />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <h2 className="text-base font-semibold text-hive-charcoal">
              Exit plan rules
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-hive-slate">
              <li>
                Sold before one year: profit distributed immediately (25% Hive,
                75% investors).
              </li>
              <li>
                Not sold within one year: investors receive original investment +
                profit share as per current market value.
              </li>
              <li>
                Withdraw before one year / before sale: only original investment
                returned (no profit).
              </li>
              <li>
                Loss case (sale below cost): investor still receives full
                principal; Hive bears the loss.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
            <h2 className="text-base font-semibold text-hive-taupe">
              Cheque management
            </h2>
            <p className="mt-3 text-sm leading-6 text-hive-light/80">
              Add cheque numbers, issue dates, maturity, and settlement status per
              investor contribution.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-xl bg-hive-slate p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  Example
                </p>
                <p className="mt-2 text-sm text-hive-light/80">
                  Cheque # 123456 — Investor principal secured — Status: Active
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-hive-taupe px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
              >
                Add Security Cheque
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
