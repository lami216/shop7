import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
        {
                project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
                projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
                paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod" },
                paymentApp: { type: String, trim: true, required: true, maxlength: 120 },
                amount: {
                        type: Number,
                        required: true,
                        min: 0.01,
                        max: 1_000_000_000,
                        validate: {
                                validator: (value) => Number(value.toFixed(2)) === value,
                                message: "Donation amount supports at most two decimal places",
                        },
                },
                donorName: { type: String, trim: true, maxlength: 120 },
                payerName: { type: String, trim: true, maxlength: 120 },
                donorPhone: { type: String, trim: true, maxlength: 40 },
                phone: { type: String, trim: true, maxlength: 40 },
                projectNumber: { type: String, trim: true, maxlength: 100 },
        receiptImageUrl: { type: String, default: "" },
        status: {
                type: String,
                enum: ["pending", "confirmed", "rejected"],
                default: "pending",
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
