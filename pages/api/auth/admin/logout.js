import { serialize } from "cookie";
import { ADMIN_COOKIE_NAME } from "@/lib/adminSession";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  res.setHeader(
    "Set-Cookie",
    serialize(ADMIN_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );

  return res.status(200).json({ message: "Logged out" });
}
