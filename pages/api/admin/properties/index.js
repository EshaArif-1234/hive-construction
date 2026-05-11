import multer from "multer";
import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Property from "@/models/Property";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";

const upload = multer({ storage: multer.memoryStorage() });

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

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method === "GET") {
    try {
      await dbConnect();

      const properties = await Property.find({})
        .sort({ createdAt: -1 })
        .select(
          "title type city address description totalCost hiveContribution investorFundingRequired expectedSellingPrice expectedProfitPercentage minimumInvestment investorProfitShare hiveProfitShare constructionStatus expectedCompletionDuration expectedSellingDuration investorProtectionEnabled earlyWithdrawalAllowed earlyWithdrawalProfit thumbnail galleryImages listingStatus featured fundingCollected createdBy createdAt"
        )
        .lean();

      return res.status(200).json({
        properties: properties.map((p) => {
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
            nearbySchool: p.nearbySchool,
            nearbyHospital: p.nearbyHospital,
            nearbyMarket: p.nearbyMarket,
            nearbyMosque: p.nearbyMosque,
            expectedCompletionDuration: p.expectedCompletionDuration,
            expectedSellingDuration: p.expectedSellingDuration,
            investorProtectionEnabled: p.investorProtectionEnabled,
            earlyWithdrawalAllowed: p.earlyWithdrawalAllowed,
            earlyWithdrawalProfit: p.earlyWithdrawalProfit,
            listingStatus: p.listingStatus,
            featured: p.featured,
            fundingCollected: p.fundingCollected,
            createdBy: p.createdBy,
            thumbnail: p.thumbnail || {},
            galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages : [],
            createdAt: p.createdAt,
          };
        }),
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "POST") {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message:
          "Image uploads require Cloudinary. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    try {
      await runMiddleware(req, res, upload.array("images", 5));

      const {
        title,
        city,
        totalCost,
        expectedSellingPrice,
        hiveContribution,
        investorFundingRequired,
        type,
        address,
        description,
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

      if (!title || !city) {
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
          message:
            "All numeric fields must contain valid numeric values",
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
      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length > 5) {
        return res.status(400).json({ message: "Maximum 5 images are allowed" });
      }

      const uploaded = [];
      for (const f of files) {
        if (!f?.buffer?.length) continue;
        const { url, publicId } = await uploadImageBuffer(f.buffer);
        uploaded.push({ url, publicId });
      }
      const thumbnail = uploaded[0] || {};
      const galleryImages = uploaded.slice(1);

      await dbConnect();

      const property = await Property.create({
        title: String(title).trim(),
        type: String(type || "house").trim().toLowerCase(),
        city: String(city).trim(),
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
        createdBy: String(createdBy || payload.email || payload.id || "").trim(),
        thumbnail,
        galleryImages,
      });

      return res.status(201).json({
        message: "Property created",
        property: {
          id: String(property._id),
          title: property.title,
          type: property.type,
          city: property.city,
          address: property.address,
          description: property.description,
          totalCost: property.totalCost,
          expectedSellingPrice: property.expectedSellingPrice,
          hiveContribution: property.hiveContribution,
          investorFundingRequired: property.investorFundingRequired,
          expectedProfitPercentage: property.expectedProfitPercentage,
          minimumInvestment: property.minimumInvestment,
          investorProfitShare: property.investorProfitShare,
          hiveProfitShare: property.hiveProfitShare,
          constructionStatus: property.constructionStatus,
          expectedCompletionDuration: property.expectedCompletionDuration,
          expectedSellingDuration: property.expectedSellingDuration,
          investorProtectionEnabled: property.investorProtectionEnabled,
          earlyWithdrawalAllowed: property.earlyWithdrawalAllowed,
          earlyWithdrawalProfit: property.earlyWithdrawalProfit,
          listingStatus: property.listingStatus,
          featured: property.featured,
          fundingCollected: property.fundingCollected,
          createdBy: property.createdBy,
          thumbnail: property.thumbnail || {},
          galleryImages: Array.isArray(property.galleryImages) ? property.galleryImages : [],
          createdAt: property.createdAt,
        },
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
