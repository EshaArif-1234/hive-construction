import jwt from "jsonwebtoken";

const PURPOSE = "password_reset";

export function signPasswordResetToken(userId, role = "investor") {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const normalizedRole = role === "admin" ? "admin" : "investor";

  return jwt.sign(
    { sub: String(userId), purpose: PURPOSE, role: normalizedRole },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

export function verifyPasswordResetToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload || payload.purpose !== PURPOSE || !payload.sub) {
    throw new Error("Invalid token");
  }

  const role = payload.role === "admin" ? "admin" : "investor";
  return { ...payload, role };
}
