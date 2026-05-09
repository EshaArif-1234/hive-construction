import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import PasswordReset from "@/models/PasswordReset";
import Investor from "@/models/Investor";
import { signPasswordResetToken } from "@/lib/passwordResetJwt";

function padFourDigits(input) {
  const digits = String(input ?? "").replace(/\D/g, "").slice(0, 4);
  return digits.padStart(4, "0");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, otp } = req.body ?? {};
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const otpCode = padFourDigits(otp);

  if (!normalizedEmail || otpCode.length !== 4) {
    return res.status(400).json({ message: "Email and a 4-digit code are required." });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  try {
    await dbConnect();

    const record = await PasswordReset.findOne({ email: normalizedEmail });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired code. Request a new code." });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await PasswordReset.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "This code has expired. Request a new one." });
    }

    const ok = await bcrypt.compare(otpCode, record.otpHash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid code. Try again." });
    }

    const investor = await Investor.findOne({ email: normalizedEmail }).select("_id").lean();
    if (!investor) {
      await PasswordReset.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "Account not found." });
    }

    await PasswordReset.deleteOne({ _id: record._id });

    const resetToken = signPasswordResetToken(investor._id);

    return res.status(200).json({
      message: "Verified",
      resetToken,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
