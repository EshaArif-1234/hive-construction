import dbConnect from "@/lib/dbConnect";
import Property from "@/models/Property";

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

    const p = await Property.findById(String(id))
      .select(
        "title location totalCost constructionCost landCost status expectedSalePrice createdAt images"
      )
      .lean();

    if (!p) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.status(200).json({
      property: {
        id: String(p._id),
        title: p.title,
        location: p.location,
        totalCost: p.totalCost,
        constructionCost: p.constructionCost,
        landCost: p.landCost,
        status: p.status,
        expectedSalePrice: p.expectedSalePrice,
        createdAt: p.createdAt,
        imagesCount: Array.isArray(p.images) ? p.images.length : 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
