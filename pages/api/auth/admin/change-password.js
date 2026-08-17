import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Admin from "@/models/Admin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const payload = requireAdmin(req, res);
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

  const email = String(payload.sub || "").toLowerCase().trim();
  if (!email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await dbConnect();

    const admin = await Admin.findOne({ email }).select("passwordHash");
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found." });
    }

    const ok = await bcrypt.compare(String(currentPassword), admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    admin.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await admin.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("[api/auth/admin/change-password]", err);
    return res.status(500).json({ message: "Server error" });
  }
}
