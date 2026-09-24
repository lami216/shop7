import cookieParser from "cookie-parser";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import achievementRoutes from "./routes/achievement.route.js";
import authRoutes from "./routes/auth.route.js";
import donationRoutes from "./routes/donation.route.js";
import paymentMethodRoutes from "./routes/paymentMethod.route.js";
import projectRoutes from "./routes/project.route.js";
import statsRoutes from "./routes/stats.route.js";
import { errorHandler } from "./middleware/error.middleware.js";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));

export function createApp({
  isReady = () => false,
  readinessCheck = isReady,
  frontendDistPath = path.resolve(backendDirectory, "../frontend/dist"),
} = {}) {
  const app = express();
  const largeAdminBodyPrefixes = ["/api/projects", "/api/achievements", "/api/payment-methods"];
  const smallJsonParser = express.json({ limit: "256kb" });
  const smallFormParser = express.urlencoded({ limit: "256kb", extended: true });
  const usesLargeAdminBody = (req) => largeAdminBodyPrefixes.some(
    (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
  );

  app.set("trust proxy", "loopback");
  app.use((req, res, next) => usesLargeAdminBody(req) ? next() : smallJsonParser(req, res, next));
  app.use((req, res, next) => usesLargeAdminBody(req) ? next() : smallFormParser(req, res, next));
  app.use(cookieParser());

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
  app.get("/readyz", async (_req, res) => {
    let timeoutId;
    try {
      const timeout = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(false), 1000);
      });
      const ready = await Promise.race([Promise.resolve().then(readinessCheck), timeout]);
      if (!ready) return res.status(503).json({ status: "not_ready" });
      return res.json({ status: "ready" });
    } catch {
      return res.status(503).json({ status: "not_ready" });
    } finally {
      clearTimeout(timeoutId);
    }
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/payment-methods", paymentMethodRoutes);
  app.use("/api/donations", donationRoutes);
  app.use("/api/statistics", statsRoutes);
  app.use("/api/achievements", achievementRoutes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(frontendDistPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(frontendDistPath, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}
