import express from "express";
import multer from "multer";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createDonation, createDonationWithReceipt, getDonations, updateDonationStatus } from "../controllers/donation.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protectRoute, adminRoute, getDonations);
router.post("/", createDonation);
router.post("/with-receipt", upload.single("receiptImage"), createDonationWithReceipt);
router.patch("/:id/status", protectRoute, adminRoute, updateDonationStatus);

export default router;
