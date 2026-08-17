import dbConnect from "@/lib/dbConnect";
import Property from "@/models/Property";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

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
  } catch (err) {
    console.error("[api/properties]", err);
    return res.status(500).json({
      message:
        process.env.NODE_ENV === "development"
          ? `Database error: ${err?.message || "Server error"}`
          : "Server error",
    });
  }
}
