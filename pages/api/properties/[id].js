import dbConnect from "@/lib/dbConnect";
import Property from "@/models/Property";
import { PUBLIC_ACTIVE_FILTER } from "@/lib/publicPropertyQuery";
import { attachFundingStats, getPropertyFundingStats } from "@/lib/propertyFunding";
import { PROPERTY_FIELDS, serializeProperty } from "@/lib/serializeProperty";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }

  try {
    await dbConnect();

    const property = await Property.findOne({ _id: String(id), ...PUBLIC_ACTIVE_FILTER })
      .select(PROPERTY_FIELDS)
      .lean();

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const funding = await getPropertyFundingStats(property._id, {
      totalCost: property.totalCost,
      investorFundingRequired: property.investorFundingRequired,
    });

    return res.status(200).json({
      property: attachFundingStats(serializeProperty(property), funding),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
