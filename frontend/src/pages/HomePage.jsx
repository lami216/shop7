import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import AchievementCard from "../components/AchievementCard";
import ProjectCard from "../components/ProjectCard";
import StatsGrid from "../components/StatsGrid";

const HomePage = () => {
        const [projects, setProjects] = useState([]);
        const [achievements, setAchievements] = useState([]);
        const [paymentMethods, setPaymentMethods] = useState([]);
        const [stats, setStats] = useState({});
        const [logoError, setLogoError] = useState(false);

        useEffect(() => {
                const loadData = async () => {
                        try {
                                const [projectsRes, paymentsRes, statsRes, achievementsRes] = await Promise.all([
                                        apiClient.get("/projects"),
                                        apiClient.get("/payment-methods"),
                                        apiClient.get("/statistics"),
                                        apiClient.get("/achievements?showOnHome=true"),
                                ]);
                                setProjects(projectsRes);
                                setPaymentMethods(paymentsRes);
                                setStats(statsRes);
                                setAchievements(achievementsRes || []);
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
                                        <div className='flex h-full w-full items-center justify-center rounded-2xl bg-ajv-mint/60 p-5 text-center text-ajv-moss shadow-inner'>
                                                <div className='flex items-center justify-center rounded-3xl border border-ajv-mint/70 bg-white p-6 shadow-lg'>
                                                        <div className='flex h-48 w-48 items-center justify-center rounded-2xl bg-ajv-cream/70 p-6 shadow-inner ring-1 ring-ajv-mint/60'>
                                                                {!logoError && (
                                                                        <img
                                                                                src='/ajv-short-logo.png'
                                                                                alt='شعار AJV'
                                                                                className='h-full w-full object-contain'
                                                                                onError={() => setLogoError(true)}
                                                                        />
                                                                )}
                                                        </div>
                                                </div>
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

                        <section className='mt-10'>
                                <div className='mb-4 flex items-center justify-between'>
                                        <div>
                                                <p className='text-sm text-ajv-moss/70'>قصص ميدانية من فريق الشباب</p>
                                                <h2 className='text-2xl font-bold text-ajv-moss'>إنجازات AJV</h2>
                                        </div>
                                        <Link
                                                to='/achievements'
                                                className='rounded-full bg-ajv-green px-4 py-2 text-sm font-semibold text-white shadow hover:bg-ajv-moss'
                                        >
                                                عرض كل الإنجازات
                                        </Link>
                                </div>
                                {achievements.length === 0 ? (
                                        <div className='rounded-2xl border border-ajv-mint/60 bg-white p-6 text-center text-ajv-moss/80 shadow-sm'>
                                                لا توجد إنجازات مفعلة للعرض حالياً.
                                        </div>
                                ) : (
                                        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                                                {achievements.slice(0, 4).map((achievement) => (
                                                        <AchievementCard key={achievement._id} achievement={achievement} showBadge />
                                                ))}
                                        </div>
                                )}
                        </section>

                        <StatsGrid stats={stats} />
                </div>
        );
};

export default HomePage;
