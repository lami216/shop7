import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

process.env.IMAGEKIT_PUBLIC_KEY = "public_test";
process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";

const { createDonation, createDonationWithReceipt, updateDonationStatus } = await import("../backend/controllers/donation.controller.js");
const { default: Donation } = await import("../backend/models/donation.model.js");
const { default: PaymentMethod } = await import("../backend/models/paymentMethod.model.js");
const { default: Project } = await import("../backend/models/project.model.js");
const { imagekitClient } = await import("../backend/lib/imagekit.js");

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("receipt donation rejects a non-numeric amount before writing", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: false, status: "active" });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  let writeAttempted = false;
  Donation.create = async () => {
    writeAttempted = true;
    return {};
  };

  const req = {
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "not-a-number",
    },
  };
  const res = responseRecorder();

  await createDonationWithReceipt(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(writeAttempted, false);
});

test("receipt donation rejects a non-positive amount", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: false, status: "active" });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  let writeAttempted = false;
  Donation.create = async () => {
    writeAttempted = true;
    return {};
  };

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: { projectId: "507f1f77bcf86cd799439011", paymentMethodId: "507f1f77bcf86cd799439012", amount: "0" },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(writeAttempted, false);
});

test("receipt donation rejects an unavailable payment method", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: false, status: "active" });
  PaymentMethod.findById = async () => null;
  let writeAttempted = false;
  Donation.create = async () => {
    writeAttempted = true;
    return {};
  };

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: { projectId: "507f1f77bcf86cd799439011", paymentMethodId: "507f1f77bcf86cd799439013", amount: "100" },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(writeAttempted, false);
});

test("receipt donation derives the payment app from the active payment method", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: false, status: "active" });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Trusted Bank", isActive: true });
  let written;
  Donation.create = async (input) => {
    written = input;
    return input;
  };

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      paymentApp: "Forged Bank",
      amount: "100",
    },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(written.paymentApp, "Trusted Bank");
});

test("receipt donation rejects a closed project", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: true });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  let writeAttempted = false;
  Donation.create = async () => {
    writeAttempted = true;
    return {};
  };

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: { projectId: "507f1f77bcf86cd799439011", paymentMethodId: "507f1f77bcf86cd799439012", amount: "100" },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(writeAttempted, false);
});

test("receipt donation rejects a project whose trusted status is not active", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    isActive: true,
    isClosed: false,
    status: "draft",
  });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  let writeAttempted = false;
  Donation.create = async () => {
    writeAttempted = true;
    return {};
  };

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "100",
    },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(writeAttempted, false);
});

test("receipt donation rejects malformed identifiers before database access", async (t) => {
  const originalFindProject = Project.findById;
  t.after(() => {
    Project.findById = originalFindProject;
  });

  let databaseReadAttempted = false;
  Project.findById = async () => {
    databaseReadAttempted = true;
    throw new Error("database should not be reached");
  };

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: { projectId: "not-an-object-id", paymentMethodId: "also-invalid", amount: "100" },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(databaseReadAttempted, false);
});

test("plain donation rejects a non-numeric amount before database access", async (t) => {
  const originalFindProject = Project.findById;
  t.after(() => {
    Project.findById = originalFindProject;
  });

  let databaseReadAttempted = false;
  Project.findById = async () => {
    databaseReadAttempted = true;
    return null;
  };

  const res = responseRecorder();
  await createDonation({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "not-a-number",
    },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(databaseReadAttempted, false);
});

test("donation amounts enforce the MRU maximum and two-decimal precision before database access", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
  });

  let databaseReadAttempted = false;
  Project.findById = async () => {
    databaseReadAttempted = true;
    return null;
  };
  PaymentMethod.findById = async () => {
    databaseReadAttempted = true;
    return null;
  };

  for (const amount of ["1000000000.01", "10.001", "0.0000000001", "10.0000000001"]) {
    const plainResponse = responseRecorder();
    await createDonation({
      body: {
        projectId: "507f1f77bcf86cd799439011",
        paymentMethodId: "507f1f77bcf86cd799439012",
        amount,
      },
    }, plainResponse);
    assert.equal(plainResponse.statusCode, 400);

    const receiptResponse = responseRecorder();
    await createDonationWithReceipt({
      body: {
        projectId: "507f1f77bcf86cd799439011",
        paymentMethodId: "507f1f77bcf86cd799439012",
        amount,
      },
    }, receiptResponse);
    assert.equal(receiptResponse.statusCode, 400);
  }

  assert.equal(databaseReadAttempted, false);
});

test("receipt donation validates fields before uploading a receipt", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
    upload: imagekitClient.files.upload,
    delete: imagekitClient.files.delete,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
    imagekitClient.files.upload = originals.upload;
    imagekitClient.files.delete = originals.delete;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: false, status: "active" });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  Donation.create = async () => {
    const error = new Error("internal validation details");
    error.name = "ValidationError";
    throw error;
  };
  let uploadAttempted = false;
  imagekitClient.files.upload = async () => {
    uploadAttempted = true;
    return { url: "https://example.test/invalid.jpg", fileId: "invalid-file" };
  };
  imagekitClient.files.delete = async () => {};

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "100",
      payerName: "n".repeat(121),
    },
    file: { buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]), mimetype: "image/jpeg" },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal("error" in res.body, false);
  assert.equal(uploadAttempted, false);
});

