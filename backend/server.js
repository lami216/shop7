import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import projectRoutes from "./routes/project.route.js";
import paymentMethodRoutes from "./routes/paymentMethod.route.js";
import donationRoutes from "./routes/donation.route.js";
import statsRoutes from "./routes/stats.route.js";
import achievementRoutes from "./routes/achievement.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config({ path: "./backend/.env" });

const app = express();
const PORT = process.env.PORT || 5000;

// في ESM هذا يُعيد المسار الحالي للعملية (غالبًا /var/www/shop1/backend)
const __dirname = path.resolve();

// نزيد حد حجم الجسم لدعم صور المشاريع حتى 10 ميجابايت بعد ترميز Base64
app.use(express.json({ limit: "15mb" })); // parse JSON body
app.use(express.urlencoded({ limit: "15mb", extended: true })); // parse URL-encoded (نماذج)
app.use(cookieParser());

/* ----------------- API Routes ----------------- */
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/statistics", statsRoutes);
app.use("/api/achievements", achievementRoutes);

/* ----------------- Production static -----------------
   كان يتم بناء المسار كـ "/var/www/shop1/backend/frontend/dist"
   والصحيح من داخل backend: "../frontend/dist"
------------------------------------------------------- */
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
  connectDB();
});
