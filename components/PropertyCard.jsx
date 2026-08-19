import Image from "next/image";
import Link from "next/link";
import { computeInvestorPoolProgressPct } from "@/lib/fundingProgress";

function formatCompactPkr(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  if (n >= 10000000) return `${(n / 10000000).toFixed(1).replace(/\.0$/, "")} Crore`;
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, "")} Lac`;
  return `PKR ${n.toLocaleString()}`;
}

function formatMinimumInvestment(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "No minimum";
  return formatCompactPkr(n);
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
  investorProfitShare,
  hiveProfitShare,
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
  isFullyFunded,
}) {
  const detailsHref = id ? `/properties/${id}` : "/properties";
  const primaryText = title ?? location;

  const collectedNum = Number(fundingCollected) || 0;
  const poolTargetNum = Number(investorFundingRequired) || 0;
  const totalCostNum = Number(totalCost) || 0;
  const remainingNum = Math.max(0, poolTargetNum - collectedNum);
  const fullyFunded =
    Boolean(isFullyFunded) || (poolTargetNum > 0 && remainingNum <= 0);

  const fundingProgress =
    Number.isFinite(Number(fundingProgressPct)) && Number(fundingProgressPct) >= 0
      ? Math.min(100, Math.max(0, Number(fundingProgressPct)))
      : 0;
  const poolProgress = computeInvestorPoolProgressPct(collectedNum, poolTargetNum);

  const costText = formatCompactPkr(totalCostNum);
  const investorFundingText = formatCompactPkr(poolTargetNum);
  const minimumInvestmentText = formatMinimumInvestment(minimumInvestment);
  const collectedText = formatCompactPkr(collectedNum);
  const remainingText = formatCompactPkr(remainingNum);

  const investorSharePct = Number.isFinite(Number(investorProfitShare)) ? Number(investorProfitShare) : 75;
  const hiveSharePct = Number.isFinite(Number(hiveProfitShare)) ? Number(hiveProfitShare) : 25;

  const typeText = humanizeKebab(propertyType, "Property");
  const riskText = humanizeKebab(riskLevel, "Medium");
  const constructionText = humanizeKebab(constructionStatus, "Not Started");
  const beds = Number.isFinite(Number(bedrooms)) ? Number(bedrooms) : 0;
  const baths = Number.isFinite(Number(bathrooms)) ? Number(bathrooms) : 0;
  const area = Number.isFinite(Number(areaSize)) ? Number(areaSize) : 0;

  return (
    <Link
      href={detailsHref}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-hive-taupe/20 bg-hive-light shadow-sm transition-all hover:border-hive-taupe/60 hover:shadow-md"
    >
      <div className="relative isolate h-44 w-full shrink-0 overflow-hidden bg-zinc-100">
        {imageSrc ? (
          String(imageSrc).startsWith("/api/") ? (
            <img
              src={imageSrc}
              alt={primaryText ?? "Property image"}
              className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <Image
              src={imageSrc}
              alt={primaryText ?? "Property image"}
              fill
              className="z-0 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )
        ) : (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <span className="text-sm font-medium text-hive-slate/50">{imageLabel ?? "Property Image"}</span>
          </div>
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          {fullyFunded ? (
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              Fully funded
            </span>
          ) : null}
          {featured ? (
            <span className="rounded-full bg-hive-taupe px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-hive-charcoal">
              Featured
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div>
          {primaryText ? (
            <p className="line-clamp-2 text-base font-semibold leading-snug text-hive-charcoal">{primaryText}</p>
          ) : null}
          {location && title ? <p className="mt-1 text-sm text-hive-slate">{location}</p> : null}
          <p className="mt-2 text-xs text-hive-slate">
            {typeText} · {riskText} Risk · {constructionText}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-hive-taupe/30 bg-hive-taupe/10 px-2.5 py-1 text-[11px] font-semibold text-hive-charcoal">
            {investorSharePct}% / {hiveSharePct}% profit split
          </span>
          <span className="rounded-full border border-hive-taupe/20 px-2.5 py-1 text-[11px] font-semibold text-hive-slate">
            Min. {minimumInvestmentText}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-hive-taupe/15 bg-neutral-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">Total cost</p>
            <p className="mt-1 font-semibold text-hive-charcoal">{costText}</p>
          </div>
          <div className="rounded-lg border border-hive-taupe/15 bg-neutral-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">Investor pool</p>
            <p className="mt-1 font-semibold text-hive-charcoal">{investorFundingText}</p>
          </div>
          <div className="rounded-lg border border-hive-taupe/15 bg-neutral-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">Raised</p>
            <p className="mt-1 font-semibold text-hive-charcoal">{collectedText}</p>
          </div>
          <div className="rounded-lg border border-hive-taupe/15 bg-neutral-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">Remaining</p>
            <p className="mt-1 font-semibold text-hive-charcoal">{fullyFunded ? "PKR 0" : remainingText}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-xs text-hive-slate">
            <span className="font-semibold text-hive-charcoal">Funding progress</span>
            <span>{fundingProgress.toFixed(1)}% of total cost</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-hive-taupe transition-all"
              style={{ width: `${fundingProgress}%` }}
            />
          </div>
          {poolTargetNum > 0 ? (
            <p className="mt-1.5 text-xs text-hive-slate">
              Investor pool: {poolProgress.toFixed(1)}% filled
            </p>
          ) : null}
        </div>

        <div className="mt-4 rounded-lg border border-hive-taupe/15 px-3 py-2 text-xs text-hive-slate">
          {beds} bed · {baths} bath · {area} sq.ft
        </div>

        <div className="mt-auto pt-5">
          <span className="inline-flex w-full items-center justify-center rounded-md bg-hive-charcoal px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors group-hover:text-hive-taupe">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
