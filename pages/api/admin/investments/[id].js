import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Investment from "@/models/Investment";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid id" });
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { profitAmount, status } = req.body ?? {};
  const update = {};

  if (profitAmount !== undefined) {
    const p = Number(profitAmount);
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ message: "profitAmount must be a non-negative number" });
    }
    update.profitAmount = p;
  }

  if (status !== undefined) {
    const s = String(status).toLowerCase();
    if (!["active", "withdrawn", "completed"].includes(s)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    update.status = s;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  try {
    await dbConnect();

    const updated = await Investment.findByIdAndUpdate(String(id), update, { new: true })
      .populate("investorId", "fullName email")
      .populate("propertyId", "title location totalCost")
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Investment not found" });
    }

    const inv = updated.investorId;
    const prop = updated.propertyId;
    const investment = {
      id: String(updated._id),
      investorId: updated.investorId ? String(updated.investorId) : "",
      investorName:
        inv && typeof inv === "object" && inv.fullName ? inv.fullName : "Unknown investor",
      investorEmail: inv && typeof inv === "object" && inv.email ? inv.email : "",
      propertyId: updated.propertyId ? String(updated.propertyId) : "",
      propertyTitle:
        prop && typeof prop === "object" && prop.title ? prop.title : "Unknown property",
      propertyLocation:
        prop && typeof prop === "object" && prop.location ? prop.location : "",
      amount: updated.amount,
      sharePercentage: updated.sharePercentage,
      investmentDate: updated.investmentDate,
      profitAmount: updated.profitAmount,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    return res.status(200).json({
      message: "Investment updated",
      investment,
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
