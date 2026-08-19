/**
 * Profit allocation helpers for the 75/25 investor/Hive split model.
 * Investor pool share is based on amount ÷ investorFundingRequired (not total cost).
 */

export const DEFAULT_INVESTOR_PROFIT_SHARE = 75;
export const DEFAULT_HIVE_PROFIT_SHARE = 25;

export function normalizeProfitSharePercentages(property) {
  const investorPct = Number(property?.investorProfitShare ?? DEFAULT_INVESTOR_PROFIT_SHARE);
  const hivePct = Number(property?.hiveProfitShare ?? DEFAULT_HIVE_PROFIT_SHARE);
  return { investorPct, hivePct };
}

export function validateProfitSharePercentages(investorPct, hivePct) {
  const investor = Number(investorPct);
  const hive = Number(hivePct);
  if (!Number.isFinite(investor) || !Number.isFinite(hive)) {
    return { valid: false, message: "Profit share percentages must be valid numbers." };
  }
  if (investor < 0 || hive < 0) {
    return { valid: false, message: "Profit share percentages cannot be negative." };
  }
  if (Math.round(investor + hive) !== 100) {
    return {
      valid: false,
      message: `Investor and Hive profit shares must total 100% (got ${investor}% + ${hive}%).`,
    };
  }
  return { valid: true, investorPct: investor, hivePct: hive };
}

export function validatePropertyProfitShare(property) {
  const { investorPct, hivePct } = normalizeProfitSharePercentages(property);
  return validateProfitSharePercentages(investorPct, hivePct);
}

export function splitProjectProfit(totalProjectProfit, investorPct, hivePct) {
  const profit = Number(totalProjectProfit);
  if (!Number.isFinite(profit) || profit <= 0) {
    return { investorPoolProfit: 0, hiveProfit: 0, totalProjectProfit: 0 };
  }

  const validation = validateProfitSharePercentages(investorPct, hivePct);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const investorPoolProfit = Math.round(profit * (validation.investorPct / 100));
  const hiveProfit = profit - investorPoolProfit;

  return {
    totalProjectProfit: profit,
    investorProfitSharePct: validation.investorPct,
    hiveProfitSharePct: validation.hivePct,
    investorPoolProfit,
    hiveProfit,
  };
}

export function computePoolSharePercentage(amount, investorFundingRequired) {
  const amt = Number(amount);
  const pool = Number(investorFundingRequired);
  if (!Number.isFinite(amt) || !Number.isFinite(pool) || pool <= 0) return 0;
  return Math.round((amt / pool) * 10000) / 100;
}

export function computeInvestorPoolProfit(totalProjectProfit, investorProfitSharePct = DEFAULT_INVESTOR_PROFIT_SHARE) {
  return splitProjectProfit(
    totalProjectProfit,
    investorProfitSharePct,
    100 - Number(investorProfitSharePct)
  ).investorPoolProfit;
}

export function computeHivePoolProfit(totalProjectProfit, hiveProfitSharePct = DEFAULT_HIVE_PROFIT_SHARE) {
  return splitProjectProfit(
    totalProjectProfit,
    100 - Number(hiveProfitSharePct),
    hiveProfitSharePct
  ).hiveProfit;
}

/**
 * Split investor-pool profit across investments proportional to each stake in the pool.
 */
export function allocateProfitByPoolShare(investorPoolProfit, investments) {
  const poolProfit = Number(investorPoolProfit);
  if (!Number.isFinite(poolProfit) || poolProfit <= 0) return [];

  const eligible = (investments || []).filter((inv) => {
    const status = String(inv?.status || "active").toLowerCase();
    return status === "active" || status === "completed";
  });

  const totalRaised = eligible.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  if (totalRaised <= 0) return [];

  const allocations = eligible.map((inv) => {
    const stake = Number(inv.amount || 0);
    const poolSharePct = Math.round((stake / totalRaised) * 10000) / 100;
    const allocated = Math.round(poolProfit * (stake / totalRaised));
    return {
      investmentId: String(inv._id || inv.id),
      investorId: String(inv.investorId?._id || inv.investorId || ""),
      amount: allocated,
      poolSharePct,
      stakeAmount: stake,
    };
  });

  const sumAllocated = allocations.reduce((sum, row) => sum + row.amount, 0);
  const remainder = poolProfit - sumAllocated;
  if (remainder !== 0 && allocations.length > 0) {
    const largest = allocations.reduce(
      (max, row) => (row.amount > max.amount ? row : max),
      allocations[0]
    );
    largest.amount += remainder;
  }

  return allocations;
}

export function buildPropertyDistributionPreview(property, investments, totalProjectProfit) {
  const { investorPct, hivePct } = normalizeProfitSharePercentages(property);
  const split = splitProjectProfit(totalProjectProfit, investorPct, hivePct);
  const allocations = allocateProfitByPoolShare(split.investorPoolProfit, investments);

  const totalRaised = investments
    .filter((inv) => {
      const status = String(inv?.status || "active").toLowerCase();
      return status === "active" || status === "completed";
    })
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  const allocatedToInvestors = allocations.reduce((sum, row) => sum + row.amount, 0);

  return {
    totalProjectProfit: split.totalProjectProfit,
    investorProfitSharePct: split.investorProfitSharePct,
    hiveProfitSharePct: split.hiveProfitSharePct,
    investorPoolProfit: split.investorPoolProfit,
    hiveProfit: split.hiveProfit,
    totalPoolRaised: totalRaised,
    allocatedToInvestors,
    allocationBalanced: allocatedToInvestors === split.investorPoolProfit,
    allocations,
  };
}
