import assert from "node:assert/strict";
import test from "node:test";

import { createDependencyReadinessCheck, startApplication } from "../backend/runtime/startApplication.js";

test("dependency readiness reflects live Mongo and Redis state", async () => {
  let mongoConnected = true;
  let redisResponse = "PONG";
  const readinessCheck = createDependencyReadinessCheck({
    isDatabaseConnected: () => mongoConnected,
    pingCache: async () => redisResponse,
  });

  assert.equal(await readinessCheck(), true);
  mongoConnected = false;
  assert.equal(await readinessCheck(), false);
  mongoConnected = true;
  redisResponse = "LOADING";
  assert.equal(await readinessCheck(), false);
});

test("startup verifies database and Redis before marking ready and listening", async () => {
  const events = [];
  const fakeServer = { once() {} };
  const app = {
    listen(_port, _host, callback) {
      events.push("listen");
      queueMicrotask(callback);
      return fakeServer;
    },
  };

  await startApplication({
    app,
    connectDatabase: async () => events.push("database"),
    verifyCache: async () => events.push("redis"),
    reconcileCleanup: async () => events.push("cleanup"),
    onReady: () => events.push("ready"),
    host: "127.0.0.1",
    port: 10007,
  });

  assert.deepEqual(events, ["database", "redis", "cleanup", "ready", "listen"]);
});
