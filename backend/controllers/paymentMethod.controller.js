import PaymentMethod from "../models/paymentMethod.model.js";
import { deleteImage, uploadImage } from "../lib/imagekit.js";

const createHttpError = (status, message) => {
        const error = new Error(message);
        error.status = status;
        return error;
};

const uploadPaymentImage = async (image) => {
        if (!image || typeof image !== "string" || !image.startsWith("data:")) {
                throw createHttpError(400, "صيغة شعار وسيلة الدفع غير صالحة");
        }

        return uploadImage(image, "payment-methods");
};

export const createPaymentMethod = async (req, res) => {
        try {
                const { name, accountNumber, image, isActive } = req.body;
                const uploadResult = await uploadPaymentImage(image);
                const method = await PaymentMethod.create({
                        name,
                        accountNumber,
                        imageUrl: uploadResult.url,
                        imageFileId: uploadResult.fileId,
                        isActive,
                });
                res.status(201).json(method);
        } catch (error) {
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error creating payment method", error.message);
                }
                res.status(status).json({ message: "تعذّر إضافة وسيلة الدفع", error: error.message });
        }
};

export const getPaymentMethods = async (req, res) => {
        try {
                const includeInactive = req.query.includeInactive === "true";
                const filter = includeInactive ? {} : { isActive: true };
                const methods = await PaymentMethod.find(filter).sort({ createdAt: -1 }).lean();
                res.json(methods);
        } catch (error) {
                console.log("Error fetching payment methods", error.message);
                res.status(500).json({ message: "تعذّر تحميل وسائل الدفع", error: error.message });
        }
};

export const updatePaymentMethod = async (req, res) => {
        try {
                const method = await PaymentMethod.findById(req.params.id);

                if (!method) {
                        return res.status(404).json({ message: "وسيلة الدفع غير موجودة" });
                }

                const { image, ...updates } = req.body || {};

                if (image !== undefined) {
                        if (image) {
                                const uploadResult = await uploadPaymentImage(image);
                                if (method.imageFileId) {
                                        await deleteImage(method.imageFileId);
                                }
                                method.imageUrl = uploadResult.url;
                                method.imageFileId = uploadResult.fileId;
                        } else {
                                if (method.imageFileId) {
                                        await deleteImage(method.imageFileId);
                                }
                                method.imageUrl = "";
                                method.imageFileId = null;
                        }
                }

                Object.entries(updates).forEach(([key, value]) => {
                        method[key] = value;
                });

                await method.save();

                res.json(method);
        } catch (error) {
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error updating payment method", error.message);
                }
                res.status(status).json({ message: "تعذّر تحديث وسيلة الدفع", error: error.message });
        }
};

export const deletePaymentMethod = async (req, res) => {
        try {
                const method = await PaymentMethod.findByIdAndDelete(req.params.id);

                if (!method) {
                        return res.status(404).json({ message: "وسيلة الدفع غير موجودة" });
                }

                if (method.imageFileId) {
                        await deleteImage(method.imageFileId);
                }

                res.json({ message: "تم حذف وسيلة الدفع" });
        } catch (error) {
                console.log("Error deleting payment method", error.message);
                res.status(500).json({ message: "تعذّر حذف وسيلة الدفع", error: error.message });
        }
};
