const PROPERTY_FIELDS =
  "title type city address description totalCost hiveContribution investorFundingRequired expectedSellingPrice expectedProfitPercentage minimumInvestment investorProfitShare hiveProfitShare constructionStatus expectedCompletionDuration expectedSellingDuration investorProtectionEnabled earlyWithdrawalAllowed earlyWithdrawalProfit thumbnail galleryImages listingStatus featured fundingCollected fundingProgressPct expectedAnnualRoiPct riskLevel bedrooms bathrooms areaSize garage floorCount nearbySchool nearbyHospital nearbyMarket nearbyMosque createdBy createdAt";

export { PROPERTY_FIELDS };

export function serializeProperty(p) {
  if (!p) return null;
  return {
    id: String(p._id),
    title: p.title,
    type: p.type,
    city: p.city,
    address: p.address,
    description: p.description,
    totalCost: p.totalCost,
    hiveContribution: p.hiveContribution,
    investorFundingRequired: p.investorFundingRequired,
    expectedSellingPrice: p.expectedSellingPrice,
    expectedProfitPercentage: p.expectedProfitPercentage,
    minimumInvestment: p.minimumInvestment,
    investorProfitShare: p.investorProfitShare,
    hiveProfitShare: p.hiveProfitShare,
    constructionStatus: p.constructionStatus,
    expectedCompletionDuration: p.expectedCompletionDuration,
    expectedSellingDuration: p.expectedSellingDuration,
    investorProtectionEnabled: p.investorProtectionEnabled,
    earlyWithdrawalAllowed: p.earlyWithdrawalAllowed,
    earlyWithdrawalProfit: p.earlyWithdrawalProfit,
    listingStatus: p.listingStatus,
    featured: p.featured,
    fundingCollected: p.fundingCollected,
    fundingProgressPct: p.fundingProgressPct ?? 0,
    expectedAnnualRoiPct: p.expectedAnnualRoiPct ?? 0,
    riskLevel: p.riskLevel || "medium",
    bedrooms: p.bedrooms ?? 0,
    bathrooms: p.bathrooms ?? 0,
    areaSize: p.areaSize ?? 0,
    garage: p.garage ?? 0,
    floorCount: p.floorCount ?? 0,
    nearbySchool: Boolean(p.nearbySchool),
    nearbyHospital: Boolean(p.nearbyHospital),
    nearbyMarket: Boolean(p.nearbyMarket),
    nearbyMosque: Boolean(p.nearbyMosque),
    createdBy: p.createdBy,
    thumbnail: p.thumbnail || {},
    galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages : [],
    createdAt: p.createdAt,
  };
}
