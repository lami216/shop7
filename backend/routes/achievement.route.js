import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
        createAchievement,
        deleteAchievement,
        getAchievementById,
        getAchievements,
        updateAchievement,
} from "../controllers/achievement.controller.js";

const router = express.Router();
const parseLargeAchievement = express.json({ limit: "15mb" });

router.get("/", getAchievements);
router.get("/:id", getAchievementById);
router.post("/", protectRoute, adminRoute, parseLargeAchievement, createAchievement);
router.patch("/:id", protectRoute, adminRoute, parseLargeAchievement, updateAchievement);
router.delete("/:id", protectRoute, adminRoute, deleteAchievement);

export default router;
