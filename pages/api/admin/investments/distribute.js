import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Investment from "@/models/Investment";
import Property from "@/models/Property";
import PropertyProfitDistribution from "@/models/PropertyProfitDistribution";
import {
  buildPropertyDistributionPreview,
  validatePropertyProfitShare,
} from "@/lib/profitDistribution";
import { populateInvestment, serializeInvestment } from "@/lib/serializeInvestment";
import { notifyBulkProfitDistribution } from "@/lib/investorNotifications";

function parseDistributionDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method === "POST") {
    const {
      propertyId,
      totalProjectProfit,
      distributedAt,
      note,
      markCompleted,
      dryRun,
    } = req.body ?? {};

    if (!propertyId) {
      return res.status(400).json({ message: "propertyId is required" });
    }

    const profitNum = Number(totalProjectProfit);
    if (!Number.isFinite(profitNum) || profitNum <= 0) {
      return res.status(400).json({ message: "totalProjectProfit must be a positive number" });
    }

    const distributionDate = parseDistributionDate(distributedAt);
    if (!distributionDate) {
      return res.status(400).json({ message: "distributedAt must be a valid date" });
    }

    const distributionNote = String(note || "").trim();
    const recordedBy = payload?.email || payload?.sub || "admin";
    const shouldMarkCompleted = Boolean(markCompleted);

    try {
      await dbConnect();

      const property = await Property.findById(String(propertyId))
        .select("title city investorProfitShare hiveProfitShare")
        .lean();

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const shareCheck = validatePropertyProfitShare(property);
      if (!shareCheck.valid) {
        return res.status(400).json({ message: shareCheck.message });
      }

      const investments = await Investment.find({
        propertyId: String(propertyId),
        status: { $in: ["active", "completed"] },
      })
        .select("_id investorId amount status")
        .lean();

      if (investments.length === 0) {
        return res.status(400).json({ message: "No eligible investments found for this property" });
      }

      const preview = buildPropertyDistributionPreview(property, investments, profitNum);

      if (dryRun) {
        return res.status(200).json({
          preview: {
            propertyId: String(propertyId),
            propertyTitle: property.title,
            ...preview,
            profitShareValid: shareCheck.valid,
          },
        });
      }

      const bulkOps = preview.allocations.map((row) => ({
        updateOne: {
          filter: { _id: row.investmentId },
          update: {
            $inc: { profitAmount: row.amount },
            $set: {
              lastProfitDistributedAt: distributionDate,
              ...(shouldMarkCompleted ? { status: "completed" } : {}),
            },
            $push: {
              profitDistributions: {
                amount: row.amount,
                distributedAt: distributionDate,
                note:
                  distributionNote ||
                  `75/25 split — investor share (${property.title})`,
                recordedBy,
              },
            },
          },
        },
      }));

      await Investment.bulkWrite(bulkOps);

      await PropertyProfitDistribution.create({
        propertyId: String(propertyId),
        totalProjectProfit: preview.totalProjectProfit,
        investorProfitSharePct: preview.investorProfitSharePct,
        hiveProfitSharePct: preview.hiveProfitSharePct,
        investorPoolAmount: preview.investorPoolProfit,
        hiveAmount: preview.hiveProfit,
        distributedAt: distributionDate,
        note: distributionNote,
        recordedBy,
        allocations: preview.allocations.map((row) => ({
          investmentId: row.investmentId,
          investorId: row.investorId,
          amount: row.amount,
          poolSharePct: row.poolSharePct,
          stakeAmount: row.stakeAmount,
        })),
      });

      await notifyBulkProfitDistribution({
        propertyId: String(propertyId),
        propertyTitle: property.title,
        allocations: preview.allocations,
        distributedAt: distributionDate,
      });

      const updatedRows = await populateInvestment(
        Investment.find({ propertyId: String(propertyId) }).sort({ investmentDate: -1 })
      ).lean();

      return res.status(200).json({
        message: "Profit distributed using 75/25 split",
        summary: {
          propertyId: String(propertyId),
          propertyTitle: property.title,
          totalProjectProfit: profitNum,
          investorProfitSharePct: preview.investorProfitSharePct,
          hiveProfitSharePct: preview.hiveProfitSharePct,
          investorPoolProfit: preview.investorPoolProfit,
          hiveProfit: preview.hiveProfit,
          investorsPaid: preview.allocations.length,
          distributedAt: distributionDate,
        },
        investments: updatedRows.map((row) => serializeInvestment(row)),
      });
    } catch (err) {
      return res.status(400).json({ message: err?.message || "Server error" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
