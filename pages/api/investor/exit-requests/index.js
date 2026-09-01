import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import ExitRequest from "@/models/ExitRequest";
import {
  loadInvestmentExitContext,
  validateExitRequestSubmission,
  payoutSnapshotForRequestType,
} from "@/lib/exitRequestContext";
import { populateExitRequest, serializeExitRequest } from "@/lib/serializeExitRequest";
import { EXIT_REQUEST_TYPES } from "@/lib/exitRequestConstants";
import { notifyExitRequestSubmitted } from "@/lib/investorNotifications";

export default async function handler(req, res) {
  const payload = requireInvestor(req, res);
  if (!payload) return;

  const investorId = String(payload.sub);

  if (req.method === "GET") {
    try {
      await dbConnect();
      const rows = await populateExitRequest(
        ExitRequest.find({ investorId }).sort({ createdAt: -1 })
      ).lean();

      return res.status(200).json({
        exitRequests: rows.map(serializeExitRequest),
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { investmentId, requestType, reason } = req.body ?? {};

  if (!investmentId || !requestType) {
    return res.status(400).json({ message: "investmentId and requestType are required" });
  }

  const normalizedType = String(requestType).toLowerCase();
  if (!EXIT_REQUEST_TYPES.includes(normalizedType)) {
    return res.status(400).json({ message: "Invalid requestType" });
  }

  try {
    await dbConnect();

    const ctx = await loadInvestmentExitContext(String(investmentId), investorId);
    if (!ctx) {
      return res.status(404).json({ message: "Investment not found" });
    }

    const validation = validateExitRequestSubmission({
      exitPlan: ctx.exitPlan,
      requestType: normalizedType,
      investment: ctx.investment,
      activeExitRequest: ctx.activeExitRequest,
    });

    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const requestedPayout = payoutSnapshotForRequestType(ctx.exitPlan, normalizedType);

    const created = await ExitRequest.create({
      investmentId: String(investmentId),
      investorId,
      propertyId: ctx.investment.propertyId,
      requestType: normalizedType,
      status: "pending",
      reason: String(reason || "").trim(),
      requestedPayout,
      exitPlanSnapshot: {
        scenarioKey: ctx.exitPlan.scenarioKey,
        scenarioTitle: ctx.exitPlan.scenarioTitle,
        investmentAgeDays: ctx.exitPlan.investmentAgeDays,
        withinFirstYear: ctx.exitPlan.withinFirstYear,
      },
    });

    const populated = await populateExitRequest(ExitRequest.findById(created._id)).lean();

    await notifyExitRequestSubmitted({
      investorId,
      propertyId: ctx.investment.propertyId,
      propertyTitle: ctx.property?.title || "Property",
      investmentId: String(investmentId),
      requestTypeLabel: normalizedType === "early-withdrawal" ? "early withdrawal (Rule III)" : "market-value exit (Rule II)",
    });

    return res.status(201).json({
      message: "Exit request submitted for admin review",
      exitRequest: serializeExitRequest(populated),
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "An exit request already exists for this investment" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}
