import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { ADMIN_COOKIE_NAME } from "@/lib/adminSession";
import Admin from "@/models/Admin";
import { ensureDefaultAdmin } from "@/lib/ensureDefaultAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const p = String(password);

  try {
    await ensureDefaultAdmin();

    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(p, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ role: "admin", sub: normalizedEmail }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.setHeader(
      "Set-Cookie",
      serialize(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
    );

    return res.status(200).json({ message: "Logged in" });
  } catch (err) {
    console.error("[api/auth/admin/login]", err);
    return res.status(500).json({ message: "Server error" });
  }
}
