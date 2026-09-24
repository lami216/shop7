import assert from "node:assert/strict";
import test from "node:test";

import Donation from "../backend/models/donation.model.js";

test("new donations default to pending until an admin confirms them", () => {
  const donation = new Donation({
    project: "507f1f77bcf86cd799439011",
    projectId: "507f1f77bcf86cd799439011",
    paymentApp: "Bank",
    amount: 100,
  });

  assert.equal(donation.status, "pending");
});

test("donation model rejects oversized donor identity fields", () => {
  const donation = new Donation({
    project: "507f1f77bcf86cd799439011",
    projectId: "507f1f77bcf86cd799439011",
    paymentApp: "Bank",
    amount: 100,
    donorName: "n".repeat(121),
    donorPhone: "1".repeat(41),
  });

  const errors = donation.validateSync()?.errors || {};
  assert.ok(errors.donorName);
  assert.ok(errors.donorPhone);
});

test("donation model rejects amounts above the MRU maximum or with excess precision", () => {
  for (const amount of [1_000_000_000.01, 10.001, 0.0000000001, 10.0000000001]) {
    const donation = new Donation({
      project: "507f1f77bcf86cd799439011",
      projectId: "507f1f77bcf86cd799439011",
      paymentApp: "Bank",
      amount,
    });

    assert.ok(donation.validateSync()?.errors.amount);
  }
});
