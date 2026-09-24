import assert from "node:assert/strict";
import test from "node:test";

const redisModule = await import("../backend/lib/redis.js");

test("Redis readiness helper is available for startup checks", () => {
  assert.equal(typeof redisModule.verifyRedisConnection, "function");
});

test("Redis readiness check requires a successful PONG", async () => {
  let pinged = false;
  const client = {
    async ping() {
      pinged = true;
      return "PONG";
    },
  };

  await redisModule.verifyRedisConnection(client);

  assert.equal(pinged, true);
});

test("Redis readiness check rejects an unexpected response", async () => {
  const client = { ping: async () => "NOPE" };

  await assert.rejects(
    redisModule.verifyRedisConnection(client),
    /Redis readiness check failed/,
  );
});
