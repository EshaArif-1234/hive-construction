import multer from "multer";
import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Property from "@/models/Property";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { parsePropertyInput } from "@/lib/parsePropertyInput";
import { uploadPropertyImages } from "@/lib/propertyMedia";
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

  if (req.method === "GET") {
    try {
      await dbConnect();

      const properties = await Property.find({})
        .sort({ createdAt: -1 })
        .select(PROPERTY_FIELDS)
        .lean();

      return res.status(200).json({
        properties: properties.map((p) => serializeProperty(p)),
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  if (req.method === "POST") {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message:
          "Image uploads require Cloudinary. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    try {
      await runMiddleware(req, res, upload.array("images", 5));

      const parsed = parsePropertyInput(req.body ?? {});
      if (parsed.error) {
        return res.status(400).json({ message: parsed.error });
      }

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length > 5) {
        return res.status(400).json({ message: "Maximum 5 images are allowed" });
      }

      let thumbnail;
      let galleryImages;
      try {
        ({ thumbnail, galleryImages } = await uploadPropertyImages(files));
      } catch (err) {
        return res.status(400).json({ message: err?.message || "Invalid image upload" });
      }

      await dbConnect();

      const property = await Property.create({
        ...parsed.data,
        createdBy:
          parsed.data.createdBy ||
          String(payload.email || payload.id || "").trim(),
        thumbnail,
        galleryImages,
      });

      return res.status(201).json({
        message: "Property created",
        property: serializeProperty(property.toObject()),
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
