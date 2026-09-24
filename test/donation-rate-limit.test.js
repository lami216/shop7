import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";

process.env.IMAGEKIT_PUBLIC_KEY = "public_test";
process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";

const { default: donationRouter } = await import("../backend/routes/donation.route.js");
const { errorHandler } = await import("../backend/middleware/error.middleware.js");
const { default: Donation } = await import("../backend/models/donation.model.js");
const { default: PaymentMethod } = await import("../backend/models/paymentMethod.model.js");
const { default: Project } = await import("../backend/models/project.model.js");

function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use("/api/donations", donationRouter);
  app.use(errorHandler);
  return app;
}

test("receipt donation endpoint rate-limits repeated submissions", async (t) => {
  const originals = {
    project: Project.findById,
    payment: PaymentMethod.findById,
    donation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.project;
    PaymentMethod.findById = originals.payment;
    Donation.create = originals.donation;
  });

  Project.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    isActive: true,
    isClosed: false,
    status: "active",
  });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  Donation.create = async (input) => ({ _id: "donation-1", ...input });

  const app = createApp();
  const statuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request(app)
      .post("/api/donations/with-receipt")
      .send({ projectId: "507f1f77bcf86cd799439011", paymentMethodId: "507f1f77bcf86cd799439012", amount: 100 });
    statuses.push(response.status);
  }

  assert.deepEqual(statuses.slice(0, 5), [201, 201, 201, 201, 201]);
  assert.equal(statuses[5], 429);
});
