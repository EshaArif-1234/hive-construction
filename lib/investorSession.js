import jwt from "jsonwebtoken";

const COOKIE_NAME = "hive_investor_session";

export function getInvestorTokenFromRequest(req) {
  const raw = req.headers?.cookie || "";
  const parts = raw.split(";").map((p) => p.trim());
  const match = parts.find((p) => p.startsWith(`${COOKIE_NAME}=`));
  if (!match) return "";
  const value = match.slice(COOKIE_NAME.length + 1);
  return decodeURIComponent(value);
}

export function requireInvestor(req, res) {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: "JWT_SECRET is not configured" });
    return null;
  }

  const token = getInvestorTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.role !== "investor" || !payload.sub) {
      res.status(401).json({ message: "Unauthorized" });
      return null;
    }
    return payload;
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
}

export const INVESTOR_COOKIE_NAME = COOKIE_NAME;
