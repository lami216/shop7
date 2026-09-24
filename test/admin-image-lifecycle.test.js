import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

process.env.IMAGEKIT_PUBLIC_KEY = "public_test";
process.env.IMAGEKIT_PRIVATE_KEY = "private_test";
process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test";
process.env.IMAGE_CLEANUP_QUEUE_PATH = "/tmp/shop7-test-image-cleanup.json";

const { createProject, updateProject } = await import("../backend/controllers/project.controller.js");
const { createAchievement, updateAchievement } = await import("../backend/controllers/achievement.controller.js");
const { createPaymentMethod, updatePaymentMethod } = await import("../backend/controllers/paymentMethod.controller.js");
const { default: Project } = await import("../backend/models/project.model.js");
const { default: Achievement } = await import("../backend/models/achievement.model.js");
const { default: PaymentMethod } = await import("../backend/models/paymentMethod.model.js");
const { imagekitClient } = await import("../backend/lib/imagekit.js");

const png = await sharp({
  create: { width: 8, height: 8, channels: 3, background: "white" },
}).png().toBuffer();
const validImage = `data:image/png;base64,${png.toString("base64")}`;
const fakeImage = `data:image/png;base64,${Buffer.from("not an image").toString("base64")}`;

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

for (const [name, invoke, model] of [
  ["project", (res) => createProject({ body: { images: [fakeImage, fakeImage, fakeImage] } }, res), Project],
  ["achievement", (res) => createAchievement({ body: { images: [fakeImage, fakeImage, fakeImage] } }, res), Achievement],
  ["payment method", (res) => createPaymentMethod({ body: { image: fakeImage } }, res), PaymentMethod],
]) {
  test(`${name} rejects non-image base64 before ImageKit upload`, async (t) => {
    const originalUpload = imagekitClient.files.upload;
    const originalCreate = model.create;
    t.after(() => {
      imagekitClient.files.upload = originalUpload;
      model.create = originalCreate;
    });
    let uploads = 0;
    imagekitClient.files.upload = async () => {
      uploads += 1;
      return { url: "https://example.test/fake.jpg", fileId: `fake-${uploads}` };
    };
    model.create = async (payload) => payload;

    const res = responseRecorder();
    await invoke(res);

    assert.equal(res.statusCode, 400);
    assert.equal(uploads, 0);
  });
}

