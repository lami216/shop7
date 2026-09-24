import assert from "node:assert/strict";
import test from "node:test";

process.env.IMAGEKIT_PUBLIC_KEY = "public_test";
process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";

const imagekit = await import("../backend/lib/imagekit.js");

test("ImageKit adapter uses the maintained files API", () => {
  assert.equal(typeof imagekit.imagekitClient.files?.upload, "function");
  assert.equal(typeof imagekit.imagekitClient.files?.delete, "function");
});
