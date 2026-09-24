import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

process.env.IMAGEKIT_PUBLIC_KEY = "public_test";
process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";

const { createApp } = await import("../backend/app.js");

test("health endpoint reports that the process is alive", async () => {
  const response = await request(createApp({ isReady: () => false })).get("/healthz");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });
});

test("readiness endpoint stays unavailable until dependencies are ready", async () => {
  const response = await request(createApp({ isReady: () => false })).get("/readyz");

  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { status: "not_ready" });
});

test("readiness endpoint degrades after a dependency becomes unavailable", async () => {
  let ready = true;
  const app = createApp({ readinessCheck: async () => ready });

  const healthy = await request(app).get("/readyz");
  ready = false;
  const degraded = await request(app).get("/readyz");

  assert.equal(healthy.status, 200);
  assert.deepEqual(healthy.body, { status: "ready" });
  assert.equal(degraded.status, 503);
  assert.deepEqual(degraded.body, { status: "not_ready" });
});

test("readiness endpoint reports ready after dependencies connect", async () => {
  const response = await request(createApp({ isReady: () => true })).get("/readyz");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ready" });
});
