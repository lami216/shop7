import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarIcon, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import apiClient from "../lib/apiClient";

const formatDate = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
};

const parseYoutubeId = (url) => {
        const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/i;
        const match = url.match(regex);
        return match ? match[1] : null;
};

const mapVideoToEmbed = (url) => {
        if (!url || typeof url !== "string") return null;
        const trimmed = url.trim();
        const youtubeId = parseYoutubeId(trimmed);
        if (youtubeId) {
                return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${youtubeId}` };
        }

        if (/facebook\.com/i.test(trimmed)) {
                return {
                        type: "facebook",
                        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false`,
                };
        }

        return null;
};

const VideoFrame = ({ embed }) => {
        if (embed.type === "facebook") {
                return (
                        <iframe
                                src={embed.embedUrl}
                                title='Facebook video'
                                className='h-64 w-full rounded-xl border border-ajv-mint/60'
                                allow='autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share'
                                allowFullScreen
                        />
                );
        }

        return (
                <iframe
                        src={embed.embedUrl}
                        title='YouTube video player'
                        className='h-64 w-full rounded-xl border border-ajv-mint/60'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                        allowFullScreen
                />
        );
};

const AchievementDetailPage = () => {
        const { id } = useParams();
        const navigate = useNavigate();
        const [achievement, setAchievement] = useState(null);
        const [videoIndex, setVideoIndex] = useState(0);
        const [imageIndex, setImageIndex] = useState(0);
        const [autoPlayImages, setAutoPlayImages] = useState(true);

        const videoEmbeds = useMemo(
                () => (achievement?.videos || []).map(mapVideoToEmbed).filter(Boolean),
                [achievement]
        );

        useEffect(() => {
                const loadAchievement = async () => {
                        try {
                                const data = await apiClient.get(`/achievements/${id}`);
                                setAchievement(data);
                        } catch (error) {
                                toast.error("تعذّر تحميل تفاصيل الإنجاز");
                                navigate("/achievements");
                        }
                };

                loadAchievement();
        }, [id, navigate]);

        useEffect(() => {
                if (!achievement?.images?.length || !autoPlayImages) return;

                const interval = setInterval(() => {
                        setImageIndex((prev) => (prev + 1) % achievement.images.length);
                }, 3500);

                return () => clearInterval(interval);
        }, [achievement?.images, autoPlayImages]);

        useEffect(() => {
                setVideoIndex(0);
                setImageIndex(0);
                setAutoPlayImages(true);
        }, [achievement]);

        const handleImageNav = (direction) => {
                if (!achievement?.images?.length) return;
                setAutoPlayImages(false);
                setImageIndex((prev) => {
                        const total = achievement.images.length;
                        if (direction === "prev") {
                                return (prev - 1 + total) % total;
                        }
                        return (prev + 1) % total;
                });
        };

        const handleVideoNav = (direction) => {
                if (!videoEmbeds.length) return;
                setVideoIndex((prev) => {
                        const total = videoEmbeds.length;
                        if (direction === "prev") {
                                return (prev - 1 + total) % total;
                        }
                        return (prev + 1) % total;
                });
        };

        if (!achievement) {
                return (
                        <div className='flex h-64 items-center justify-center text-ajv-moss'>
                                جار التحميل...
                        </div>
                );
        }

        const hasMultipleVideos = videoEmbeds.length > 1;

        return (
                <div className='mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-10'>
                        <div className='mb-4 flex items-center justify-between text-sm text-ajv-moss/80'>
                                <Link
                                        to='/achievements'
                                        className='rounded-full bg-ajv-cream px-3 py-1 shadow-sm hover:bg-ajv-mint/60'
                                >
                                        ← العودة للإنجازات
                                </Link>
                        </div>

                        <div className='space-y-6'>
                                {videoEmbeds.length > 0 && (
                                        <div className='rounded-2xl border border-ajv-mint/60 bg-white p-4 shadow card-shadow'>
                                                {videoEmbeds.length === 1 ? (
                                                        <VideoFrame embed={videoEmbeds[0]} />
                                                ) : (
                                                        <div className='space-y-3'>
                                                                <div className='relative'>
                                                                        <VideoFrame embed={videoEmbeds[videoIndex]} />
                                                                        {hasMultipleVideos && (
                                                                                <>
                                                                                        <button
                                                                                                className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-ajv-mint'
                                                                                                onClick={() => handleVideoNav("next")}
                                                                                                aria-label='التالي'
                                                                                        >
                                                                                                <ChevronLeft className='h-5 w-5 text-ajv-moss' />
                                                                                        </button>
                                                                                        <button
                                                                                                className='absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-ajv-mint'
                                                                                                onClick={() => handleVideoNav("prev")}
                                                                                                aria-label='السابق'
                                                                                        >
                                                                                                <ChevronRight className='h-5 w-5 text-ajv-moss' />
                                                                                        </button>
                                                                                </>
                                                                        )}
                                                                </div>
                                                                {hasMultipleVideos && (
                                                                        <div className='text-center text-sm font-semibold text-ajv-moss'>
                                                                                الفيديو {videoIndex + 1} من {videoEmbeds.length}
                                                                        </div>
                                                                )}
                                                        </div>
                                                )}
                                        </div>
                                )}

                                {achievement.images?.length > 0 && (
                                        <div className='relative overflow-hidden rounded-2xl border border-ajv-mint/60 bg-white p-4 shadow card-shadow'>
                                                <div className='relative h-80 w-full overflow-hidden rounded-xl bg-ajv-cream/60'>
                                                        <img
                                                                src={achievement.images[imageIndex]}
                                                                alt={`صورة الإنجاز ${imageIndex + 1}`}
                                                                className='h-full w-full object-cover transition duration-500'
                                                        />
                                                        {achievement.images.length > 1 && (
                                                                <>
                                                                        <button
                                                                                className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-ajv-mint'
                                                                                onClick={() => handleImageNav("next")}
                                                                                aria-label='التالي'
                                                                        >
                                                                                <ChevronLeft className='h-5 w-5 text-ajv-moss' />
                                                                        </button>
                                                                        <button
                                                                                className='absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-ajv-mint'
                                                                                onClick={() => handleImageNav("prev")}
                                                                                aria-label='السابق'
                                                                        >
                                                                                <ChevronRight className='h-5 w-5 text-ajv-moss' />
                                                                        </button>
                                                                </>
                                                        )}
                                                </div>
                                                {achievement.images.length > 1 && (
                                                        <div className='mt-3 flex justify-center gap-2'>
                                                                {achievement.images.map((_, idx) => (
                                                                        <span
                                                                                key={idx}
                                                                                className={`h-2 w-2 rounded-full ${idx === imageIndex ? "bg-ajv-green" : "bg-ajv-mint"}`}
                                                                        />
                                                                ))}
                                                        </div>
                                                )}
                                        </div>
                                )}

                                <div className='rounded-2xl border border-ajv-mint/60 bg-white p-6 shadow card-shadow'>
                                        <div className='flex flex-col gap-2 text-right'>
                                                <h1 className='text-3xl font-bold text-ajv-moss'>{achievement.title}</h1>
                                                <div className='flex flex-wrap items-center gap-3 text-sm text-ajv-moss/70'>
                                                        <span className='flex items-center gap-1'>
                                                                <CalendarIcon className='h-5 w-5' />
                                                                {formatDate(achievement.date)}
                                                        </span>
                                                        {achievement.location && (
                                                                <span className='flex items-center gap-1'>
                                                                        <MapPin className='h-5 w-5' />
                                                                        {achievement.location}
                                                                </span>
                                                        )}
                                                </div>
                                                <p className='mt-2 whitespace-pre-line text-ajv-moss/90 leading-relaxed'>
                                                        {achievement.fullDescription}
                                                </p>
                                        </div>
                                </div>
                        </div>
                </div>
        );
};

export default AchievementDetailPage;
