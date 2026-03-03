import jwt from "jsonwebtoken";

const COOKIE_NAME = "hive_admin_session";

export function getAdminTokenFromRequest(req) {
  const raw = req.headers?.cookie || "";
  const parts = raw.split(";").map((p) => p.trim());
  const match = parts.find((p) => p.startsWith(`${COOKIE_NAME}=`));
  if (!match) return "";
  const value = match.slice(COOKIE_NAME.length + 1);
  return decodeURIComponent(value);
}

export function requireAdmin(req, res) {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: "JWT_SECRET is not configured" });
    return null;
  }

  const token = getAdminTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return null;
    }
    return payload;
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
