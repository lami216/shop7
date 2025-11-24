import Donation from "../models/donation.model.js";
import Project from "../models/project.model.js";
import { deleteImage, uploadImage } from "../lib/imagekit.js";

const createHttpError = (status, message) => {
        const error = new Error(message);
        error.status = status;
        return error;
};

const MAX_PROJECT_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const uploadProjectImage = async (image) => {
        if (!image || typeof image !== "string" || !image.startsWith("data:")) {
                throw createHttpError(400, "صيغة صورة المشروع غير صالحة");
        }

        const base64Payload = image.split(",")[1] || "";
        const estimatedBytes = Math.ceil((base64Payload.length * 3) / 4);

        if (estimatedBytes > MAX_PROJECT_IMAGE_SIZE_BYTES) {
                throw createHttpError(400, "حجم صورة المشروع يتجاوز الحد المسموح (10 ميجابايت)");
        }

        return uploadImage(image, "projects");
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
                        image,
                        targetAmount,
                        status,
                        isActive,
                        isClosed = false,
                } = req.body;

                const uploadResult = await uploadProjectImage(image);

                const project = await Project.create({
                        title,
                        shortDescription,
                        description,
                        category,
                        imageUrl: uploadResult.url,
                        imageFileId: uploadResult.fileId,
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

                const { image, ...updates } = req.body || {};

                if (image !== undefined) {
                        if (image) {
                                const uploadResult = await uploadProjectImage(image);
                                if (project.imageFileId) {
                                        await deleteImage(project.imageFileId);
                                }
                                project.imageUrl = uploadResult.url;
                                project.imageFileId = uploadResult.fileId;
                        } else {
                                if (project.imageFileId) {
                                        await deleteImage(project.imageFileId);
                                }
                                project.imageUrl = "";
                                project.imageFileId = null;
                        }
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
