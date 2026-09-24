import assert from "node:assert/strict";
import test from "node:test";

import { isProductionEnvironment, loadEnvironment } from "../backend/config/environment.js";

const validEnvironment = {
  NODE_ENV: "test",
  PORT: "10007",
  MONGO_URI: "mongodb://localhost/test",
  UPSTASH_REDIS_URL: "rediss://default:password@redis.example",
  ACCESS_TOKEN_SECRET: "a".repeat(32),
  REFRESH_TOKEN_SECRET: "b".repeat(32),
  IMAGEKIT_PUBLIC_KEY: "public_test",
  IMAGEKIT_PRIVATE_KEY: "private_test",
  IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/test",
};

test("environment validation requires NODE_ENV", () => {
  const source = { ...validEnvironment };
  delete source.NODE_ENV;

  assert.throws(() => loadEnvironment(source), /NODE_ENV/);
});

test("environment validation rejects unknown NODE_ENV values", () => {
  assert.throws(
    () => loadEnvironment({ ...validEnvironment, NODE_ENV: "prod" }),
    /NODE_ENV/,
  );
});

test("production cookie policy rejects an unvalidated environment", () => {
  assert.equal(isProductionEnvironment("production"), true);
  assert.equal(isProductionEnvironment("test"), false);
  assert.throws(() => isProductionEnvironment("prod"), /NODE_ENV/);
});
