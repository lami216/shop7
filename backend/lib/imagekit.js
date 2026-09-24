import { randomUUID } from "node:crypto";
import ImageKit, { toFile } from "@imagekit/nodejs";

const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
  console.warn("[ImageKit] Missing env (IMAGEKIT_PUBLIC_KEY/PRIVATE_KEY/URL_ENDPOINT). Uploads will fail.");
}

export const imagekitClient = new ImageKit({
  privateKey: IMAGEKIT_PRIVATE_KEY || "private_missing",
  maxRetries: 1,
  timeout: 20_000,
});

function normalizeUploadBytes(fileBase64OrBuffer) {
  if (Buffer.isBuffer(fileBase64OrBuffer)) return fileBase64OrBuffer;
  if (typeof fileBase64OrBuffer === "string") {
    const match = fileBase64OrBuffer.match(/^data:[^;,]+;base64,([A-Za-z0-9+/=]+)$/);
    if (match) return Buffer.from(match[1], "base64");
  }
  throw new TypeError("Image upload input must be a Buffer or base64 data URL");
}

export async function uploadImage(fileBase64OrBuffer, folder = "products") {
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    throw new Error("ImageKit env missing (IMAGEKIT_PUBLIC_KEY/PRIVATE_KEY/URL_ENDPOINT).");
  }

  const fileName = `${randomUUID()}.jpg`;
  const file = await toFile(normalizeUploadBytes(fileBase64OrBuffer), fileName);
  const response = await imagekitClient.files.upload({ file, fileName, folder });
  return { url: response.url, fileId: response.fileId };
}

export async function deleteImage(fileId) {
  if (!fileId) return;
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    console.warn("[ImageKit] Missing env, skip delete.");
    return;
  }
  await imagekitClient.files.delete(fileId);
}
