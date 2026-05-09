import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Property from "@/models/Property";
import Investor from "@/models/Investor";
import Investment from "@/models/Investment";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const [
      propertiesTotal,
      propertiesAvailable,
      propertiesInProgress,
      propertiesSold,
      investorsTotal,
      investorsPending,
      investmentSumResult,
      investmentsActiveCount,
    ] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ status: "available" }),
      Property.countDocuments({ status: "in-progress" }),
      Property.countDocuments({ status: "sold" }),
      Investor.countDocuments(),
      Investor.countDocuments({ status: "pending" }),
      Investment.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Investment.countDocuments({ status: "active" }),
    ]);

    const totalInvestedActive = investmentSumResult[0]?.total ?? 0;

    return res.status(200).json({
      propertiesTotal,
      propertiesAvailable,
      propertiesInProgress,
      propertiesSold,
      investorsTotal,
      investorsPending,
      totalInvestedActive,
      investmentsActiveCount,
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
