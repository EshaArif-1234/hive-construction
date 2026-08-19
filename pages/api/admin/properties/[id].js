import multer from "multer";
import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Property from "@/models/Property";
import { destroyCloudinaryAsset, isCloudinaryConfigured } from "@/lib/cloudinary";
import { collectPropertyImages, parsePropertyInput } from "@/lib/parsePropertyInput";
import { applyPropertyImageUpdates } from "@/lib/propertyMedia";
import { PROPERTY_FIELDS, serializeProperty } from "@/lib/serializeProperty";

const upload = multer({ storage: multer.memoryStorage() });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid id" });
  }

  if (req.method === "GET") {
    try {
      await dbConnect();

      const property = await Property.findById(id).select(PROPERTY_FIELDS).lean();
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      return res.status(200).json({ property: serializeProperty(property) });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await dbConnect();

      const existing = await Property.findById(id)
        .select("thumbnail galleryImages")
        .lean();
      if (!existing) {
        return res.status(404).json({ message: "Property not found" });
      }

      for (const img of collectPropertyImages(existing)) {
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
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await runMiddleware(
      req,
      res,
      upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "galleryImages", maxCount: 4 },
      ])
    );

    const parsed = parsePropertyInput(req.body ?? {});
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const thumbnailFile = req.files?.thumbnail?.[0];
    const galleryFiles = req.files?.galleryImages;
    const hasImageUpload =
      Boolean(thumbnailFile?.buffer?.length) ||
      (Array.isArray(galleryFiles) && galleryFiles.some((f) => f?.buffer?.length));

    if (hasImageUpload && !isCloudinaryConfigured()) {
      return res.status(503).json({
        message:
          "Image uploads require Cloudinary. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    await dbConnect();

    const existing = await Property.findById(id).select("thumbnail galleryImages").lean();
    if (!existing) {
      return res.status(404).json({ message: "Property not found" });
    }

    let imageUpdate = {};
    if (hasImageUpload) {
      try {
        imageUpdate = await applyPropertyImageUpdates(existing, req.files);
      } catch (err) {
        return res.status(400).json({ message: err?.message || "Invalid image upload" });
      }
    }

    const updated = await Property.findByIdAndUpdate(
      id,
      { ...parsed.data, ...imageUpdate },
      { new: true }
    )
      .select(PROPERTY_FIELDS)
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.status(200).json({
      message: "Property updated",
      property: serializeProperty(updated),
    });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
