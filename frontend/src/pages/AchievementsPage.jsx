import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AchievementCard from "../components/AchievementCard";
import apiClient from "../lib/apiClient";

const AchievementsPage = () => {
        const [achievements, setAchievements] = useState([]);

        useEffect(() => {
                const loadAchievements = async () => {
                        try {
                                const data = await apiClient.get("/achievements");
                                setAchievements(data || []);
                        } catch (error) {
                                toast.error("تعذّر تحميل الإنجازات");
                        }
                };

                loadAchievements();
        }, []);

        return (
                <div className='mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10'>
                        <div className='mb-6 flex flex-col gap-2 text-right'>
                                <p className='text-sm text-ajv-moss/70'>أعمال تطوعية وحملات ميدانية</p>
                                <h1 className='text-3xl font-bold text-ajv-moss'>إنجازات AJV</h1>
                                <p className='text-ajv-moss/80'>استكشف قصص الشباب التطوعية والصور والفيديوهات التي توثق جهودهم.</p>
                        </div>

                        {achievements.length === 0 ? (
                                <div className='rounded-2xl border border-ajv-mint/60 bg-white p-6 text-center text-ajv-moss/80 shadow-sm'>
                                        لا توجد إنجازات منشورة حالياً.
                                </div>
                        ) : (
                                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                                        {achievements.map((achievement) => (
                                                <AchievementCard key={achievement._id} achievement={achievement} showBadge />
                                        ))}
                                </div>
                        )}
                </div>
        );
};

export default AchievementsPage;
