import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createProject, getProjectById, getProjects, updateProject } from "../controllers/project.controller.js";

const router = express.Router();

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", protectRoute, adminRoute, createProject);
router.patch("/:id", protectRoute, adminRoute, updateProject);

export default router;
