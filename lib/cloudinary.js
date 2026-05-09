import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function configureCloudinary() {
  if (!isCloudinaryConfigured()) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * @param {Buffer} buffer
 * @param {{ folder?: string }} [opts]
 * @returns {Promise<{ url: string; publicId: string }>}
 */
export function uploadImageBuffer(buffer, opts = {}) {
  configureCloudinary();
  if (!isCloudinaryConfigured()) {
    return Promise.reject(new Error("Cloudinary is not configured"));
  }

  const folder = opts.folder || process.env.CLOUDINARY_FOLDER || "hive-properties";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result?.public_id) {
          reject(new Error("Cloudinary upload returned no URL"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * @param {string} publicId
 */
export async function destroyCloudinaryAsset(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return;
  configureCloudinary();
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // best-effort cleanup
  }
}
