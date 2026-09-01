import {
  normalizeProfitSharePercentages,
  splitProjectProfit,
} from "@/lib/profitDistribution";

export const EXIT_PLAN_RULES = [
  {
    id: "sold-within-year",
    ruleNumber: "I",
    title: "Sold within one year",
    description:
      "If the home is sold before one year, profit is distributed immediately (75% investors, 25% Hive).",
  },
  {
    id: "not-sold-after-year",
    ruleNumber: "II",
    title: "Not sold within one year",
    description:
      "If the home is not sold within one year, investors receive their original investment plus a profit share based on the property's current market value.",
  },
  {
    id: "early-withdrawal",
    ruleNumber: "III",
    title: "Early withdrawal",
    description:
      "If an investor withdraws before one year or before the sale, only the original investment is returned (no profit).",
  },
  {
    id: "loss-scenario",
    ruleNumber: "IV",
    title: "Loss protection",
    description:
      "If the sale price is below total cost, the investor still receives their full original investment (secured by cheque). Hive bears the loss.",
  },
];

function findRuleById(id) {
  return EXIT_PLAN_RULES.find((rule) => rule.id === id) || null;
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function isPropertySold(property) {
  const status = String(property?.constructionStatus || "").toLowerCase();
  return status === "sold" || status === "completed";
}

function formatDateIso(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

function computeInvestorProfitShare({
  projectProfit,
  investorPct,
  hivePct,
  investmentAmount,
  propertyFundingCollected,
}) {
  if (projectProfit <= 0 || propertyFundingCollected <= 0) {
    return { investorPoolProfit: 0, yourProfitShare: 0 };
  }

  const split = splitProjectProfit(projectProfit, investorPct, hivePct);
  const yourProfitShare = Math.round(
    split.investorPoolProfit * (Number(investmentAmount) / Number(propertyFundingCollected))
  );

  return {
    investorPoolProfit: split.investorPoolProfit,
    yourProfitShare,
  };
}

function buildProjectedPayouts({
  principal,
  recordedProfit,
  projectProfit,
  investorPct,
  hivePct,
  investmentAmount,
  propertyFundingCollected,
  investorProtectionEnabled,
  earlyWithdrawalAllowed,
  earlyWithdrawalProfit,
}) {
  const { yourProfitShare: saleProfitShare } = computeInvestorProfitShare({
    projectProfit: Math.max(0, projectProfit),
    investorPct,
    hivePct,
    investmentAmount,
    propertyFundingCollected,
  });

  const isLoss = projectProfit < 0;
  const lossProtectedPrincipal = investorProtectionEnabled ? principal : Math.max(0, principal + projectProfit);

  let earlyProfit = 0;
  const earlyPolicy = String(earlyWithdrawalProfit || "no-profit").toLowerCase();
  if (earlyPolicy === "full-profit") {
    earlyProfit = saleProfitShare;
  } else if (earlyPolicy === "partial-profit") {
    earlyProfit = Math.round(saleProfitShare * 0.5);
  }

  return {
    earlyWithdrawal: {
      ruleId: "early-withdrawal",
      available: earlyWithdrawalAllowed,
      principal: principal,
      profit: earlyProfit,
      total: principal + earlyProfit,
      note: earlyProfit > 0
        ? "Early withdrawal with partial/full profit per property policy."
        : "Principal only — no profit on early withdrawal.",
    },
    soldWithinYear: {
      ruleId: "sold-within-year",
      principal,
      profit: saleProfitShare,
      total: principal + saleProfitShare,
      note: "Profit allocated by your share of the raised investor pool (75% investor split).",
    },
    notSoldAfterYear: {
      ruleId: "not-sold-after-year",
      principal,
      profit: saleProfitShare,
      total: principal + saleProfitShare,
      note: "Based on reference market value and your raised-pool share.",
    },
    lossProtection: {
      ruleId: "loss-scenario",
      principal: investorProtectionEnabled ? principal : lossProtectedPrincipal,
      profit: 0,
      total: investorProtectionEnabled ? principal : lossProtectedPrincipal,
      note: investorProtectionEnabled
        ? "Full principal protected by security cheque; Hive bears the loss."
        : "Loss protection disabled on this property — settlement may differ.",
      applies: isLoss,
    },
    recorded: {
      principal,
      profit: recordedProfit,
      total: principal + recordedProfit,
      note: "Actual profit already recorded by admin on this investment.",
    },
  };
}

function resolveActiveRuleId({
  investmentStatus,
  settlementType,
  sold,
  withinFirstYear,
  oneYearReached,
  projectProfit,
  investorProtectionEnabled,
}) {
  // Rule III — early withdrawal before one year or before sale
  if (investmentStatus === "withdrawn" || settlementType === "early-withdrawal") {
    return "early-withdrawal";
  }

  // Rule IV — loss on sale (takes precedence over profit scenarios)
  if (
    settlementType === "loss-scenario" ||
    (sold && projectProfit < 0 && investorProtectionEnabled)
  ) {
    return "loss-scenario";
  }

  // Rule I — sold before one year (from this investor's investment date)
  if (sold && withinFirstYear) return "sold-within-year";

  // Rule II — not sold after one year (market-value exit)
  if (!sold && oneYearReached) return "not-sold-after-year";

  // Sold after one year with profit — same 75/25 distribution as Rule I
  if (sold && !withinFirstYear && projectProfit >= 0) return "sold-within-year";

  return null;
}

function resolveHoldingContext({ withinFirstYear, oneYearReached, sold, earlyAllowed, investmentStatus }) {
  if (sold || investmentStatus !== "active") return null;

  if (withinFirstYear) {
    return {
      label: "Active — within first year",
      summary:
        "No exit rule is active yet. If the property sells before your one-year date, Rule I applies. If you withdraw early, Rule III applies.",
      applicableRules: ["I", "III"],
    };
  }

  if (oneYearReached) {
    return {
      label: "Rule II eligible",
      summary: "One year has passed and the property is not sold. Rule II applies — principal plus market-value profit share.",
      applicableRules: ["II"],
    };
  }

  return {
    label: "Active — awaiting one-year milestone",
    summary: "Investment is active. Rule I applies if sold before one year; Rule II if still unsold after one year.",
    applicableRules: earlyAllowed ? ["I", "II", "III"] : ["I", "II"],
  };
}

const RULE_TO_PAYOUT_KEY = {
  "early-withdrawal": "earlyWithdrawal",
  "sold-within-year": "soldWithinYear",
  "not-sold-after-year": "notSoldAfterYear",
  "loss-scenario": "lossProtection",
};

function pickCurrentPayout(activeRuleId, projectedPayouts, scenarioKey) {
  if (scenarioKey === "early-withdrawal") return projectedPayouts.earlyWithdrawal;
  if (scenarioKey === "loss-scenario") return projectedPayouts.lossProtection;
  if (scenarioKey === "sold-within-year" || scenarioKey === "sold-after-year") {
    return projectedPayouts.soldWithinYear;
  }
  if (scenarioKey === "not-sold-after-year") return projectedPayouts.notSoldAfterYear;

  const payoutKey = RULE_TO_PAYOUT_KEY[activeRuleId];
  if (payoutKey && projectedPayouts[payoutKey]) return projectedPayouts[payoutKey];

  if (projectedPayouts.lossProtection?.applies) return projectedPayouts.lossProtection;
  return null;
}

export function buildInvestmentExitPlan({ investment, property, cheque, funding = {}, exitRequest = null }) {
  const investmentDate = investment?.investmentDate ? new Date(investment.investmentDate) : null;
  const now = new Date();
  const ageMs =
    investmentDate && !Number.isNaN(investmentDate.getTime())
      ? now.getTime() - investmentDate.getTime()
      : 0;
  const withinFirstYear = ageMs >= 0 && ageMs < ONE_YEAR_MS;
  const oneYearDate =
    investmentDate && !Number.isNaN(investmentDate.getTime())
      ? new Date(investmentDate.getTime() + ONE_YEAR_MS)
      : null;
  const oneYearReached = oneYearDate ? now >= oneYearDate : false;
  const daysUntilOneYear = oneYearDate
    ? Math.max(0, Math.ceil((oneYearDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : null;

  const investmentStatus = String(investment?.status || "active").toLowerCase();
  const exitRequestStatus = String(exitRequest?.status || "").toLowerCase();
  const hasPendingExitRequest = exitRequestStatus === "pending";
  const hasApprovedExitRequest = exitRequestStatus === "approved";
  const hasCompletedExit = investmentStatus === "withdrawn" || exitRequestStatus === "completed";
  const exitBlocked =
    hasPendingExitRequest || hasApprovedExitRequest || hasCompletedExit || investmentStatus === "completed";
  const sold = isPropertySold(property);
  const settlementType = String(cheque?.settlementType || "none").toLowerCase();
  const chequeStatus = String(cheque?.status || "").toLowerCase();
  const earlyAllowed = property?.earlyWithdrawalAllowed !== false;
  const earlyWithdrawalProfit = property?.earlyWithdrawalProfit || "no-profit";
  const investorProtectionEnabled = property?.investorProtectionEnabled !== false;
  const recordedProfit = Number(investment?.profitAmount || 0);
  const principal = Number(investment?.amount || 0);
  const marketValue = Number(property?.expectedSellingPrice || 0);
  const totalCost = Number(property?.totalCost || 0);
  const projectProfit = marketValue - totalCost;
  const propertyFundingCollected = Number(
    funding?.propertyFundingCollected ?? investment?.propertyFundingCollected ?? 0
  );
  const investorFundingRequired = Number(
    funding?.investorFundingRequired ?? property?.investorFundingRequired ?? 0
  );
  const profitAllocationSharePct = Number(
    investment?.profitAllocationSharePct ??
      (propertyFundingCollected > 0 ? (principal / propertyFundingCollected) * 100 : 0)
  );
  const targetPoolSharePct = Number(investment?.sharePercentage || 0);
  const { investorPct, hivePct } = normalizeProfitSharePercentages(property);

  const projectedPayouts = buildProjectedPayouts({
    principal,
    recordedProfit,
    projectProfit,
    investorPct,
    hivePct,
    investmentAmount: principal,
    propertyFundingCollected,
    investorProtectionEnabled,
    earlyWithdrawalAllowed: earlyAllowed,
    earlyWithdrawalProfit,
  });

  const activeRuleId = resolveActiveRuleId({
    investmentStatus,
    settlementType,
    sold,
    withinFirstYear,
    oneYearReached,
    projectProfit,
    investorProtectionEnabled,
  });

  const actions = [];
  let scenarioKey = "active-holding";
  let scenarioTitle = "Investment active";
  let scenarioDescription =
    "Your capital is participating in the project. Exit handling follows the Hive exit plan rules below.";

  if (investmentStatus === "withdrawn" || settlementType === "early-withdrawal") {
    scenarioKey = "early-withdrawal";
    scenarioTitle = "Early withdrawal";
    scenarioDescription =
      "Only your original investment is returned. Profit is not paid on standard early withdrawal.";
    if (chequeStatus === "cleared") {
      actions.push("Early withdrawal processed — security cheque cleared.");
    } else if (chequeStatus === "presented") {
      actions.push("Cheque presented for early withdrawal settlement.");
    } else {
      actions.push("Contact Hive support to complete early withdrawal settlement.");
    }
  } else if (settlementType === "loss-scenario" || (sold && projectProfit < 0 && investorProtectionEnabled)) {
    scenarioKey = "loss-scenario";
    scenarioTitle = "Loss scenario — principal protected";
    scenarioDescription =
      "Sale proceeds were below total cost. You receive your full original investment; Hive bears the loss.";
    actions.push("Principal protection applies via your security cheque.");
    if (chequeStatus !== "cleared") {
      actions.push("Awaiting final cheque settlement with Hive admin.");
    }
  } else if (sold && withinFirstYear) {
    scenarioKey = "sold-within-year";
    scenarioTitle = "Sold within one year";
    scenarioDescription =
      "Profit is distributed immediately: 75% to investors and 25% to Hive, allocated by raised-pool share.";
    if (recordedProfit > 0) {
      actions.push(`Recorded profit on this investment: PKR ${roundMoney(recordedProfit).toLocaleString("en-PK")}.`);
    } else {
      actions.push("Awaiting admin profit distribution for this property sale.");
    }
  } else if (sold && !withinFirstYear) {
    scenarioKey = "sold-after-year";
    scenarioTitle = "Sold after one year";
    scenarioDescription =
      "Property sold after your one-year milestone. Profit is distributed 75% to investors and 25% to Hive (same split as Rule I).";
    if (recordedProfit > 0) {
      actions.push(`Recorded profit: PKR ${roundMoney(recordedProfit).toLocaleString("en-PK")}.`);
    } else {
      actions.push("Contact Hive if profit distribution is pending.");
    }
  } else if (!sold && oneYearReached) {
    scenarioKey = "not-sold-after-year";
    scenarioTitle = "One year reached — not sold yet";
    scenarioDescription =
      "You are eligible for original investment return plus profit share based on the property's current market value.";
    if (marketValue > 0) {
      actions.push(
        `Reference market value: PKR ${roundMoney(marketValue).toLocaleString("en-PK")} — final settlement by Hive.`
      );
    }
    actions.push("Contact Hive support to schedule market-value exit review.");
  } else {
    scenarioKey = withinFirstYear ? "holding-within-year" : "holding";
    scenarioTitle = withinFirstYear ? "Within first year" : "Awaiting sale";
    scenarioDescription = sold
      ? "Property sale recorded — settlement in progress."
      : "Investment is active while the project progresses toward sale.";

    if (oneYearDate) {
      actions.push(
        withinFirstYear
          ? `One-year milestone: ${oneYearDate.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })} (${daysUntilOneYear} days remaining)`
          : "One-year period has passed — see not-sold-after-year rule if still unsold."
      );
    }

    if (earlyAllowed && !sold && withinFirstYear && investmentStatus === "active") {
      actions.push("Early withdrawal available: principal only (no profit). Contact Hive to request.");
    } else if (!earlyAllowed && !sold && withinFirstYear) {
      actions.push("Early withdrawal is not enabled for this property.");
    }
  }

  if (hasPendingExitRequest) {
    actions.push("Exit request pending admin review.");
  } else if (hasApprovedExitRequest) {
    actions.push("Exit request approved — awaiting security cheque settlement.");
  }

  if (!cheque) {
    actions.push("No security cheque on file yet — contact Hive if your cheque should have been issued.");
  } else if (cheque.status === "pending") {
    actions.push("Security cheque is pending activation by admin.");
  } else if (cheque.status === "active") {
    actions.push(`Security cheque #${cheque.chequeNumber} is active and securing your principal.`);
  }

  if (investmentStatus === "completed" && scenarioKey !== "early-withdrawal") {
    actions.push("Investment marked completed — review settlement notes on your cheque.");
  }

  const uniqueActions = [...new Set(actions.filter(Boolean))];
  const currentPayout = pickCurrentPayout(activeRuleId, projectedPayouts, scenarioKey);
  const appliedRule = findRuleById(activeRuleId);
  const holdingContext = resolveHoldingContext({
    withinFirstYear,
    oneYearReached,
    sold,
    earlyAllowed,
    investmentStatus,
  });

  const settlementStatus =
    chequeStatus === "cleared"
      ? "Settled"
      : chequeStatus === "presented"
        ? "Cheque presented"
        : chequeStatus === "active"
          ? "Secured — active cheque"
          : chequeStatus === "pending"
            ? "Cheque pending"
            : cheque
              ? formatChequeStatusLabel(chequeStatus)
              : "No cheque on file";

  return {
    scenarioKey,
    scenarioTitle,
    scenarioDescription,
    activeRuleId,
    currentRule: appliedRule
      ? {
          number: appliedRule.ruleNumber,
          id: appliedRule.id,
          title: appliedRule.title,
          description: appliedRule.description,
        }
      : null,
    holdingContext,
    appliedRule,
    withinFirstYear,
    oneYearDate: formatDateIso(oneYearDate),
    investmentAgeDays: Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000))),
    daysUntilOneYear,
    propertySold: sold,
    earlyWithdrawalAllowed: earlyAllowed,
    earlyWithdrawalOutcome: projectedPayouts.earlyWithdrawal.note,
    referenceMarketValue: marketValue > 0 ? marketValue : null,
    recordedProfit,
    principal,
    actionsNeeded: uniqueActions,
    timeline: {
      investedOn: formatDateIso(investmentDate),
      oneYearDate: formatDateIso(oneYearDate),
      investmentAgeDays: Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000))),
      daysUntilOneYear,
      withinFirstYear,
      oneYearReached,
      propertySold: sold,
    },
    financials: {
      principal,
      recordedProfit,
      pendingProfit: Math.max(0, roundMoney(currentPayout?.profit || 0) - recordedProfit),
      totalPropertyCost: totalCost,
      expectedSellingPrice: marketValue,
      projectedProjectProfit: roundMoney(projectProfit),
      isProjectLoss: projectProfit < 0,
      propertyFundingCollected,
      investorFundingRequired,
      targetPoolSharePct,
      profitAllocationSharePct,
      investorProfitSharePct: investorPct,
      hiveProfitSharePct: hivePct,
      investorProtectionEnabled,
    },
    projectedPayouts,
    currentScenario: {
      key: scenarioKey,
      title: scenarioTitle,
      description: scenarioDescription,
      expectedPrincipalReturn: currentPayout?.principal ?? principal,
      expectedProfitReturn: recordedProfit > 0 ? recordedProfit : currentPayout?.profit ?? 0,
      expectedTotalReturn:
        recordedProfit > 0
          ? principal + recordedProfit
          : currentPayout?.total ?? principal,
      settlementStatus,
      usesRecordedProfit: recordedProfit > 0,
    },
    exitRequest: exitRequest
      ? {
          id: exitRequest.id,
          status: exitRequest.status,
          statusLabel: exitRequest.statusLabel,
          requestType: exitRequest.requestType,
          requestTypeLabel: exitRequest.requestTypeLabel,
          createdAt: exitRequest.createdAt,
          adminNote: exitRequest.adminNote || "",
        }
      : null,
    withdrawalOptions: {
      earlyWithdrawalAllowed:
        earlyAllowed && !sold && investmentStatus === "active" && withinFirstYear && !exitBlocked,
      canRequestEarlyExit:
        earlyAllowed &&
        !sold &&
        investmentStatus === "active" &&
        withinFirstYear &&
        !exitBlocked,
      canRequestMarketValueExit:
        oneYearReached && !sold && investmentStatus === "active" && !exitBlocked,
      canRequestExit:
        !exitBlocked &&
        investmentStatus === "active" &&
        ((earlyAllowed && !sold && withinFirstYear) || (oneYearReached && !sold)),
      exitRequestDisabled: exitBlocked,
      exitRequestDisabledReason: hasCompletedExit
        ? "Exit already completed for this investment."
        : hasPendingExitRequest
          ? "Exit request is pending admin approval."
          : hasApprovedExitRequest
            ? "Exit request approved — settlement in progress."
            : investmentStatus === "completed"
              ? "Investment is already completed."
              : "",
      exitRequestStatus: exitRequestStatus || null,
      exitRequestId: exitRequest?.id || null,
      earlyWithdrawalOutcome: projectedPayouts.earlyWithdrawal.note,
      projectedEarlyWithdrawalTotal: projectedPayouts.earlyWithdrawal.total,
      projectedMarketValueExitTotal: projectedPayouts.notSoldAfterYear.total,
      requiresHiveApproval: true,
      contactHint: "Submit an exit request from this page. Admin will review and issue your security cheque.",
    },
  };
}

function formatChequeStatusLabel(status) {
  const labels = {
    pending: "Cheque pending",
    active: "Cheque active",
    presented: "Cheque presented",
    cleared: "Cheque cleared",
    cancelled: "Cheque cancelled",
    bounced: "Cheque bounced",
    expired: "Cheque expired",
  };
  return labels[status] || "Cheque on file";
}

export function summarizeExitPlan(items) {
  const pendingActions = items.reduce((sum, row) => sum + (row.exitPlan?.actionsNeeded?.length || 0), 0);
  const earlyWithdrawalEligible = items.filter(
    (row) => row.exitPlan?.withdrawalOptions?.earlyWithdrawalAllowed
  ).length;
  const totalPrincipal = items.reduce(
    (sum, row) => sum + Number(row.exitPlan?.financials?.principal || 0),
    0
  );
  const totalRecordedProfit = items.reduce(
    (sum, row) => sum + Number(row.exitPlan?.financials?.recordedProfit || 0),
    0
  );

  return {
    investmentCount: items.length,
    pendingActionCount: pendingActions,
    earlyWithdrawalEligibleCount: earlyWithdrawalEligible,
    totalPrincipal,
    totalRecordedProfit,
  };
}
