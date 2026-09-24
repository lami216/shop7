import assert from "node:assert/strict";
import test from "node:test";
import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";

const { default: paymentMethodRouter } = await import("../backend/routes/paymentMethod.route.js");
const { default: PaymentMethod } = await import("../backend/models/paymentMethod.model.js");

function createApp() {
  const app = express();
  app.use(cookieParser());
  app.use("/api/payment-methods", paymentMethodRouter);
  return app;
}

test("inactive payment methods require authenticated admin access", async (t) => {
  const originalFind = PaymentMethod.find;
  t.after(() => {
    PaymentMethod.find = originalFind;
  });

  let databaseReadAttempted = false;
  PaymentMethod.find = () => {
    databaseReadAttempted = true;
    return { sort: () => ({ lean: async () => [] }) };
  };

  const response = await request(createApp()).get("/api/payment-methods?includeInactive=true");

  assert.equal(response.status, 401);
  assert.equal(databaseReadAttempted, false);
});
