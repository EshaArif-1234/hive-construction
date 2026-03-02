import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import Investor from "@/models/Investor";

const COOKIE_NAME = "hive_investor_session";

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;

  cookieHeader.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    out[k] = decodeURIComponent(v.join("="));
  });

  return out;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const investorId = payload?.sub;

    await dbConnect();

    const investor = await Investor.findById(investorId).select(
      "fullName email status"
    );

    if (!investor) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.status(200).json({
      investor: {
        id: investor._id,
        fullName: investor.fullName,
        email: investor.email,
        status: investor.status,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Not authenticated" });
  }
}
