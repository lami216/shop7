import express from "express";
import { rateLimit } from "express-rate-limit";
import { login, logout, signup, refreshToken, getProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
const createAuthLimiter = (message) => rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        handler: (_req, res) => res.status(429).json({ message }),
});
const signupLimiter = createAuthLimiter("محاولات إنشاء حساب كثيرة، حاول لاحقًا");
const loginLimiter = createAuthLimiter("محاولات دخول كثيرة، حاول لاحقًا");

router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);

export default router;
