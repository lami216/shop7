import { CalendarIcon, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const formatDate = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
};

const AchievementCard = ({ achievement, showBadge = false }) => {
        const coverImage = achievement.images?.[0] || "/achievement-placeholder.svg";

        return (
                <div className='flex h-full flex-col overflow-hidden rounded-2xl border border-ajv-mint/50 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg'>
                        <div className='relative h-52 w-full overflow-hidden bg-ajv-cream/80'>
                                <img src={coverImage} alt={achievement.title} className='h-full w-full object-cover' />
                                {showBadge && (
                                        <span className='absolute right-3 top-3 rounded-full bg-ajv-green/90 px-3 py-1 text-xs font-semibold text-white shadow'>
                                                نشاط تطوعي
                                        </span>
                                )}
                        </div>
                        <div className='flex flex-1 flex-col gap-2 p-4'>
                                <div className='space-y-1'>
                                        <h3 className='line-clamp-2 text-lg font-bold text-ajv-moss'>{achievement.title}</h3>
                                        <p className='line-clamp-2 text-sm text-ajv-moss/80'>{achievement.shortDescription}</p>
                                </div>
                                <div className='mt-auto flex flex-wrap items-center gap-3 text-xs text-ajv-moss/70'>
                                        <span className='flex items-center gap-1'>
                                                <CalendarIcon className='h-4 w-4' />
                                                {formatDate(achievement.date)}
                                        </span>
                                        {achievement.location && (
                                                <span className='flex items-center gap-1'>
                                                        <MapPin className='h-4 w-4' />
                                                        {achievement.location}
                                                </span>
                                        )}
                                </div>
                                <div className='pt-2'>
                                        <Link
                                                to={`/achievements/${achievement._id}`}
                                                className='inline-flex items-center justify-center rounded-xl bg-ajv-green px-3 py-2 text-sm font-semibold text-white shadow hover:bg-ajv-moss'
                                        >
                                                عرض الإنجاز
                                        </Link>
                                </div>
                        </div>
                </div>
        );
};

export default AchievementCard;
