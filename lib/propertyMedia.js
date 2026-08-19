import { destroyCloudinaryAsset, uploadImageBuffer } from "@/lib/cloudinary";

/**
 * Upload optional thumbnail/gallery replacements and queue old Cloudinary assets for cleanup.
 */
export async function applyPropertyImageUpdates(existing, files) {
  const update = {};
  const toDestroy = [];

  const thumbnailFile = files?.thumbnail?.[0];
  const galleryFiles = Array.isArray(files?.galleryImages) ? files.galleryImages : [];

  if (thumbnailFile?.buffer?.length) {
    const { url, publicId } = await uploadImageBuffer(thumbnailFile.buffer);
    if (existing?.thumbnail?.publicId) {
      toDestroy.push(String(existing.thumbnail.publicId));
    }
    update.thumbnail = { url, publicId };
  }

  if (galleryFiles.length > 0) {
    if (galleryFiles.length > 4) {
      throw new Error("Gallery allows up to 4 images");
    }

    const uploaded = [];
    for (const file of galleryFiles) {
      if (!file?.buffer?.length) continue;
      uploaded.push(await uploadImageBuffer(file.buffer));
    }

    for (const img of existing?.galleryImages || []) {
      if (img?.publicId) toDestroy.push(String(img.publicId));
    }

    update.galleryImages = uploaded.map(({ url, publicId }) => ({ url, publicId }));
  }

  for (const publicId of toDestroy) {
    await destroyCloudinaryAsset(publicId);
  }

  return update;
}

/**
 * Upload create-flow images (first file = thumbnail, rest = gallery).
 */
export async function uploadPropertyImages(files) {
  const list = Array.isArray(files) ? files : [];
  if (list.length > 5) {
    throw new Error("Maximum 5 images are allowed");
  }

  const uploaded = [];
  for (const f of list) {
    if (!f?.buffer?.length) continue;
    uploaded.push(await uploadImageBuffer(f.buffer));
  }

  return {
    thumbnail: uploaded[0] || {},
    galleryImages: uploaded.slice(1).map(({ url, publicId }) => ({ url, publicId })),
  };
}
