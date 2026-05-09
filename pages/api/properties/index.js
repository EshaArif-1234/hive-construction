import dbConnect from "@/lib/dbConnect";
import Property from "@/models/Property";
import { serializePropertyImages } from "@/lib/propertyImages";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const properties = await Property.find({})
      .sort({ createdAt: -1 })
      .select(
        "title location totalCost constructionCost landCost status expectedSalePrice createdAt images"
      )
      .lean();

    return res.status(200).json({
      properties: properties.map((p) => {
        const img = serializePropertyImages(p);
        return {
          id: String(p._id),
          title: p.title,
          location: p.location,
          totalCost: p.totalCost,
          constructionCost: p.constructionCost,
          landCost: p.landCost,
          status: p.status,
          expectedSalePrice: p.expectedSalePrice,
          createdAt: p.createdAt,
          imagesCount: img.imagesCount,
          coverImage: img.coverImage,
        };
      }),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
