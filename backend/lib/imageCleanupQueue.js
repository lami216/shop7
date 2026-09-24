import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_QUEUE_PATH = path.resolve("./backend/data/image-cleanup-queue.json");
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let queueMutation = Promise.resolve();

function configuredQueuePath(queuePath) {
  return queuePath || process.env.IMAGE_CLEANUP_QUEUE_PATH || DEFAULT_QUEUE_PATH;
}

async function readQueue(queuePath) {
  try {
    const contents = await readFile(queuePath, "utf8");
    const parsed = JSON.parse(contents);
    if (!Array.isArray(parsed)) throw new Error("Invalid image cleanup queue");
    return parsed.filter((entry) => typeof entry?.fileId === "string" && entry.fileId);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeQueue(queuePath, entries) {
  const directory = path.dirname(queuePath);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const temporaryPath = `${queuePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(entries)}\n`, { mode: 0o600, flag: "wx" });
  await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, queuePath);
  await chmod(queuePath, 0o600);
}

function mutateQueue(operation) {
  const result = queueMutation.then(operation, operation);
  queueMutation = result.catch(() => {});
  return result;
}

async function enqueue(fileId, queuePath) {
  await mutateQueue(async () => {
    const entries = await readQueue(queuePath);
    if (!entries.some((entry) => entry.fileId === fileId)) entries.push({ fileId });
    await writeQueue(queuePath, entries);
  });
}

export async function cleanupImageOrQueue(fileId, {
  deleteImageFn,
  attempts = 3,
  delayMs = 100,
  queuePath,
} = {}) {
  if (!fileId) return "deleted";
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await deleteImageFn(fileId);
      return "deleted";
    } catch {
      if (attempt + 1 < attempts && delayMs > 0) await wait(delayMs);
    }
  }
  await enqueue(fileId, configuredQueuePath(queuePath));
  return "queued";
}

export async function reconcileQueuedImageDeletions({ deleteImageFn, queuePath } = {}) {
  const resolvedQueuePath = configuredQueuePath(queuePath);
  return mutateQueue(async () => {
    const entries = await readQueue(resolvedQueuePath);
    const retained = [];
    for (const entry of entries) {
      try {
        await deleteImageFn(entry.fileId);
      } catch {
        retained.push(entry);
      }
    }
    if (entries.length > 0) await writeQueue(resolvedQueuePath, retained);
    return { processed: entries.length, remaining: retained.length };
  });
}
