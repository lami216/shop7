import PaymentMethod from "../models/paymentMethod.model.js";
import { cleanupImageIds, uploadSanitizedImage } from "../lib/imageAssets.js";

const createHttpError = (status, message) => {
        const error = new Error(message);
        error.status = status;
        return error;
};

const uploadPaymentImage = async (image) => {
        if (!image || typeof image !== "string" || !image.startsWith("data:")) {
                throw createHttpError(400, "صيغة شعار وسيلة الدفع غير صالحة");
        }

        return uploadSanitizedImage(image, "payment-methods");
};

const PAYMENT_METHOD_UPDATE_FIELDS = ["name", "accountNumber", "isActive"];

export const createPaymentMethod = async (req, res) => {
        let uploadedFileId = null;
        try {
                const { name, accountNumber, image, isActive } = req.body;
                const uploadResult = await uploadPaymentImage(image);
                uploadedFileId = uploadResult.fileId;
                const method = await PaymentMethod.create({
                        name,
                        accountNumber,
                        imageUrl: uploadResult.url,
                        imageFileId: uploadResult.fileId,
                        isActive,
                });
                res.status(201).json(method);
        } catch (error) {
                await cleanupImageIds([uploadedFileId]);
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error creating payment method");
                }
                res.status(status).json({ message: "تعذّر إضافة وسيلة الدفع" });
        }
};

export const getPaymentMethods = async (req, res) => {
        try {
                const includeInactive = req.query.includeInactive === "true";
                const filter = includeInactive ? {} : { isActive: true };
                const methods = await PaymentMethod.find(filter).sort({ createdAt: -1 }).lean();
                res.json(methods);
        } catch (error) {
                console.log("Error fetching payment methods");
                res.status(500).json({ message: "تعذّر تحميل وسائل الدفع" });
        }
};

export const updatePaymentMethod = async (req, res) => {
        let uploadedFileId = null;
        let previousFileId = null;
        let persisted = false;
        try {
                const method = await PaymentMethod.findById(req.params.id);

                if (!method) {
                        return res.status(404).json({ message: "وسيلة الدفع غير موجودة" });
                }

                const { image } = req.body || {};

                if (image !== undefined) {
                        if (image) {
                                const uploadResult = await uploadPaymentImage(image);
                                uploadedFileId = uploadResult.fileId;
                                previousFileId = method.imageFileId;
                                method.imageUrl = uploadResult.url;
                                method.imageFileId = uploadResult.fileId;
                        } else {
                                previousFileId = method.imageFileId;
                                method.imageUrl = "";
                                method.imageFileId = null;
                        }
                }

                PAYMENT_METHOD_UPDATE_FIELDS.forEach((key) => {
                        if (req.body?.[key] !== undefined) method[key] = req.body[key];
                });

                await method.save();
                persisted = true;
                await cleanupImageIds([previousFileId]);

                res.json(method);
        } catch (error) {
                if (!persisted) await cleanupImageIds([uploadedFileId]);
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error updating payment method");
                }
                res.status(status).json({ message: "تعذّر تحديث وسيلة الدفع" });
        }
};

export const deletePaymentMethod = async (req, res) => {
        try {
                const method = await PaymentMethod.findByIdAndDelete(req.params.id);

                if (!method) {
                        return res.status(404).json({ message: "وسيلة الدفع غير موجودة" });
                }

                if (method.imageFileId) {
                        await cleanupImageIds([method.imageFileId]);
                }

                res.json({ message: "تم حذف وسيلة الدفع" });
        } catch (error) {
                console.log("Error deleting payment method");
                res.status(500).json({ message: "تعذّر حذف وسيلة الدفع" });
        }
};
