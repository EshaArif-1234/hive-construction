import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import Investment from "@/models/Investment";
import Property from "@/models/Property";

export default async function handler(req, res) {
  const payload = requireInvestor(req, res);
  if (!payload) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { propertyId, amount } = req.body ?? {};

  if (!propertyId || amount === undefined) {
    return res.status(400).json({ message: "propertyId and amount are required" });
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return res.status(400).json({ message: "amount must be a valid positive number" });
  }

  try {
    await dbConnect();

    const property = await Property.findById(String(propertyId))
      .select("totalCost status")
      .lean();

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const totalCost = Number(property.totalCost);
    const sharePercentage = Number.isFinite(totalCost) && totalCost > 0 ? (amountNum / totalCost) * 100 : 0;

    const investment = await Investment.create({
      investorId: String(payload.sub),
      propertyId: String(propertyId),
      amount: amountNum,
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
