import Achievement from "../models/achievement.model.js";
import { cleanupImageIds, uploadSanitizedImage } from "../lib/imageAssets.js";

const createHttpError = (status, message) => {
        const error = new Error(message);
        error.status = status;
        return error;
};

const ACHIEVEMENT_MIN_IMAGES = 3;
const ACHIEVEMENT_MAX_IMAGES = 15;
const ACHIEVEMENT_UPDATE_FIELDS = [
        "title",
        "shortDescription",
        "fullDescription",
        "date",
        "location",
        "videos",
        "showOnHome",
];

const normalizeVideos = (videos = []) =>
        (videos || [])
                .filter((video) => typeof video === "string")
                .map((video) => video.trim())
                .filter(Boolean);

const uploadAchievementImages = async (images = [], existingFileIdsByUrl = new Map()) => {
        if (!Array.isArray(images)) {
                throw createHttpError(400, "صيغة الصور غير صالحة");
        }

        const trimmedImages = images
                .map((image) => (typeof image === "string" ? image.trim() : ""))
                .filter(Boolean);

        if (trimmedImages.length < ACHIEVEMENT_MIN_IMAGES || trimmedImages.length > ACHIEVEMENT_MAX_IMAGES) {
                throw createHttpError(400, "يجب إرفاق ما بين 3 إلى 15 صورة لكل إنجاز");
        }

        const assets = [];
        const uploadedFileIds = [];

        try {
                for (const image of trimmedImages) {
                        if (image.startsWith("data:")) {
                                const uploadResult = await uploadSanitizedImage(image, "achievements");
                                assets.push({ url: uploadResult.url, fileId: uploadResult.fileId });
                                uploadedFileIds.push(uploadResult.fileId);
                        } else {
                                if (!existingFileIdsByUrl.has(image)) {
                                        throw createHttpError(400, "مرجع صورة الإنجاز غير صالح");
                                }
                                assets.push({ url: image, fileId: existingFileIdsByUrl.get(image) || null });
                        }
                }
        } catch (error) {
                await cleanupImageIds(uploadedFileIds);
                throw error;
        }

        return { assets, uploadedFileIds };
};

export const createAchievement = async (req, res) => {
        let uploadedFileIds = [];
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

                const uploadBatch = await uploadAchievementImages(images);
                const processedImages = uploadBatch.assets.map((asset) => asset.url);
                uploadedFileIds = uploadBatch.uploadedFileIds;
                const trimmedVideos = normalizeVideos(videos);
                const parsedDate = date ? new Date(date) : undefined;

                const achievement = await Achievement.create({
                        title,
                        shortDescription,
                        fullDescription,
                        date: parsedDate,
                        location,
                        images: processedImages,
                        imageFileIds: uploadBatch.assets.map((asset) => asset.fileId).filter(Boolean),
                        imageAssets: uploadBatch.assets,
                        videos: trimmedVideos,
                        showOnHome,
                });

                res.status(201).json(achievement);
        } catch (error) {
                await cleanupImageIds(uploadedFileIds);
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error creating achievement");
                }
                res.status(status).json({ message: "تعذّر إنشاء الإنجاز" });
        }
};

export const updateAchievement = async (req, res) => {
        let uploadedFileIds = [];
        let previousFileIdsToDelete = [];
        let persisted = false;
        try {
                const achievement = await Achievement.findById(req.params.id);

                if (!achievement) {
                        return res.status(404).json({ message: "الإنجاز غير موجود" });
                }

                const updates = {};
                ACHIEVEMENT_UPDATE_FIELDS.forEach((key) => {
                        if (req.body?.[key] !== undefined) updates[key] = req.body[key];
                });

                if (req.body?.images !== undefined) {
                        const currentAssets = achievement.imageAssets?.length
                                ? achievement.imageAssets
                                : (achievement.images || []).map((url, index) => ({
                                        url,
                                        fileId: achievement.imageFileIds?.[index] || null,
                                }));
                        const existingFileIdsByUrl = new Map(
                                currentAssets.map((asset) => [asset.url, asset.fileId]),
                        );
                        const uploadBatch = await uploadAchievementImages(req.body.images, existingFileIdsByUrl);
                        uploadedFileIds = uploadBatch.uploadedFileIds;
                        const retainedFileIds = new Set(uploadBatch.assets.map((asset) => asset.fileId).filter(Boolean));
                        previousFileIdsToDelete = currentAssets
                                .map((asset) => asset.fileId)
                                .filter((fileId) => fileId && !retainedFileIds.has(fileId));
                        updates.images = uploadBatch.assets.map((asset) => asset.url);
                        updates.imageFileIds = uploadBatch.assets.map((asset) => asset.fileId).filter(Boolean);
                        updates.imageAssets = uploadBatch.assets;
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
                persisted = true;
                await cleanupImageIds(previousFileIdsToDelete);

                res.json(achievement);
        } catch (error) {
                if (!persisted) await cleanupImageIds(uploadedFileIds);
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error updating achievement");
                }
                res.status(status).json({ message: "تعذّر تحديث الإنجاز" });
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
                console.log("Error fetching achievements");
                res.status(500).json({ message: "تعذّر تحميل الإنجازات" });
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
                console.log("Error fetching achievement");
                res.status(500).json({ message: "تعذّر تحميل تفاصيل الإنجاز" });
        }
};

export const deleteAchievement = async (req, res) => {
        try {
                const deleted = await Achievement.findByIdAndDelete(req.params.id);

                if (!deleted) {
                        return res.status(404).json({ message: "الإنجاز غير موجود" });
                }

                const fileIds = deleted.imageAssets?.length
                        ? deleted.imageAssets.map((asset) => asset.fileId)
                        : deleted.imageFileIds;
                await cleanupImageIds(fileIds);

                res.json({ message: "تم حذف الإنجاز" });
        } catch (error) {
                console.log("Error deleting achievement");
                res.status(500).json({ message: "تعذّر حذف الإنجاز" });
        }
};
