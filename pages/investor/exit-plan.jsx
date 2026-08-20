import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import InfoCard from "@/components/InfoCard";
import { formatChequeStatus, formatSettlementType } from "@/lib/securityChequeConstants";

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

function humanizeKebab(value) {
  const v = String(value || "").trim();
  if (!v) return "—";
  return v
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
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

function ScenarioPill({ scenarioKey }) {
  const key = String(scenarioKey || "");
  const cls =
    key === "early-withdrawal"
      ? "bg-amber-100 text-amber-900"
      : key === "loss-scenario"
        ? "bg-violet-100 text-violet-900"
        : key === "sold-within-year"
          ? "bg-emerald-100 text-emerald-900"
          : key === "not-sold-after-year"
            ? "bg-sky-100 text-sky-900"
            : "bg-neutral-100 text-neutral-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {humanizeKebab(key.replace(/-/g, " "))}
    </span>
  );
}

export default function InvestorExitPlanPage() {
  const [rules, setRules] = useState([]);
  const [items, setItems] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [summary, setSummary] = useState({
    totalSecured: 0,
    activeCount: 0,
    investmentCount: 0,
    pendingActionCount: 0,
    earlyWithdrawalEligibleCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/investor/exit-plan");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data?.message || "Unable to load exit plan.");
          return;
        }
        if (!cancelled) {
          setRules(Array.isArray(data?.rules) ? data.rules : []);
          setItems(Array.isArray(data?.items) ? data.items : []);
          setCheques(Array.isArray(data?.cheques) ? data.cheques : []);
          setSummary(data?.summary || {});
        }
      } catch {
        if (!cancelled) setError("Unable to load exit plan.");
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

      <div className="space-y-6">
        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
            Exit Plan
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
            Security & Withdrawal Options
          </h1>
          <p className="mt-2 text-sm leading-6 text-hive-slate">
            Track your exit plan, withdrawal options, and actions needed for each investment.
            Principal is secured through cheques issued by Hive Construction.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Principal secured"
              value={formatPKR(summary.totalSecured)}
              subtext="Total covered by security cheques"
            />
            <InfoCard
              label="Investments tracked"
              value={String(summary.investmentCount ?? 0)}
              subtext="Exit scenarios per investment"
            />
            <InfoCard
              label="Early withdrawal eligible"
              value={String(summary.earlyWithdrawalEligibleCount ?? 0)}
              subtext="Principal-only exit before sale / 1 year"
            />
            <InfoCard
              label="Active cheques"
              value={String(summary.activeCount ?? 0)}
              subtext="Pending or active instruments"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <h2 className="text-base font-semibold text-hive-charcoal">Exit plan rules</h2>
          <p className="mt-2 text-sm text-hive-slate">
            These rules govern how exits and withdrawals are handled across all Hive projects.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(rules.length > 0 ? rules : []).map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl border border-hive-taupe/15 bg-neutral-50 p-4"
              >
                <p className="text-sm font-semibold text-hive-charcoal">{rule.title}</p>
                <p className="mt-2 text-sm leading-6 text-hive-slate">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-charcoal p-6 text-hive-light">
          <h2 className="text-base font-semibold text-hive-taupe">Early withdrawal process</h2>
          <p className="mt-3 text-sm leading-6 text-hive-light/85">
            If you withdraw before one year or before the property sale, only your original
            investment is returned — no profit. Contact Hive Construction support with your
            investment ID. When processed, your security cheque is cleared under the early
            withdrawal settlement type.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-hive-light/80">
            <li>• Outcome: principal only (no profit share)</li>
            <li>• Requires Hive admin approval and cheque settlement</li>
            <li>• Check each investment below for eligibility and current status</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <h2 className="text-base font-semibold text-hive-charcoal">Your investments — exit tracking</h2>
          {loading ? (
            <p className="mt-4 text-sm text-hive-slate">Loading exit plan…</p>
          ) : items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-hive-taupe/20 bg-neutral-50 p-8 text-center">
              <p className="text-base font-semibold text-hive-charcoal">No investments to track yet</p>
              <p className="mt-2 text-sm text-hive-slate">
                Invest in a property to see exit scenarios, withdrawal options, and security cheques here.
              </p>
              <Link
                href="/properties"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-hive-charcoal px-6 py-3 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
              >
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {items.map((row) => {
                const { investment, property, cheque, exitPlan } = row;
                return (
                  <div
                    key={investment.id}
                    className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-hive-charcoal">
                          {property?.title || "Property"}
                        </p>
                        <p className="mt-1 text-xs text-hive-slate">
                          {property?.city ? `${property.city} • ` : ""}
                          Investment {investment.id}
                        </p>
                      </div>
                      <ScenarioPill scenarioKey={exitPlan?.scenarioKey} />
                    </div>

                    <div className="mt-4 rounded-xl bg-neutral-50 p-4">
                      <p className="text-sm font-semibold text-hive-charcoal">
                        {exitPlan?.scenarioTitle}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-hive-slate">
                        {exitPlan?.scenarioDescription}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-hive-taupe/15 bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase text-hive-slate/70">
                          Your contribution
                        </p>
                        <p className="mt-1 text-sm font-bold tabular-nums">
                          {formatPKR(investment.amount)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-hive-taupe/15 bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase text-hive-slate/70">
                          Invested on
                        </p>
                        <p className="mt-1 text-sm">{formatDate(investment.investmentDate)}</p>
                      </div>
                      <div className="rounded-lg border border-hive-taupe/15 bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase text-hive-slate/70">
                          One-year date
                        </p>
                        <p className="mt-1 text-sm">{formatDate(exitPlan?.oneYearDate)}</p>
                      </div>
                      <div className="rounded-lg border border-hive-taupe/15 bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase text-hive-slate/70">
                          Property status
                        </p>
                        <p className="mt-1 text-sm">{humanizeKebab(property?.constructionStatus)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-hive-taupe/15 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-hive-taupe">
                          Withdrawal options
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-hive-slate">
                          <li>
                            <span className="font-semibold text-hive-charcoal">Early withdrawal:</span>{" "}
                            {exitPlan?.withdrawalOptions?.earlyWithdrawalAllowed
                              ? "Available (principal only)"
                              : "Not available for this investment"}
                          </li>
                          <li>
                            <span className="font-semibold text-hive-charcoal">Outcome:</span>{" "}
                            {exitPlan?.withdrawalOptions?.earlyWithdrawalOutcome}
                          </li>
                          <li>
                            <span className="font-semibold text-hive-charcoal">Profit split on sale:</span>{" "}
                            75% investors / 25% Hive
                          </li>
                          {exitPlan?.referenceMarketValue ? (
                            <li>
                              <span className="font-semibold text-hive-charcoal">Reference market value:</span>{" "}
                              {formatPKR(exitPlan.referenceMarketValue)}
                            </li>
                          ) : null}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                          Actions needed
                        </p>
                        {exitPlan?.actionsNeeded?.length ? (
                          <ul className="mt-3 space-y-2 text-sm text-amber-950">
                            {exitPlan.actionsNeeded.map((action) => (
                              <li key={action} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-amber-900/80">No immediate actions required.</p>
                        )}
                      </div>
                    </div>

                    {cheque ? (
                      <div className="mt-4 rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-hive-charcoal">
                            Security cheque #{cheque.chequeNumber}
                          </p>
                          <ChequeStatusPill status={cheque.status} />
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-hive-slate sm:grid-cols-3">
                          <span>Principal: {formatPKR(cheque.principalAmount)}</span>
                          <span>Settlement: {formatSettlementType(cheque.settlementType)}</span>
                          <span>Maturity: {formatDate(cheque.maturityDate)}</span>
                        </div>
                        {cheque.settlementNote ? (
                          <p className="mt-2 text-xs text-hive-slate">
                            <span className="font-semibold">Note:</span> {cheque.settlementNote}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/properties/${investment.propertyId}?role=investor`}
                        className="inline-flex items-center justify-center rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                      >
                        View property
                      </Link>
                      <Link
                        href="/investor/investments"
                        className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                      >
                        My investments
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <h2 className="text-base font-semibold text-hive-charcoal">All security cheques</h2>
          {loading ? (
            <p className="mt-3 text-sm text-hive-slate">Loading cheques…</p>
          ) : cheques.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-hive-taupe/20 bg-neutral-50 p-8 text-center text-sm text-hive-slate">
              No security cheques recorded yet. Cheques appear here once issued by admin for your
              investments.
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
                      <p className="text-[10px] font-semibold uppercase text-hive-slate/70">Settlement</p>
                      <p className="mt-1 text-sm">{formatSettlementType(c.settlementType)}</p>
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
