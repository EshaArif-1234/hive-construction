import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import ExitRequest from "@/models/ExitRequest";
import Investment from "@/models/Investment";
import SecurityCheque from "@/models/SecurityCheque";
import Property from "@/models/Property";
import { populateExitRequest, serializeExitRequest } from "@/lib/serializeExitRequest";
import {
  populateSecurityCheque,
  serializeSecurityCheque,
} from "@/lib/serializeSecurityCheque";
import { settlementTypeForExitRequest } from "@/lib/exitRequestConstants";
import {
  notifyExitRequestReviewed,
  notifyExitRequestCompleted,
  notifySecurityCheque,
} from "@/lib/investorNotifications";
import { completeExitRequestForInvestment } from "@/lib/completeExitRequest";
import { syncPropertyFunding } from "@/lib/propertyFunding";

function parseDate(value) {
  if (!value) return null;
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
      const row = await populateExitRequest(ExitRequest.findById(String(id))).lean();
      if (!row) return res.status(404).json({ message: "Exit request not found" });
      return res.status(200).json({ exitRequest: serializeExitRequest(row) });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { action, adminNote, cheque, markChequeCleared } = req.body ?? {};
  const normalizedAction = String(action || "").toLowerCase();

  if (!["approve", "reject", "complete"].includes(normalizedAction)) {
    return res.status(400).json({ message: "action must be approve, reject, or complete" });
  }

  try {
    await dbConnect();

    const existing = await ExitRequest.findById(String(id)).lean();
    if (!existing) {
      return res.status(404).json({ message: "Exit request not found" });
    }

    const reviewedBy = payload?.email || payload?.sub || "admin";
    const now = new Date();

    if (normalizedAction === "reject") {
      if (existing.status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be rejected" });
      }

      const updated = await populateExitRequest(
        ExitRequest.findByIdAndUpdate(
          String(id),
          {
            status: "rejected",
            adminNote: String(adminNote || "").trim(),
            reviewedBy,
            reviewedAt: now,
          },
          { new: true }
        )
      ).lean();

      const property = await Property.findById(existing.propertyId).select("title").lean();

      await notifyExitRequestReviewed({
        investorId: String(existing.investorId),
        propertyId: String(existing.propertyId),
        propertyTitle: property?.title || "Property",
        investmentId: String(existing.investmentId),
        approved: false,
        adminNote: String(adminNote || "").trim(),
      });

      return res.status(200).json({
        message: "Exit request rejected",
        exitRequest: serializeExitRequest(updated),
      });
    }

    if (normalizedAction === "approve") {
      if (existing.status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be approved" });
      }

      const investment = await Investment.findById(String(existing.investmentId))
        .select("amount investorId propertyId status")
        .lean();

      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }

      if (String(investment.status) === "withdrawn") {
        return res.status(400).json({ message: "Investment is already withdrawn" });
      }

      const chequeInput = cheque && typeof cheque === "object" ? cheque : {};
      const chequeNumber = String(chequeInput.chequeNumber || "").trim();
      const issueDate = parseDate(chequeInput.issueDate) || now;

      if (!chequeNumber) {
        return res.status(400).json({
          message: "cheque.chequeNumber and cheque.issueDate are required when approving",
        });
      }

      const principalNum =
        chequeInput.principalAmount !== undefined && chequeInput.principalAmount !== null
          ? Number(chequeInput.principalAmount)
          : Number(investment.amount || existing.requestedPayout?.principal || 0);

      if (!Number.isFinite(principalNum) || principalNum <= 0) {
        return res.status(400).json({ message: "cheque.principalAmount must be a positive number" });
      }

      const settlementType = settlementTypeForExitRequest(existing.requestType);
      const chequeStatus = String(chequeInput.status || "active").toLowerCase();

      const createdCheque = await SecurityCheque.create({
        investmentId: String(existing.investmentId),
        investorId: String(existing.investorId),
        propertyId: String(existing.propertyId),
        chequeNumber,
        bankName: String(chequeInput.bankName || "").trim(),
        accountHolder: String(chequeInput.accountHolder || "").trim(),
        principalAmount: principalNum,
        issueDate,
        maturityDate: chequeInput.maturityDate ? parseDate(chequeInput.maturityDate) : null,
        status: chequeStatus,
        settlementType,
        settlementNote: String(chequeInput.settlementNote || adminNote || "").trim(),
        notes: String(chequeInput.notes || "").trim(),
        recordedBy: reviewedBy,
      });

      const updated = await populateExitRequest(
        ExitRequest.findByIdAndUpdate(
          String(id),
          {
            status: "approved",
            adminNote: String(adminNote || "").trim(),
            reviewedBy,
            reviewedAt: now,
            securityChequeId: createdCheque._id,
          },
          { new: true }
        )
      ).lean();

      const property = await Property.findById(existing.propertyId).select("title").lean();

      await notifyExitRequestReviewed({
        investorId: String(existing.investorId),
        propertyId: String(existing.propertyId),
        propertyTitle: property?.title || "Property",
        investmentId: String(existing.investmentId),
        approved: true,
        adminNote: String(adminNote || "").trim(),
      });

      await notifySecurityCheque({
        investorId: String(existing.investorId),
        propertyId: String(existing.propertyId),
        propertyTitle: property?.title || "Property",
        investmentId: String(existing.investmentId),
        chequeNumber,
        status: chequeStatus,
        principalAmount: principalNum,
      });

      if (markChequeCleared || chequeStatus === "cleared") {
        await Investment.findByIdAndUpdate(String(existing.investmentId), { status: "withdrawn" });
        await syncPropertyFunding(existing.propertyId);
        await completeExitRequestForInvestment(String(existing.investmentId), {
          securityChequeId: createdCheque._id,
        });
      }

      const populatedCheque = await populateSecurityCheque(
        SecurityCheque.findById(createdCheque._id)
      ).lean();

      return res.status(200).json({
        message: "Exit request approved and security cheque created",
        exitRequest: serializeExitRequest(updated),
        cheque: serializeSecurityCheque(populatedCheque),
      });
    }

    if (normalizedAction === "complete") {
      if (existing.status !== "approved") {
        return res.status(400).json({ message: "Only approved requests can be completed" });
      }

      await Investment.findByIdAndUpdate(String(existing.investmentId), { status: "withdrawn" });
      await syncPropertyFunding(existing.propertyId);

      if (existing.securityChequeId) {
        await SecurityCheque.findByIdAndUpdate(String(existing.securityChequeId), {
          status: "cleared",
          settledAt: now,
          settlementType: settlementTypeForExitRequest(existing.requestType),
        });
      }

      const updated = await populateExitRequest(
        ExitRequest.findByIdAndUpdate(
          String(id),
          { status: "completed", completedAt: now },
          { new: true }
        )
      ).lean();

      const property = await Property.findById(existing.propertyId).select("title").lean();

      await notifyExitRequestCompleted({
        investorId: String(existing.investorId),
        propertyId: String(existing.propertyId),
        propertyTitle: property?.title || "Property",
        investmentId: String(existing.investmentId),
      });

      return res.status(200).json({
        message: "Exit completed",
        exitRequest: serializeExitRequest(updated),
      });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate cheque record" });
    }
    return res.status(500).json({ message: err?.message || "Server error" });
  }
}
