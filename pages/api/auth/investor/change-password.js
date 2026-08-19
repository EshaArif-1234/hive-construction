import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import Investor from "@/models/Investor";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const payload = requireInvestor(req, res);
  if (!payload) return;

  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required." });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  if (String(currentPassword) === String(newPassword)) {
    return res.status(400).json({ message: "New password must be different from the current password." });
  }

  const investorId = String(payload.sub || "");
  if (!mongoose.Types.ObjectId.isValid(investorId)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await dbConnect();

    const investor = await Investor.findById(investorId).select("passwordHash");
    if (!investor) {
      return res.status(404).json({ message: "Investor account not found." });
    }

    const ok = await bcrypt.compare(String(currentPassword), investor.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    investor.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await investor.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("[api/auth/investor/change-password]", err);
    return res.status(500).json({ message: "Server error" });
  }
}
