import Donation from "../models/donation.model.js";
import Project from "../models/project.model.js";

export const getSiteStatistics = async (_req, res) => {
        try {
                const [totalDonationsAgg, donationCount, donorGroups, projects, donationsByProject] = await Promise.all([
                        Donation.aggregate([
                                { $match: { status: "confirmed" } },
                                { $group: { _id: null, total: { $sum: "$amount" } } },
                        ]),
                        Donation.countDocuments({ status: "confirmed" }),
                        Donation.aggregate([
                                { $match: { status: "confirmed" } },
                                { $group: { _id: { phone: "$donorPhone", name: "$donorName" } } },
                        ]),
                        Project.find().lean(),
                        Donation.aggregate([
                                { $match: { status: "confirmed" } },
                                { $group: { _id: "$project", totalAmount: { $sum: "$amount" } } },
                        ]),
                ]);

                const totalDonations = totalDonationsAgg[0]?.total || 0;
                const donorsCount = donorGroups.length;
                const totalProjects = projects.length;

                const donationMap = new Map();
                donationsByProject.forEach((item) => donationMap.set(item._id.toString(), item.totalAmount));

                let completedProjects = 0;
                projects.forEach((project) => {
                        const currentAmount = donationMap.get(project._id.toString()) || 0;
                        if (project.targetAmount > 0 && currentAmount >= project.targetAmount) {
                                completedProjects += 1;
                        }
                });

                res.json({
                        totalDonations,
                        donationCount,
                        donorsCount,
                        totalProjects,
                        completedProjects,
                });
        } catch (error) {
                console.log("Error building statistics", error.message);
                res.status(500).json({ message: "تعذّر تحميل الإحصائيات", error: error.message });
        }
};
