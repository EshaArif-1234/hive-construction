import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Investment from "@/models/Investment";
import Investor from "@/models/Investor";
import Property from "@/models/Property";
import { getPropertyFundingStats } from "@/lib/propertyFunding";
import {
  populateInvestment,
  resolveInvestorPool,
  serializeInvestment,
} from "@/lib/serializeInvestment";
import { computePoolSharePercentage } from "@/lib/profitDistribution";
import { syncPropertyFunding } from "@/lib/propertyFunding";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method === "GET") {
    const { status, propertyId, investorId } = req.query;
    const filter = {};

    if (status && ["active", "withdrawn", "completed"].includes(String(status))) {
      filter.status = String(status);
    }
    if (propertyId && typeof propertyId === "string") {
      filter.propertyId = String(propertyId);
    }
    if (investorId && typeof investorId === "string") {
      filter.investorId = String(investorId);
    }

    try {
      await dbConnect();

      const rows = await populateInvestment(
        Investment.find(filter).sort({ investmentDate: -1 })
      ).lean();

      const investments = rows.map((row) => serializeInvestment(row));
      const summary = investments.reduce(
        (acc, row) => {
          acc.totalPrincipal += Number(row.amount) || 0;
          acc.totalProfit += Number(row.profitAmount) || 0;
          if (row.status === "active") acc.activeCount += 1;
          return acc;
        },
        { totalPrincipal: 0, totalProfit: 0, activeCount: 0 }
      );

      return res.status(200).json({ investments, summary });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "POST") {
    const { investorId, propertyId, amount, investmentDate, paymentMethod, paymentScreenshotName } =
      req.body ?? {};

    if (!investorId || !propertyId || amount === undefined) {
      return res
        .status(400)
        .json({ message: "investorId, propertyId, and amount are required" });
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: "amount must be a valid positive number" });
    }

    let invDate = new Date();
    if (investmentDate) {
      const d = new Date(investmentDate);
      if (!Number.isNaN(d.getTime())) invDate = d;
    }

    const normalizedMethod = paymentMethod
      ? String(paymentMethod).toLowerCase()
      : "bank-transfer";
    const allowedMethods = ["bank-transfer", "easypaisa", "jazzcash"];
    if (!allowedMethods.includes(normalizedMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    try {
      await dbConnect();

      const [investor, property] = await Promise.all([
        Investor.findById(String(investorId)).select("_id status").lean(),
        Property.findById(String(propertyId))
          .select("totalCost investorFundingRequired minimumInvestment listingStatus constructionStatus")
          .lean(),
      ]);

      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const funding = await getPropertyFundingStats(property._id, {
        totalCost: property.totalCost,
        investorFundingRequired: property.investorFundingRequired,
      });

      if (funding.isFullyFunded) {
        return res.status(400).json({ message: "Property is fully funded." });
      }

      if (amountNum > funding.remainingFunding) {
        return res.status(400).json({
          message: `Amount exceeds remaining funding (PKR ${Math.round(funding.remainingFunding).toLocaleString()} available).`,
        });
      }

      const minimumInvestment = Number(property.minimumInvestment || 0);
      if (minimumInvestment > 0 && amountNum < minimumInvestment) {
        return res.status(400).json({
          message: `Minimum investment is PKR ${minimumInvestment.toLocaleString()}.`,
        });
      }

      const pool = resolveInvestorPool(property);
      const sharePercentage = computePoolSharePercentage(amountNum, pool);

      const created = await Investment.create({
        investorId: String(investorId),
        propertyId: String(propertyId),
        amount: amountNum,
        paymentMethod: normalizedMethod,
        paymentScreenshotName: String(paymentScreenshotName || "").trim(),
        investmentDate: invDate,
        sharePercentage,
        profitAmount: 0,
        profitDistributions: [],
        status: "active",
      });

      const populated = await populateInvestment(Investment.findById(created._id)).lean();

      await syncPropertyFunding(propertyId);

      return res.status(201).json({
        message: "Investment created",
        investment: serializeInvestment(populated),
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
