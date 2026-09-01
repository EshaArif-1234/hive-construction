import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import ExitRequest from "@/models/ExitRequest";
import { populateExitRequest, serializeExitRequest } from "@/lib/serializeExitRequest";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { status, propertyId, investorId, investmentId } = req.query;

  try {
    await dbConnect();

    const filter = {};
    if (status && typeof status === "string") filter.status = String(status);
    if (propertyId && typeof propertyId === "string") filter.propertyId = String(propertyId);
    if (investorId && typeof investorId === "string") filter.investorId = String(investorId);
    if (investmentId && typeof investmentId === "string") filter.investmentId = String(investmentId);

    const rows = await populateExitRequest(
      ExitRequest.find(filter).sort({ createdAt: -1 })
    ).lean();

    const exitRequests = rows.map(serializeExitRequest);
    const summary = {
      pendingCount: exitRequests.filter((r) => r.status === "pending").length,
      approvedCount: exitRequests.filter((r) => r.status === "approved").length,
      completedCount: exitRequests.filter((r) => r.status === "completed").length,
      rejectedCount: exitRequests.filter((r) => r.status === "rejected").length,
    };

    return res.status(200).json({ exitRequests, summary });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
