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
