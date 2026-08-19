import Head from "next/head";
import { useEffect, useState } from "react";
import InfoCard from "@/components/InfoCard";
import { formatChequeStatus } from "@/lib/securityChequeConstants";

function formatPKR(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `PKR ${Math.round(x).toLocaleString("en-PK")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}

function ChequeStatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "active"
      ? "bg-emerald-100 text-emerald-900"
      : s === "pending"
        ? "bg-amber-100 text-amber-900"
        : s === "cleared"
          ? "bg-sky-100 text-sky-900"
          : "bg-neutral-200 text-neutral-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {formatChequeStatus(status)}
    </span>
  );
}

export default function InvestorExitPlanPage() {
  const [cheques, setCheques] = useState([]);
  const [summary, setSummary] = useState({ totalSecured: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/investor/security/cheques");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data?.message || "Unable to load security cheques.");
          return;
        }
        if (!cancelled) {
          setCheques(Array.isArray(data?.cheques) ? data.cheques : []);
          setSummary(data?.summary || { totalSecured: 0, activeCount: 0 });
        }
      } catch {
        if (!cancelled) setError("Unable to load security cheques.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
          Security & Withdrawal Rules
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          Your principal is secured via cheques issued by Hive Construction for each investment.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <InfoCard
            label="Principal secured"
            value={formatPKR(summary.totalSecured)}
            subtext="Total amount covered by security cheques"
          />
          <InfoCard
            label="Active cheques"
            value={String(summary.activeCount)}
            subtext="Pending or active security instruments"
          />
          <InfoCard
            label="Profit sharing"
            value="75% / 25%"
            subtext="Investors / Hive when profit is distributed"
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <h2 className="text-base font-semibold text-hive-charcoal">Exit plan rules</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-hive-slate">
              <li>Sold before one year: profit distributed immediately (75% investors, 25% Hive).</li>
              <li>Not sold within one year: original investment + profit share at current market value.</li>
              <li>Early withdrawal: only original investment returned (no profit).</li>
              <li>Loss case: investor receives full principal; Hive bears the loss.</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
            <h2 className="text-base font-semibold text-hive-taupe">Early withdrawal</h2>
            <p className="mt-3 text-sm leading-6 text-hive-light/80">
              To request early withdrawal, contact Hive Construction support with your investment ID.
              When processed, your security cheque is cleared and only principal is returned.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-semibold text-hive-charcoal">Your security cheques</h2>
          {loading ? (
            <p className="mt-3 text-sm text-hive-slate">Loading cheques…</p>
          ) : cheques.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-hive-taupe/20 bg-neutral-50 p-8 text-center text-sm text-hive-slate">
              No security cheques recorded yet for your investments. Cheques appear here once issued by admin.
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {cheques.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-hive-charcoal">
                        Cheque #{c.chequeNumber}
                      </p>
                      <p className="mt-1 text-xs text-hive-slate">
                        {c.propertyTitle} · Investment {c.investmentId}
                      </p>
                    </div>
                    <ChequeStatusPill status={c.status} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-neutral-50 p-3">
                      <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Principal</p>
                      <p className="mt-1 text-sm font-bold tabular-nums">{formatPKR(c.principalAmount)}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-3">
                      <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Issued</p>
                      <p className="mt-1 text-sm">{formatDate(c.issueDate)}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-3">
                      <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Maturity</p>
                      <p className="mt-1 text-sm">{formatDate(c.maturityDate)}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-3">
                      <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Bank</p>
                      <p className="mt-1 text-sm">{c.bankName || "—"}</p>
                    </div>
                  </div>

                  {c.settlementNote ? (
                    <p className="mt-3 text-xs text-hive-slate">
                      <span className="font-semibold">Settlement:</span> {c.settlementNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
