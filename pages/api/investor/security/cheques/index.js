import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import SecurityCheque from "@/models/SecurityCheque";
import {
  populateSecurityCheque,
  serializeSecurityCheque,
} from "@/lib/serializeSecurityCheque";

export default async function handler(req, res) {
  const payload = requireInvestor(req, res);
  if (!payload) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const rows = await populateSecurityCheque(
      SecurityCheque.find({ investorId: String(payload.sub) }).sort({
        issueDate: -1,
        createdAt: -1,
      })
    ).lean();

    const cheques = rows.map((row) => serializeSecurityCheque(row));

    const summary = {
      totalSecured: cheques.reduce((sum, c) => sum + (Number(c.principalAmount) || 0), 0),
      activeCount: cheques.filter((c) => c.status === "active" || c.status === "pending").length,
    };

    return res.status(200).json({ cheques, summary });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
