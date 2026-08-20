import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Investment from "@/models/Investment";
import Property from "@/models/Property";
import {
  populateInvestment,
  resolveInvestorPool,
  serializeInvestment,
} from "@/lib/serializeInvestment";
import { computePoolSharePercentage } from "@/lib/profitDistribution";
import { syncPropertyFunding } from "@/lib/propertyFunding";
import { notifyProfitShare } from "@/lib/investorNotifications";

function parseDistributionDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid id" });
  }

  if (req.method === "GET") {
    try {
      await dbConnect();

      const row = await populateInvestment(Investment.findById(String(id))).lean();
      if (!row) {
        return res.status(404).json({ message: "Investment not found" });
      }

      return res.status(200).json({ investment: serializeInvestment(row) });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await dbConnect();

      const deleted = await Investment.findByIdAndDelete(String(id)).select("propertyId").lean();
      if (!deleted) {
        return res.status(404).json({ message: "Investment not found" });
      }

      if (deleted.propertyId) {
        await syncPropertyFunding(deleted.propertyId);
      }

      return res.status(200).json({ message: "Investment deleted" });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { profitAmount, status, amount, investmentDate, addProfitDistribution } = req.body ?? {};
  const mongoUpdate = {};

  if (addProfitDistribution && typeof addProfitDistribution === "object") {
    const distAmount = Number(addProfitDistribution.amount);
    if (!Number.isFinite(distAmount) || distAmount <= 0) {
      return res.status(400).json({ message: "Distribution amount must be a positive number" });
    }

    const distributedAt = parseDistributionDate(addProfitDistribution.distributedAt);
    if (!distributedAt) {
      return res.status(400).json({ message: "distributedAt must be a valid date" });
    }

    const note = String(addProfitDistribution.note || "").trim();
    const recordedBy = payload?.email || payload?.sub || "admin";

    mongoUpdate.$inc = { profitAmount: distAmount };
    mongoUpdate.$set = { lastProfitDistributedAt: distributedAt };
    mongoUpdate.$push = {
      profitDistributions: {
        amount: distAmount,
        distributedAt,
        note,
        recordedBy,
      },
    };
  }

  const setFields = {};

  if (profitAmount !== undefined && !addProfitDistribution) {
    const p = Number(profitAmount);
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ message: "profitAmount must be a non-negative number" });
    }
    setFields.profitAmount = p;
  }

  if (status !== undefined) {
    const s = String(status).toLowerCase();
    if (!["active", "withdrawn", "completed"].includes(s)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    setFields.status = s;
  }

  if (amount !== undefined) {
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: "amount must be a valid positive number" });
    }
    setFields.amount = amountNum;
  }

  if (investmentDate !== undefined) {
    const d = new Date(investmentDate);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ message: "investmentDate must be a valid date" });
    }
    setFields.investmentDate = d;
  }

  if (Object.keys(setFields).length > 0) {
    mongoUpdate.$set = { ...(mongoUpdate.$set || {}), ...setFields };
  }

  if (Object.keys(mongoUpdate).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  try {
    await dbConnect();

    const existing = await Investment.findById(String(id)).select("propertyId amount").lean();
    if (!existing) {
      return res.status(404).json({ message: "Investment not found" });
    }

    if (setFields.amount !== undefined) {
      const property = await Property.findById(String(existing.propertyId))
        .select("totalCost investorFundingRequired")
        .lean();
      const pool = resolveInvestorPool(property);
      mongoUpdate.$set = {
        ...(mongoUpdate.$set || {}),
        sharePercentage: computePoolSharePercentage(setFields.amount, pool),
      };
    }

    const updated = await populateInvestment(
      Investment.findByIdAndUpdate(String(id), mongoUpdate, { new: true })
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Investment not found" });
    }

    if (setFields.amount !== undefined) {
      await syncPropertyFunding(existing.propertyId);
    }

    if (addProfitDistribution) {
      const property = await Property.findById(String(existing.propertyId)).select("title").lean();
      await notifyProfitShare({
        investorId: String(updated.investorId?._id || updated.investorId),
        propertyId: String(existing.propertyId),
        propertyTitle: property?.title || "Property",
        amount: Number(addProfitDistribution.amount),
        investmentId: String(id),
        distributedAt: parseDistributionDate(addProfitDistribution.distributedAt),
      });
    }

    return res.status(200).json({
      message: addProfitDistribution ? "Profit distribution recorded" : "Investment updated",
      investment: serializeInvestment(updated),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
