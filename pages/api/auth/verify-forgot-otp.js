import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import PasswordReset from "@/models/PasswordReset";
import Investor from "@/models/Investor";
import { signPasswordResetToken } from "@/lib/passwordResetJwt";
import { getPrimaryAdmin } from "@/lib/adminLookup";

function padFourDigits(input) {
  const digits = String(input ?? "").replace(/\D/g, "").slice(0, 4);
  return digits.padStart(4, "0");
}

function normalizeRole(value) {
  return String(value || "").toLowerCase() === "admin" ? "admin" : "investor";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, otp, role: roleInput } = req.body ?? {};
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const otpCode = padFourDigits(otp);
  const role = normalizeRole(roleInput);

  if (!normalizedEmail || otpCode.length !== 4) {
    return res.status(400).json({ message: "Email and a 4-digit code are required." });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  try {
    await dbConnect();

    const record = await PasswordReset.findOne({ email: normalizedEmail, role });
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

    let accountId = null;

    if (role === "admin") {
      const admin = await getPrimaryAdmin();
      if (!admin) {
        await PasswordReset.deleteOne({ _id: record._id });
        return res.status(400).json({ message: "Admin account not found." });
      }
      accountId = admin._id;
    } else {
      const investor = await Investor.findOne({ email: normalizedEmail }).select("_id").lean();
      if (!investor) {
        await PasswordReset.deleteOne({ _id: record._id });
        return res.status(400).json({ message: "Account not found." });
      }
      accountId = investor._id;
    }

    await PasswordReset.deleteOne({ _id: record._id });

    const resetToken = signPasswordResetToken(accountId, role);

    return res.status(200).json({
      message: "Verified",
      resetToken,
    });
  } catch (err) {
    console.error("[api/auth/verify-forgot-otp]", err);
    return res.status(500).json({ message: "Server error" });
  }
}