test("project creation cleans every new image when database persistence fails", async (t) => {
  const originals = {
    upload: imagekitClient.files.upload,
    delete: imagekitClient.files.delete,
    create: Project.create,
  };
  t.after(() => {
    imagekitClient.files.upload = originals.upload;
    imagekitClient.files.delete = originals.delete;
    Project.create = originals.create;
  });
  let nextId = 0;
  imagekitClient.files.upload = async () => {
    nextId += 1;
    return { url: `https://example.test/${nextId}.jpg`, fileId: `new-${nextId}` };
  };
  const deleted = [];
  imagekitClient.files.delete = async (fileId) => { deleted.push(fileId); };
  Project.create = async () => { throw new Error("database failed"); };

  const res = responseRecorder();
  await createProject({ body: { images: [validImage, validImage, validImage] } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(deleted.sort(), ["new-1", "new-2", "new-3"]);
});

test("project image batch cleans earlier uploads when a later upload fails", async (t) => {
  const originals = {
    upload: imagekitClient.files.upload,
    delete: imagekitClient.files.delete,
    create: Project.create,
  };
  t.after(() => {
    imagekitClient.files.upload = originals.upload;
    imagekitClient.files.delete = originals.delete;
    Project.create = originals.create;
  });
  let attempts = 0;
  imagekitClient.files.upload = async () => {
    attempts += 1;
    if (attempts === 2) throw new Error("ImageKit unavailable");
    return { url: "https://example.test/first.jpg", fileId: "first-file" };
  };
  const deleted = [];
  imagekitClient.files.delete = async (fileId) => { deleted.push(fileId); };
  Project.create = async () => { throw new Error("database should not be reached"); };

  const res = responseRecorder();
  await createProject({ body: { images: [validImage, validImage, validImage] } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(deleted, ["first-file"]);
});

test("payment update keeps the old image until save succeeds and cleans the new image on failure", async (t) => {
  const originals = {
    upload: imagekitClient.files.upload,
    delete: imagekitClient.files.delete,
    findById: PaymentMethod.findById,
  };
  t.after(() => {
    imagekitClient.files.upload = originals.upload;
    imagekitClient.files.delete = originals.delete;
    PaymentMethod.findById = originals.findById;
  });
  imagekitClient.files.upload = async () => ({ url: "https://example.test/new.jpg", fileId: "new-file" });
  const deleted = [];
  imagekitClient.files.delete = async (fileId) => { deleted.push(fileId); };
  PaymentMethod.findById = async () => ({
    imageUrl: "https://example.test/old.jpg",
    imageFileId: "old-file",
    save: async () => { throw new Error("database failed"); },
  });

  const res = responseRecorder();
  await updatePaymentMethod({ params: { id: "507f1f77bcf86cd799439011" }, body: { image: validImage } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(deleted, ["new-file"]);
});

test("achievement persistence retains ImageKit file IDs for lifecycle cleanup", async (t) => {
  const originals = { upload: imagekitClient.files.upload, create: Achievement.create };
  t.after(() => {
    imagekitClient.files.upload = originals.upload;
    Achievement.create = originals.create;
  });
  let nextId = 0;
  imagekitClient.files.upload = async () => {
    nextId += 1;
    return { url: `https://example.test/${nextId}.jpg`, fileId: `achievement-${nextId}` };
  };
  let persisted;
  Achievement.create = async (payload) => {
    persisted = payload;
    return payload;
  };

  const res = responseRecorder();
  await createAchievement({ body: { images: [validImage, validImage, validImage] } }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(persisted.imageFileIds, ["achievement-1", "achievement-2", "achievement-3"]);
});

test("project creation rejects external image URLs not already persisted", async (t) => {
  const originalCreate = Project.create;
  t.after(() => { Project.create = originalCreate; });
  let persistenceAttempted = false;
  Project.create = async () => { persistenceAttempted = true; return {}; };

  const res = responseRecorder();
  await createProject({ body: { images: [
    "https://attacker.test/1.svg",
    "https://attacker.test/2.svg",
    "https://attacker.test/3.svg",
  ] } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(persistenceAttempted, false);
});

test("project update resolves retained file IDs only from persisted assets", async (t) => {
  const originals = {
    findById: Project.findById,
    delete: imagekitClient.files.delete,
  };
  t.after(() => {
    Project.findById = originals.findById;
    imagekitClient.files.delete = originals.delete;
  });
  const project = {
    images: [
      { url: "https://example.test/1.jpg", fileId: "old-1" },
      { url: "https://example.test/2.jpg", fileId: "old-2" },
      { url: "https://example.test/3.jpg", fileId: "old-3" },
    ],
    imageUrl: "https://example.test/1.jpg",
    imageFileId: "old-1",
    save: async () => {},
  };
  Project.findById = async () => project;
  const deleted = [];
  imagekitClient.files.delete = async (fileId) => { deleted.push(fileId); };

  const res = responseRecorder();
  await updateProject({
    params: { id: "507f1f77bcf86cd799439011" },
    body: {
      images: [
        "https://example.test/1.jpg",
        { url: "https://example.test/2.jpg", fileId: "forged-file" },
        "https://example.test/3.jpg",
      ],
      imageUrl: "https://attacker.test/evil.svg",
      imageFileId: "forged-top-level",
    },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(project.images.map((asset) => asset.fileId), ["old-1", "old-2", "old-3"]);
  assert.equal(project.imageUrl, "https://example.test/1.jpg");
  assert.equal(project.imageFileId, "old-1");
  assert.deepEqual(deleted, []);
});

test("achievement update ignores client-supplied lifecycle metadata", async (t) => {
  const originalFindById = Achievement.findById;
  t.after(() => { Achievement.findById = originalFindById; });
  const achievement = {
    title: "Old",
    images: ["https://example.test/1.jpg"],
    imageFileIds: ["old-1"],
    imageAssets: [{ url: "https://example.test/1.jpg", fileId: "old-1" }],
    save: async () => {},
  };
  Achievement.findById = async () => achievement;

  const res = responseRecorder();
  await updateAchievement({
    params: { id: "507f1f77bcf86cd799439011" },
    body: {
      title: "New",
      imageFileIds: ["forged-file"],
      imageAssets: [{ url: "https://attacker.test/evil.svg", fileId: "forged-file" }],
    },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(achievement.title, "New");
  assert.deepEqual(achievement.imageFileIds, ["old-1"]);
  assert.deepEqual(achievement.imageAssets, [{ url: "https://example.test/1.jpg", fileId: "old-1" }]);
});

test("payment update ignores client-supplied image lifecycle metadata", async (t) => {
  const originals = {
    upload: imagekitClient.files.upload,
    delete: imagekitClient.files.delete,
    findById: PaymentMethod.findById,
  };
  t.after(() => {
    imagekitClient.files.upload = originals.upload;
    imagekitClient.files.delete = originals.delete;
    PaymentMethod.findById = originals.findById;
  });
  imagekitClient.files.upload = async () => ({ url: "https://example.test/new.jpg", fileId: "new-file" });
  imagekitClient.files.delete = async () => {};
  const method = {
    name: "Old",
    imageUrl: "https://example.test/old.jpg",
    imageFileId: "old-file",
    save: async () => {},
  };
  PaymentMethod.findById = async () => method;

  const res = responseRecorder();
  await updatePaymentMethod({
    params: { id: "507f1f77bcf86cd799439011" },
    body: {
      name: "New",
      image: validImage,
      imageUrl: "https://attacker.test/evil.svg",
      imageFileId: "forged-file",
    },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(method.name, "New");
  assert.equal(method.imageUrl, "https://example.test/new.jpg");
  assert.equal(method.imageFileId, "new-file");
});
