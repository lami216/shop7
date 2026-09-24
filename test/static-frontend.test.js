import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";

process.env.IMAGEKIT_PUBLIC_KEY = "public_test";
process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";

const { createApp } = await import("../backend/app.js");

test("production app serves the configured frontend build directory", async (t) => {
  const previousNodeEnv = process.env.NODE_ENV;
  const frontendDistPath = await mkdtemp(path.join(os.tmpdir(), "shop7-frontend-"));
  await writeFile(path.join(frontendDistPath, "index.html"), "<!doctype html><title>AJV</title>");
  process.env.NODE_ENV = "production";
  t.after(async () => {
    process.env.NODE_ENV = previousNodeEnv;
    await rm(frontendDistPath, { recursive: true, force: true });
  });

  const response = await request(createApp({ isReady: () => true, frontendDistPath })).get("/");

  assert.equal(response.status, 200);
  assert.match(response.text, /<title>AJV<\/title>|<title>[^<]+<\/title>/);
});
