import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
        createPaymentMethod,
        deletePaymentMethod,
        getPaymentMethods,
        updatePaymentMethod,
} from "../controllers/paymentMethod.controller.js";

const router = express.Router();

router.get("/", getPaymentMethods);
router.post("/", protectRoute, adminRoute, createPaymentMethod);
router.patch("/:id", protectRoute, adminRoute, updatePaymentMethod);
router.delete("/:id", protectRoute, adminRoute, deletePaymentMethod);

export default router;
