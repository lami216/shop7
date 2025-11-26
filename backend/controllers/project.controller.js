import Donation from "../models/donation.model.js";
import Project from "../models/project.model.js";
import { deleteImage, uploadImage } from "../lib/imagekit.js";

const createHttpError = (status, message) => {
        const error = new Error(message);
        error.status = status;
        return error;
};

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const PROJECT_MIN_IMAGES = 3;
const PROJECT_MAX_IMAGES = 5;

const calculateBase64Size = (base64String = "") => {
        const payload = base64String.split(",")[1] || "";
        return Math.ceil((payload.length * 3) / 4);
};

const assertImageSizeWithinLimit = (image, label) => {
        if (!image?.startsWith("data:")) return;
        const estimatedBytes = calculateBase64Size(image);
        if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
                throw createHttpError(400, `${label} يتجاوز الحد الأقصى المسموح (2 ميغابايت لكل صورة)`);
        }
};

const uploadProjectImages = async (images = []) => {
        if (!Array.isArray(images)) {
                throw createHttpError(400, "صيغة صور المشروع غير صالحة");
        }

        const validImages = images
                .map((image) => (typeof image === "string" ? image.trim() : ""))
                .filter(Boolean);

        if (validImages.length < PROJECT_MIN_IMAGES || validImages.length > PROJECT_MAX_IMAGES) {
                throw createHttpError(400, "يجب رفع ما بين 3 إلى 5 صور للمشروع");
        }

        const uploads = [];

        for (const image of validImages) {
                if (image.startsWith("data:")) {
                        assertImageSizeWithinLimit(image, "حجم الصورة");
                        const uploadResult = await uploadImage(image, "projects");
                        uploads.push({ url: uploadResult.url, fileId: uploadResult.fileId });
                } else {
                        uploads.push({ url: image, fileId: null });
                }
        }

        return uploads;
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

                const uploadedImages = await uploadProjectImages(images);

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
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error creating project", error.message);
                }
                res.status(status).json({ message: "تعذّر إنشاء المشروع", error: error.message });
        }
};

export const updateProject = async (req, res) => {
        try {
                const project = await Project.findById(req.params.id);

                if (!project) {
                        return res.status(404).json({ message: "المشروع غير موجود" });
                }

                const { images, ...updates } = req.body || {};

                if (images !== undefined) {
                        const previousFileIds = (project.images || []).map((img) => img.fileId).filter(Boolean);
                        const uploadedImages = await uploadProjectImages(images);
                        const newFileIds = new Set(uploadedImages.map((img) => img.fileId).filter(Boolean));
                        const toDelete = previousFileIds.filter((fileId) => !newFileIds.has(fileId));

                        if (toDelete.length) {
                                await Promise.all(toDelete.map((fileId) => deleteImage(fileId)));
                        }

                        project.images = uploadedImages;
                        project.imageUrl = uploadedImages[0]?.url || "";
                        project.imageFileId = uploadedImages[0]?.fileId || null;
                }

                Object.entries(updates).forEach(([key, value]) => {
                        project[key] = value;
                });

                await project.save();

                res.json(project);
        } catch (error) {
                const status = error.status || 500;
                if (status >= 500) {
                        console.log("Error updating project", error.message);
                }
                res.status(status).json({ message: "تعذّر تحديث المشروع", error: error.message });
        }
};

export const getProjects = async (_req, res) => {
        try {
                const [projects, donationTotals] = await Promise.all([
                        Project.find().sort({ createdAt: -1 }).lean(),
                        Donation.aggregate([
                                { $group: { _id: "$project", totalAmount: { $sum: "$amount" } } },
                        ]),
                ]);

                const totalsMap = buildTotalsMap(donationTotals);

                const projectsWithStats = projects.map((project) => enrichProject(project, totalsMap));

                res.json(projectsWithStats);
        } catch (error) {
                console.log("Error fetching projects", error.message);
                res.status(500).json({ message: "تعذّر تحميل المشاريع", error: error.message });
        }
};

export const getProjectById = async (req, res) => {
        try {
                const project = await Project.findById(req.params.id).lean();

                if (!project) {
                        return res.status(404).json({ message: "المشروع غير موجود" });
                }

                const donationTotals = await Donation.aggregate([
                        { $match: { project: project._id } },
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
                console.log("Error fetching project", error.message);
                res.status(500).json({ message: "تعذّر تحميل تفاصيل المشروع", error: error.message });
        }
};
