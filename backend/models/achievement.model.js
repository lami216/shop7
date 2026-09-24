import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
        {
                title: { type: String, required: true, trim: true },
                shortDescription: { type: String, required: true, trim: true },
                fullDescription: { type: String, required: true, trim: true },
                date: { type: Date, required: true },
                location: { type: String, trim: true },
                images: { type: [String], default: [] },
                imageFileIds: { type: [String], default: [] },
                imageAssets: {
                        type: [{
                                url: { type: String, required: true },
                                fileId: { type: String, default: null },
                        }],
                        default: [],
                },
                videos: { type: [String], default: [] },
                showOnHome: { type: Boolean, default: false },
        },
        { timestamps: true }
);

export default mongoose.model("Achievement", achievementSchema);
