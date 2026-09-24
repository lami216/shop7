import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createProject, getProjectById, getProjects, updateProject } from "../controllers/project.controller.js";

const router = express.Router();
const parseLargeProject = express.json({ limit: "15mb" });

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", protectRoute, adminRoute, parseLargeProject, createProject);
router.patch("/:id", protectRoute, adminRoute, parseLargeProject, updateProject);

export default router;
