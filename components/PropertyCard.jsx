import Image from "next/image";
import Link from "next/link";

function formatCompactPkr(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  if (n >= 10000000) return `${(n / 10000000).toFixed(1).replace(/\.0$/, "")} Crore`;
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, "")} Lac`;
  return `PKR ${n.toLocaleString()}`;
}

function humanizeKebab(value, fallback = "N/A") {
  const v = String(value || "").trim();
  if (!v) return fallback;
  return v
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

export default function PropertyCard({
  id,
  imageSrc,
  imageLabel,
  title,
  location,
  totalCost,
  expectedProfitMinPct,
  expectedProfitMaxPct,
  fundingProgressPct,
  propertyType,
  riskLevel,
  investorFundingRequired,
  minimumInvestment,
  fundingCollected,
  featured,
  bedrooms,
  bathrooms,
  areaSize,
  constructionStatus,
}) {
  const detailsHref = id ? `/properties/${id}` : "/properties";
  const primaryText = title ?? location;
  const fundingProgress =
    Number.isFinite(Number(fundingProgressPct)) && Number(fundingProgressPct) >= 0
      ? Math.min(100, Math.max(0, Number(fundingProgressPct)))
      : 0;
  const costText = formatCompactPkr(totalCost);
  const investorFundingText = formatCompactPkr(investorFundingRequired);
  const minimumInvestmentText = formatCompactPkr(minimumInvestment);
  const collectedText = formatCompactPkr(fundingCollected);
  const expectedProfitText =
    Number.isFinite(Number(expectedProfitMinPct)) &&
    Number.isFinite(Number(expectedProfitMaxPct)) &&
    Number(expectedProfitMaxPct) >= Number(expectedProfitMinPct) &&
    Number(expectedProfitMaxPct) > 0
      ? `${Number(expectedProfitMaxPct)}%`
      : "N/A";
  const totalFundingText = formatCompactPkr(investorFundingRequired);
  const typeText = humanizeKebab(propertyType, "Property");
  const riskText = humanizeKebab(riskLevel, "Medium");
  const beds = Number.isFinite(Number(bedrooms)) ? Number(bedrooms) : 0;
  const baths = Number.isFinite(Number(bathrooms)) ? Number(bathrooms) : 0;
  const area = Number.isFinite(Number(areaSize)) ? Number(areaSize) : 0;
  const constructionText = humanizeKebab(constructionStatus, "Not Started");

  return (
    <Link
      href={detailsHref}
      className="group block overflow-hidden rounded-2xl border border-hive-taupe/20 bg-hive-light shadow-sm transition-colors hover:border-hive-taupe/60"
    >
      <div className="relative isolate h-44 w-full overflow-hidden bg-zinc-100">
        {imageSrc ? (
          String(imageSrc).startsWith("/api/") ? (
            <img
              src={imageSrc}
              alt={primaryText ?? "Property image"}
              className="absolute inset-0 z-0 h-full w-full object-cover"
            />
          ) : (
            <Image
              src={imageSrc}
              alt={primaryText ?? "Property image"}
              fill
              className="z-0 object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )
        ) : (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <span className="text-sm font-medium text-hive-slate/50">
              {imageLabel ?? "Property Image"}
            </span>
          </div>
        )}

        {featured ? (
          <div className="absolute right-3 top-3 z-10 rounded-md bg-hive-taupe px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-hive-charcoal">
            Featured
          </div>
        ) : null}
      </div>

      <div className="p-6">
        {primaryText ? (
          <p className="text-sm font-semibold text-hive-charcoal">
            {primaryText}
          </p>
        ) : null}

        {location && title ? (
          <p className="mt-1 text-sm text-hive-slate">{location}</p>
        ) : null}
        <p className="mt-2 text-sm text-hive-slate">
          {typeText} | {riskText} Risk
        </p>

        <div className="mt-4 space-y-1 rounded-lg border border-hive-taupe/20 p-3 text-sm">
          <p className="flex justify-between gap-3 text-hive-slate"><span>Total Cost</span><span className="font-semibold text-hive-charcoal">{costText}</span></p>
          <p className="flex justify-between gap-3 text-hive-slate"><span>Investor Funding Needed</span><span className="font-semibold text-hive-charcoal">{investorFundingText}</span></p>
          <p className="flex justify-between gap-3 text-hive-slate"><span>Expected ROI</span><span className="font-semibold text-hive-charcoal">{expectedProfitText}</span></p>
          <p className="flex justify-between gap-3 text-hive-slate"><span>Minimum Investment</span><span className="font-semibold text-hive-charcoal">{minimumInvestmentText}</span></p>
        </div>

        <p className="mt-4 text-sm font-semibold text-hive-charcoal">Funding Progress</p>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-hive-taupe transition-all"
            style={{ width: `${fundingProgress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-hive-slate">
          Collected: <span className="font-semibold text-hive-charcoal">{collectedText}</span> /{" "}
          <span className="font-semibold text-hive-charcoal">{totalFundingText}</span>
        </p>

        <div className="mt-4 rounded-lg border border-hive-taupe/20 p-3 text-sm text-hive-slate">
          Bedrooms: <span className="font-semibold text-hive-charcoal">{beds}</span>{" "}
          <span className="mx-2">|</span>
          Bathrooms: <span className="font-semibold text-hive-charcoal">{baths}</span>{" "}
          <span className="mx-2">|</span>
          Area: <span className="font-semibold text-hive-charcoal">{area} sq.ft</span>
        </div>
        <p className="mt-4 text-sm text-hive-slate">
          Construction Status: <span className="font-semibold text-hive-charcoal">{constructionText}</span>
        </p>

        <div className="mt-5">
          <span className="inline-flex w-full items-center justify-center rounded-md bg-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors group-hover:text-hive-taupe">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
