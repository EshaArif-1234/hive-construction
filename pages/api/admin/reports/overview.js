import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import { buildReportsOverview } from "@/lib/adminReports";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const overview = await buildReportsOverview();
    return res.status(200).json({ overview });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
