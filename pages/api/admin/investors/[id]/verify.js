import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";
import { requireAdmin } from "@/lib/adminSession";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }

  try {
    await dbConnect();

    const investor = await Investor.findByIdAndUpdate(
      String(id),
      { status: "verified" },
      { new: true }
    ).select("fullName email status");

    if (!investor) {
      return res.status(404).json({ message: "Investor not found" });
    }

    return res.status(200).json({
      message: "Investor verified",
      investor: {
        id: investor._id,
        fullName: investor.fullName,
        email: investor.email,
        status: investor.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
