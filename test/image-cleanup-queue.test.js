import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  cleanupImageOrQueue,
  reconcileQueuedImageDeletions,
} from "../backend/lib/imageCleanupQueue.js";

test("image cleanup retries a bounded transient deletion failure", async () => {
  let attempts = 0;
  const result = await cleanupImageOrQueue("file-id", {
    attempts: 3,
    delayMs: 0,
    deleteImageFn: async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("temporary failure");
    },
    queuePath: path.join(os.tmpdir(), "unused-cleanup-queue.json"),
  });

  assert.equal(result, "deleted");
  assert.equal(attempts, 3);
});

test("image cleanup durably queues deletion after bounded retries fail", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "image-cleanup-"));
  const queuePath = path.join(directory, "queue.json");
  let attempts = 0;

  const result = await cleanupImageOrQueue("receipt-file-id", {
    attempts: 2,
    delayMs: 0,
    deleteImageFn: async () => {
      attempts += 1;
      throw new Error("service unavailable");
    },
    queuePath,
  });

  assert.equal(result, "queued");
  assert.equal(attempts, 2);
  assert.deepEqual(JSON.parse(await readFile(queuePath, "utf8")), [{ fileId: "receipt-file-id" }]);
  assert.equal((await stat(queuePath)).mode & 0o777, 0o600);
});

test("reconciliation removes deleted entries and retains failures", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "image-reconcile-"));
  const queuePath = path.join(directory, "queue.json");
  for (const fileId of ["first", "second"]) {
    await cleanupImageOrQueue(fileId, {
      attempts: 1,
      delayMs: 0,
      deleteImageFn: async () => { throw new Error("offline"); },
      queuePath,
    });
  }

  await reconcileQueuedImageDeletions({
    deleteImageFn: async (fileId) => {
      if (fileId === "second") throw new Error("still offline");
    },
    queuePath,
  });

  assert.deepEqual(JSON.parse(await readFile(queuePath, "utf8")), [{ fileId: "second" }]);
});
