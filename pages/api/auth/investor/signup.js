import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { fullName, email, phone, password } = req.body ?? {};

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email, and password are required" });
  }

  try {
    await dbConnect();

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await Investor.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const investor = await Investor.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : "",
      passwordHash,
      status: "pending",
    });

    return res.status(201).json({
      message: "Registration submitted. Your account will be verified before access is granted.",
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
