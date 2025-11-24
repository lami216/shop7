import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
        {
                title: { type: String, required: true, trim: true },
                shortDescription: { type: String, required: true, trim: true },
                fullDescription: { type: String, required: true, trim: true },
                date: { type: Date, required: true },
                location: { type: String, trim: true },
                images: { type: [String], default: [] },
                videos: { type: [String], default: [] },
                showOnHome: { type: Boolean, default: false },
        },
        { timestamps: true }
);

export default mongoose.model("Achievement", achievementSchema);