test("plain donation rejects malformed identifiers before database access", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
  });

  let databaseReadAttempted = false;
  Project.findById = async () => {
    databaseReadAttempted = true;
    return null;
  };
  PaymentMethod.findById = async () => {
    databaseReadAttempted = true;
    return null;
  };

  const res = responseRecorder();
  await createDonation({
    body: { projectId: "bad", paymentMethodId: "bad", amount: "100" },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(databaseReadAttempted, false);
});

test("plain donation rejects a closed project", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: true });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  let writeAttempted = false;
  Donation.create = async () => {
    writeAttempted = true;
    return {};
  };

  const res = responseRecorder();
  await createDonation({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "100",
    },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(writeAttempted, false);
});

test("plain donation rejects a project whose trusted status is not active", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    isActive: true,
    isClosed: false,
    status: "hidden",
  });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  let writeAttempted = false;
  Donation.create = async () => {
    writeAttempted = true;
    return {};
  };

  const res = responseRecorder();
  await createDonation({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "100",
    },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(writeAttempted, false);
});

test("plain donation returns a sanitized client error for invalid stored fields", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: false, status: "active" });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  Donation.create = async () => {
    const error = new Error("internal validation details");
    error.name = "ValidationError";
    throw error;
  };

  const res = responseRecorder();
  await createDonation({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "100",
      donorName: "n".repeat(121),
    },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal("error" in res.body, false);
});

test("donation status update rejects malformed identifiers before database access", async (t) => {
  const originalUpdate = Donation.findByIdAndUpdate;
  t.after(() => {
    Donation.findByIdAndUpdate = originalUpdate;
  });

  let databaseWriteAttempted = false;
  Donation.findByIdAndUpdate = () => {
    databaseWriteAttempted = true;
    throw new Error("database should not be reached");
  };

  const res = responseRecorder();
  await updateDonationStatus({ params: { id: "bad" }, body: { status: "confirmed" } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(databaseWriteAttempted, false);
});

test("donation status cannot be reset to pending", async (t) => {
  const originalUpdate = Donation.findByIdAndUpdate;
  t.after(() => {
    Donation.findByIdAndUpdate = originalUpdate;
  });

  let databaseWriteAttempted = false;
  Donation.findByIdAndUpdate = () => {
    databaseWriteAttempted = true;
    throw new Error("database should not be reached");
  };

  const res = responseRecorder();
  await updateDonationStatus({
    params: { id: "507f1f77bcf86cd799439011" },
    body: { status: "pending" },
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(databaseWriteAttempted, false);
});

test("receipt donation deletes an uploaded receipt when persistence fails", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
    upload: imagekitClient.files.upload,
    delete: imagekitClient.files.delete,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
    imagekitClient.files.upload = originals.upload;
    imagekitClient.files.delete = originals.delete;
  });

  Project.findById = async () => ({ _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: false, status: "active" });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  Donation.create = async () => {
    throw new Error("database unavailable");
  };
  imagekitClient.files.upload = async () => ({ url: "https://example.test/receipt.jpg", fileId: "receipt-file-id" });
  let deletedFileId;
  imagekitClient.files.delete = async (fileId) => {
    deletedFileId = fileId;
  };

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "100",
    },
    file: { buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]), mimetype: "image/jpeg" },
  }, res);

  assert.equal(res.statusCode, 500);
  assert.equal(deletedFileId, "receipt-file-id");
});

test("receipt donation queues cleanup when ImageKit deletion keeps failing", async (t) => {
  const originals = {
    findProject: Project.findById,
    findPaymentMethod: PaymentMethod.findById,
    createDonation: Donation.create,
    upload: imagekitClient.files.upload,
    delete: imagekitClient.files.delete,
    queuePath: process.env.IMAGE_CLEANUP_QUEUE_PATH,
  };
  t.after(() => {
    Project.findById = originals.findProject;
    PaymentMethod.findById = originals.findPaymentMethod;
    Donation.create = originals.createDonation;
    imagekitClient.files.upload = originals.upload;
    imagekitClient.files.delete = originals.delete;
    if (originals.queuePath === undefined) delete process.env.IMAGE_CLEANUP_QUEUE_PATH;
    else process.env.IMAGE_CLEANUP_QUEUE_PATH = originals.queuePath;
  });

  const directory = await mkdtemp(path.join(os.tmpdir(), "receipt-cleanup-"));
  const queuePath = path.join(directory, "queue.json");
  process.env.IMAGE_CLEANUP_QUEUE_PATH = queuePath;
  Project.findById = async () => ({
    _id: "507f1f77bcf86cd799439011", isActive: true, isClosed: false, status: "active",
  });
  PaymentMethod.findById = async () => ({ _id: "507f1f77bcf86cd799439012", name: "Bank", isActive: true });
  Donation.create = async () => { throw new Error("database unavailable"); };
  imagekitClient.files.upload = async () => ({ url: "https://example.test/receipt.jpg", fileId: "orphan-receipt" });
  imagekitClient.files.delete = async () => { throw new Error("image service unavailable"); };

  const res = responseRecorder();
  await createDonationWithReceipt({
    body: {
      projectId: "507f1f77bcf86cd799439011",
      paymentMethodId: "507f1f77bcf86cd799439012",
      amount: "100",
    },
    file: { buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]), mimetype: "image/jpeg" },
  }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(JSON.parse(await readFile(queuePath, "utf8")), [{ fileId: "orphan-receipt" }]);
});
