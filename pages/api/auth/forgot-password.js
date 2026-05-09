import crypto from "crypto";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";
import PasswordReset from "@/models/PasswordReset";
import { isSmtpConfigured, sendMail } from "@/lib/mail";

const OTP_EXPIRY_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!isSmtpConfigured()) {
    return res.status(503).json({
      message:
        "Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and optionally SMTP_PORT, SMTP_FROM.",
    });
  }

  const { email } = req.body ?? {};
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    await dbConnect();

    const investor = await Investor.findOne({ email: normalizedEmail }).select("_id").lean();

    const generic =
      "If an account exists for that email, we sent a 4-digit code. It expires in 15 minutes.";

    if (!investor) {
      return res.status(200).json({ message: generic });
    }

    const n = crypto.randomInt(0, 10000);
    const otp = String(n).padStart(4, "0");
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await PasswordReset.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otpHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendMail({
      to: normalizedEmail,
      subject: "Your Hive Construction password reset code",
      text: `Your password reset code is: ${otp}\n\nThis code expires in 15 minutes.\nIf you did not request this, you can ignore this email.`,
      html: `<p>Your password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p><p>This code expires in 15 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
    });

    return res.status(200).json({ message: generic });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
