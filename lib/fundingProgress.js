/** Progress bar denominator: total project cost when set, else investor funding target. */
export function resolveFundingProgressDenominator({ totalCost = 0, investorFundingRequired = 0 } = {}) {
  const total = Math.max(0, Number(totalCost) || 0);
  const required = Math.max(0, Number(investorFundingRequired) || 0);
  return total > 0 ? total : required;
}

export function computeFundingProgressPct(
  fundingCollected,
  { totalCost = 0, investorFundingRequired = 0 } = {}
) {
  const collected = Math.max(0, Number(fundingCollected) || 0);
  const denominator = resolveFundingProgressDenominator({ totalCost, investorFundingRequired });
  if (denominator <= 0) return 0;
  return Math.min(100, Math.round((collected / denominator) * 10000) / 100);
}

export function computeInvestorPoolProgressPct(fundingCollected, investorFundingRequired = 0) {
  const collected = Math.max(0, Number(fundingCollected) || 0);
  const required = Math.max(0, Number(investorFundingRequired) || 0);
  if (required <= 0) return 0;
  return Math.min(100, Math.round((collected / required) * 10000) / 100);
}
