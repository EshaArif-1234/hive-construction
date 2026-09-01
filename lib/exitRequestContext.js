import Investment from "@/models/Investment";
import ExitRequest from "@/models/ExitRequest";
import { getPropertyFundingStats } from "@/lib/propertyFunding";
import { computePoolSharePercentage } from "@/lib/profitDistribution";
import { buildInvestmentExitPlan } from "@/lib/exitPlan";
import { populateExitRequest, serializeExitRequest } from "@/lib/serializeExitRequest";
import { serializeSecurityCheque, populateSecurityCheque } from "@/lib/serializeSecurityCheque";
import SecurityCheque from "@/models/SecurityCheque";

const ACTIVE_EXIT_REQUEST_STATUSES = ["pending", "approved"];

export async function getActiveExitRequestForInvestment(investmentId) {
  const row = await ExitRequest.findOne({
    investmentId: String(investmentId),
    status: { $in: ACTIVE_EXIT_REQUEST_STATUSES },
  })
    .sort({ createdAt: -1 })
    .lean();

  return row || null;
}

export async function getLatestExitRequestForInvestment(investmentId) {
  const row = await populateExitRequest(
    ExitRequest.findOne({ investmentId: String(investmentId) }).sort({ createdAt: -1 })
  ).lean();

  return row ? serializeExitRequest(row) : null;
}

export async function loadInvestmentExitContext(investmentId, investorId) {
  const filter = { _id: String(investmentId) };
  if (investorId) filter.investorId = String(investorId);

  const inv = await Investment.findOne(filter)
    .select(
      "investorId propertyId amount investmentDate status profitAmount sharePercentage paymentMethod profitDistributions lastProfitDistributedAt"
    )
    .populate({
      path: "propertyId",
      select:
        "title city constructionStatus listingStatus expectedSellingPrice earlyWithdrawalAllowed earlyWithdrawalProfit investorProtectionEnabled totalCost investorFundingRequired investorProfitShare hiveProfitShare",
      options: { lean: true },
    })
    .lean();

  if (!inv) return null;

  const property = inv.propertyId && typeof inv.propertyId === "object" ? inv.propertyId : null;
  const propertyId = property?._id ? String(property._id) : String(inv.propertyId || "");

  const fundingStats = await getPropertyFundingStats(propertyId, {
    totalCost: property?.totalCost,
    investorFundingRequired: property?.investorFundingRequired,
  });

  const propertyFundingCollected = Number(fundingStats.fundingCollected || 0);
  const amount = Number(inv.amount || 0);

  const investment = {
    id: String(inv._id),
    propertyId,
    amount,
    investmentDate: inv.investmentDate,
    status: inv.status || "active",
    profitAmount: Number(inv.profitAmount || 0),
    sharePercentage: Number(inv.sharePercentage || 0),
    profitAllocationSharePct:
      propertyFundingCollected > 0
        ? computePoolSharePercentage(amount, propertyFundingCollected)
        : 0,
    propertyFundingCollected,
    paymentMethod: inv.paymentMethod,
    lastProfitDistributedAt: inv.lastProfitDistributedAt || null,
  };

  const propertySummary = property
    ? {
        id: propertyId,
        title: property.title,
        city: property.city,
        constructionStatus: property.constructionStatus,
        listingStatus: property.listingStatus,
        expectedSellingPrice: Number(property.expectedSellingPrice || 0),
        totalCost: Number(property.totalCost || 0),
        investorFundingRequired: Number(property.investorFundingRequired || 0),
        investorProfitShare: Number(property.investorProfitShare ?? 75),
        hiveProfitShare: Number(property.hiveProfitShare ?? 25),
        earlyWithdrawalAllowed: property.earlyWithdrawalAllowed !== false,
        earlyWithdrawalProfit: property.earlyWithdrawalProfit || "no-profit",
        investorProtectionEnabled: property.investorProtectionEnabled !== false,
      }
    : null;

  const funding = {
    propertyFundingCollected,
    investorFundingRequired: Number(property?.investorFundingRequired || 0),
    remainingFunding: Number(fundingStats.remainingFunding || 0),
    fundingProgressPct: Number(fundingStats.fundingProgressPct || 0),
    isFullyFunded: Boolean(fundingStats.isFullyFunded),
  };

  const [chequeRow, latestExitRequestRow] = await Promise.all([
    populateSecurityCheque(
      SecurityCheque.findOne({ investmentId: String(inv._id) }).sort({ issueDate: -1, createdAt: -1 })
    ).lean(),
    populateExitRequest(
      ExitRequest.findOne({ investmentId: String(inv._id) }).sort({ createdAt: -1 })
    ).lean(),
  ]);

  const cheque = chequeRow ? serializeSecurityCheque(chequeRow) : null;
  const latestExitRequest = latestExitRequestRow ? serializeExitRequest(latestExitRequestRow) : null;
  const activeExitRequest =
    latestExitRequest && ACTIVE_EXIT_REQUEST_STATUSES.includes(latestExitRequest.status)
      ? latestExitRequest
      : null;

  const exitPlan = buildInvestmentExitPlan({
    investment,
    property: propertySummary,
    cheque,
    funding,
    exitRequest: latestExitRequest,
  });

  return {
    investment,
    property: propertySummary,
    cheque,
    funding,
    exitPlan,
    activeExitRequest,
    latestExitRequest,
  };
}

export function validateExitRequestSubmission({ exitPlan, requestType, investment, activeExitRequest }) {
  const investmentStatus = String(investment?.status || "").toLowerCase();
  if (investmentStatus === "withdrawn" || investmentStatus === "completed") {
    return { ok: false, message: "This investment is no longer active." };
  }

  if (activeExitRequest) {
    return {
      ok: false,
      message: `An exit request is already ${activeExitRequest.status} for this investment.`,
    };
  }

  const type = String(requestType || "").toLowerCase();

  if (type === "early-withdrawal") {
    if (!exitPlan?.withdrawalOptions?.earlyWithdrawalAllowed) {
      return {
        ok: false,
        message:
          exitPlan?.withdrawalOptions?.exitRequestDisabledReason ||
          "Early withdrawal is not available for this investment.",
      };
    }
    return { ok: true };
  }

  if (type === "not-sold-after-year") {
    if (!exitPlan?.timeline?.oneYearReached || exitPlan?.propertySold) {
      return {
        ok: false,
        message:
          "Market-value exit (Rule II) is only available after one year when the property is still unsold.",
      };
    }
    return { ok: true };
  }

  return { ok: false, message: "Invalid exit request type." };
}

export function payoutSnapshotForRequestType(exitPlan, requestType) {
  const payouts = exitPlan?.projectedPayouts || {};
  const type = String(requestType || "").toLowerCase();

  if (type === "early-withdrawal") {
    const p = payouts.earlyWithdrawal || {};
    return {
      principal: Number(p.principal || 0),
      profit: Number(p.profit || 0),
      total: Number(p.total || 0),
      ruleNumber: "III",
      ruleId: "early-withdrawal",
    };
  }

  const p = payouts.notSoldAfterYear || {};
  return {
    principal: Number(p.principal || 0),
    profit: Number(p.profit || 0),
    total: Number(p.total || 0),
    ruleNumber: "II",
    ruleId: "not-sold-after-year",
  };
}
