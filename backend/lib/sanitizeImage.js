import sharp from "sharp";

const allowedMimeByFormat = new Map([
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function invalidImageError() {
  const error = new Error("Invalid image upload");
  error.status = 400;
  error.code = "INVALID_IMAGE";
  return error;
}

export async function sanitizeBase64Image(dataUrl) {
  try {
    const match = typeof dataUrl === "string"
      ? dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/)
      : null;
    if (!match) throw invalidImageError();
    const input = Buffer.from(match[2], "base64");
    if (input.length > MAX_IMAGE_BYTES) throw invalidImageError();
    const image = sharp(input, {
      animated: false,
      failOn: "error",
      limitInputPixels: 12_000_000,
      sequentialRead: true,
    });
    const metadata = await image.metadata();
    if (allowedMimeByFormat.get(metadata.format) !== match[1]) throw invalidImageError();
    const output = await image.rotate().flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer();
    if (output.length > MAX_IMAGE_BYTES) throw invalidImageError();
    return output;
  } catch (error) {
    if (error?.code === "INVALID_IMAGE") throw error;
    throw invalidImageError();
  }
}
