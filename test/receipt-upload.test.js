import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";
import sharp from "sharp";

process.env.IMAGEKIT_PUBLIC_KEY = "public_test";
process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";

const { default: donationRouter } = await import("../backend/routes/donation.route.js");
const { default: Project } = await import("../backend/models/project.model.js");
const { errorHandler } = await import("../backend/middleware/error.middleware.js");

function createApp() {
  const app = express();
  app.set("trust proxy", "loopback");
  app.use("/api/donations", donationRouter);
  app.use(errorHandler);
  return app;
}

test("receipt upload rejects files larger than five megabytes before controller work", async (t) => {
  const originalFindById = Project.findById;
  t.after(() => {
    Project.findById = originalFindById;
  });
  Project.findById = async () => {
    throw new Error("controller should not be reached");
  };

  const response = await request(createApp())
    .post("/api/donations/with-receipt")
    .field("projectId", "507f1f77bcf86cd799439011")
    .field("paymentMethodId", "507f1f77bcf86cd799439012")
    .field("amount", "100")
    .attach("receiptImage", Buffer.alloc(5 * 1024 * 1024 + 1), {
      filename: "receipt.png",
      contentType: "image/png",
    });

  assert.equal(response.status, 413);
  assert.equal(response.body.code, "LIMIT_FILE_SIZE");
});

test("receipt upload rejects more than eight multipart fields before controller work", async (t) => {
  const originalFindById = Project.findById;
  t.after(() => {
    Project.findById = originalFindById;
  });
  Project.findById = async () => {
    throw new Error("controller should not be reached");
  };

  let submission = request(createApp()).post("/api/donations/with-receipt");
  for (let index = 0; index < 9; index += 1) {
    submission = submission.field(`field${index}`, "value");
  }
  const response = await submission;

  assert.equal(response.status, 413);
  assert.equal(response.body.code, "LIMIT_FIELD_COUNT");
});

test("receipt upload rejects multipart fields larger than one kilobyte", async () => {
  const response = await request(createApp())
    .post("/api/donations/with-receipt")
    .field("payerName", "x".repeat(1025));

  assert.equal(response.status, 413);
  assert.equal(response.body.code, "LIMIT_FIELD_VALUE");
});

test("receipt upload rejects decoded images larger than twelve megapixels", async (t) => {
  const originalFindById = Project.findById;
  t.after(() => {
    Project.findById = originalFindById;
  });
  Project.findById = async () => {
    throw new Error("controller should not be reached");
  };
  const oversizedPixels = await sharp({
    create: { width: 4000, height: 3100, channels: 3, background: "white" },
  }).png().toBuffer();

  const response = await request(createApp())
    .post("/api/donations/with-receipt")
    .field("projectId", "507f1f77bcf86cd799439011")
    .field("paymentMethodId", "507f1f77bcf86cd799439012")
    .field("amount", "100")
    .attach("receiptImage", oversizedPixels, {
      filename: "receipt.png",
      contentType: "image/png",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_RECEIPT_TYPE");
});

test("receipt upload rejects content whose bytes are not an allowed image", async (t) => {
  const originalFindById = Project.findById;
  t.after(() => {
    Project.findById = originalFindById;
  });
  Project.findById = async () => {
    throw new Error("controller should not be reached");
  };

  const response = await request(createApp())
    .post("/api/donations/with-receipt")
    .field("projectId", "507f1f77bcf86cd799439011")
    .field("paymentMethodId", "507f1f77bcf86cd799439012")
    .field("amount", "100")
    .attach("receiptImage", Buffer.from("<html>not an image</html>"), {
      filename: "receipt.png",
      contentType: "image/png",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_RECEIPT_TYPE");
});

test("receipt upload rejects an allowed image signature with a disallowed MIME type", async (t) => {
  const originalFindById = Project.findById;
  t.after(() => {
    Project.findById = originalFindById;
  });
  Project.findById = async () => {
    throw new Error("controller should not be reached");
  };

  const response = await request(createApp())
    .post("/api/donations/with-receipt")
    .set("X-Forwarded-For", "198.51.100.10")
    .field("projectId", "507f1f77bcf86cd799439011")
    .field("paymentMethodId", "507f1f77bcf86cd799439012")
    .field("amount", "100")
    .attach("receiptImage", Buffer.from([0xff, 0xd8, 0xff, 0x00]), {
      filename: "receipt.html",
      contentType: "text/html",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_RECEIPT_TYPE");
});

test("receipt upload rejects a truncated JPEG that only has signature bytes", async (t) => {
  const originalFindById = Project.findById;
  t.after(() => {
    Project.findById = originalFindById;
  });
  Project.findById = async () => {
    throw new Error("controller should not be reached");
  };

  const response = await request(createApp())
    .post("/api/donations/with-receipt")
    .set("X-Forwarded-For", "198.51.100.11")
    .field("projectId", "507f1f77bcf86cd799439011")
    .field("paymentMethodId", "507f1f77bcf86cd799439012")
    .field("amount", "100")
    .attach("receiptImage", Buffer.from([0xff, 0xd8, 0xff, 0x00]), {
      filename: "receipt.jpg",
      contentType: "image/jpeg",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_RECEIPT_TYPE");
});
