import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

function formatStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "draft") return "Draft";
  if (value === "active") return "Active";
  if (value === "paused") return "Paused";
  if (value === "completed") return "Completed";
  if (value === "archived") return "Archived";
  return "Draft";
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `PKR ${n.toLocaleString()}`;
}

function humanize(value) {
  return String(value || "—")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function InvestmentStatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const label =
    s === "active"
      ? "Active"
      : s === "withdrawn"
        ? "Withdrawn"
        : s === "completed"
          ? "Completed"
          : status || "—";
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

function DetailRow({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-hive-slate">{label}</p>
      <p className="mt-1 text-sm text-hive-charcoal">{value ?? "—"}</p>
    </div>
  );
}

const tabs = [
  { key: "basic", label: "Basic Info" },
  { key: "financial", label: "Financial" },
  { key: "investors", label: "Investors" },
  { key: "construction", label: "Construction" },
  { key: "media", label: "Media" },
  { key: "rules", label: "Rules" },
];

export default function AdminPropertyViewModal({ property, loading, error, onClose, onEdit }) {
  const [tab, setTab] = useState("basic");
  const [investments, setInvestments] = useState([]);
  const [investmentsSummary, setInvestmentsSummary] = useState(null);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);
  const [investmentsError, setInvestmentsError] = useState("");

  useEffect(() => {
    const propertyId = property?.id;
    if (!propertyId) {
      setInvestments([]);
      setInvestmentsSummary(null);
      setInvestmentsError("");
      return;
    }

    let cancelled = false;
    const loadInvestments = async () => {
      setInvestmentsLoading(true);
      setInvestmentsError("");
      try {
        const res = await fetch(
          `/api/admin/investments?propertyId=${encodeURIComponent(String(propertyId))}&status=active`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setInvestmentsError(data?.message || "Unable to load investors.");
            setInvestments([]);
            setInvestmentsSummary(null);
          }
          return;
        }
        if (!cancelled) {
          setInvestments(Array.isArray(data?.investments) ? data.investments : []);
          setInvestmentsSummary(data?.summary || null);
        }
      } catch {
        if (!cancelled) {
          setInvestmentsError("Unable to load investors.");
          setInvestments([]);
          setInvestmentsSummary(null);
        }
      } finally {
        if (!cancelled) setInvestmentsLoading(false);
      }
    };

    loadInvestments();
    return () => {
      cancelled = true;
    };
  }, [property?.id]);

  const images = [
    ...(property?.thumbnail?.url ? [property.thumbnail] : []),
    ...(Array.isArray(property?.galleryImages) ? property.galleryImages : []),
  ].filter((img) => img?.url);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center sm:p-6">
      <div className="my-auto flex min-h-0 w-full max-w-2xl max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-3xl border border-hive-taupe/15 bg-hive-light shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hive-taupe/15 px-6 pt-6 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Property</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-hive-charcoal">
              {loading ? "Loading…" : property?.title || "Property Details"}
            </h2>
            {property ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={formatStatus(property.listingStatus)} />
                {property.featured ? (
                  <span className="rounded-full bg-hive-taupe/20 px-2.5 py-0.5 text-xs font-semibold text-hive-charcoal">
                    Featured
                  </span>
                ) : null}
                <span className="text-xs text-hive-slate">{property.id}</span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-hive-slate">Read-only property details</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 [scrollbar-gutter:stable]">
          {loading ? (
            <p className="py-10 text-center text-sm text-hive-slate">Loading property details…</p>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : property ? (
            <>
              <div className="mb-6 rounded-xl border border-hive-taupe/20 bg-hive-light p-2">
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {tabs.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTab(item.key)}
                      className={
                        "rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors " +
                        (tab === item.key
                          ? "bg-hive-charcoal text-hive-light"
                          : "border border-hive-taupe/20 text-hive-slate hover:border-hive-taupe hover:text-hive-charcoal")
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "basic" ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailRow label="Property Title" value={property.title} className="sm:col-span-2" />
                    <DetailRow label="Property Type" value={humanize(property.type)} />
                    <DetailRow label="City / Location" value={property.city} />
                    <DetailRow label="Full Address" value={property.address || "—"} className="sm:col-span-2" />
                    <DetailRow label="Description" value={property.description || "—"} className="sm:col-span-2" />
                    <DetailRow label="Created By" value={property.createdBy || "—"} />
                    <DetailRow
                      label="Created At"
                      value={
                        property.createdAt
                          ? new Date(property.createdAt).toLocaleString()
                          : "—"
                      }
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                      Property Features
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Bedrooms" value={property.bedrooms ?? 0} />
                      <DetailRow label="Bathrooms" value={property.bathrooms ?? 0} />
                      <DetailRow label="Area Size" value={property.areaSize ?? 0} />
                      <DetailRow label="Garage" value={property.garage ?? 0} />
                      <DetailRow label="Floor Count" value={property.floorCount ?? 0} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                      Nearby Facilities
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <DetailRow label="School" value={yesNo(property.nearbySchool)} />
                      <DetailRow label="Hospital" value={yesNo(property.nearbyHospital)} />
                      <DetailRow label="Market" value={yesNo(property.nearbyMarket)} />
                      <DetailRow label="Mosque" value={yesNo(property.nearbyMosque)} />
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "investors" ? (
                <div className="space-y-4">
                  {investmentsLoading ? (
                    <p className="py-8 text-center text-sm text-hive-slate">Loading investors…</p>
                  ) : investmentsError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {investmentsError}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-hive-slate/80">
                        Showing active investments only. Investors who exit are removed from this list.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
                          <p className="text-[10px] font-semibold uppercase text-hive-slate/70">
                            Total invested
                          </p>
                          <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">
                            {formatCurrency(investmentsSummary?.totalPrincipal ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
                          <p className="text-[10px] font-semibold uppercase text-hive-slate/70">
                            Profit distributed
                          </p>
                          <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">
                            {formatCurrency(investmentsSummary?.totalProfit ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-4">
                          <p className="text-[10px] font-semibold uppercase text-hive-slate/70">
                            Active investments
                          </p>
                          <p className="mt-1 text-lg font-bold tabular-nums text-hive-charcoal">
                            {investmentsSummary?.activeCount ?? 0}
                          </p>
                        </div>
                      </div>

                      {investments.length === 0 ? (
                        <p className="rounded-xl border border-hive-taupe/15 bg-neutral-50 p-6 text-center text-sm text-hive-slate">
                          No active investors on this property. Exited or withdrawn investments are not shown.
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-hive-taupe/15">
                          <table className="min-w-full divide-y divide-hive-taupe/15 text-sm">
                            <thead className="bg-neutral-50">
                              <tr>
                                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-hive-slate">
                                  Investor
                                </th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-hive-slate">
                                  Amount
                                </th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-hive-slate">
                                  Pool share
                                </th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-hive-slate">
                                  Invested on
                                </th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-hive-slate">
                                  Profit
                                </th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-hive-slate">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-hive-taupe/10 bg-hive-light">
                              {investments.map((row) => (
                                <tr key={row.id} className="hover:bg-neutral-50/80">
                                  <td className="px-3 py-3">
                                    <div>
                                      {row.investorId ? (
                                        <Link
                                          href={`/admin/investors/${row.investorId}`}
                                          className="font-semibold text-hive-charcoal hover:text-hive-taupe"
                                        >
                                          {row.investorName}
                                        </Link>
                                      ) : (
                                        <p className="font-semibold text-hive-charcoal">
                                          {row.investorName}
                                        </p>
                                      )}
                                      <p className="mt-0.5 text-xs text-hive-slate">{row.investorEmail}</p>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 tabular-nums font-medium text-hive-charcoal">
                                    {formatCurrency(row.amount)}
                                  </td>
                                  <td className="px-3 py-3 tabular-nums text-hive-charcoal">
                                    {formatPct(row.sharePercentage)}
                                  </td>
                                  <td className="px-3 py-3 text-hive-charcoal">
                                    {formatDate(row.investmentDate)}
                                  </td>
                                  <td className="px-3 py-3 tabular-nums text-hive-charcoal">
                                    {formatCurrency(row.profitAmount)}
                                  </td>
                                  <td className="px-3 py-3">
                                    <InvestmentStatusPill status={row.status} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null}

              {tab === "financial" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Total Project Cost" value={formatCurrency(property.totalCost)} />
                  <DetailRow label="Hive Contribution" value={formatCurrency(property.hiveContribution)} />
                  <DetailRow
                    label="Required Investor Funding"
                    value={formatCurrency(property.investorFundingRequired)}
                  />
                  <DetailRow
                    label="Expected Selling Price"
                    value={formatCurrency(property.expectedSellingPrice)}
                  />
                  <DetailRow
                    label="Profit Split"
                    value={`${Number(property.investorProfitShare ?? 75)}% Investors / ${Number(property.hiveProfitShare ?? 25)}% Hive`}
                  />
                  <DetailRow
                    label="Minimum Investment"
                    value={formatCurrency(property.minimumInvestment)}
                  />
                  <DetailRow label="Funding Collected" value={formatCurrency(property.fundingCollected)} />
                  <DetailRow
                    label="Funding Progress"
                    value={
                      Number.isFinite(Number(property.fundingProgressPct))
                        ? `${property.fundingProgressPct}%`
                        : "—"
                    }
                  />
                  <DetailRow label="Risk Level" value={humanize(property.riskLevel)} />
                  <DetailRow
                    label="Investor Profit Share"
                    value={
                      Number.isFinite(Number(property.investorProfitShare))
                        ? `${property.investorProfitShare}%`
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Hive Profit Share"
                    value={
                      Number.isFinite(Number(property.hiveProfitShare))
                        ? `${property.hiveProfitShare}%`
                        : "—"
                    }
                  />
                </div>
              ) : null}

              {tab === "construction" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Construction Status" value={humanize(property.constructionStatus)} />
                  <DetailRow label="Listing Status" value={formatStatus(property.listingStatus)} />
                  <DetailRow
                    label="Expected Completion Duration"
                    value={
                      Number.isFinite(Number(property.expectedCompletionDuration))
                        ? `${property.expectedCompletionDuration} months`
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Expected Selling Duration"
                    value={
                      Number.isFinite(Number(property.expectedSellingDuration))
                        ? `${property.expectedSellingDuration} months`
                        : "—"
                    }
                  />
                  <DetailRow label="Featured Property" value={yesNo(property.featured)} />
                </div>
              ) : null}

              {tab === "media" ? (
                <div>
                  {images.length > 0 ? (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((img, idx) => (
                        <li
                          key={`${img.url}-${idx}`}
                          className="overflow-hidden rounded-xl border border-hive-taupe/25 bg-neutral-100"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={idx === 0 ? "Thumbnail" : `Gallery image ${idx}`}
                            className="aspect-square w-full object-cover"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-hive-slate">No images uploaded for this property.</p>
                  )}
                </div>
              ) : null}

              {tab === "rules" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow
                    label="Investor Protection Enabled"
                    value={yesNo(property.investorProtectionEnabled)}
                  />
                  <DetailRow
                    label="Early Withdrawal Allowed"
                    value={yesNo(property.earlyWithdrawalAllowed)}
                  />
                  <DetailRow
                    label="Early Withdrawal Profit"
                    value={humanize(property.earlyWithdrawalProfit)}
                    className="sm:col-span-2"
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-hive-taupe/15 bg-hive-light px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
          >
            Close
          </button>
          {property && onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(property)}
              className="rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
            >
              Edit Property
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
