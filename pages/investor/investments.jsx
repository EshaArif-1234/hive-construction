import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function formatPKR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function formatListingStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "Active";
  if (value === "paused") return "Paused";
  if (value === "completed") return "Completed";
  if (value === "archived") return "Archived";
  return "Draft";
}

function formatInvestmentStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "Active";
  if (value === "withdrawn") return "Withdrawn";
  if (value === "completed") return "Completed";
  return "Active";
}

function formatPaymentMethod(method) {
  const value = String(method || "").toLowerCase();
  if (value === "bank-transfer") return "Bank transfer";
  if (value === "easypaisa") return "Easypaisa";
  if (value === "jazzcash") return "JazzCash";
  return method || "—";
}

function formatInvestmentDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSharePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "0.00%";
  return `${n.toFixed(2)}%`;
}

function formatText(value) {
  const v = String(value || "").trim();
  return v || "—";
}

function DetailRow({ label, value, mono = false, highlight = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-hive-taupe/10 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-sm text-hive-slate">{label}</dt>
      <dd
        className={
          "text-right text-sm text-hive-charcoal " +
          (mono ? "font-mono text-xs break-all " : "font-semibold ") +
          (highlight ? "tabular-nums text-emerald-800" : "")
        }
      >
        {value}
      </dd>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-hive-taupe">{title}</h3>
      <dl className="mt-3">{children}</dl>
    </section>
  );
}

function InvestmentStatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const label = formatInvestmentStatus(s);
  const cls =
    s === "active"
      ? "bg-emerald-100 text-emerald-900"
      : s === "completed"
        ? "bg-sky-100 text-sky-900"
        : s === "withdrawn"
          ? "bg-amber-100 text-amber-900"
          : "bg-neutral-200 text-neutral-800";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function ListingStatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const label = formatListingStatus(s);
  const cls =
    s === "active"
      ? "bg-hive-charcoal text-hive-taupe"
      : s === "completed"
        ? "bg-sky-100 text-sky-900"
        : "bg-neutral-100 text-neutral-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function InvestmentViewModal({ investment, onClose }) {
  const [exitPlanRow, setExitPlanRow] = useState(null);
  const [exitPlanLoading, setExitPlanLoading] = useState(false);

  useEffect(() => {
    if (!investment?.id) {
      setExitPlanRow(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setExitPlanLoading(true);
      try {
        const res = await fetch(`/api/investor/exit-plan?investmentId=${investment.id}`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setExitPlanRow(data?.item || null);
        } else if (!cancelled) {
          setExitPlanRow(null);
        }
      } catch {
        if (!cancelled) setExitPlanRow(null);
      } finally {
        if (!cancelled) setExitPlanLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [investment?.id]);

  if (!investment) return null;

  const distributions = Array.isArray(investment.profitDistributions)
    ? investment.profitDistributions
    : [];
  const exitPlan = exitPlanRow?.exitPlan;
  const current = exitPlan?.currentScenario;
  const payouts = exitPlan?.projectedPayouts;
  const exitOpts = exitPlan?.withdrawalOptions || {};
  const exitBlocked = exitOpts.exitRequestDisabled;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="investment-view-title"
    >
      <div className="my-auto w-full max-w-3xl rounded-2xl border border-hive-taupe/20 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-hive-taupe/15 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Investment details
            </p>
            <h2 id="investment-view-title" className="mt-1 text-lg font-semibold text-hive-charcoal">
              {investment.propertyTitle}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <InvestmentStatusPill status={investment.status} />
              <ListingStatusPill status={investment.propertyStatus} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-hive-taupe/30 px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <DetailSection title="Identifiers">
            <DetailRow label="Investment ID" value={investment.id} mono />
            <DetailRow label="Investor ID" value={investment.investorId} mono />
            <DetailRow label="Property ID" value={investment.propertyId} mono />
          </DetailSection>

          <DetailSection title="Property">
            <DetailRow label="Title" value={formatText(investment.propertyTitle)} />
            <DetailRow label="City" value={formatText(investment.propertyCity)} />
            <DetailRow label="Listing status" value={formatListingStatus(investment.propertyStatus)} />
            <DetailRow label="Total property cost" value={formatPKR(investment.totalPropertyCost)} highlight />
          </DetailSection>

          <DetailSection title="Your investment">
            <DetailRow label="Contribution amount" value={formatPKR(investment.amount)} highlight />
            <DetailRow label="Investment date" value={formatInvestmentDate(investment.investmentDate)} />
            <DetailRow label="Payment method" value={formatPaymentMethod(investment.paymentMethod)} />
            <DetailRow
              label="Payment proof file"
              value={formatText(investment.paymentScreenshotName)}
            />
            <DetailRow label="Investment status" value={formatInvestmentStatus(investment.status)} />
          </DetailSection>

          <DetailSection title="Funding pool">
            <DetailRow
              label="Investor funding target"
              value={formatPKR(investment.investorFundingRequired)}
            />
            <DetailRow
              label="Property funding collected"
              value={formatPKR(investment.propertyFundingCollected)}
            />
            <DetailRow
              label="Remaining funding"
              value={formatPKR(investment.remainingFunding)}
            />
            <DetailRow
              label="Funding progress"
              value={formatSharePct(investment.fundingProgressPct)}
            />
            <DetailRow
              label="Fully funded"
              value={investment.isFullyFunded ? "Yes" : "No"}
            />
            <DetailRow
              label="Active investors on property"
              value={String(investment.propertyInvestorCount ?? 0)}
            />
          </DetailSection>

          <DetailSection title="Share & profit">
            <DetailRow
              label="Share of target pool"
              value={formatSharePct(investment.sharePercentage)}
            />
            <DetailRow
              label="Share of raised pool"
              value={formatSharePct(investment.profitAllocationSharePct)}
            />
            <DetailRow
              label="Investor profit share"
              value={`${Number(investment.investorProfitShare ?? 75)}%`}
            />
            <DetailRow
              label="Hive profit share"
              value={`${Number(investment.hiveProfitShare ?? 25)}%`}
            />
            <DetailRow
              label="Total recorded profit"
              value={formatPKR(investment.profitAmount)}
              highlight
            />
            <DetailRow
              label="Last profit payout"
              value={formatInvestmentDate(investment.lastProfitDistributedAt)}
            />
          </DetailSection>

          <section className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-hive-taupe">
              Profit distribution history
            </h3>
            {distributions.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {distributions.map((row, index) => (
                  <li
                    key={row.id || row.distributedAt || index}
                    className="rounded-lg border border-hive-taupe/15 bg-white px-4 py-3"
                  >
                    <dl>
                      <DetailRow label="Distribution ID" value={formatText(row.id)} mono />
                      <DetailRow label="Amount" value={formatPKR(row.amount)} highlight />
                      <DetailRow
                        label="Distributed on"
                        value={formatInvestmentDate(row.distributedAt)}
                      />
                      <DetailRow label="Note" value={formatText(row.note)} />
                      <DetailRow label="Recorded by" value={formatText(row.recordedBy)} />
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-hive-slate">
                No profit distributions recorded yet.
              </p>
            )}
          </section>
          <section className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-hive-taupe">
              Generated exit plan
            </h3>
            {exitPlanLoading ? (
              <p className="mt-3 text-sm text-hive-slate">Generating exit plan…</p>
            ) : exitPlan ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-hive-taupe/15 bg-white px-4 py-3">
                  {exitPlan.currentRule ? (
                    <RuleBadge
                      ruleNumber={exitPlan.currentRule.number}
                      title={exitPlan.currentRule.title}
                    />
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-hive-charcoal">{exitPlan.scenarioTitle}</p>
                  <p className="mt-1 text-sm text-hive-slate">{exitPlan.scenarioDescription}</p>
                  {exitPlan.holdingContext && !exitPlan.currentRule ? (
                    <p className="mt-2 text-xs text-hive-slate">{exitPlan.holdingContext.summary}</p>
                  ) : null}
                  <dl className="mt-3">
                    <DetailRow
                      label="Expected total return"
                      value={formatPKR(current?.expectedTotalReturn)}
                      highlight
                    />
                    <DetailRow
                      label={current?.usesRecordedProfit ? "Recorded profit" : "Expected profit"}
                      value={formatPKR(current?.expectedProfitReturn)}
                      highlight
                    />
                    <DetailRow label="Settlement" value={current?.settlementStatus || "—"} />
                    <DetailRow label="One-year date" value={formatInvestmentDate(exitPlan.oneYearDate)} />
                  </dl>
                </div>
                {payouts ? (
                  <div className="grid gap-2 sm:grid-cols-2">
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
                          className="rounded-lg border border-hive-taupe/15 bg-white px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-hive-charcoal">
                            {payout.ruleId === "early-withdrawal"
                              ? "Rule III"
                              : payout.ruleId === "sold-within-year"
                                ? "Rule I"
                                : payout.ruleId === "not-sold-after-year"
                                  ? "Rule II"
                                  : payout.ruleId === "loss-scenario"
                                    ? "Rule IV"
                                    : String(payout.ruleId).replace(/-/g, " ")}
                          </p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-800">
                            {formatPKR(payout.total)}
                          </p>
                          <p className="mt-1 text-[11px] text-hive-slate">{payout.note}</p>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-hive-slate">Exit plan unavailable for this investment.</p>
            )}
          </section>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-hive-taupe/15 px-6 py-5">
          <Link
            href={`/properties/${investment.propertyId}?role=investor`}
            className="inline-flex items-center justify-center rounded-lg bg-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            View property
          </Link>
          <Link
            href="/investor/exit-plan"
            className={
              "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors " +
              (exitBlocked
                ? "cursor-not-allowed border border-neutral-200 bg-neutral-100 text-neutral-400 pointer-events-none"
                : "border border-hive-charcoal text-hive-charcoal hover:border-hive-taupe hover:text-hive-taupe")
            }
            aria-disabled={exitBlocked}
            tabIndex={exitBlocked ? -1 : undefined}
          >
            {exitBlocked
              ? exitOpts.exitRequestStatus === "pending"
                ? "Exit pending review"
                : exitOpts.exitRequestStatus === "approved"
                  ? "Exit in progress"
                  : investment?.status === "withdrawn" || exitOpts.exitRequestStatus === "completed"
                    ? "Exit completed"
                    : "Exit unavailable"
              : "Manage exit plan"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function InvestorInvestmentsPage() {
  const [query, setQuery] = useState("");
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewInvestment, setViewInvestment] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/investments");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data?.message || "Unable to load investments.");
          if (!cancelled) setInvestments([]);
          return;
        }
        if (!cancelled) setInvestments(Array.isArray(data?.investments) ? data.investments : []);
      } catch {
        if (!cancelled) {
          setError("Unable to load investments.");
          setInvestments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return investments;

    return investments.filter((x) => {
      return `${x.propertyId} ${x.propertyTitle} ${x.propertyCity} ${x.propertyStatus} ${x.status} ${x.id} ${x.paymentMethod}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, investments]);

  const totals = useMemo(() => {
    const totalContributed = filtered.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const totalRecordedProfit = filtered.reduce((sum, x) => sum + Number(x.profitAmount || 0), 0);
    return { totalContributed, totalRecordedProfit };
  }, [filtered]);

  const hasSearch = query.trim().length > 0;

  return (
    <>
      <Head>
        <title>My Investments | Hive Construction</title>
      </Head>

      <div className="border-y border-hive-taupe/20 bg-white">
        <div className="flex flex-col gap-4 border-b border-hive-taupe/15 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
                Total contributed
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-hive-charcoal">
                {formatPKR(totals.totalContributed)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
                Recorded profit
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-800">
                {formatPKR(totals.totalRecordedProfit)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">
                Investments
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-hive-charcoal">
                {filtered.length}
                <span className="ml-1 text-sm font-medium text-hive-slate">shown</span>
              </p>
            </div>
          </div>

          <Link
            href="/properties"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            Invest in a property
          </Link>
        </div>

        <div className="flex flex-col gap-3 border-b border-hive-taupe/15 py-4 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-hive-taupe/25 bg-white px-3 py-2.5 text-sm text-hive-charcoal outline-none focus:border-hive-taupe sm:max-w-md"
            placeholder="Search property, city, status, or ID"
          />
          <p className="text-sm text-hive-slate">
            Profit split: <span className="font-semibold text-hive-charcoal">75% investor / 25% Hive</span>
          </p>
        </div>

        {error ? (
          <div className="border-b border-red-200 bg-red-50 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-hive-charcoal">
              <tr>
                {[
                  "Property",
                  "City",
                  "Amount",
                  "Target share",
                  "Raised share",
                  "Profit",
                  "Invested",
                  "Status",
                  "Listing",
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
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-hive-slate">
                    Loading investments…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    {investments.length === 0 ? (
                      <div>
                        <p className="text-base font-semibold text-hive-charcoal">
                          You have no investments yet
                        </p>
                        <p className="mt-2 text-sm text-hive-slate">
                          Browse available properties and submit your first investment.
                        </p>
                        <Link
                          href="/properties"
                          className="mt-4 inline-flex rounded-lg bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                        >
                          Browse properties
                        </Link>
                      </div>
                    ) : hasSearch ? (
                      <p className="text-sm text-hive-slate">No investments match your search.</p>
                    ) : (
                      <p className="text-sm text-hive-slate">No investments to show.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((x) => (
                  <tr key={x.id} className="odd:bg-hive-light even:bg-white transition-colors hover:bg-hive-taupe/10">
                    <td className="border-t border-hive-taupe/15 px-4 py-4">
                      <p className="max-w-[200px] truncate text-sm font-semibold text-hive-charcoal">
                        {x.propertyTitle}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-hive-slate">{x.id}</p>
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm text-hive-slate">
                      {x.propertyCity || "—"}
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm font-semibold tabular-nums text-hive-charcoal">
                      {formatPKR(x.amount)}
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm tabular-nums text-hive-slate">
                      {formatSharePct(x.sharePercentage)}
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm tabular-nums text-hive-slate">
                      {formatSharePct(x.profitAllocationSharePct)}
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm font-semibold tabular-nums text-emerald-800">
                      {formatPKR(x.profitAmount)}
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4 text-sm whitespace-nowrap text-hive-slate">
                      {formatInvestmentDate(x.investmentDate)}
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4">
                      <InvestmentStatusPill status={x.status} />
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4">
                      <ListingStatusPill status={x.propertyStatus} />
                    </td>
                    <td className="border-t border-hive-taupe/15 px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setViewInvestment(x)}
                        className="rounded-lg border border-hive-charcoal px-3.5 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InvestmentViewModal investment={viewInvestment} onClose={() => setViewInvestment(null)} />
    </>
  );
}
