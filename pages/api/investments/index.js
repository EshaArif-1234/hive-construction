import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import Investment from "@/models/Investment";
import Property from "@/models/Property";

function humanizeKebab(value, fallback = "N/A") {
  const v = String(value || "").trim();
  if (!v) return fallback;
  return v
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
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
          "investorId propertyId amount paymentMethod paymentScreenshotName investmentDate sharePercentage profitAmount status"
        )
        .populate({
          path: "propertyId",
          select: "title city listingStatus totalCost expectedSellingPrice",
          options: { lean: true },
        })
        .lean();

      return res.status(200).json({
        investments: investments.map((inv) => ({
          id: String(inv._id),
          investorId: String(inv.investorId),
          propertyId: inv?.propertyId?._id ? String(inv.propertyId._id) : String(inv.propertyId || ""),
          propertyTitle: inv?.propertyId?.title || "Property",
          propertyCity: inv?.propertyId?.city || "",
          propertyStatus: inv?.propertyId?.listingStatus || "draft",
          totalPropertyCost: Number(inv?.propertyId?.totalCost || 0),
          currentMarketValue: Number(
            inv?.propertyId?.expectedSellingPrice || inv?.propertyId?.totalCost || 0
          ),
          amount: Number(inv.amount || 0),
          paymentMethod: inv.paymentMethod,
          paymentScreenshotName: inv.paymentScreenshotName || "",
          investmentDate: inv.investmentDate,
          sharePercentage: Number(inv.sharePercentage || 0),
          profitAmount: Number(inv.profitAmount || 0),
          status: inv.status || "active",
        })),
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

    const property = await Property.findById(String(propertyId))
      .select("totalCost status listingStatus constructionStatus")
      .lean();

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const listingStatus = String(property?.listingStatus || "").toLowerCase();
    const constructionStatus = String(property?.constructionStatus || "").toLowerCase();
    const legacyStatus = String(property?.status || "").toLowerCase();
    const isAcceptingCapital =
      (listingStatus === "active" &&
        ["under-construction", "gray-structure-completed", "finishing-work"].includes(
          constructionStatus
        )) ||
      legacyStatus === "in-progress";

    if (!isAcceptingCapital) {
      return res.status(400).json({
        message: `This property is not currently accepting capital. Current status: ${humanizeKebab(
          listingStatus || legacyStatus,
          "Unknown"
        )}${constructionStatus ? ` (${humanizeKebab(constructionStatus)})` : ""}.`,
      });
    }

    const totalCost = Number(property.totalCost);
    const sharePercentage = Number.isFinite(totalCost) && totalCost > 0 ? (amountNum / totalCost) * 100 : 0;

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
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
}
