import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Property from "@/models/Property";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";

function parseBooleanLike(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "yes" || v === "1") return true;
    if (v === "false" || v === "no" || v === "0") return false;
  }
  return fallback;
}

function derivePublicStatus(listingStatus, constructionStatus) {
  if (
    listingStatus === "completed" ||
    constructionStatus === "sold" ||
    constructionStatus === "completed"
  ) {
    return "sold";
  }
  if (
    listingStatus === "active" &&
    ["under-construction", "gray-structure-completed", "finishing-work"].includes(
      constructionStatus
    )
  ) {
    return "in-progress";
  }
  return "available";
}

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid id" });
  }

  if (req.method === "DELETE") {
    try {
      await dbConnect();

      const existing = await Property.findById(id).select("images").lean();
      if (!existing) {
        return res.status(404).json({ message: "Property not found" });
      }

      const imgs = Array.isArray(existing.images) ? existing.images : [];
      for (const img of imgs) {
        if (img?.publicId) {
          await destroyCloudinaryAsset(String(img.publicId));
        }
      }

      const deleted = await Property.findByIdAndDelete(id).select("_id").lean();
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }

      return res.status(200).json({ message: "Property deleted" });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    title,
    type,
    city,
    address,
    description,
    totalCost,
    hiveContribution,
    investorFundingRequired,
    expectedSellingPrice,
    expectedProfitPercentage,
    minimumInvestment,
    investorProfitShare,
    hiveProfitShare,
    constructionStatus,
    expectedCompletionDuration,
    expectedSellingDuration,
    investorProtectionEnabled,
    earlyWithdrawalAllowed,
    earlyWithdrawalProfit,
    listingStatus,
    featured,
    fundingCollected,
    createdBy,
  } = req.body ?? {};

  const t = String(title ?? "").trim();
  const loc = String(city ?? "").trim();

  if (!t || !loc) {
    return res.status(400).json({ message: "title and city are required" });
  }

  const totalCostNum = Number(totalCost);
  const expectedSellingPriceNum = Number(expectedSellingPrice);
  const hiveContributionNum = Number(hiveContribution);
  const investorFundingRequiredNum = Number(investorFundingRequired);
  const expectedProfitPercentageNum = Number(expectedProfitPercentage);
  const minimumInvestmentNum = Number(minimumInvestment);
  const investorProfitShareNum = Number(investorProfitShare);
  const hiveProfitShareNum = Number(hiveProfitShare);
  const expectedCompletionDurationNum = Number(expectedCompletionDuration);
  const expectedSellingDurationNum = Number(expectedSellingDuration);
  const fundingCollectedNum = Number(fundingCollected);

  if (
    !Number.isFinite(totalCostNum) ||
    !Number.isFinite(expectedSellingPriceNum) ||
    !Number.isFinite(hiveContributionNum) ||
    !Number.isFinite(investorFundingRequiredNum) ||
    !Number.isFinite(expectedProfitPercentageNum) ||
    !Number.isFinite(minimumInvestmentNum) ||
    !Number.isFinite(investorProfitShareNum) ||
    !Number.isFinite(hiveProfitShareNum) ||
    !Number.isFinite(expectedCompletionDurationNum) ||
    !Number.isFinite(expectedSellingDurationNum) ||
    !Number.isFinite(fundingCollectedNum)
  ) {
    return res.status(400).json({
      message: "All numeric fields must contain valid numeric values",
    });
  }

  if (Math.round(investorProfitShareNum + hiveProfitShareNum) !== 100) {
    return res.status(400).json({
      message: "investorProfitShare and hiveProfitShare must total 100",
    });
  }

  const normalizedListingStatus = String(listingStatus || "active").toLowerCase();
  const allowedListingStatuses = ["draft", "active", "paused", "completed", "archived"];
  const finalListingStatus = allowedListingStatuses.includes(normalizedListingStatus)
    ? normalizedListingStatus
    : "draft";
  const normalizedConstructionStatus = String(constructionStatus || "not-started").toLowerCase();
  const allowedConstructionStatuses = [
    "not-started",
    "land-purchased",
    "under-construction",
    "gray-structure-completed",
    "finishing-work",
    "ready-for-sale",
    "sold",
    "completed",
  ];
  const finalConstructionStatus = allowedConstructionStatuses.includes(normalizedConstructionStatus)
    ? normalizedConstructionStatus
    : "not-started";
  try {
    await dbConnect();

    const updated = await Property.findByIdAndUpdate(
      id,
      {
        title: t,
        type: String(type || "house").trim().toLowerCase(),
        city: loc,
        address: String(address || "").trim(),
        description: String(description || "").trim(),
        totalCost: totalCostNum,
        expectedSellingPrice: expectedSellingPriceNum,
        hiveContribution: hiveContributionNum,
        investorFundingRequired: investorFundingRequiredNum,
        expectedProfitPercentage: expectedProfitPercentageNum,
        minimumInvestment: minimumInvestmentNum,
        investorProfitShare: investorProfitShareNum,
        hiveProfitShare: hiveProfitShareNum,
        constructionStatus: finalConstructionStatus,
        expectedCompletionDuration: expectedCompletionDurationNum,
        expectedSellingDuration: expectedSellingDurationNum,
        investorProtectionEnabled: parseBooleanLike(investorProtectionEnabled, true),
        earlyWithdrawalAllowed: parseBooleanLike(earlyWithdrawalAllowed, true),
        earlyWithdrawalProfit: String(earlyWithdrawalProfit || "no-profit").toLowerCase(),
        listingStatus: finalListingStatus,
        featured: parseBooleanLike(featured, false),
        fundingCollected: fundingCollectedNum,
        createdBy: String(createdBy || "").trim(),
      },
      { new: true }
    )
      .select(
        "title type city address description totalCost hiveContribution investorFundingRequired expectedSellingPrice expectedProfitPercentage minimumInvestment investorProfitShare hiveProfitShare constructionStatus expectedCompletionDuration expectedSellingDuration investorProtectionEnabled earlyWithdrawalAllowed earlyWithdrawalProfit thumbnail galleryImages listingStatus featured fundingCollected createdBy createdAt"
      )
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.status(200).json({
      message: "Property updated",
      property: {
        id: String(updated._id),
        title: updated.title,
        type: updated.type,
        city: updated.city,
        address: updated.address,
        description: updated.description,
        totalCost: updated.totalCost,
        expectedSellingPrice: updated.expectedSellingPrice,
        hiveContribution: updated.hiveContribution,
        investorFundingRequired: updated.investorFundingRequired,
        expectedProfitPercentage: updated.expectedProfitPercentage,
        minimumInvestment: updated.minimumInvestment,
        investorProfitShare: updated.investorProfitShare,
        hiveProfitShare: updated.hiveProfitShare,
        constructionStatus: updated.constructionStatus,
        expectedCompletionDuration: updated.expectedCompletionDuration,
        expectedSellingDuration: updated.expectedSellingDuration,
        investorProtectionEnabled: updated.investorProtectionEnabled,
        earlyWithdrawalAllowed: updated.earlyWithdrawalAllowed,
        earlyWithdrawalProfit: updated.earlyWithdrawalProfit,
        listingStatus: updated.listingStatus,
        featured: updated.featured,
        fundingCollected: updated.fundingCollected,
        createdBy: updated.createdBy,
        thumbnail: updated.thumbnail || {},
        galleryImages: Array.isArray(updated.galleryImages) ? updated.galleryImages : [],
        createdAt: updated.createdAt,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
