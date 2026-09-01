import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Investment from "@/models/Investment";
import SecurityCheque from "@/models/SecurityCheque";
import {
  populateSecurityCheque,
  serializeSecurityCheque,
} from "@/lib/serializeSecurityCheque";
import {
  notifySecurityCheque,
  notifyExitRequestCompleted,
} from "@/lib/investorNotifications";
import { CHEQUE_STATUSES, SETTLEMENT_TYPES } from "@/lib/securityChequeConstants";

function parseDate(value) {
  if (value === null) return null;
  if (!value) return undefined;
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

      const row = await populateSecurityCheque(SecurityCheque.findById(String(id))).lean();
      if (!row) {
        return res.status(404).json({ message: "Security cheque not found" });
      }

      return res.status(200).json({ cheque: serializeSecurityCheque(row) });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await dbConnect();

      const deleted = await SecurityCheque.findByIdAndDelete(String(id)).lean();
      if (!deleted) {
        return res.status(404).json({ message: "Security cheque not found" });
      }

      return res.status(200).json({ message: "Security cheque deleted" });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    chequeNumber,
    bankName,
    accountHolder,
    principalAmount,
    issueDate,
    maturityDate,
    status,
    settlementType,
    settledAt,
    settlementNote,
    notes,
  } = req.body ?? {};

  const update = {};

  if (chequeNumber !== undefined) {
    const num = String(chequeNumber).trim();
    if (!num) return res.status(400).json({ message: "chequeNumber cannot be empty" });
    update.chequeNumber = num;
  }

  if (bankName !== undefined) update.bankName = String(bankName).trim();
  if (accountHolder !== undefined) update.accountHolder = String(accountHolder).trim();
  if (notes !== undefined) update.notes = String(notes).trim();
  if (settlementNote !== undefined) update.settlementNote = String(settlementNote).trim();

  if (principalAmount !== undefined) {
    const p = Number(principalAmount);
    if (!Number.isFinite(p) || p <= 0) {
      return res.status(400).json({ message: "principalAmount must be a positive number" });
    }
    update.principalAmount = p;
  }

  if (issueDate !== undefined) {
    const d = parseDate(issueDate);
    if (!d) return res.status(400).json({ message: "issueDate must be a valid date" });
    update.issueDate = d;
  }

  if (maturityDate !== undefined) {
    if (maturityDate === null || maturityDate === "") {
      update.maturityDate = null;
    } else {
      const d = parseDate(maturityDate);
      if (!d) return res.status(400).json({ message: "maturityDate must be a valid date" });
      update.maturityDate = d;
    }
  }

  if (status !== undefined) {
    const s = String(status).toLowerCase();
    if (!CHEQUE_STATUSES.includes(s)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    update.status = s;
  }

  if (settlementType !== undefined) {
    const t = String(settlementType).toLowerCase();
    if (!SETTLEMENT_TYPES.includes(t)) {
      return res.status(400).json({ message: "Invalid settlementType" });
    }
    update.settlementType = t;
  }

  if (settledAt !== undefined) {
    if (settledAt === null || settledAt === "") {
      update.settledAt = null;
    } else {
      const d = parseDate(settledAt);
      if (!d) return res.status(400).json({ message: "settledAt must be a valid date" });
      update.settledAt = d;
    }
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  try {
    await dbConnect();

    const existing = await SecurityCheque.findById(String(id))
      .select("investorId propertyId investmentId status chequeNumber principalAmount")
      .lean();
    if (!existing) {
      return res.status(404).json({ message: "Security cheque not found" });
    }

    const updated = await populateSecurityCheque(
      SecurityCheque.findByIdAndUpdate(String(id), update, { new: true })
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Security cheque not found" });
    }

    const newStatus = update.status || existing.status;
    if (update.status !== undefined && update.status !== existing.status) {
      const propertyTitle =
        updated?.propertyId && typeof updated.propertyId === "object"
          ? updated.propertyId.title || "Property"
          : "Property";

      await notifySecurityCheque({
        investorId: String(updated.investorId?._id || updated.investorId || existing.investorId),
        propertyId: String(updated.propertyId?._id || updated.propertyId || existing.propertyId),
        propertyTitle,
        investmentId: String(updated.investmentId?._id || updated.investmentId || existing.investmentId),
        chequeNumber: updated.chequeNumber || existing.chequeNumber,
        status: newStatus,
        principalAmount: updated.principalAmount ?? existing.principalAmount,
      });
    }

    if (newStatus === "cleared" || newStatus === "cancelled") {
      const settlementType = update.settlementType || updated.settlementType;
      if (settlementType === "early-withdrawal" || settlementType === "other") {
        const inv = await Investment.findByIdAndUpdate(String(existing.investmentId), {
          status: "withdrawn",
        }).select("propertyId investorId").lean();

        if (inv?.propertyId) {
          await syncPropertyFunding(inv.propertyId);
        }

        const completed = await completeExitRequestForInvestment(String(existing.investmentId), {
          securityChequeId: String(id),
        });

        if (completed && newStatus === "cleared") {
          const property = await Property.findById(existing.propertyId || inv?.propertyId)
            .select("title")
            .lean();
          await notifyExitRequestCompleted({
            investorId: String(existing.investorId),
            propertyId: String(existing.propertyId || inv?.propertyId),
            propertyTitle: property?.title || "Property",
            investmentId: String(existing.investmentId),
          });
        }
      } else if (settlementType === "project-completion" && newStatus === "cleared") {
        await Investment.findByIdAndUpdate(String(existing.investmentId), {
          status: "completed",
        });
      }
    }

    return res.status(200).json({
      message: "Security cheque updated",
      cheque: serializeSecurityCheque(updated),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
