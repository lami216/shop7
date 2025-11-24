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

router.get("/", getAchievements);
router.get("/:id", getAchievementById);
router.post("/", protectRoute, adminRoute, createAchievement);
router.patch("/:id", protectRoute, adminRoute, updateAchievement);
router.delete("/:id", protectRoute, adminRoute, deleteAchievement);

export default router;
