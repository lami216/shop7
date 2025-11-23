import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
        {
                title: { type: String, required: true, trim: true },
                shortDescription: { type: String, required: true, trim: true },
                description: { type: String, required: true, trim: true },
                category: { type: String, default: "للمشاريع العامة", trim: true },
                imageUrl: { type: String, default: "" },
                targetAmount: { type: Number, required: true, min: 0 },
                isActive: { type: Boolean, default: true },
                status: {
                        type: String,
                        enum: ["active", "hidden", "draft"],
                        default: "active",
                },
        },
        { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
