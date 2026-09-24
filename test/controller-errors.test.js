import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET = "a".repeat(32);
process.env.REFRESH_TOKEN_SECRET = "b".repeat(32);

const { signup } = await import("../backend/controllers/auth.controller.js");
const { getSiteStatistics } = await import("../backend/controllers/stats.controller.js");
const { getProjects } = await import("../backend/controllers/project.controller.js");
const { getAchievements } = await import("../backend/controllers/achievement.controller.js");
const { getPaymentMethods } = await import("../backend/controllers/paymentMethod.controller.js");
const { default: User } = await import("../backend/models/user.model.js");
const { default: Donation } = await import("../backend/models/donation.model.js");
const { default: Project } = await import("../backend/models/project.model.js");
const { default: Achievement } = await import("../backend/models/achievement.model.js");
const { default: PaymentMethod } = await import("../backend/models/paymentMethod.model.js");

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function assertSanitized(res) {
  assert.equal(res.statusCode, 500);
  assert.equal("error" in res.body, false);
  assert.doesNotMatch(JSON.stringify(res.body), /sensitive database details/);
}

test("auth failures do not disclose internal error details", async (t) => {
  const original = User.findOne;
  t.after(() => { User.findOne = original; });
  User.findOne = async () => { throw new Error("sensitive database details"); };
  const res = responseRecorder();
  await signup({ body: { name: "User", email: "u@example.com", password: "password" } }, res);
  assertSanitized(res);
});

test("statistics failures do not disclose internal error details", async (t) => {
  const original = Donation.aggregate;
  t.after(() => { Donation.aggregate = original; });
  Donation.aggregate = () => { throw new Error("sensitive database details"); };
  const res = responseRecorder();
  await getSiteStatistics({}, res);
  assertSanitized(res);
});

test("project failures do not disclose internal error details", async (t) => {
  const original = Project.find;
  t.after(() => { Project.find = original; });
  Project.find = () => { throw new Error("sensitive database details"); };
  const res = responseRecorder();
  await getProjects({}, res);
  assertSanitized(res);
});

test("achievement failures do not disclose internal error details", async (t) => {
  const original = Achievement.find;
  t.after(() => { Achievement.find = original; });
  Achievement.find = () => { throw new Error("sensitive database details"); };
  const res = responseRecorder();
  await getAchievements({ query: {} }, res);
  assertSanitized(res);
});

test("payment method failures do not disclose internal error details", async (t) => {
  const original = PaymentMethod.find;
  t.after(() => { PaymentMethod.find = original; });
  PaymentMethod.find = () => { throw new Error("sensitive database details"); };
  const res = responseRecorder();
  await getPaymentMethods({ query: {} }, res);
  assertSanitized(res);
});
