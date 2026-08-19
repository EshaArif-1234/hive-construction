import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import InfoCard from "@/components/InfoCard";
import StatusBadge from "@/components/StatusBadge";

function formatPKR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function calcInvestorSharePercent(contribution, investorPool) {
  const c = Number(contribution);
  const pool = Number(investorPool);
  if (!Number.isFinite(c) || !Number.isFinite(pool) || pool <= 0) return 0;
  return (c / pool) * 100;
}

function formatListingStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "Active";
  if (value === "paused") return "Paused";
  if (value === "completed") return "Completed";
  if (value === "archived") return "Archived";
  return "Draft";
}

export default function InvestorInvestmentsPage() {
  const [query, setQuery] = useState("");
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      return `${x.propertyId} ${x.propertyTitle} ${x.propertyStatus} ${x.status} ${x.id}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, investments]);

  const totals = useMemo(() => {
    const totalContributed = filtered.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    return { totalContributed };
  }, [filtered]);

  return (
    <>
      <Head>
        <title>My Investments | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Tracking
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              My Investments
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              View contribution amount, share percentage, and profit calculations.
            </p>
          </div>

          <Link
            href="/properties"
            className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            Invest in a Property
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Total Contributed" value={formatPKR(totals.totalContributed)} />
          <InfoCard label="Profit Split" value="75% Investor / 25% Hive" />
          <InfoCard label="Security" value="Cheque Guarantee" />
          <InfoCard label="Reporting" value="Status Updates" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
            placeholder="Search by property, status, id"
          />
          <div className="rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-slate">
            Showing <span className="font-semibold text-hive-charcoal">{filtered.length}</span>
          </div>
          <div className="rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-slate">
            Profit is distributed using the 75% investor / 25% Hive split when recorded by admin.
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 rounded-xl border border-hive-taupe/20 bg-hive-light p-3 text-sm text-hive-slate">
            Loading investments...
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {filtered.map((x) => {
            const sharePercent = calcInvestorSharePercent(x.amount, x.investorFundingRequired);
            const recordedProfit = Number(x.profitAmount || 0);

            return (
              <div
                key={x.id}
                className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-hive-charcoal">
                      {x.propertyTitle}
                    </p>
                    <p className="mt-1 text-xs text-hive-slate">
                      {x.propertyId} • Investment ID: {x.id}
                    </p>
                  </div>
                  <StatusBadge status={formatListingStatus(x.propertyStatus)} />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard label="Your contribution" value={formatPKR(x.amount)} />
                  <InfoCard
                    label="Pool share"
                    value={`${sharePercent.toFixed(2)}%`}
                    subtext="Your share of investor funding"
                  />
                  <InfoCard
                    label="Profit split"
                    value="75% / 25%"
                    subtext="Investors / Hive on project profit"
                  />
                  <InfoCard
                    label="Recorded profit"
                    value={formatPKR(recordedProfit)}
                    subtext={recordedProfit > 0 ? "Distributed by admin" : "Not recorded yet"}
                  />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-hive-charcoal p-5 text-hive-light">
                    <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                      Profit distribution
                    </p>
                    <p className="mt-2 text-sm text-hive-light/80">
                      75% of project profit goes to investors and 25% to Hive. Your recorded profit appears after admin allocation.
                    </p>
                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                        <span className="text-hive-light/90">Your Investment</span>
                        <span className="font-semibold text-hive-taupe">
                          {formatPKR(x.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                        <span className="text-hive-light/90">Investor pool share</span>
                        <span className="font-semibold text-hive-taupe">
                          {sharePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                        <span className="text-hive-light/90">Recorded profit</span>
                        <span className="font-semibold text-hive-taupe">
                          {formatPKR(recordedProfit)}
                        </span>
                      </div>
                    </div>
                    {Array.isArray(x.profitDistributions) && x.profitDistributions.length > 0 ? (
                      <ul className="mt-4 space-y-2 border-t border-hive-taupe/20 pt-4 text-xs">
                        {x.profitDistributions.map((row) => (
                          <li key={row.id || row.distributedAt} className="flex justify-between gap-3 text-hive-light/85">
                            <span>{formatPKR(row.amount)}{row.note ? ` · ${row.note}` : ""}</span>
                            <span>{row.distributedAt ? new Date(row.distributedAt).toLocaleDateString("en-PK") : "—"}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                      Actions
                    </p>
                    <p className="mt-2 text-sm leading-6 text-hive-slate">
                      View property details, review exit plan, or request early
                      withdrawal. (UI only)
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/properties/${x.propertyId}?role=investor`}
                        className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                      >
                        View Property
                      </Link>
                      <Link
                        href="/investor/exit-plan"
                        className="inline-flex items-center justify-center rounded-md border border-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                      >
                        Exit Plan
                      </Link>
                    </div>

                    <div className="mt-3 rounded-xl border border-hive-taupe/20 bg-hive-light p-3 text-sm text-hive-slate">
                      Early withdrawal:
                      <span className="ml-2 font-semibold text-hive-charcoal">
                        Principal only (no profit)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-10 text-center text-sm text-hive-slate">
              No investments match your search.
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
