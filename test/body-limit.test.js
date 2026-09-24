import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

process.env.IMAGEKIT_PUBLIC_KEY = "public_test";
process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";

const { createApp } = await import("../backend/app.js");

test("public API rejects oversized JSON before route work", async () => {
  const response = await request(createApp())
    .post("/api/donations")
    .send({
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: 100,
      donorName: "x".repeat(300 * 1024),
    });

  assert.equal(response.status, 413);
  assert.equal(response.body.code, "PAYLOAD_TOO_LARGE");
});

test("large admin upload routes authenticate before parsing their larger bodies", async () => {
  const response = await request(createApp())
    .post("/api/projects")
    .send({ images: ["x".repeat(300 * 1024)] });

  assert.equal(response.status, 401);
});
