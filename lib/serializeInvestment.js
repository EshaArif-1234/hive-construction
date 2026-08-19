import { computePoolSharePercentage } from "@/lib/profitDistribution";

export function serializeInvestment(doc) {
  if (!doc) return null;

  const inv = doc.investorId;
  const prop = doc.propertyId;

  const investorName =
    inv && typeof inv === "object" && inv.fullName ? inv.fullName : "Unknown investor";
  const investorEmail = inv && typeof inv === "object" && inv.email ? inv.email : "";

  const propertyTitle =
    prop && typeof prop === "object" && prop.title ? prop.title : "Unknown property";
  const propertyLocation =
    prop && typeof prop === "object" && (prop.city || prop.location)
      ? prop.city || prop.location
      : "";

  const profitDistributions = Array.isArray(doc.profitDistributions)
    ? doc.profitDistributions.map((row) => ({
        id: row._id ? String(row._id) : "",
        amount: Number(row.amount || 0),
        distributedAt: row.distributedAt,
        note: row.note || "",
        recordedBy: row.recordedBy || "",
      }))
    : [];

  return {
    id: String(doc._id),
    investorId:
      doc.investorId && typeof doc.investorId === "object"
        ? String(doc.investorId._id || doc.investorId)
        : String(doc.investorId || ""),
    investorName,
    investorEmail,
    propertyId:
      doc.propertyId && typeof doc.propertyId === "object"
        ? String(doc.propertyId._id || doc.propertyId)
        : String(doc.propertyId || ""),
    propertyTitle,
    propertyLocation,
    propertyInvestorProfitShare:
      prop && typeof prop === "object" ? Number(prop.investorProfitShare ?? 75) : 75,
    propertyHiveProfitShare:
      prop && typeof prop === "object" ? Number(prop.hiveProfitShare ?? 25) : 25,
    amount: doc.amount,
    sharePercentage: doc.sharePercentage,
    investmentDate: doc.investmentDate,
    profitAmount: doc.profitAmount,
    profitDistributions,
    lastProfitDistributedAt: doc.lastProfitDistributedAt || null,
    paymentMethod: doc.paymentMethod || "",
    paymentScreenshotName: doc.paymentScreenshotName || "",
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const INVESTMENT_POPULATE = [
  { path: "investorId", select: "fullName email" },
  {
    path: "propertyId",
    select: "title city totalCost investorFundingRequired investorProfitShare hiveProfitShare",
  },
];

export function populateInvestment(query) {
  return query
    .populate("investorId", "fullName email")
    .populate(
      "propertyId",
      "title city totalCost investorFundingRequired investorProfitShare hiveProfitShare"
    );
}

/** @deprecated Use computePoolSharePercentage from lib/profitDistribution.js */
export function computeSharePercentage(amount, investorFundingRequired) {
  return computePoolSharePercentage(amount, investorFundingRequired);
}

export function resolveInvestorPool(property) {
  const pool = Number(property?.investorFundingRequired || 0);
  return pool > 0 ? pool : Number(property?.totalCost || 0);
}
