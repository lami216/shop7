import Donation from "../models/donation.model.js";
import Project from "../models/project.model.js";
import { cleanupImageIds, uploadSanitizedImage } from "../lib/imageAssets.js";

const createHttpError = (status, message) => {
        const error = new Error(message);
        error.status = status;
        return error;
};

const PROJECT_MIN_IMAGES = 3;
const PROJECT_MAX_IMAGES = 5;
const PROJECT_UPDATE_FIELDS = [
        "title",
        "shortDescription",
        "description",
        "category",
        "targetAmount",
        "status",
        "isActive",
        "isClosed",
];

const normalizeProjectImageInput = (image) => {
        if (typeof image === "string") {
                const trimmed = image.trim();
                return trimmed ? { url: trimmed } : null;
        }

        if (image && typeof image === "object") {
                const url = typeof image.url === "string" ? image.url.trim() : "";
                return url ? { url } : null;
        }

        return null;
};

const uploadProjectImages = async (images = [], existingFileIdsByUrl = new Map()) => {
        if (!Array.isArray(images)) {
                throw createHttpError(400, "صيغة صور المشروع غير صالحة");
        }

        const validImages = images.map(normalizeProjectImageInput).filter(Boolean);

        if (validImages.length < PROJECT_MIN_IMAGES || validImages.length > PROJECT_MAX_IMAGES) {
                throw createHttpError(400, "يجب رفع ما بين 3 إلى 5 صور للمشروع");
        }

        const assets = [];
        const uploadedFileIds = [];

        try {
                for (const image of validImages) {
                        if (image.url.startsWith("data:")) {
                                const uploadResult = await uploadSanitizedImage(image.url, "projects");
                                assets.push({ url: uploadResult.url, fileId: uploadResult.fileId });
                                uploadedFileIds.push(uploadResult.fileId);
                        } else {
                                if (!existingFileIdsByUrl.has(image.url)) {
                                        throw createHttpError(400, "مرجع صورة المشروع غير صالح");
                                }
                                assets.push({ url: image.url, fileId: existingFileIdsByUrl.get(image.url) || null });
                        }
                }
        } catch (error) {
                await cleanupImageIds(uploadedFileIds);
                throw error;
        }

        return { assets, uploadedFileIds };
};

const buildTotalsMap = (totals = []) => {
        const map = new Map();
        totals.forEach((item) => {
                if (item?._id) {
                        map.set(item._id.toString(), item.totalAmount || 0);
                }
        });
        return map;
};

const enrichProject = (project, totalsMap) => {
        const currentAmount = totalsMap.get(project._id.toString()) || 0;
        const targetAmount = project.targetAmount || 0;
        const remainingAmount = Math.max(targetAmount - currentAmount, 0);
        const progress = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;

        return {
                ...project,
                currentAmount,
                remainingAmount,
                progress,
        };
};

export const createProject = async (req, res) => {
        let uploadedFileIds = [];
        try {
                const {
                        title,
                        shortDescription,
                        description,
                        category,
                        images,
                        targetAmount,
                        status,
                        isActive,
                        isClosed = false,
                } = req.body;

                const uploadBatch = await uploadProjectImages(images);
                const uploadedImages = uploadBatch.assets;
                uploadedFileIds = uploadBatch.uploadedFileIds;

                const project = await Project.create({
                        title,
                        shortDescription,
                        description,
                        category,
                        images: uploadedImages,
                        imageUrl: uploadedImages[0]?.url || "",
                        imageFileId: uploadedImages[0]?.fileId || null,
                        targetAmount,
                        status,
                        isActive,
                        isClosed,
                });

                res.status(201).json(project);
        } catch (error) {
                await cleanupImageIds(uploadedFileIds);
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error creating project");
                }
                res.status(status).json({ message: "تعذّر إنشاء المشروع" });
        }
};

