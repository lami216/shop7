import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
        createPaymentMethod,
        deletePaymentMethod,
        getPaymentMethods,
        updatePaymentMethod,
} from "../controllers/paymentMethod.controller.js";

const router = express.Router();
const parsePaymentImage = express.json({ limit: "3mb" });

router.get("/", (req, res, next) => {
        if (req.query.includeInactive === "true") return next();
        return getPaymentMethods(req, res, next);
}, protectRoute, adminRoute, getPaymentMethods);
router.post("/", protectRoute, adminRoute, parsePaymentImage, createPaymentMethod);
router.patch("/:id", protectRoute, adminRoute, parsePaymentImage, updatePaymentMethod);
router.delete("/:id", protectRoute, adminRoute, deletePaymentMethod);

export default router;
