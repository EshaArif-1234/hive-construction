import dbConnect from "@/lib/dbConnect";
import Property from "@/models/Property";
import { buildPublicPropertyQuery } from "@/lib/publicPropertyQuery";
import { PROPERTY_FIELDS, serializeProperty } from "@/lib/serializeProperty";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const filter = buildPublicPropertyQuery(req.query);

    const properties = await Property.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .select(PROPERTY_FIELDS)
      .lean();

    return res.status(200).json({
      properties: properties.map((p) => serializeProperty(p)),
    });
  } catch (err) {
    console.error("[api/properties]", err);
    return res.status(500).json({
      message:
        process.env.NODE_ENV === "development"
          ? `Database error: ${err?.message || "Server error"}`
          : "Server error",
    });
  }
}
