import mongoose from "mongoose";
import Investment from "@/models/Investment";
import Property from "@/models/Property";
import { computeFundingProgressPct } from "@/lib/fundingProgress";

function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
}

/**
 * Aggregate live funding from active investments for one property.
 */
export async function getPropertyFundingStats(
  propertyId,
  { totalCost = 0, investorFundingRequired = 0 } = {}
) {
  const oid = toObjectId(propertyId);
  if (!oid) {
    return {
      fundingCollected: 0,
      investorCount: 0,
      remainingFunding: Math.max(0, Number(investorFundingRequired) || 0),
      fundingProgressPct: 0,
      isFullyFunded: false,
    };
  }

  const [agg] = await Investment.aggregate([
    { $match: { propertyId: oid, status: "active" } },
    {
      $group: {
        _id: null,
        fundingCollected: { $sum: "$amount" },
        investorIds: { $addToSet: "$investorId" },
      },
    },
  ]);

  const fundingCollected = Number(agg?.fundingCollected || 0);
  const investorCount = Array.isArray(agg?.investorIds) ? agg.investorIds.length : 0;
  const required = Math.max(0, Number(investorFundingRequired) || 0);
  const remainingFunding = Math.max(0, required - fundingCollected);
  const fundingProgressPct = computeFundingProgressPct(fundingCollected, {
    totalCost,
    investorFundingRequired: required,
  });
  const isFullyFunded = required > 0 && remainingFunding <= 0;

  return {
    fundingCollected,
    investorCount,
    remainingFunding,
    fundingProgressPct,
    isFullyFunded,
  };
}

/** Persist aggregated funding totals on the property document. */
export async function syncPropertyFunding(propertyId) {
  const oid = toObjectId(propertyId);
  if (!oid) return null;

  const property = await Property.findById(oid).select("totalCost investorFundingRequired").lean();
  if (!property) return null;

  const stats = await getPropertyFundingStats(oid, {
    totalCost: property.totalCost,
    investorFundingRequired: property.investorFundingRequired,
  });

  await Property.findByIdAndUpdate(oid, {
    fundingCollected: stats.fundingCollected,
    fundingProgressPct: stats.fundingProgressPct,
  });

  return stats;
}

export function attachFundingStats(property, stats) {
  if (!property || !stats) return property;
  return {
    ...property,
    fundingCollected: stats.fundingCollected,
    fundingProgressPct: stats.fundingProgressPct,
    investorCount: stats.investorCount,
    remainingFunding: stats.remainingFunding,
    isFullyFunded: stats.isFullyFunded,
  };
}
