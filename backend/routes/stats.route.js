import express from "express";
import { getSiteStatistics } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/", getSiteStatistics);

export default router;
