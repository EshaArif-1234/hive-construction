import { computeFundingProgressPct } from "@/lib/fundingProgress";

function normalizeRisk(level) {
  const value = String(level || "").toLowerCase();
  if (["low", "medium", "high"].includes(value)) return value;
  return "medium";
}

export function mapPublicPropertyForCard(p) {
  const totalCost = Number(p?.totalCost || 0);
  const required = Number(p?.investorFundingRequired || 0);
  const collected = Number(p?.fundingCollected || 0);
  const progress = computeFundingProgressPct(collected, {
    totalCost,
    investorFundingRequired: required,
  });
  const remainingFunding = Math.max(0, required - collected);

  return {
    ...p,
    location: p.city || "",
    fundingProgressPct: progress,
    isFullyFunded: required > 0 && remainingFunding <= 0,
    remainingFunding,
    status: p.listingStatus,
    riskLevel: normalizeRisk(p.riskLevel),
    bedrooms: p.bedrooms ?? 0,
    bathrooms: p.bathrooms ?? 0,
    areaSize: p.areaSize ?? 0,
  };
}
