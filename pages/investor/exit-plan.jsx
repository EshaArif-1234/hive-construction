import Head from "next/head";
import InfoCard from "@/components/InfoCard";

export default function InvestorExitPlanPage() {
  return (
    <>
      <Head>
        <title>Exit Plan | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
          Exit Plan
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
          Withdrawal Options & Rules
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          Track exit plan status and understand early withdrawal behavior.
          (Frontend only)
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoCard
            label="Principal Protection"
            value="Enabled"
            subtext="Your original investment is secured through cheque guarantee."
          />
          <InfoCard
            label="Profit Sharing"
            value="75% Investors / 25% Hive"
            subtext="Applied when profit exists and based on sale timeline."
          />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <h2 className="text-base font-semibold text-hive-charcoal">
              Rule summary
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-hive-slate">
              <li>
                If the home is sold before one year: profit distributed immediately
                (25% Hive, 75% investors).
              </li>
              <li>
                If the home is not sold within one year: investors receive original
                investment + profit share as per current market value.
              </li>
              <li>
                If an investor withdraws before one year or before sale: only the
                original investment is returned (no profit).
              </li>
              <li>
                In case of loss (sale below cost): investor still receives original
                investment in full; Hive bears the loss.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
            <h2 className="text-base font-semibold text-hive-taupe">
              Early withdrawal request
            </h2>
            <p className="mt-3 text-sm leading-6 text-hive-light/80">
              Submit an early withdrawal request. In early withdrawal, you receive
              principal only (no profit). (UI-only)
            </p>

            <div className="mt-6 grid gap-3">
              <input
                className="w-full rounded-md border border-hive-taupe/40 bg-hive-slate px-3 py-2 text-sm text-hive-light outline-none focus:border-hive-taupe"
                placeholder="Investment ID (e.g., invst-001)"
              />
              <textarea
                className="w-full rounded-md border border-hive-taupe/40 bg-hive-slate px-3 py-2 text-sm text-hive-light outline-none focus:border-hive-taupe"
                placeholder="Reason for withdrawal (optional)"
                rows={4}
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-hive-taupe px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
