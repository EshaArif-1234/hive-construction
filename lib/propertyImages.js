/**
 * Normalize images for API responses (Cloudinary URLs + legacy MongoDB buffers).
 * @param {{ _id?: unknown; images?: unknown }} property
 */
export function serializePropertyImages(property) {
  const id = property?._id != null ? String(property._id) : "";
  const raw = Array.isArray(property?.images) ? property.images : [];

  const imageUrls = [];
  for (let i = 0; i < raw.length; i++) {
    const img = raw[i];
    if (!img || typeof img !== "object") continue;

    if (typeof img.url === "string" && img.url.length > 0) {
      imageUrls.push(img.url);
      continue;
    }

    if (img.data && id) {
      imageUrls.push(`/api/properties/${id}/image?index=${i}`);
    }
  }

  return {
    imagesCount: imageUrls.length,
    imageUrls,
    coverImage: imageUrls[0] || "",
  };
}
