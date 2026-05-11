import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Investment from "@/models/Investment";
import Investor from "@/models/Investor";
import Property from "@/models/Property";

function mapInvestment(doc) {
  const inv = doc.investorId;
  const prop = doc.propertyId;

  const investorName =
    inv && typeof inv === "object" && inv.fullName ? inv.fullName : "Unknown investor";
  const investorEmail =
    inv && typeof inv === "object" && inv.email ? inv.email : "";

  const propertyTitle =
    prop && typeof prop === "object" && prop.title ? prop.title : "Unknown property";
  const propertyLocation =
    prop && typeof prop === "object" && prop.location ? prop.location : "";

  return {
    id: String(doc._id),
    investorId: doc.investorId ? String(doc.investorId) : "",
    investorName,
    investorEmail,
    propertyId: doc.propertyId ? String(doc.propertyId) : "",
    propertyTitle,
    propertyLocation,
    amount: doc.amount,
    sharePercentage: doc.sharePercentage,
    investmentDate: doc.investmentDate,
    profitAmount: doc.profitAmount,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method === "GET") {
    const { status } = req.query;
    const filter = {};
    if (status && ["active", "withdrawn", "completed"].includes(String(status))) {
      filter.status = String(status);
    }

    try {
      await dbConnect();

      const rows = await Investment.find(filter)
        .populate("investorId", "fullName email")
        .populate("propertyId", "title location totalCost")
        .sort({ investmentDate: -1 })
        .lean();

      return res.status(200).json({
        investments: rows.map(mapInvestment),
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "POST") {
    const { investorId, propertyId, amount, investmentDate } = req.body ?? {};

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

    try {
      await dbConnect();

      const [investor, property] = await Promise.all([
        Investor.findById(String(investorId)).select("_id").lean(),
        Property.findById(String(propertyId)).select("totalCost").lean(),
      ]);

      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const totalCost = Number(property.totalCost);
      const sharePercentage =
        Number.isFinite(totalCost) && totalCost > 0 ? (amountNum / totalCost) * 100 : 0;

      const created = await Investment.create({
        investorId: String(investorId),
        propertyId: String(propertyId),
        amount: amountNum,
        investmentDate: invDate,
        sharePercentage,
        profitAmount: 0,
        status: "active",
      });

      const populated = await Investment.findById(created._id)
        .populate("investorId", "fullName email")
        .populate("propertyId", "title location totalCost")
        .lean();

      return res.status(201).json({
        message: "Investment created",
        investment: mapInvestment(populated),
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
