import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import ProjectCard from "../components/ProjectCard";
import StatsGrid from "../components/StatsGrid";

const HomePage = () => {
        const [projects, setProjects] = useState([]);
        const [paymentMethods, setPaymentMethods] = useState([]);
        const [stats, setStats] = useState({});
        const [logoError, setLogoError] = useState(false);

        useEffect(() => {
                const loadData = async () => {
                        try {
                                const [projectsRes, paymentsRes, statsRes] = await Promise.all([
                                        apiClient.get("/projects"),
                                        apiClient.get("/payment-methods"),
                                        apiClient.get("/statistics"),
                                ]);
                                setProjects(projectsRes);
                                setPaymentMethods(paymentsRes);
                                setStats(statsRes);
                        } catch (error) {
                                toast.error("تعذّر تحميل بيانات المنصة");
                        }
                };

                loadData();
        }, []);

        return (
                <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-10'>
                        <section className='mt-6 rounded-3xl border border-ajv-mint/70 bg-white p-6 shadow card-shadow'>
                                <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
                                        <div className='space-y-3 text-right'>
                                                <p className='text-sm font-semibold text-ajv-green'>منصة تبرعات AJV</p>
                                                <h1 className='text-3xl font-bold text-ajv-moss'>رابطة شباب الفلّانية</h1>
                                                <p className='text-ajv-moss/80'>
                                                        تبرع للمشاريع الخيرية الموثوقة، بخطوتين بسيطتين ودعم كامل للهوية الخضراء للجمعية.
                                                </p>
                                        </div>
                                        <div className='flex h-full w-full flex-col items-center justify-center rounded-2xl bg-ajv-mint/60 p-5 text-center text-ajv-moss shadow-inner'>
                                                <p className='text-sm text-ajv-moss/80'>شعار مختصر</p>
                                                <div className='mt-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-ajv-green shadow'>
                                                        {!logoError && (
                                                                <img
                                                                        src='/uploads/ajv-short-logo.png'
                                                                        alt='شعار AJV'
                                                                        className='h-full w-full rounded-2xl object-contain'
                                                                        onError={() => setLogoError(true)}
                                                                />
                                                        )}
                                                </div>
                                                <p className='mt-2 text-xs text-ajv-moss/70'>Association de la Jeunesse de Voullaniya</p>
                                        </div>
                                </div>
                        </section>

                        <section className='mt-10'>
                                <div className='mb-4 flex items-center justify-between'>
                                        <div>
                                                <p className='text-sm text-ajv-moss/70'>مشاريعنا الخيرية</p>
                                                <h2 className='text-2xl font-bold text-ajv-moss'>اختر مشروعك وتبرع الآن</h2>
                                        </div>
                                </div>
                                <div className='grid gap-4 md:grid-cols-2'>
                                        {projects.filter((p) => p.isActive && p.status === "active").length === 0 && (
                                                <div className='rounded-2xl border border-ajv-mint/60 bg-white p-6 text-center text-ajv-moss/80 shadow-sm'>
                                                        لا توجد مشاريع منشورة بعد.
                                                </div>
                                        )}
                                        {projects
                                                .filter((project) => project.isActive && project.status === "active")
                                                .map((project) => (
                                                <ProjectCard
                                                        key={project._id}
                                                        project={project}
                                                        paymentMethods={paymentMethods}
                                                        onDonationComplete={() => {
                                                                // refresh stats after new donation
                                                                apiClient.get("/statistics").then(setStats).catch(() => {});
                                                                apiClient.get("/projects").then(setProjects).catch(() => {});
                                                        }}
                                                />
                                        ))}
                                </div>
                        </section>

                        <StatsGrid stats={stats} />
                </div>
        );
};

export default HomePage;
