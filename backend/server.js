import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { loadEnvironment } from "./config/environment.js";

const envFile = process.env.ENV_FILE || path.resolve("./backend/.env");
dotenv.config({ path: envFile });

let environment;
try {
  environment = loadEnvironment(process.env);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const [
  { createApp },
  { connectDB },
  { redis, verifyRedisConnection },
  { createDependencyReadinessCheck, startApplication },
  { deleteImage },
  { reconcileQueuedImageDeletions },
] = await Promise.all([
  import("./app.js"),
  import("./lib/db.js"),
  import("./lib/redis.js"),
  import("./runtime/startApplication.js"),
  import("./lib/imagekit.js"),
  import("./lib/imageCleanupQueue.js"),
]);

const readinessCheck = createDependencyReadinessCheck({
  isDatabaseConnected: () => mongoose.connection.readyState === 1,
  pingCache: () => redis.ping(),
});
const app = createApp({ readinessCheck });
const { port } = environment;

await startApplication({
  app,
  connectDatabase: connectDB,
  verifyCache: verifyRedisConnection,
  reconcileCleanup: () => reconcileQueuedImageDeletions({ deleteImageFn: deleteImage }),
  onReady: () => {},
  host: "127.0.0.1",
  port,
});

const cleanupInterval = setInterval(() => {
  reconcileQueuedImageDeletions({ deleteImageFn: deleteImage }).catch(() => {
    console.error("Queued image cleanup reconciliation failed");
  });
}, 15 * 60 * 1000);
cleanupInterval.unref();

console.log(`Server listening on http://127.0.0.1:${port}`);
