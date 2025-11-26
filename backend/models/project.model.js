import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
        {
                title: { type: String, required: true, trim: true },
        shortDescription: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        category: { type: String, default: "للمشاريع العامة", trim: true },
        images: {
                type: [
                        {
                                url: { type: String, default: "" },
                                fileId: { type: String, default: null },
                        },
                ],
                default: [],
        },
        imageUrl: { type: String, default: "" },
        imageFileId: { type: String, default: null },
        targetAmount: { type: Number, required: true, min: 0 },
        isActive: { type: Boolean, default: true },
        isClosed: { type: Boolean, default: false },
        status: {
                        type: String,
                        enum: ["active", "hidden", "draft"],
                        default: "active",
                },
        },
        { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