export const updateProject = async (req, res) => {
        let uploadedFileIds = [];
        let previousFileIdsToDelete = [];
        let persisted = false;
        try {
                const project = await Project.findById(req.params.id);

                if (!project) {
                        return res.status(404).json({ message: "المشروع غير موجود" });
                }

                const { images } = req.body || {};

                if (images !== undefined) {
                        const previousFileIds = (project.images || []).map((img) => img.fileId).filter(Boolean);
                        const existingFileIdsByUrl = new Map(
                                (project.images || []).map((image) => [image.url, image.fileId || null]),
                        );
                        if (project.imageUrl && !existingFileIdsByUrl.has(project.imageUrl)) {
                                existingFileIdsByUrl.set(project.imageUrl, project.imageFileId || null);
                        }
                        const uploadBatch = await uploadProjectImages(images, existingFileIdsByUrl);
                        const uploadedImages = uploadBatch.assets;
                        uploadedFileIds = uploadBatch.uploadedFileIds;
                        const newFileIds = new Set(uploadedImages.map((img) => img.fileId).filter(Boolean));
                        previousFileIdsToDelete = previousFileIds.filter((fileId) => !newFileIds.has(fileId));

                        project.images = uploadedImages;
                        project.imageUrl = uploadedImages[0]?.url || "";
                        project.imageFileId = uploadedImages[0]?.fileId || null;
                }

                PROJECT_UPDATE_FIELDS.forEach((key) => {
                        if (req.body?.[key] !== undefined) project[key] = req.body[key];
                });

                await project.save();
                persisted = true;
                await cleanupImageIds(previousFileIdsToDelete);

                res.json(project);
        } catch (error) {
                if (!persisted) await cleanupImageIds(uploadedFileIds);
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error updating project");
                }
                res.status(status).json({ message: "تعذّر تحديث المشروع" });
        }
};

export const getProjects = async (_req, res) => {
        try {
                const [projects, donationTotals] = await Promise.all([
                        Project.find().sort({ createdAt: -1 }).lean(),
                        Donation.aggregate([
                                { $match: { status: "confirmed" } },
                                { $group: { _id: "$project", totalAmount: { $sum: "$amount" } } },
                        ]),
                ]);

                const totalsMap = buildTotalsMap(donationTotals);

                const projectsWithStats = projects.map((project) => enrichProject(project, totalsMap));

                res.json(projectsWithStats);
        } catch (error) {
                console.log("Error fetching projects");
                res.status(500).json({ message: "تعذّر تحميل المشاريع" });
        }
};

export const getProjectById = async (req, res) => {
        try {
                const project = await Project.findById(req.params.id).lean();

                if (!project) {
                        return res.status(404).json({ message: "المشروع غير موجود" });
                }

                const donationTotals = await Donation.aggregate([
                        { $match: { project: project._id, status: "confirmed" } },
                        { $group: { _id: "$paymentMethod", totalAmount: { $sum: "$amount" }, donationsCount: { $sum: 1 } } },
                        {
                                $lookup: {
                                        from: "paymentmethods",
                                        localField: "_id",
                                        foreignField: "_id",
                                        as: "paymentMethod",
                                },
                        },
                        { $unwind: { path: "$paymentMethod", preserveNullAndEmptyArrays: true } },
                ]);

                const projectTotal = donationTotals.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
                const totalsMap = buildTotalsMap([{ _id: project._id, totalAmount: projectTotal }]);
                const projectWithStats = enrichProject(project, totalsMap);
                const currentAmount = projectWithStats.currentAmount;

                const paymentBreakdown = donationTotals.map((item) => {
                        const percentage = currentAmount > 0 ? Math.round((item.totalAmount / currentAmount) * 100) : 0;
                        return {
                                paymentMethodId: item.paymentMethod?._id,
                                name: item.paymentMethod?.name || "غير محدد",
                                imageUrl: item.paymentMethod?.imageUrl || "",
                                accountNumber: item.paymentMethod?.accountNumber || "",
                                totalAmount: item.totalAmount,
                                donationsCount: item.donationsCount,
                                percentage,
                        };
                });

                res.json({
                        project: projectWithStats,
                        stats: {
                                currentAmount,
                                targetAmount: project.targetAmount,
                                remainingAmount: projectWithStats.remainingAmount,
                                progress: projectWithStats.progress,
                        },
                        paymentBreakdown,
                });
        } catch (error) {
                console.log("Error fetching project");
                res.status(500).json({ message: "تعذّر تحميل تفاصيل المشروع" });
        }
};
