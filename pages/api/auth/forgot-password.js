import crypto from "crypto";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";
import { upsertPasswordResetOtp } from "@/lib/ensurePasswordResetIndexes";
import { getPrimaryAdmin } from "@/lib/adminLookup";
import { isSmtpConfigured, sendMail } from "@/lib/mail";

const OTP_EXPIRY_MS = 15 * 60 * 1000;

function normalizeRole(value) {
  return String(value || "").toLowerCase() === "admin" ? "admin" : "investor";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

  const { email, role: roleInput } = req.body ?? {};
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const role = normalizeRole(roleInput);

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required." });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  const investorGeneric =
    "If an account exists for that email, we sent a 4-digit code. It expires in 15 minutes.";
  const adminMessage =
    "We sent a 4-digit code to your email. It expires in 15 minutes.";

  try {
    await dbConnect();

    if (role === "admin") {
      const admin = await getPrimaryAdmin();
      if (!admin) {
        return res.status(503).json({
          message: "No admin account found. Start the app once so the default admin is created.",
        });
      }
    } else {
      const investor = await Investor.findOne({ email: normalizedEmail }).select("_id").lean();
      if (!investor) {
        return res.status(200).json({ message: investorGeneric });
      }
    }

    const n = crypto.randomInt(0, 10000);
    const otp = String(n).padStart(4, "0");
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await upsertPasswordResetOtp({
      email: normalizedEmail,
      role,
      otpHash,
      expiresAt,
    });

    const accountLabel = role === "admin" ? "admin" : "investor";

    await sendMail({
      to: normalizedEmail,
      subject: `Your Hive Construction ${accountLabel} password reset code`,
      text: `Your password reset code is: ${otp}\n\nThis code expires in 15 minutes.\nIf you did not request this, you can ignore this email.`,
      html: `<p>Your ${accountLabel} password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p><p>This code expires in 15 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
    });

    return res.status(200).json({
      message: role === "admin" ? adminMessage : investorGeneric,
    });
  } catch (err) {
    console.error("[api/auth/forgot-password]", err);
    return res.status(500).json({
      message:
        process.env.NODE_ENV === "development"
          ? `Could not send email: ${err?.message || "Server error"}`
          : "Could not send email. Check SMTP settings and try again.",
    });
  }
}
