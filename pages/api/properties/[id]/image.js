import dbConnect from "@/lib/dbConnect";
import Property from "@/models/Property";
import { PUBLIC_ACTIVE_FILTER } from "@/lib/publicPropertyQuery";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id, index } = req.query;
  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }

  const idx = Number(index || 0);
  if (!Number.isFinite(idx) || idx < 0) {
    return res.status(400).json({ message: "index must be a non-negative number" });
  }

  try {
    await dbConnect();

    const p = await Property.findOne({ _id: String(id), ...PUBLIC_ACTIVE_FILTER }).select(
      "thumbnail galleryImages"
    );
    if (!p) {
      return res.status(404).json({ message: "Property not found" });
    }

    const images = [p.thumbnail, ...(Array.isArray(p.galleryImages) ? p.galleryImages : [])].filter(
      Boolean
    );
    const img = images[idx];
    if (!img || !img.data) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.setHeader("Content-Type", img.contentType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return res.status(200).send(img.data);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
