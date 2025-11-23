import Donation from "../models/donation.model.js";
import PaymentMethod from "../models/paymentMethod.model.js";
import Project from "../models/project.model.js";

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
                        paymentMethod: paymentMethodId,
                        amount,
                        donorName,
                        donorPhone,
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

export const getDonations = async (_req, res) => {
        try {
                const donations = await Donation.find()
                        .populate("project", "title category")
                        .populate("paymentMethod", "name accountNumber")
                        .sort({ createdAt: -1 })
                        .lean();

                res.json(donations);
        } catch (error) {
                console.log("Error fetching donations", error.message);
                res.status(500).json({ message: "تعذّر تحميل التبرعات", error: error.message });
        }
};
