import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import { buildPropertyStatusReport } from "@/lib/adminReports";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { listingStatus } = req.query;

  try {
    await dbConnect();
    const report = await buildPropertyStatusReport({
      listingStatus: typeof listingStatus === "string" ? listingStatus : undefined,
    });
    return res.status(200).json(report);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
