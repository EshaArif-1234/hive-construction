import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import InfoCard from "@/components/InfoCard";
import StatusBadge from "@/components/StatusBadge";

const MOCK_INVESTMENTS = [
  {
    id: "invst-001",
    propertyId: "islamabad-01",
    propertyTitle: "Islamabad Land + Construction",
    status: "In Progress",
    contribution: 350000,
    investedOn: "2026-02-14",
    totalPropertyCost: 12500000,
    currentMarketValue: 13200000,
    sold: false,
    soldWithinOneYear: false,
    withdrawnEarly: false,
  },
  {
    id: "invst-002",
    propertyId: "lahore-01",
    propertyTitle: "Lahore Residential Build",
    status: "Available",
    contribution: 750000,
    investedOn: "2026-01-12",
    totalPropertyCost: 8500000,
    currentMarketValue: 9200000,
    sold: false,
    soldWithinOneYear: true,
    withdrawnEarly: false,
  },
];

function formatPKR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function calcInvestorSharePercent(contribution, totalCost) {
  const c = Number(contribution);
  const t = Number(totalCost);
  if (!Number.isFinite(c) || !Number.isFinite(t) || t <= 0) return 0;
  return (c / t) * 100;
}

function calcProfit(contribution, totalCost, currentMarketValue) {
  const c = Number(contribution);
  const t = Number(totalCost);
  const v = Number(currentMarketValue);
  if (![c, t, v].every(Number.isFinite) || t <= 0) {
    return { investorProfit: 0, hiveProfit: 0, totalProfit: 0 };
  }

  const totalProfit = v - t;
  if (totalProfit <= 0) {
    return { investorProfit: 0, hiveProfit: 0, totalProfit };
  }

  const investorProfit = totalProfit * 0.75;
  const hiveProfit = totalProfit * 0.25;
  return { investorProfit, hiveProfit, totalProfit };
}

export default function InvestorInvestmentsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_INVESTMENTS;

    return MOCK_INVESTMENTS.filter((x) => {
      return `${x.propertyId} ${x.propertyTitle} ${x.status} ${x.id}`
        .toLowerCase()
        .includes(q);
    });
  }, [query]);

  const totals = useMemo(() => {
    const totalContributed = filtered.reduce((sum, x) => sum + x.contribution, 0);
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
              (Mock data)
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
            Profit calculation is preview-only.
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {filtered.map((x) => {
            const sharePercent = calcInvestorSharePercent(
              x.contribution,
              x.totalPropertyCost
            );

            const profit = calcProfit(
              x.contribution,
              x.totalPropertyCost,
              x.currentMarketValue
            );

            const principalProtected = true;
            const principalReturn = x.contribution;

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
                  <StatusBadge status={x.status} />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard label="Your contribution" value={formatPKR(x.contribution)} />
                  <InfoCard
                    label="Your share (est.)"
                    value={`${sharePercent.toFixed(2)}%`}
                    subtext="Based on contribution / total cost"
                  />
                  <InfoCard
                    label="Current market value"
                    value={formatPKR(x.currentMarketValue)}
                    subtext="Mock value"
                  />
                  <InfoCard
                    label="Principal return"
                    value={formatPKR(principalReturn)}
                    subtext={principalProtected ? "Protected" : "Not protected"}
                  />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-hive-charcoal p-5 text-hive-light">
                    <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                      Profit calculation (preview)
                    </p>
                    <p className="mt-2 text-sm text-hive-light/80">
                      Total profit = market value − total cost
                    </p>
                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                        <span className="text-hive-light/90">Total Profit</span>
                        <span className="font-semibold text-hive-taupe">
                          {formatPKR(profit.totalProfit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                        <span className="text-hive-light/90">Investor Pool (75%)</span>
                        <span className="font-semibold text-hive-taupe">
                          {formatPKR(profit.investorProfit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-hive-slate p-3">
                        <span className="text-hive-light/90">Hive (25%)</span>
                        <span className="font-semibold text-hive-taupe">
                          {formatPKR(profit.hiveProfit)}
                        </span>
                      </div>
                    </div>
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
