import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("server exits before listening when required environment variables are missing", () => {
  const env = { ...process.env, NODE_ENV: "production", PORT: "0" };
  for (const name of [
    "MONGO_URI",
    "UPSTASH_REDIS_URL",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_PRIVATE_KEY",
    "IMAGEKIT_URL_ENDPOINT",
  ]) {
    delete env[name];
  }

  const result = spawnSync(process.execPath, ["backend/server.js"], {
    cwd: repositoryRoot,
    env,
    encoding: "utf8",
    timeout: 5000,
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Missing required environment variables/);
});

test("server does not listen when MongoDB connection fails", () => {
  const env = {
    ...process.env,
    NODE_ENV: "test",
    PORT: "10007",
    MONGO_URI: "mongodb://127.0.0.1:1/test7?serverSelectionTimeoutMS=100",
    UPSTASH_REDIS_URL: "rediss://default:test@127.0.0.1:1",
    ACCESS_TOKEN_SECRET: "a".repeat(32),
    REFRESH_TOKEN_SECRET: "b".repeat(32),
    IMAGEKIT_PUBLIC_KEY: "public_test",
    IMAGEKIT_PRIVATE_KEY: "private_test",
    IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/test",
  };

  const result = spawnSync(process.execPath, ["backend/server.js"], {
    cwd: repositoryRoot,
    env,
    encoding: "utf8",
    timeout: 5000,
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.doesNotMatch(output, /Server listening/);
});

test("server rejects malformed environment values before loading services", () => {
  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: "70000",
    MONGO_URI: "https://not-mongodb.example",
    UPSTASH_REDIS_URL: "http://not-redis.example",
    ACCESS_TOKEN_SECRET: "short",
    REFRESH_TOKEN_SECRET: "short",
    IMAGEKIT_PUBLIC_KEY: "not-public",
    IMAGEKIT_PRIVATE_KEY: "not-private",
    IMAGEKIT_URL_ENDPOINT: "ftp://invalid.example",
  };

  const result = spawnSync(process.execPath, ["backend/server.js"], {
    cwd: repositoryRoot,
    env,
    encoding: "utf8",
    timeout: 5000,
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /Invalid environment variables/);
  assert.doesNotMatch(output, /Server listening/);
});
