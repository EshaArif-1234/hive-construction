import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";

function requireAdmin(req, res) {
  const auth = req.headers.authorization || "";
  if (auth !== "Bearer ok") {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

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
