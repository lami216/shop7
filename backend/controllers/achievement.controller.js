import Achievement from "../models/achievement.model.js";
import { uploadImage } from "../lib/imagekit.js";

const normalizeVideos = (videos = []) =>
        (videos || [])
                .filter((video) => typeof video === "string")
                .map((video) => video.trim())
                .filter(Boolean);

const uploadAchievementImages = async (images = []) => {
        const finalImages = [];

        await Promise.all(
                (images || []).map(async (image) => {
                        if (typeof image !== "string") return;

                        const trimmed = image.trim();
                        if (!trimmed) return;

                        if (trimmed.startsWith("data:")) {
                                const uploadResult = await uploadImage(trimmed, "achievements");
                                finalImages.push(uploadResult.url);
                                return;
                        }

                        finalImages.push(trimmed);
                })
        );

        return finalImages;
};

export const createAchievement = async (req, res) => {
        try {
                const {
                        title,
                        shortDescription,
                        fullDescription,
                        date,
                        location,
                        images = [],
                        videos = [],
                        showOnHome = false,
                } = req.body;

                const processedImages = await uploadAchievementImages(images);
                const trimmedVideos = normalizeVideos(videos);
                const parsedDate = date ? new Date(date) : undefined;

                const achievement = await Achievement.create({
                        title,
                        shortDescription,
                        fullDescription,
                        date: parsedDate,
                        location,
                        images: processedImages,
                        videos: trimmedVideos,
                        showOnHome,
                });

                res.status(201).json(achievement);
        } catch (error) {
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error creating achievement", error.message);
                }
                res.status(status).json({ message: "تعذّر إنشاء الإنجاز", error: error.message });
        }
};

export const updateAchievement = async (req, res) => {
        try {
                const achievement = await Achievement.findById(req.params.id);

                if (!achievement) {
                        return res.status(404).json({ message: "الإنجاز غير موجود" });
                }

                const updates = { ...req.body };

                if (updates.images !== undefined) {
                        updates.images = await uploadAchievementImages(updates.images);
                }

                if (updates.videos) {
                        updates.videos = normalizeVideos(updates.videos);
                }

                if (updates.date) {
                        updates.date = new Date(updates.date);
                }

                Object.entries(updates).forEach(([key, value]) => {
                        if (value === undefined) return;
                        achievement[key] = value;
                });

                await achievement.save();

                res.json(achievement);
        } catch (error) {
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error updating achievement", error.message);
                }
                res.status(status).json({ message: "تعذّر تحديث الإنجاز", error: error.message });
        }
};

export const getAchievements = async (req, res) => {
        try {
                const filter = {};
                if (req.query.showOnHome === "true") {
                        filter.showOnHome = true;
                }

                const achievements = await Achievement.find(filter)
                        .sort({ date: -1, createdAt: -1 })
                        .lean();

                res.json(achievements);
        } catch (error) {
                console.log("Error fetching achievements", error.message);
                res.status(500).json({ message: "تعذّر تحميل الإنجازات", error: error.message });
        }
};

export const getAchievementById = async (req, res) => {
        try {
                const achievement = await Achievement.findById(req.params.id).lean();

                if (!achievement) {
                        return res.status(404).json({ message: "الإنجاز غير موجود" });
                }

                res.json(achievement);
        } catch (error) {
                console.log("Error fetching achievement", error.message);
                res.status(500).json({ message: "تعذّر تحميل تفاصيل الإنجاز", error: error.message });
        }
};

export const deleteAchievement = async (req, res) => {
        try {
                const deleted = await Achievement.findByIdAndDelete(req.params.id);

                if (!deleted) {
                        return res.status(404).json({ message: "الإنجاز غير موجود" });
                }

                res.json({ message: "تم حذف الإنجاز" });
        } catch (error) {
                console.log("Error deleting achievement", error.message);
                res.status(500).json({ message: "تعذّر حذف الإنجاز", error: error.message });
        }
};
