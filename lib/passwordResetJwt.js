import jwt from "jsonwebtoken";

const PURPOSE = "password_reset";

export function signPasswordResetToken(investorId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { sub: String(investorId), purpose: PURPOSE },
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
  return payload;
}
