import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

function formatPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toFixed(2)}%`;
}

function ruleLabel(ruleId) {
  const map = {
    "early-withdrawal": "Rule III",
    "sold-within-year": "Rule I",
    "not-sold-after-year": "Rule II",
    "loss-scenario": "Rule IV",
  };
  return map[ruleId] || humanizeKebab(ruleId);
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

function RuleBadge({ ruleNumber, title }) {
  if (!ruleNumber) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-hive-charcoal px-3 py-1 text-xs font-semibold text-hive-taupe">
      <span>Rule {ruleNumber}</span>
      {title ? <span className="text-white/80">· {title}</span> : null}
    </span>
  );
}

function ScenarioPill({ scenarioKey, ruleNumber }) {
  if (ruleNumber) {
    return <RuleBadge ruleNumber={ruleNumber} />;
  }

  const key = String(scenarioKey || "");
  const cls =
    key === "early-withdrawal"
      ? "bg-amber-100 text-amber-900"
      : key === "loss-scenario"
        ? "bg-violet-100 text-violet-900"
        : key === "sold-within-year"
          ? "bg-emerald-100 text-emerald-900"
          : key === "not-sold-after-year" || key === "sold-after-year"
            ? "bg-sky-100 text-sky-900"
            : "bg-neutral-100 text-neutral-800";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {humanizeKebab(key.replace(/-/g, " "))}
    </span>
  );
}

function DetailRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-hive-taupe/10 py-2.5 last:border-b-0">
      <dt className="text-sm text-hive-slate">{label}</dt>
      <dd
        className={
          "text-right text-sm font-semibold text-hive-charcoal " +
          (highlight ? "tabular-nums text-emerald-800" : "")
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ExitPlanViewModal({ row, onClose, onRequestExit, requestSubmitting }) {
  if (!row) return null;

  const { investment, property, cheque, funding, exitPlan, exitRequest, activeExitRequest } = row;
  const payouts = exitPlan?.projectedPayouts || {};
  const financials = exitPlan?.financials || {};
  const current = exitPlan?.currentScenario || {};
  const opts = exitPlan?.withdrawalOptions || {};
  const canRequest = opts.canRequestExit && !opts.exitRequestDisabled;
  const requestType = opts.canRequestEarlyExit
    ? "early-withdrawal"
    : opts.canRequestMarketValueExit
      ? "not-sold-after-year"
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div className="my-auto w-full max-w-3xl rounded-2xl border border-hive-taupe/20 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-hive-taupe/15 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Exit plan
            </p>
            <h2 className="mt-1 text-lg font-semibold text-hive-charcoal">
              {property?.title || "Property"}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {exitPlan?.currentRule ? (
                <RuleBadge
                  ruleNumber={exitPlan.currentRule.number}
                  title={exitPlan.currentRule.title}
                />
              ) : (
                <ScenarioPill scenarioKey={exitPlan?.scenarioKey} />
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-hive-taupe/30 px-3 py-2 text-xs font-semibold"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <section className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-hive-taupe">
              Current scenario
            </h3>
            <p className="mt-2 text-sm font-semibold text-hive-charcoal">{exitPlan?.scenarioTitle}</p>
            <p className="mt-1 text-sm text-hive-slate">{exitPlan?.scenarioDescription}</p>
            {exitPlan?.currentRule ? (
              <p className="mt-3 rounded-lg border border-hive-taupe/20 bg-white px-3 py-2 text-sm text-hive-slate">
                <span className="font-semibold text-hive-charcoal">
                  Rule {exitPlan.currentRule.number}:
                </span>{" "}
                {exitPlan.currentRule.description}
              </p>
            ) : exitPlan?.holdingContext ? (
              <p className="mt-3 rounded-lg border border-hive-taupe/20 bg-white px-3 py-2 text-sm text-hive-slate">
                <span className="font-semibold text-hive-charcoal">
                  {exitPlan.holdingContext.label}:
                </span>{" "}
                {exitPlan.holdingContext.summary}
              </p>
            ) : null}
            <dl className="mt-4">
              <DetailRow label="Applied rule" value={exitPlan?.currentRule ? `Rule ${exitPlan.currentRule.number}` : exitPlan?.holdingContext?.label || "—"} />
              <DetailRow label="Expected principal return" value={formatPKR(current.expectedPrincipalReturn)} />
              <DetailRow
                label={current.usesRecordedProfit ? "Recorded profit" : "Expected profit"}
                value={formatPKR(current.expectedProfitReturn)}
                highlight
              />
              <DetailRow label="Expected total return" value={formatPKR(current.expectedTotalReturn)} highlight />
              <DetailRow label="Settlement status" value={current.settlementStatus || "—"} />
            </dl>
          </section>

          <section className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-hive-taupe">Timeline</h3>
            <dl className="mt-3">
              <DetailRow label="Invested on" value={formatDate(investment?.investmentDate)} />
              <DetailRow label="One-year date" value={formatDate(exitPlan?.oneYearDate)} />
              <DetailRow label="Investment age" value={`${exitPlan?.investmentAgeDays ?? 0} days`} />
              <DetailRow
                label="Days until one year"
                value={
                  exitPlan?.daysUntilOneYear != null ? String(exitPlan.daysUntilOneYear) : "—"
                }
              />
              <DetailRow label="Within first year" value={exitPlan?.withinFirstYear ? "Yes" : "No"} />
              <DetailRow label="Property sold" value={exitPlan?.propertySold ? "Yes" : "No"} />
              <DetailRow label="Construction status" value={humanizeKebab(property?.constructionStatus)} />
            </dl>
          </section>

          <section className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-hive-taupe">
              Financial basis
            </h3>
            <dl className="mt-3">
              <DetailRow label="Your contribution" value={formatPKR(financials.principal)} />
              <DetailRow label="Recorded profit" value={formatPKR(financials.recordedProfit)} highlight />
              <DetailRow label="Total property cost" value={formatPKR(financials.totalPropertyCost)} />
              <DetailRow label="Expected selling price" value={formatPKR(financials.expectedSellingPrice)} />
              <DetailRow label="Projected project profit" value={formatPKR(financials.projectedProjectProfit)} />
              <DetailRow label="Funding collected" value={formatPKR(financials.propertyFundingCollected)} />
              <DetailRow label="Investor funding target" value={formatPKR(financials.investorFundingRequired)} />
              <DetailRow label="Remaining funding" value={formatPKR(funding?.remainingFunding)} />
              <DetailRow label="Target pool share" value={formatPct(financials.targetPoolSharePct)} />
              <DetailRow label="Raised pool share" value={formatPct(financials.profitAllocationSharePct)} />
              <DetailRow
                label="Profit split"
                value={`${financials.investorProfitSharePct}% / ${financials.hiveProfitSharePct}%`}
              />
              <DetailRow
                label="Loss protection"
                value={financials.investorProtectionEnabled ? "Enabled" : "Disabled"}
              />
            </dl>
          </section>

          <section className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-hive-taupe">
              Projected payouts by rule
            </h3>
            <div className="mt-3 space-y-3">
              {[
                payouts.earlyWithdrawal,
                payouts.soldWithinYear,
                payouts.notSoldAfterYear,
                payouts.lossProtection,
              ]
                .filter(Boolean)
                .map((payout) => (
                  <div
                    key={payout.ruleId}
                    className="rounded-lg border border-hive-taupe/15 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-hive-charcoal">
                      {ruleLabel(payout.ruleId)}
                    </p>
                    <dl className="mt-2">
                      <DetailRow label="Principal" value={formatPKR(payout.principal)} />
                      <DetailRow label="Profit" value={formatPKR(payout.profit)} highlight />
                      <DetailRow label="Total" value={formatPKR(payout.total)} highlight />
                    </dl>
                    <p className="mt-2 text-xs text-hive-slate">{payout.note}</p>
                  </div>
                ))}
            </div>
          </section>

          {cheque ? (
            <section className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-hive-taupe">
                  Security cheque
                </h3>
                <ChequeStatusPill status={cheque.status} />
              </div>
              <dl className="mt-3">
                <DetailRow label="Cheque number" value={cheque.chequeNumber} />
                <DetailRow label="Principal secured" value={formatPKR(cheque.principalAmount)} highlight />
                <DetailRow label="Bank" value={cheque.bankName || "—"} />
                <DetailRow label="Issued" value={formatDate(cheque.issueDate)} />
                <DetailRow label="Maturity" value={formatDate(cheque.maturityDate)} />
                <DetailRow label="Settlement type" value={formatSettlementType(cheque.settlementType)} />
                {cheque.settlementNote ? (
                  <DetailRow label="Settlement note" value={cheque.settlementNote} />
                ) : null}
              </dl>
            </section>
          ) : null}

          {exitPlan?.actionsNeeded?.length ? (
            <section className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                Actions needed
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-amber-950">
                {exitPlan.actionsNeeded.map((action) => (
                  <li key={action} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                    {action}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {(activeExitRequest || exitRequest) && (
          <div className="border-t border-hive-taupe/15 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-hive-taupe">Exit request</p>
            <p className="mt-1 text-sm text-hive-slate">
              Status:{" "}
              <span className="font-semibold text-hive-charcoal">
                {(activeExitRequest || exitRequest).statusLabel}
              </span>
              {(activeExitRequest || exitRequest).adminNote ? (
                <span className="block mt-1">Admin note: {(activeExitRequest || exitRequest).adminNote}</span>
              ) : null}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-hive-taupe/15 px-6 py-5">
          {canRequest && requestType ? (
            <button
              type="button"
              disabled={requestSubmitting}
              onClick={() => onRequestExit?.({ investmentId: investment.id, requestType, row })}
              className="rounded-lg bg-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-light hover:text-hive-taupe disabled:opacity-60"
            >
              {requestSubmitting ? "Submitting…" : "Request exit"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-400"
              title={opts.exitRequestDisabledReason || "Exit request not available"}
            >
              {opts.exitRequestDisabled
                ? opts.exitRequestStatus === "pending"
                  ? "Exit requested — pending"
                  : opts.exitRequestStatus === "approved"
                    ? "Exit approved — in progress"
                    : opts.exitRequestStatus === "completed" || investment?.status === "withdrawn"
                      ? "Exit completed"
                      : "Request exit (unavailable)"
                : "Request exit (unavailable)"}
            </button>
          )}
          <Link
            href={`/properties/${investment.propertyId}?role=investor`}
            className="rounded-lg bg-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-light hover:text-hive-taupe"
          >
            View property
          </Link>
          <Link
            href="/investor/investments"
            className="rounded-lg border border-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-charcoal"
          >
            My investments
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function InvestorExitPlanPage() {
  const [rules, setRules] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/investor/exit-plan");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load exit plan.");
        setItems([]);
        return;
      }
      setRules(Array.isArray(data?.rules) ? data.rules : []);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setSummary(data?.summary || {});
    } catch {
      setError("Unable to load exit plan.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRequestExit = async ({ investmentId, requestType, row }) => {
    const reason = window.prompt("Optional reason for your exit request:", "");
    if (reason === null) return;

    setRequestSubmitting(true);
    setRequestMessage("");
    setError("");
    try {
      const res = await fetch("/api/investor/exit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investmentId, requestType, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to submit exit request.");
        return;
      }
      setRequestMessage("Exit request submitted. Admin will review and issue your security cheque.");
      await load();
      if (row) {
        const refreshed = await fetch(`/api/investor/exit-plan?investmentId=${investmentId}`);
        const refreshedData = await refreshed.json().catch(() => ({}));
        if (refreshed.ok && refreshedData?.item) setViewRow(refreshedData.item);
      }
    } catch {
      setError("Unable to submit exit request.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const hasItems = items.length > 0;

  return (
    <>
      <Head>
        <title>Exit Plan | Hive Construction</title>
      </Head>

      <div className="space-y-6">
        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Exit Plan</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
            Security & Withdrawal Options
          </h1>
          <p className="mt-2 text-sm leading-6 text-hive-slate">
            Exit plans are generated from your investment amount, property data, funding pool share,
            and security cheque status.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Total principal", formatPKR(summary.totalPrincipal)],
              ["Recorded profit", formatPKR(summary.totalRecordedProfit)],
              ["Principal secured", formatPKR(summary.totalSecured)],
              ["Investments", String(summary.investmentCount ?? 0)],
              ["Early withdrawal eligible", String(summary.earlyWithdrawalEligibleCount ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-hive-taupe/15 bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
                  {label}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">{value}</p>
              </div>
            ))}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {requestMessage ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {requestMessage}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <h2 className="text-base font-semibold text-hive-charcoal">Exit plan rules</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
                <p className="text-sm font-semibold text-hive-charcoal">
                  Rule {rule.ruleNumber}: {rule.title}
                </p>
                <p className="mt-2 text-sm text-hive-slate">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-hive-taupe/20 bg-white">
          <div className="border-b border-hive-taupe/15 py-4">
            <h2 className="text-base font-semibold text-hive-charcoal">
              Your investments — generated exit plans
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-hive-charcoal">
                <tr>
                  {[
                    "Property",
                    "Scenario",
                    "Principal",
                    "Expected profit",
                    "Total return",
                    "One-year date",
                    "Cheque",
                    "Early exit",
                    "Actions",
                  ].map((label) => (
                    <th
                      key={label}
                      className={`whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-widest text-hive-taupe ${
                        label === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-hive-slate">
                      Loading exit plans…
                    </td>
                  </tr>
                ) : !hasItems ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <p className="font-semibold text-hive-charcoal">No investments to track yet</p>
                      <Link
                        href="/properties"
                        className="mt-4 inline-flex rounded-lg bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light"
                      >
                        Browse properties
                      </Link>
                    </td>
                  </tr>
                ) : (
                  items.map((row) => {
                    const { investment, property, cheque, exitPlan } = row;
                    const current = exitPlan?.currentScenario || {};
                    return (
                      <tr
                        key={investment.id}
                        className="odd:bg-hive-light even:bg-white hover:bg-hive-taupe/10"
                      >
                        <td className="border-t border-hive-taupe/15 px-4 py-4">
                          <p className="text-sm font-semibold text-hive-charcoal">
                            {property?.title || "Property"}
                          </p>
                          <p className="mt-0.5 text-xs text-hive-slate">{property?.city || "—"}</p>
                        </td>
                        <td className="border-t border-hive-taupe/15 px-4 py-4">
                          {exitPlan?.currentRule ? (
                            <RuleBadge
                              ruleNumber={exitPlan.currentRule.number}
                              title={exitPlan.currentRule.title}
                            />
                          ) : (
                            <>
                              <ScenarioPill scenarioKey={exitPlan?.scenarioKey} />
                              {exitPlan?.holdingContext ? (
                                <p className="mt-1 max-w-[160px] text-xs text-hive-slate">
                                  {exitPlan.holdingContext.label}
                                </p>
                              ) : null}
                            </>
                          )}
                          <p className="mt-1 max-w-[160px] text-xs text-hive-slate">
                            {exitPlan?.scenarioTitle}
                          </p>
                        </td>
                        <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm font-semibold tabular-nums">
                          {formatPKR(investment.amount)}
                        </td>
                        <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm font-semibold tabular-nums text-emerald-800">
                          {formatPKR(current.expectedProfitReturn)}
                        </td>
                        <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm font-semibold tabular-nums">
                          {formatPKR(current.expectedTotalReturn)}
                        </td>
                        <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm whitespace-nowrap text-hive-slate">
                          {formatDate(exitPlan?.oneYearDate)}
                        </td>
                        <td className="border-t border-hive-taupe/15 px-4 py-4">
                          {cheque ? (
                            <ChequeStatusPill status={cheque.status} />
                          ) : (
                            <span className="text-xs text-hive-slate">None</span>
                          )}
                        </td>
                        <td className="border-t border-hive-taupe/15 px-4 py-4 text-xs text-hive-slate">
                          {exitPlan?.withdrawalOptions?.earlyWithdrawalAllowed
                            ? "Available"
                            : "Not available"}
                        </td>
                        <td className="border-t border-hive-taupe/15 px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setViewRow(row)}
                            className="rounded-lg border border-hive-charcoal px-3.5 py-2 text-xs font-semibold text-hive-charcoal hover:border-hive-taupe"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExitPlanViewModal
        row={viewRow}
        onClose={() => setViewRow(null)}
        onRequestExit={handleRequestExit}
        requestSubmitting={requestSubmitting}
      />
    </>
  );
}
