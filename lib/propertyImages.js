/**
 * Normalize images for API responses (Cloudinary URLs + legacy MongoDB buffers).
 * @param {{ _id?: unknown; thumbnail?: unknown; galleryImages?: unknown }} property
 */
export function serializePropertyImages(property) {
  const thumbnail = property?.thumbnail && typeof property.thumbnail === "object" ? property.thumbnail : null;
  const gallery = Array.isArray(property?.galleryImages) ? property.galleryImages : [];
  const raw = [thumbnail, ...gallery].filter(Boolean);

  const imageUrls = [];
  for (let i = 0; i < raw.length; i++) {
    const img = raw[i];
    if (!img || typeof img !== "object") continue;

    if (typeof img.url === "string" && img.url.length > 0) {
      imageUrls.push(img.url);
      continue;
    }

    if (img.data) continue;
  }

  return {
    imagesCount: imageUrls.length,
    imageUrls,
    coverImage: imageUrls[0] || "",
  };
}
