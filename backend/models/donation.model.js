import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
        {
                project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
                paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod", required: true },
                amount: { type: Number, required: true, min: 1 },
                donorName: { type: String, trim: true },
                donorPhone: { type: String, trim: true },
        },
        { timestamps: true }
);

export default mongoose.model("Donation", donationSchema);
