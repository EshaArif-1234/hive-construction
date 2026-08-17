import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Admin from "@/models/Admin";
import Investor from "@/models/Investor";
import { verifyPasswordResetToken } from "@/lib/passwordResetJwt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { resetToken, newPassword } = req.body ?? {};

  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: "resetToken and newPassword are required." });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const payload = verifyPasswordResetToken(String(resetToken));
    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    await dbConnect();

    if (payload.role === "admin") {
      const updated = await Admin.findByIdAndUpdate(
        String(payload.sub),
        { passwordHash },
        { new: true }
      ).select("_id");

      if (!updated) {
        return res.status(400).json({ message: "Account not found." });
      }
    } else {
      const updated = await Investor.findByIdAndUpdate(
        String(payload.sub),
        { passwordHash },
        { new: true }
      ).select("_id");

      if (!updated) {
        return res.status(400).json({ message: "Account not found." });
      }
    }

    return res.status(200).json({ message: "Password updated. You can sign in with your new password." });
  } catch (e) {
    return res.status(400).json({
      message: "Invalid or expired session. Start the reset process again from the login page.",
    });
  }
}
