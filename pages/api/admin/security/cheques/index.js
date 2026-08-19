import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Investment from "@/models/Investment";
import SecurityCheque from "@/models/SecurityCheque";
import {
  populateSecurityCheque,
  serializeSecurityCheque,
} from "@/lib/serializeSecurityCheque";

import {
  CHEQUE_STATUSES,
  SETTLEMENT_TYPES,
} from "@/lib/securityChequeConstants";

function parseDate(value, fallback = null) {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method === "GET") {
    const { status, propertyId, investorId, investmentId } = req.query;
    const filter = {};

    if (status && CHEQUE_STATUSES.includes(String(status))) {
      filter.status = String(status);
    }
    if (propertyId && typeof propertyId === "string") {
      filter.propertyId = String(propertyId);
    }
    if (investorId && typeof investorId === "string") {
      filter.investorId = String(investorId);
    }
    if (investmentId && typeof investmentId === "string") {
      filter.investmentId = String(investmentId);
    }

    try {
      await dbConnect();

      const rows = await populateSecurityCheque(
        SecurityCheque.find(filter).sort({ issueDate: -1, createdAt: -1 })
      ).lean();

      const cheques = rows.map((row) => serializeSecurityCheque(row));
      const summary = cheques.reduce(
        (acc, row) => {
          acc.totalPrincipalSecured += Number(row.principalAmount) || 0;
          if (row.status === "active" || row.status === "pending") acc.activeCount += 1;
          if (row.status === "cleared") acc.clearedCount += 1;
          return acc;
        },
        { totalPrincipalSecured: 0, activeCount: 0, clearedCount: 0 }
      );

      return res.status(200).json({ cheques, summary });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "POST") {
    const {
      investmentId,
      chequeNumber,
      bankName,
      accountHolder,
      principalAmount,
      issueDate,
      maturityDate,
      status,
      notes,
    } = req.body ?? {};

    if (!investmentId || !chequeNumber || !issueDate) {
      return res.status(400).json({
        message: "investmentId, chequeNumber, and issueDate are required",
      });
    }

    const issueDateParsed = parseDate(issueDate);
    if (!issueDateParsed) {
      return res.status(400).json({ message: "issueDate must be a valid date" });
    }

    const maturityDateParsed = maturityDate ? parseDate(maturityDate) : null;
    if (maturityDate && !maturityDateParsed) {
      return res.status(400).json({ message: "maturityDate must be a valid date" });
    }

    const normalizedStatus = status ? String(status).toLowerCase() : "pending";
    if (!CHEQUE_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    try {
      await dbConnect();

      const investment = await Investment.findById(String(investmentId))
        .select("investorId propertyId amount status")
        .lean();

      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }

      const principalNum =
        principalAmount !== undefined && principalAmount !== null && principalAmount !== ""
          ? Number(principalAmount)
          : Number(investment.amount || 0);

      if (!Number.isFinite(principalNum) || principalNum <= 0) {
        return res.status(400).json({ message: "principalAmount must be a positive number" });
      }

      const created = await SecurityCheque.create({
        investmentId: String(investmentId),
        investorId: String(investment.investorId),
        propertyId: String(investment.propertyId),
        chequeNumber: String(chequeNumber).trim(),
        bankName: String(bankName || "").trim(),
        accountHolder: String(accountHolder || "").trim(),
        principalAmount: principalNum,
        issueDate: issueDateParsed,
        maturityDate: maturityDateParsed,
        status: normalizedStatus,
        notes: String(notes || "").trim(),
        recordedBy: payload?.email || payload?.sub || "admin",
      });

      const populated = await populateSecurityCheque(
        SecurityCheque.findById(created._id)
      ).lean();

      return res.status(201).json({
        message: "Security cheque recorded",
        cheque: serializeSecurityCheque(populated),
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ message: "Duplicate cheque record" });
      }
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}