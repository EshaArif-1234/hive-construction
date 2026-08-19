import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";
import Investment from "@/models/Investment";
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
      .select("fullName email phone status createdAt")
      .lean();

    const statsAgg = await Investment.aggregate([
      {
        $group: {
          _id: "$investorId",
          totalInvested: { $sum: "$amount" },
          totalProfit: { $sum: "$profitAmount" },
          investmentCount: { $sum: 1 },
        },
      },
    ]);

    const statsMap = Object.fromEntries(
      statsAgg.map((row) => [
        String(row._id),
        {
          totalInvested: Number(row.totalInvested || 0),
          totalProfit: Number(row.totalProfit || 0),
          investmentCount: row.investmentCount || 0,
        },
      ])
    );

    return res.status(200).json({
      investors: investors.map((i) => {
        const stats = statsMap[String(i._id)] || {
          totalInvested: 0,
          totalProfit: 0,
          investmentCount: 0,
        };
        return {
          id: String(i._id),
          fullName: i.fullName,
          email: i.email,
          phone: i.phone || "",
          status: i.status,
          createdAt: i.createdAt,
          totalInvested: stats.totalInvested,
          totalProfit: stats.totalProfit,
          investmentCount: stats.investmentCount,
        };
      }),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
