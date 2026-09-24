import Donation from "../models/donation.model.js";
import PaymentMethod from "../models/paymentMethod.model.js";
import Project from "../models/project.model.js";
import { deleteImage, uploadImage } from "../lib/imagekit.js";
import { cleanupImageOrQueue } from "../lib/imageCleanupQueue.js";
import mongoose from "mongoose";

const buildBase64FromFile = (file) => {
        if (!file?.buffer) return null;
        return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

const MAX_DONATION_AMOUNT = 1_000_000_000;
const DONATION_AMOUNT_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const isValidDonationAmount = (rawAmount, numericAmount) => {
        const normalized = typeof rawAmount === "number"
                ? String(rawAmount)
                : (typeof rawAmount === "string" ? rawAmount.trim() : "");
        return DONATION_AMOUNT_PATTERN.test(normalized)
                && Number.isFinite(numericAmount)
                && numericAmount > 0
                && numericAmount <= MAX_DONATION_AMOUNT;
};

export const createDonation = async (req, res) => {
        try {
                const { projectId, paymentMethodId, amount, donorName, donorPhone } = req.body;
                const numericAmount = Number(amount);

                if (!isValidDonationAmount(amount, numericAmount)) {
                        return res.status(400).json({ message: "مبلغ التبرع غير صالح" });
                }
                if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(paymentMethodId)) {
                        return res.status(400).json({ message: "معرّف المشروع أو وسيلة الدفع غير صالح" });
                }

                const [project, paymentMethod] = await Promise.all([
                        Project.findById(projectId),
                        PaymentMethod.findById(paymentMethodId),
                ]);

                if (!project) {
                        return res.status(404).json({ message: "المشروع غير موجود" });
                }
                if (project.isClosed || project.isActive === false || project.status !== "active") {
                        return res.status(400).json({ message: "المشروع غير متاح للتبرع" });
                }

                if (!paymentMethod || !paymentMethod.isActive) {
                        return res.status(400).json({ message: "وسيلة الدفع غير متاحة" });
                }

                const donation = await Donation.create({
                        project: projectId,
                        projectId,
                        paymentMethod: paymentMethodId,
                        paymentApp: paymentMethod.name,
                        amount: numericAmount,
                        donorName,
                        payerName: donorName,
                        donorPhone,
                        phone: donorPhone,
                });

                res.status(201).json({
                        donation,
                        instruction: `أرسل المبلغ ${amount} إلى ${paymentMethod.accountNumber} عبر ${paymentMethod.name}`,
                        paymentMethod,
                });
        } catch (error) {
                if (error.name === "ValidationError") {
                        return res.status(400).json({ message: "بيانات التبرع غير صالحة" });
                }
                console.log("Error creating donation");
                return res.status(500).json({ message: "تعذّر تسجيل التبرع" });
        }
};

export const createDonationWithReceipt = async (req, res) => {
        let uploadedReceiptFileId = null;
        try {
                const { projectId, amount, payerName, phone, projectNumber, paymentMethodId } = req.body;
                const { file } = req;
                const numericAmount = Number(amount);

                if (!isValidDonationAmount(amount, numericAmount)) {
                        return res.status(400).json({ message: "مبلغ التبرع غير صالح" });
                }
                if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(paymentMethodId)) {
                        return res.status(400).json({ message: "معرّف المشروع أو وسيلة الدفع غير صالح" });
                }

                const project = await Project.findById(projectId);
                if (!project) {
                        return res.status(404).json({ message: "المشروع غير موجود" });
                }
                if (project.isClosed || project.isActive === false || project.status !== "active") {
                        return res.status(400).json({ message: "المشروع غير متاح للتبرع" });
                }

                if (!paymentMethodId) {
                        return res.status(400).json({ message: "وسيلة الدفع مطلوبة" });
                }

                const paymentMethod = await PaymentMethod.findById(paymentMethodId);
                if (!paymentMethod || paymentMethod.isActive === false) {
                        return res.status(400).json({ message: "وسيلة الدفع غير متاحة" });
                }

                const donationPayload = {
                        project: projectId,
                        projectId,
                        paymentMethod: paymentMethod._id,
                        paymentApp: paymentMethod.name,
                        amount: numericAmount,
                        payerName,
                        donorName: payerName,
                        phone,
                        donorPhone: phone,
                        receiptImageUrl: "",
                        projectNumber,
                };
                await new Donation(donationPayload).validate();

                if (file) {
                        const base64 = buildBase64FromFile(file);
                        if (base64) {
                                const uploadResult = await uploadImage(base64, "donation-receipts");
                                donationPayload.receiptImageUrl = uploadResult.url;
                                uploadedReceiptFileId = uploadResult.fileId;
                        }
                }

                const donation = await Donation.create(donationPayload);

                return res.status(201).json({
                        donation,
                        message: "تم تسجيل التبرع بنجاح",
                });
        } catch (error) {
                if (uploadedReceiptFileId) {
                        await cleanupImageOrQueue(uploadedReceiptFileId, { deleteImageFn: deleteImage });
                }
                if (error.name === "ValidationError") {
                        return res.status(400).json({ message: "بيانات التبرع غير صالحة" });
                }
                console.log("Error creating donation with receipt");
                return res.status(500).json({ message: "تعذّر تسجيل التبرع" });
        }
};

export const getDonations = async (_req, res) => {
        try {
                const donations = await Donation.find()
                        .populate("project", "title category targetAmount")
                        .populate("paymentMethod", "name accountNumber")
                        .sort({ createdAt: -1 })
                        .lean();

                res.json(donations);
        } catch (error) {
                console.log("Error fetching donations");
                res.status(500).json({ message: "تعذّر تحميل التبرعات" });
        }
};

export const updateDonationStatus = async (req, res) => {
        try {
                const { status } = req.body;
                const allowedStatuses = ["confirmed", "rejected"];

                if (!allowedStatuses.includes(status)) {
                        return res.status(400).json({ message: "حالة التبرع غير صالحة" });
                }
                if (!mongoose.isValidObjectId(req.params.id)) {
                        return res.status(400).json({ message: "معرّف التبرع غير صالح" });
                }

                const donation = await Donation.findByIdAndUpdate(req.params.id, { status }, { new: true })
                        .populate("project", "title category targetAmount")
                        .populate("paymentMethod", "name accountNumber");

                if (!donation) {
                        return res.status(404).json({ message: "التبرع غير موجود" });
                }

                res.json(donation);
        } catch (error) {
                console.log("Error updating donation status");
                res.status(500).json({ message: "تعذّر تحديث حالة التبرع" });
        }
};
