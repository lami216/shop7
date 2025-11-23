import express from "express";
import multer from "multer";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createDonation, createDonationWithReceipt, getDonations } from "../controllers/donation.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protectRoute, adminRoute, getDonations);
router.post("/", createDonation);
router.post("/with-receipt", upload.single("receiptImage"), createDonationWithReceipt);

export default router;
