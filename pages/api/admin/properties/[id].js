import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Property from "@/models/Property";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import { serializePropertyImages } from "@/lib/propertyImages";

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid id" });
  }

  if (req.method === "DELETE") {
    try {
      await dbConnect();

      const existing = await Property.findById(id).select("images").lean();
      if (!existing) {
        return res.status(404).json({ message: "Property not found" });
      }

      const imgs = Array.isArray(existing.images) ? existing.images : [];
      for (const img of imgs) {
        if (img?.publicId) {
          await destroyCloudinaryAsset(String(img.publicId));
        }
      }

      const deleted = await Property.findByIdAndDelete(id).select("_id").lean();
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }

      return res.status(200).json({ message: "Property deleted" });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    title,
    location,
    totalCost,
    constructionCost,
    landCost,
    status,
    expectedSalePrice,
  } = req.body ?? {};

  const t = String(title ?? "").trim();
  const loc = String(location ?? "").trim();

  if (!t || !loc) {
    return res.status(400).json({ message: "title and location are required" });
  }

  const totalCostNum = Number(totalCost);
  const constructionCostNum = Number(constructionCost);
  const landCostNum = Number(landCost);
  const expectedSalePriceNum = Number(expectedSalePrice);

  if (
    !Number.isFinite(totalCostNum) ||
    !Number.isFinite(constructionCostNum) ||
    !Number.isFinite(landCostNum) ||
    !Number.isFinite(expectedSalePriceNum)
  ) {
    return res.status(400).json({
      message:
        "totalCost, constructionCost, landCost, and expectedSalePrice must be valid numbers",
    });
  }

  const normalizedStatus = String(status || "available").toLowerCase();
  const allowed = ["available", "sold", "in-progress"];
  const finalStatus = allowed.includes(normalizedStatus)
    ? normalizedStatus
    : "available";

  try {
    await dbConnect();

    const updated = await Property.findByIdAndUpdate(
      id,
      {
        title: t,
        location: loc,
        totalCost: totalCostNum,
        constructionCost: constructionCostNum,
        landCost: landCostNum,
        status: finalStatus,
        expectedSalePrice: expectedSalePriceNum,
      },
      { new: true }
    )
      .select(
        "title location totalCost constructionCost landCost status expectedSalePrice createdAt images"
      )
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Property not found" });
    }

    const img = serializePropertyImages(updated);

    return res.status(200).json({
      message: "Property updated",
      property: {
        id: String(updated._id),
        title: updated.title,
        location: updated.location,
        totalCost: updated.totalCost,
        constructionCost: updated.constructionCost,
        landCost: updated.landCost,
        status: updated.status,
        expectedSalePrice: updated.expectedSalePrice,
        createdAt: updated.createdAt,
        imagesCount: img.imagesCount,
        coverImage: img.coverImage,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
