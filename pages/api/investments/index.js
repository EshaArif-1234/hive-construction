import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import Investment from "@/models/Investment";
import Property from "@/models/Property";
import { getPropertyFundingStats, syncPropertyFunding } from "@/lib/propertyFunding";
import { computePoolSharePercentage } from "@/lib/profitDistribution";
import { PUBLIC_ACTIVE_FILTER } from "@/lib/publicPropertyQuery";
import { notifyInvestmentCreated } from "@/lib/investorNotifications";

function humanizeKebab(value, fallback = "N/A") {
  const v = String(value || "").trim();
  if (!v) return fallback;
  return v
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

function isAcceptingInvestment(property) {
  const listingStatus = String(property?.listingStatus || "").toLowerCase();
  const constructionStatus = String(property?.constructionStatus || "").toLowerCase();
  return (
    listingStatus === "active" &&
    ["under-construction", "gray-structure-completed", "finishing-work", "land-purchased"].includes(
      constructionStatus
    )
  );
}

export default async function handler(req, res) {
  const payload = requireInvestor(req, res);
  if (!payload) return;

  if (req.method === "GET") {
    try {
      await dbConnect();

      const investments = await Investment.find({ investorId: String(payload.sub) })
        .sort({ investmentDate: -1 })
        .select(
          "investorId propertyId amount paymentMethod paymentScreenshotName investmentDate sharePercentage profitAmount profitDistributions lastProfitDistributedAt status"
        )
        .populate({
          path: "propertyId",
          select: "title city listingStatus totalCost investorFundingRequired investorProfitShare hiveProfitShare",
          options: { lean: true },
        })
        .lean();

      const propertyIds = [
        ...new Set(
          investments
            .map((inv) => String(inv?.propertyId?._id || inv.propertyId || ""))
            .filter(Boolean)
        ),
      ];

      const fundingByPropertyId = new Map();
      await Promise.all(
        propertyIds.map(async (propertyId) => {
          const sample = investments.find(
            (inv) => String(inv?.propertyId?._id || inv.propertyId || "") === propertyId
          );
          const stats = await getPropertyFundingStats(propertyId, {
            totalCost: sample?.propertyId?.totalCost,
            investorFundingRequired: sample?.propertyId?.investorFundingRequired,
          });
          fundingByPropertyId.set(propertyId, stats);
        })
      );

      return res.status(200).json({
        investments: investments.map((inv) => {
          const propertyId = inv?.propertyId?._id
            ? String(inv.propertyId._id)
            : String(inv.propertyId || "");
          const amount = Number(inv.amount || 0);
          const investorFundingRequired = Number(inv?.propertyId?.investorFundingRequired || 0);
          const funding = fundingByPropertyId.get(propertyId) || {};
          const propertyFundingCollected = Number(funding.fundingCollected || 0);
          const remainingFunding = Number(funding.remainingFunding || 0);
          const fundingProgressPct = Number(funding.fundingProgressPct || 0);
          const isFullyFunded = Boolean(funding.isFullyFunded);
          const propertyInvestorCount = Number(funding.investorCount || 0);
          const profitAllocationSharePct =
            propertyFundingCollected > 0
              ? computePoolSharePercentage(amount, propertyFundingCollected)
              : 0;
          const investorProfitShare = Number(inv?.propertyId?.investorProfitShare ?? 75);
          const hiveProfitShare = Number(inv?.propertyId?.hiveProfitShare ?? 25);

          return {
            id: String(inv._id),
            investorId: String(inv.investorId),
            propertyId,
            propertyTitle: inv?.propertyId?.title || "Property",
            propertyCity: inv?.propertyId?.city || "",
            propertyStatus: inv?.propertyId?.listingStatus || "draft",
            totalPropertyCost: Number(inv?.propertyId?.totalCost || 0),
            investorFundingRequired,
            propertyFundingCollected,
            remainingFunding,
            fundingProgressPct,
            isFullyFunded,
            propertyInvestorCount,
            investorProfitShare,
            hiveProfitShare,
            amount,
            paymentMethod: inv.paymentMethod,
            paymentScreenshotName: inv.paymentScreenshotName || "",
            investmentDate: inv.investmentDate,
            sharePercentage: Number(inv.sharePercentage || 0),
            profitAllocationSharePct,
            profitAmount: Number(inv.profitAmount || 0),
            lastProfitDistributedAt: inv.lastProfitDistributedAt || null,
            profitDistributions: Array.isArray(inv.profitDistributions)
              ? inv.profitDistributions.map((row) => ({
                  id: row._id ? String(row._id) : "",
                  amount: Number(row.amount || 0),
                  distributedAt: row.distributedAt,
                  note: row.note || "",
                  recordedBy: row.recordedBy || "",
                }))
              : [],
            status: inv.status || "active",
          };
        }),
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { propertyId, amount, paymentMethod, paymentScreenshotName } = req.body ?? {};

  if (!propertyId || amount === undefined || !paymentMethod) {
    return res.status(400).json({
      message: "propertyId, amount, and paymentMethod are required",
    });
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return res.status(400).json({ message: "amount must be a valid positive number" });
  }

  const normalizedMethod = String(paymentMethod).toLowerCase();
  const allowedMethods = ["bank-transfer", "easypaisa", "jazzcash"];
  if (!allowedMethods.includes(normalizedMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  try {
    await dbConnect();

    const property = await Property.findOne({
      _id: String(propertyId),
      ...PUBLIC_ACTIVE_FILTER,
    })
      .select(
        "totalCost investorFundingRequired minimumInvestment listingStatus constructionStatus"
      )
      .lean();

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (!isAcceptingInvestment(property)) {
      return res.status(400).json({
        message: `This property is not currently accepting investment. Status: ${humanizeKebab(
          property.listingStatus
        )} (${humanizeKebab(property.constructionStatus)}).`,
      });
    }

    const funding = await getPropertyFundingStats(property._id, {
      totalCost: property.totalCost,
      investorFundingRequired: property.investorFundingRequired,
    });

    if (funding.isFullyFunded) {
      return res.status(400).json({
        message: "This property is fully funded. No further investment is accepted.",
      });
    }

    const minimumInvestment = Number(property.minimumInvestment || 0);
    if (minimumInvestment > 0 && amountNum < minimumInvestment) {
      return res.status(400).json({
        message: `Minimum investment is PKR ${minimumInvestment.toLocaleString()}.`,
      });
    }

    if (amountNum > funding.remainingFunding) {
      return res.status(400).json({
        message: `Amount exceeds remaining funding (PKR ${Math.round(funding.remainingFunding).toLocaleString()} available).`,
      });
    }

    const investorPool = Number(property.investorFundingRequired || 0);
    const sharePercentage =
      investorPool > 0 ? Math.round((amountNum / investorPool) * 10000) / 100 : 0;

    const investment = await Investment.create({
      investorId: String(payload.sub),
      propertyId: String(propertyId),
      amount: amountNum,
      paymentMethod: normalizedMethod,
      paymentScreenshotName: String(paymentScreenshotName || "").trim(),
      investmentDate: new Date(),
      sharePercentage,
      profitAmount: 0,
      status: "active",
    });

    const updatedFunding = await syncPropertyFunding(property._id);

    const propertyDoc = await Property.findById(property._id).select("title").lean();

    await notifyInvestmentCreated({
      investorId: String(payload.sub),
      propertyId: String(propertyId),
      propertyTitle: propertyDoc?.title || "Property",
      amount: amountNum,
      investmentId: String(investment._id),
    });

    return res.status(201).json({
      message: "Investment created",
      investment: {
        id: String(investment._id),
        investorId: investment.investorId,
        propertyId: investment.propertyId,
        amount: investment.amount,
        paymentMethod: investment.paymentMethod,
        paymentScreenshotName: investment.paymentScreenshotName,
        investmentDate: investment.investmentDate,
        sharePercentage: investment.sharePercentage,
        profitAmount: investment.profitAmount,
        status: investment.status,
      },
      funding: updatedFunding,
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
