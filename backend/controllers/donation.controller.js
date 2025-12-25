import Donation from "../models/donation.model.js";
import PaymentMethod from "../models/paymentMethod.model.js";
import Project from "../models/project.model.js";
import { uploadImage } from "../lib/imagekit.js";

const buildBase64FromFile = (file) => {
        if (!file?.buffer) return null;
        return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

export const createDonation = async (req, res) => {
        try {
                const { projectId, paymentMethodId, amount, donorName, donorPhone } = req.body;

                const [project, paymentMethod] = await Promise.all([
                        Project.findById(projectId),
                        PaymentMethod.findById(paymentMethodId),
                ]);

                if (!project) {
                        return res.status(404).json({ message: "المشروع غير موجود" });
                }

                if (!paymentMethod || !paymentMethod.isActive) {
                        return res.status(400).json({ message: "وسيلة الدفع غير متاحة" });
                }

                const donation = await Donation.create({
                        project: projectId,
                        projectId,
                        paymentMethod: paymentMethodId,
                        paymentApp: paymentMethod.name,
                        amount,
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
                console.log("Error creating donation", error.message);
                res.status(500).json({ message: "تعذّر تسجيل التبرع", error: error.message });
        }
};

export const createDonationWithReceipt = async (req, res) => {
        try {
                const { projectId, amount, paymentApp, payerName, phone, projectNumber, paymentMethodId } = req.body;
                const { file } = req;

                const project = await Project.findById(projectId);
                if (!project) {
                        return res.status(404).json({ message: "المشروع غير موجود" });
                }

                const paymentMethod = paymentMethodId ? await PaymentMethod.findById(paymentMethodId) : null;
                if (paymentMethod && paymentMethod.isActive === false) {
                        return res.status(400).json({ message: "وسيلة الدفع غير متاحة" });
                }

                let receiptImageUrl = "";
                if (file) {
                        const base64 = buildBase64FromFile(file);
                        if (base64) {
                                const uploadResult = await uploadImage(base64, "donation-receipts");
                                receiptImageUrl = uploadResult.url;
                        }
                }

                const donation = await Donation.create({
                        project: projectId,
                        projectId,
                        paymentMethod: paymentMethod?._id,
                        paymentApp: paymentApp || paymentMethod?.name || "غير محدد",
                        amount: Number(amount),
                        payerName,
                        donorName: payerName,
                        phone,
                        donorPhone: phone,
                        receiptImageUrl,
                        projectNumber,
                });

                return res.status(201).json({
                        donation,
                        message: "تم تسجيل التبرع بنجاح",
                });
        } catch (error) {
                console.log("Error creating donation with receipt", error.message);
                res.status(500).json({ message: "تعذّر تسجيل التبرع", error: error.message });
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
                console.log("Error fetching donations", error.message);
                res.status(500).json({ message: "تعذّر تحميل التبرعات", error: error.message });
        }
};

export const updateDonationStatus = async (req, res) => {
        try {
                const { status } = req.body;
                const allowedStatuses = ["pending", "confirmed", "rejected"];

                if (!allowedStatuses.includes(status)) {
                        return res.status(400).json({ message: "حالة التبرع غير صالحة" });
                }

                const donation = await Donation.findByIdAndUpdate(req.params.id, { status }, { new: true })
                        .populate("project", "title category targetAmount")
                        .populate("paymentMethod", "name accountNumber");

                if (!donation) {
                        return res.status(404).json({ message: "التبرع غير موجود" });
                }

                res.json(donation);
        } catch (error) {
                console.log("Error updating donation status", error.message);
                res.status(500).json({ message: "تعذّر تحديث حالة التبرع", error: error.message });
        }
};
