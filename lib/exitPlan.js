export const EXIT_PLAN_RULES = [
  {
    id: "sold-within-year",
    title: "Sold within one year",
    description:
      "If the home is sold before one year, profit is distributed immediately (75% investors, 25% Hive).",
  },
  {
    id: "not-sold-after-year",
    title: "Not sold within one year",
    description:
      "If the home is not sold within one year, investors receive their original investment plus a profit share based on the property's current market value.",
  },
  {
    id: "early-withdrawal",
    title: "Early withdrawal",
    description:
      "If an investor withdraws before one year or before the sale, only the original investment is returned (no profit).",
  },
  {
    id: "loss-scenario",
    title: "Loss protection",
    description:
      "If the sale price is below total cost, the investor still receives their full original investment (secured by cheque). Hive bears the loss.",
  },
];

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

export function buildInvestmentExitPlan({ investment, property, cheque }) {
  const investmentDate = investment?.investmentDate ? new Date(investment.investmentDate) : null;
  const now = new Date();
  const ageMs =
    investmentDate && !Number.isNaN(investmentDate.getTime()) ? now.getTime() - investmentDate.getTime() : 0;
  const withinFirstYear = ageMs >= 0 && ageMs < ONE_YEAR_MS;
  const oneYearDate =
    investmentDate && !Number.isNaN(investmentDate.getTime())
      ? new Date(investmentDate.getTime() + ONE_YEAR_MS)
      : null;

  const sold = isPropertySold(property);
  const investmentStatus = String(investment?.status || "active").toLowerCase();
  const settlementType = String(cheque?.settlementType || "none").toLowerCase();
  const chequeStatus = String(cheque?.status || "").toLowerCase();
  const earlyAllowed = property?.earlyWithdrawalAllowed !== false;
  const recordedProfit = Number(investment?.profitAmount || 0);
  const principal = Number(investment?.amount || 0);
  const marketValue = Number(property?.expectedSellingPrice || 0);

  const actions = [];
  let scenarioKey = "active-holding";
  let scenarioTitle = "Investment active";
  let scenarioDescription =
    "Your capital is participating in the project. Exit handling follows the Hive exit plan rules below.";

  if (investmentStatus === "withdrawn" || settlementType === "early-withdrawal") {
    scenarioKey = "early-withdrawal";
    scenarioTitle = "Early withdrawal";
    scenarioDescription =
      "Only your original investment is returned. Profit is not paid on early withdrawal.";
    if (chequeStatus === "cleared") {
      actions.push("Early withdrawal processed — security cheque cleared.");
    } else if (chequeStatus === "presented") {
      actions.push("Cheque presented for early withdrawal settlement.");
    } else {
      actions.push("Contact Hive support to complete early withdrawal settlement.");
    }
  } else if (settlementType === "loss-scenario") {
    scenarioKey = "loss-scenario";
    scenarioTitle = "Loss scenario — principal protected";
    scenarioDescription =
      "Sale proceeds were below cost. You receive your full original investment; Hive bears the loss.";
    actions.push("Principal protection applies via your security cheque.");
    if (chequeStatus !== "cleared") {
      actions.push("Awaiting final cheque settlement with Hive admin.");
    }
  } else if (sold && withinFirstYear) {
    scenarioKey = "sold-within-year";
    scenarioTitle = "Sold within one year";
    scenarioDescription =
      "Profit is distributed immediately: 75% to investors and 25% to Hive, allocated by pool share.";
    if (recordedProfit > 0) {
      actions.push(`Recorded profit on this investment: PKR ${Math.round(recordedProfit).toLocaleString("en-PK")}.`);
    } else {
      actions.push("Awaiting admin profit distribution for this property sale.");
    }
  } else if (sold && !withinFirstYear) {
    scenarioKey = "sold-after-year";
    scenarioTitle = "Sold after one year";
    scenarioDescription =
      "Exit follows post-year sale settlement. Review profit distribution and principal clearance with Hive.";
    if (recordedProfit > 0) {
      actions.push(`Recorded profit: PKR ${Math.round(recordedProfit).toLocaleString("en-PK")}.`);
    } else {
      actions.push("Contact Hive if profit distribution is pending.");
    }
  } else if (!sold && oneYearDate && now >= oneYearDate) {
    scenarioKey = "not-sold-after-year";
    scenarioTitle = "One year reached — not sold yet";
    scenarioDescription =
      "You are eligible for original investment return plus profit share based on the property's current market value.";
    if (marketValue > 0) {
      actions.push(
        `Reference market value on file: PKR ${Math.round(marketValue).toLocaleString("en-PK")} — final settlement by Hive.`
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
          ? `One-year milestone: ${oneYearDate.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}`
          : "One-year period has passed — see not-sold-after-year rule if still unsold."
      );
    }

    if (earlyAllowed && !sold && withinFirstYear) {
      actions.push("Early withdrawal available: principal only (no profit). Contact Hive to request.");
    } else if (!earlyAllowed && !sold && withinFirstYear) {
      actions.push("Early withdrawal is not enabled for this property.");
    }
  }

  if (!cheque) {
    actions.push("No security cheque on file yet — contact Hive if your cheque should have been issued.");
  } else if (cheque.status === "pending") {
    actions.push("Security cheque is pending activation by admin.");
  } else if (cheque.status === "active") {
    actions.push("Security cheque is active and securing your principal.");
  }

  if (investmentStatus === "completed" && scenarioKey !== "early-withdrawal") {
    actions.push("Investment marked completed — review settlement notes on your cheque.");
  }

  const uniqueActions = [...new Set(actions.filter(Boolean))];

  return {
    scenarioKey,
    scenarioTitle,
    scenarioDescription,
    withinFirstYear,
    oneYearDate: formatDateIso(oneYearDate),
    investmentAgeDays: Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000))),
    propertySold: sold,
    earlyWithdrawalAllowed: earlyAllowed,
    earlyWithdrawalOutcome: "Principal only (no profit)",
    referenceMarketValue: marketValue > 0 ? marketValue : null,
    recordedProfit,
    principal,
    actionsNeeded: uniqueActions,
    withdrawalOptions: {
      earlyWithdrawalAllowed: earlyAllowed && !sold && investmentStatus === "active",
      earlyWithdrawalOutcome: "Original investment only — no profit",
      requiresHiveApproval: true,
      contactHint: "Contact Hive Construction support with your investment ID to request early withdrawal.",
    },
  };
}

export function summarizeExitPlan(items) {
  const pendingActions = items.reduce((sum, row) => sum + (row.exitPlan?.actionsNeeded?.length || 0), 0);
  const earlyWithdrawalEligible = items.filter(
    (row) => row.exitPlan?.withdrawalOptions?.earlyWithdrawalAllowed
  ).length;

  return {
    investmentCount: items.length,
    pendingActionCount: pendingActions,
    earlyWithdrawalEligibleCount: earlyWithdrawalEligible,
  };
}
