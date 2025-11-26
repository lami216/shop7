import Achievement from "../models/achievement.model.js";
import { uploadImage } from "../lib/imagekit.js";

const createHttpError = (status, message) => {
        const error = new Error(message);
        error.status = status;
        return error;
};

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ACHIEVEMENT_MIN_IMAGES = 3;
const ACHIEVEMENT_MAX_IMAGES = 15;

const calculateBase64Size = (base64String = "") => {
        const payload = base64String.split(",")[1] || "";
        return Math.ceil((payload.length * 3) / 4);
};

const assertImageSizeWithinLimit = (image) => {
        if (!image?.startsWith("data:")) return;
        const estimatedBytes = calculateBase64Size(image);
        if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
                throw createHttpError(400, "حجم الصورة يتجاوز الحد الأقصى (2 ميغابايت لكل صورة)");
        }
};

const normalizeVideos = (videos = []) =>
        (videos || [])
                .filter((video) => typeof video === "string")
                .map((video) => video.trim())
                .filter(Boolean);

const uploadAchievementImages = async (images = []) => {
        if (!Array.isArray(images)) {
                throw createHttpError(400, "صيغة الصور غير صالحة");
        }

        const trimmedImages = images
                .map((image) => (typeof image === "string" ? image.trim() : ""))
                .filter(Boolean);

        if (trimmedImages.length < ACHIEVEMENT_MIN_IMAGES || trimmedImages.length > ACHIEVEMENT_MAX_IMAGES) {
                throw createHttpError(400, "يجب إرفاق ما بين 3 إلى 15 صورة لكل إنجاز");
        }

        const finalImages = [];

        for (const image of trimmedImages) {
                if (image.startsWith("data:")) {
                        assertImageSizeWithinLimit(image);
                        const uploadResult = await uploadImage(image, "achievements");
                        finalImages.push(uploadResult.url);
                } else {
                        finalImages.push(image);
                }
        }

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
