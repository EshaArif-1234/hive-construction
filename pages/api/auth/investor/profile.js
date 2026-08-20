import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { requireInvestor } from "@/lib/investorSession";
import Investor from "@/models/Investor";

function serializeInvestorProfile(investor) {
  if (!investor) return null;
  return {
    id: String(investor._id),
    fullName: investor.fullName,
    email: investor.email,
    phone: investor.phone || "",
    cnic: investor.cnic || "",
    address: investor.address || "",
    status: investor.status,
    createdAt: investor.createdAt,
    updatedAt: investor.updatedAt,
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default async function handler(req, res) {
  const payload = requireInvestor(req, res);
  if (!payload) return;

  const investorId = String(payload.sub || "");
  if (!mongoose.Types.ObjectId.isValid(investorId)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      await dbConnect();
      const investor = await Investor.findById(investorId)
        .select("fullName email phone cnic address status createdAt updatedAt")
        .lean();

      if (!investor) {
        return res.status(404).json({ message: "Investor account not found." });
      }

      return res.status(200).json({ investor: serializeInvestorProfile(investor) });
    } catch (err) {
      console.error("[api/auth/investor/profile GET]", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "PATCH") {
    const { fullName, email, phone, cnic, address } = req.body ?? {};

    const trimmedName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").toLowerCase().trim();
    const trimmedPhone = String(phone || "").trim();
    const trimmedCnic = String(cnic || "").trim();
    const trimmedAddress = String(address || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "Full name is required." });
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "A valid email address is required." });
    }

    try {
      await dbConnect();

      const existing = await Investor.findOne({
        email: normalizedEmail,
        _id: { $ne: investorId },
      })
        .select("_id")
        .lean();

      if (existing) {
        return res.status(409).json({ message: "Another account already uses this email." });
      }

      const investor = await Investor.findByIdAndUpdate(
        investorId,
        {
          fullName: trimmedName,
          email: normalizedEmail,
          phone: trimmedPhone,
          cnic: trimmedCnic,
          address: trimmedAddress,
        },
        { new: true, runValidators: true }
      )
        .select("fullName email phone cnic address status createdAt updatedAt")
        .lean();

      if (!investor) {
        return res.status(404).json({ message: "Investor account not found." });
      }

      return res.status(200).json({
        message: "Profile updated successfully.",
        investor: serializeInvestorProfile(investor),
      });
    } catch (err) {
      console.error("[api/auth/investor/profile PATCH]", err);
      if (err?.code === 11000) {
        return res.status(409).json({ message: "Another account already uses this email." });
      }
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
