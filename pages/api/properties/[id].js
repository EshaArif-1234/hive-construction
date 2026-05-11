import dbConnect from "@/lib/dbConnect";
import Property from "@/models/Property";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }

  try {
    await dbConnect();

    const p = await Property.findById(String(id))
      .select(
        "title type city address description totalCost hiveContribution investorFundingRequired expectedSellingPrice expectedProfitPercentage minimumInvestment investorProfitShare hiveProfitShare constructionStatus expectedCompletionDuration expectedSellingDuration investorProtectionEnabled earlyWithdrawalAllowed earlyWithdrawalProfit thumbnail galleryImages listingStatus featured fundingCollected createdBy createdAt"
      )
      .lean();

    if (!p) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.status(200).json({
      property: {
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
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
