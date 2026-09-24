import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import sharp from "sharp";

import { sanitizeBase64Image } from "../backend/lib/sanitizeImage.js";

test("base64 image sanitizer decodes supported PNG and re-encodes JPEG", async () => {
  const png = await sharp({
    create: { width: 20, height: 10, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 0.5 } },
  }).png().toBuffer();
  const sanitized = await sanitizeBase64Image(`data:image/png;base64,${png.toString("base64")}`);
  const metadata = await sharp(sanitized).metadata();

  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 20);
  assert.equal(metadata.height, 10);
});

test("base64 image sanitizer rejects decoded uploads larger than two megabytes", async () => {
  const png = await sharp(randomBytes(1000 * 1000 * 3), {
    raw: { width: 1000, height: 1000, channels: 3 },
  }).png({ compressionLevel: 0 }).toBuffer();

  await assert.rejects(
    sanitizeBase64Image(`data:image/png;base64,${png.toString("base64")}`),
    (error) => error.status === 400 && error.code === "INVALID_IMAGE",
  );
});

test("base64 image sanitizer rejects decompression-bomb pixel dimensions", async () => {
  const png = await sharp({
    create: { width: 4000, height: 4000, channels: 3, background: "white" },
  }).png().toBuffer();

  await assert.rejects(
    sanitizeBase64Image(`data:image/png;base64,${png.toString("base64")}`),
    (error) => error.status === 400 && error.code === "INVALID_IMAGE",
  );
});
