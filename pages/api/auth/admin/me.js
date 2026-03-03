import { requireAdmin } from "@/lib/adminSession";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const payload = requireAdmin(req, res);
  if (!payload) return;

  return res.status(200).json({
    admin: {
      email: "hiveconstruction@admin.com",
      role: "admin",
    },
  });
}
