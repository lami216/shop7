import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createDonation, getDonations } from "../controllers/donation.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getDonations);
router.post("/", createDonation);

export default router;
