import express from "express";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { createDonation, createDonationWithReceipt, getDonations, updateDonationStatus } from "../controllers/donation.controller.js";

const router = express.Router();
const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
                fileSize: 5 * 1024 * 1024,
                files: 1,
                fields: 8,
                fieldSize: 1024,
                parts: 9,
        },
});
const donationSubmissionLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        handler: (_req, res) => res.status(429).json({ message: "محاولات كثيرة، حاول لاحقًا" }),
});

const allowedReceiptTypes = new Map([
        ["jpeg", "image/jpeg"],
        ["png", "image/png"],
        ["webp", "image/webp"],
]);

const validateReceiptImage = async (req, _res, next) => {
        if (!req.file) return next();
        try {
                const image = sharp(req.file.buffer, {
                        animated: false,
                        failOn: "error",
                        limitInputPixels: 12_000_000,
                        sequentialRead: true,
                });
                const metadata = await image.metadata();
                if (allowedReceiptTypes.get(metadata.format) !== req.file.mimetype) {
                        throw new Error("MIME type does not match decoded image");
                }

                req.file.buffer = await image
                        .rotate()
                        .flatten({ background: "#ffffff" })
                        .jpeg({ quality: 90, mozjpeg: true })
                        .toBuffer();
                req.file.mimetype = "image/jpeg";
                req.file.originalname = "receipt.jpg";
                return next();
        } catch {
                const error = new Error("نوع ملف الإيصال غير صالح");
                error.code = "INVALID_RECEIPT_TYPE";
                return next(error);
        }
};

router.get("/", protectRoute, adminRoute, getDonations);
router.post("/", donationSubmissionLimiter, createDonation);
router.post("/with-receipt", donationSubmissionLimiter, upload.single("receiptImage"), validateReceiptImage, createDonationWithReceipt);
router.patch("/:id/status", protectRoute, adminRoute, updateDonationStatus);

export default router;
