import assert from "node:assert/strict";
import test from "node:test";
import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET = "a".repeat(32);
process.env.REFRESH_TOKEN_SECRET = "b".repeat(32);

const { default: authRouter } = await import("../backend/routes/auth.route.js");
const { default: User } = await import("../backend/models/user.model.js");

function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  return app;
}

test("login endpoint rate-limits repeated failed attempts", async (t) => {
  const originalFindOne = User.findOne;
  t.after(() => {
    User.findOne = originalFindOne;
  });
  User.findOne = async () => null;

  const app = createApp();
  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "wrong-password" });
    statuses.push(response.status);
  }

  assert.deepEqual(statuses.slice(0, 5), [400, 400, 400, 400, 400]);
  assert.equal(statuses[5], 429);
});

test("signup endpoint rate-limits repeated account creation", async (t) => {
  const originals = { findOne: User.findOne, create: User.create };
  t.after(() => {
    User.findOne = originals.findOne;
    User.create = originals.create;
  });
  User.findOne = async () => null;
  User.create = async ({ name, email }) => ({
    _id: "507f1f77bcf86cd799439011",
    name,
    email,
    role: "customer",
  });

  const app = createApp();
  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ name: "User", email: `user${attempt}@example.com`, password: "safe-password" });
    statuses.push(response.status);
  }

  assert.deepEqual(statuses.slice(0, 5), [201, 201, 201, 201, 201]);
  assert.equal(statuses[5], 429);
});
