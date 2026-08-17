import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Admin from "@/models/Admin";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  const loginEmail = String(payload.sub || "")
    .toLowerCase()
    .trim();

  if (!loginEmail) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      await dbConnect();
      const admin = await Admin.findOne({ email: loginEmail })
        .select("email recoveryEmail")
        .lean();

      if (!admin) {
        return res.status(404).json({ message: "Admin account not found." });
      }

      return res.status(200).json({
        admin: {
          email: admin.email,
          recoveryEmail: admin.recoveryEmail || "",
        },
      });
    } catch (err) {
      console.error("[api/auth/admin/me GET profile]", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "PATCH") {
    const { recoveryEmail } = req.body ?? {};
    const normalizedRecovery = String(recoveryEmail || "")
      .toLowerCase()
      .trim();

    if (!normalizedRecovery || !normalizedRecovery.includes("@")) {
      return res.status(400).json({ message: "A valid recovery email is required." });
    }

    try {
      await dbConnect();
      const admin = await Admin.findOneAndUpdate(
        { email: loginEmail },
        { recoveryEmail: normalizedRecovery },
        { new: true }
      )
        .select("email recoveryEmail")
        .lean();

      if (!admin) {
        return res.status(404).json({ message: "Admin account not found." });
      }

      return res.status(200).json({
        message: "Recovery email updated.",
        admin: {
          email: admin.email,
          recoveryEmail: admin.recoveryEmail || "",
        },
      });
    } catch (err) {
      console.error("[api/auth/admin/me PATCH recovery]", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
