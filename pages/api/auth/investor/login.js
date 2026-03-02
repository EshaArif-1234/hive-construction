import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";

const COOKIE_NAME = "hive_investor_session";

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

  try {
    await dbConnect();

    const normalizedEmail = String(email).toLowerCase().trim();
    const investor = await Investor.findOne({ email: normalizedEmail });

    if (!investor) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), investor.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (investor.status !== "verified") {
      return res.status(403).json({
        message:
          "Your account is pending verification. You will receive access after approval.",
      });
    }

    const token = jwt.sign(
      { sub: String(investor._id), role: "investor" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.setHeader(
      "Set-Cookie",
      serialize(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      })
    );

    return res.status(200).json({
      message: "Logged in",
      investor: {
        id: investor._id,
        fullName: investor.fullName,
        email: investor.email,
        status: investor.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
