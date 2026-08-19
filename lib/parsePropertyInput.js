
export function parseBooleanLike(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "yes" || v === "1") return true;
    if (v === "false" || v === "no" || v === "0") return false;
  }
  return fallback;
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function parseOptionalNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const ALLOWED_LISTING_STATUSES = ["draft", "active", "paused", "completed", "archived"];
const ALLOWED_CONSTRUCTION_STATUSES = [
  "not-started",
  "land-purchased",
  "under-construction",
  "gray-structure-completed",
  "finishing-work",
  "ready-for-sale",
  "sold",
  "completed",
];
const ALLOWED_RISK_LEVELS = ["low", "medium", "high"];

/**
 * Parse and validate property fields from multipart form body or JSON.
 * @returns {{ data?: object, error?: string }}
 */
export function parsePropertyInput(body, { requireTitleCity = true } = {}) {
  const title = String(body?.title ?? "").trim();
  const city = String(body?.city ?? "").trim();

  if (requireTitleCity && (!title || !city)) {
    return { error: "title and city are required" };
  }

  const totalCost = parseNumber(body?.totalCost);
  const expectedSellingPrice = parseOptionalNumber(body?.expectedSellingPrice, 0);
  const hiveContribution = parseNumber(body?.hiveContribution);
  const investorFundingRequired = parseNumber(body?.investorFundingRequired);
  const minimumInvestment = parseOptionalNumber(body?.minimumInvestment, 0);
  const investorProfitShare = parseNumber(body?.investorProfitShare);
  const hiveProfitShare = parseNumber(body?.hiveProfitShare);
  const expectedCompletionDuration = parseNumber(body?.expectedCompletionDuration);
  const expectedSellingDuration = parseNumber(body?.expectedSellingDuration);
  const fundingCollected = parseOptionalNumber(body?.fundingCollected, 0);
  const fundingProgressPct = parseOptionalNumber(body?.fundingProgressPct, 0);
  const expectedAnnualRoiPct = parseOptionalNumber(body?.expectedAnnualRoiPct, 0);
  const bedrooms = parseNumber(body?.bedrooms);
  const bathrooms = parseNumber(body?.bathrooms);
  const areaSize = parseNumber(body?.areaSize);
  const garage = parseNumber(body?.garage);
  const floorCount = parseNumber(body?.floorCount);

  const expectedProfitPercentage = parseOptionalNumber(body?.expectedProfitPercentage, 0);

  const numericFields = [
    totalCost,
    hiveContribution,
    investorFundingRequired,
    investorProfitShare,
    hiveProfitShare,
    expectedCompletionDuration,
    expectedSellingDuration,
    bedrooms,
    bathrooms,
    areaSize,
    garage,
    floorCount,
  ];

  if (numericFields.some((n) => !Number.isFinite(n))) {
    return { error: "All numeric fields must contain valid numeric values" };
  }

  if (Math.round(investorProfitShare + hiveProfitShare) !== 100) {
    return { error: "investorProfitShare and hiveProfitShare must total 100" };
  }

  if (fundingProgressPct < 0 || fundingProgressPct > 100) {
    return { error: "fundingProgressPct must be between 0 and 100" };
  }

  const listingStatus = String(body?.listingStatus || "draft").toLowerCase();
  const constructionStatus = String(body?.constructionStatus || "not-started").toLowerCase();
  const riskLevel = String(body?.riskLevel || "medium").toLowerCase();

  return {
    data: {
      title,
      type: String(body?.type || "house").trim().toLowerCase(),
      city,
      address: String(body?.address || "").trim(),
      description: String(body?.description || "").trim(),
      totalCost,
      expectedSellingPrice,
      hiveContribution,
      investorFundingRequired,
      expectedProfitPercentage,
      minimumInvestment,
      investorProfitShare,
      hiveProfitShare,
      constructionStatus: ALLOWED_CONSTRUCTION_STATUSES.includes(constructionStatus)
        ? constructionStatus
        : "not-started",
      expectedCompletionDuration,
      expectedSellingDuration,
      investorProtectionEnabled: parseBooleanLike(body?.investorProtectionEnabled, true),
      earlyWithdrawalAllowed: parseBooleanLike(body?.earlyWithdrawalAllowed, true),
      earlyWithdrawalProfit: String(body?.earlyWithdrawalProfit || "no-profit").toLowerCase(),
      listingStatus: ALLOWED_LISTING_STATUSES.includes(listingStatus) ? listingStatus : "draft",
      featured: parseBooleanLike(body?.featured, false),
      fundingCollected,
      fundingProgressPct,
      expectedAnnualRoiPct,
      riskLevel: ALLOWED_RISK_LEVELS.includes(riskLevel) ? riskLevel : "medium",
      bedrooms,
      bathrooms,
      areaSize,
      garage,
      floorCount,
      nearbySchool: parseBooleanLike(body?.nearbySchool, false),
      nearbyHospital: parseBooleanLike(body?.nearbyHospital, false),
      nearbyMarket: parseBooleanLike(body?.nearbyMarket, false),
      nearbyMosque: parseBooleanLike(body?.nearbyMosque, false),
      createdBy: String(body?.createdBy || "").trim(),
    },
  };
}

export function collectPropertyImages(property) {
  return [
    property?.thumbnail,
    ...(Array.isArray(property?.galleryImages) ? property.galleryImages : []),
  ].filter(Boolean);
}
