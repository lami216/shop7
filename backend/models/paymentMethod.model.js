import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
        {
                name: { type: String, required: true, trim: true },
                accountNumber: { type: String, required: true, trim: true },
                imageUrl: { type: String, default: "" },
                isActive: { type: Boolean, default: true },
        },
        { timestamps: true }
);

export default mongoose.model("PaymentMethod", paymentMethodSchema);
