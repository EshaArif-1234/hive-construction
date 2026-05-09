import multer from "multer";
import dbConnect from "@/lib/dbConnect";
import { requireAdmin } from "@/lib/adminSession";
import Property from "@/models/Property";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";
import { serializePropertyImages } from "@/lib/propertyImages";

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

  if (req.method === "POST") {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message:
          "Image uploads require Cloudinary. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      });
    }

    try {
      await runMiddleware(req, res, upload.array("images", 5));

      const {
        title,
        location,
        totalCost,
        constructionCost,
        landCost,
        status,
        expectedSalePrice,
      } = req.body ?? {};

      if (!title || !location) {
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

      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length > 5) {
        return res.status(400).json({ message: "Maximum 5 images are allowed" });
      }

      const images = [];
      for (const f of files) {
        if (!f?.buffer?.length) continue;
        const { url, publicId } = await uploadImageBuffer(f.buffer);
        images.push({ url, publicId });
      }

      await dbConnect();

      const property = await Property.create({
        title: String(title).trim(),
        location: String(location).trim(),
        totalCost: totalCostNum,
        constructionCost: constructionCostNum,
        landCost: landCostNum,
        status: finalStatus,
        expectedSalePrice: expectedSalePriceNum,
        images,
      });

      const img = serializePropertyImages(property.toObject());

      return res.status(201).json({
        message: "Property created",
        property: {
          id: String(property._id),
          title: property.title,
          location: property.location,
          totalCost: property.totalCost,
          constructionCost: property.constructionCost,
          landCost: property.landCost,
          status: property.status,
          expectedSalePrice: property.expectedSalePrice,
          createdAt: property.createdAt,
          imagesCount: img.imagesCount,
          coverImage: img.coverImage,
        },
      });
    } catch {
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Method Not Allowed" });
}
