import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";
import { requireAdmin } from "@/lib/adminSession";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const investors = await Investor.find({})
      .sort({ createdAt: -1 })
      .select("fullName email status createdAt")
      .lean();

    return res.status(200).json({
      investors: investors.map((i) => ({
        id: String(i._id),
        fullName: i.fullName,
        email: i.email,
        status: i.status,
        createdAt: i.createdAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
