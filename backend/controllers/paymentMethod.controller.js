import PaymentMethod from "../models/paymentMethod.model.js";

export const createPaymentMethod = async (req, res) => {
        try {
                const { name, accountNumber, imageUrl, isActive } = req.body;
                const method = await PaymentMethod.create({ name, accountNumber, imageUrl, isActive });
                res.status(201).json(method);
        } catch (error) {
                console.log("Error creating payment method", error.message);
                res.status(500).json({ message: "تعذّر إضافة وسيلة الدفع", error: error.message });
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
                const method = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, {
                        new: true,
                        runValidators: true,
                });

                if (!method) {
                        return res.status(404).json({ message: "وسيلة الدفع غير موجودة" });
                }

                res.json(method);
        } catch (error) {
                console.log("Error updating payment method", error.message);
                res.status(500).json({ message: "تعذّر تحديث وسيلة الدفع", error: error.message });
        }
};

export const deletePaymentMethod = async (req, res) => {
        try {
                const method = await PaymentMethod.findByIdAndDelete(req.params.id);

                if (!method) {
                        return res.status(404).json({ message: "وسيلة الدفع غير موجودة" });
                }

                res.json({ message: "تم حذف وسيلة الدفع" });
        } catch (error) {
                console.log("Error deleting payment method", error.message);
                res.status(500).json({ message: "تعذّر حذف وسيلة الدفع", error: error.message });
        }
};
