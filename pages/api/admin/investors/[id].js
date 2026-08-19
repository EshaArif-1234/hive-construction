import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import { buildInvestorProfile } from "@/lib/adminReports";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid id" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const data = await buildInvestorProfile(id);
    if (!data) {
      return res.status(404).json({ message: "Investor not found" });
    }
    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
