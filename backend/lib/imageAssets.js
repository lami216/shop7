import { cleanupImageOrQueue } from "./imageCleanupQueue.js";
import { deleteImage, uploadImage } from "./imagekit.js";
import { sanitizeBase64Image } from "./sanitizeImage.js";

export async function uploadSanitizedImage(dataUrl, folder) {
  const sanitized = await sanitizeBase64Image(dataUrl);
  return uploadImage(sanitized, folder);
}

export async function cleanupImageIds(fileIds = []) {
  const uniqueIds = [...new Set(fileIds.filter(Boolean))];
  await Promise.all(uniqueIds.map((fileId) => cleanupImageOrQueue(fileId, { deleteImageFn: deleteImage })));
}
