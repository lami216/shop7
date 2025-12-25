import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
        {
                project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
                projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
                paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod" },
                paymentApp: { type: String, trim: true, required: true },
                amount: { type: Number, required: true, min: 1 },
                donorName: { type: String, trim: true },
                payerName: { type: String, trim: true },
                donorPhone: { type: String, trim: true },
                phone: { type: String, trim: true },
                projectNumber: { type: String, trim: true },
        receiptImageUrl: { type: String, default: "" },
        status: {
                type: String,
                enum: ["pending", "confirmed", "rejected"],
                default: "confirmed",
        },
        },
        { timestamps: true }
);

donationSchema.pre("save", function (next) {
        if (!this.project && this.projectId) {
                this.project = this.projectId;
        }
        if (!this.projectId && this.project) {
                this.projectId = this.project;
        }
        if (!this.donorName && this.payerName) {
                this.donorName = this.payerName;
        }
        if (!this.donorPhone && this.phone) {
                this.donorPhone = this.phone;
        }
        next();
});

export default mongoose.model("Donation", donationSchema);
