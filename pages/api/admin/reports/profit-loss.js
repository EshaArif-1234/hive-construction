import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import { buildProfitLossReport } from "@/lib/adminReports";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { propertyId } = req.query;

  try {
    await dbConnect();
    const report = await buildProfitLossReport({
      propertyId: typeof propertyId === "string" ? propertyId : undefined,
    });
    return res.status(200).json(report);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
