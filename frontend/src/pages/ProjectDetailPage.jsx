import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, HandHeart } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import DonationFlow from "../components/DonationFlow";
import { formatNumber } from "../utils/numberFormat";

const BreakdownItem = ({ item, total }) => {
        const percentage = total > 0 ? Math.round((item.totalAmount / total) * 100) : 0;
        return (
                <div className='flex items-center justify-between rounded-xl border border-ajv-mint/60 bg-white px-4 py-3 text-right shadow-sm'>
                        <div>
                                <p className='text-sm font-semibold text-ajv-moss'>{item.name}</p>
                                <p className='text-xs text-ajv-moss/70'>رقم الحساب: {item.accountNumber}</p>
                        </div>
                        <div className='text-left text-ajv-moss'>
                                <p className='text-lg font-bold'>{formatNumber(item.totalAmount || 0)}</p>
                                <p className='text-xs text-ajv-moss/70'> {formatNumber(percentage)}% من إجمالي التبرعات</p>
                        </div>
                </div>
        );
};

const ProjectDetailPage = () => {
        const { id } = useParams();
        const [data, setData] = useState(null);
        const [paymentMethods, setPaymentMethods] = useState([]);
        const [loading, setLoading] = useState(true);
        const [openDonation, setOpenDonation] = useState(false);
        const [currentImageIndex, setCurrentImageIndex] = useState(0);
        const [touchStartX, setTouchStartX] = useState(null);

        const fetchProjectData = async () => {
                try {
                        const [projectRes, methodsRes] = await Promise.all([
                                apiClient.get(`/projects/${id}`),
                                apiClient.get("/payment-methods"),
                        ]);
                        setData(projectRes);
                        setPaymentMethods(methodsRes);
                } catch (error) {
                        toast.error("تعذّر تحميل تفاصيل المشروع");
                } finally {
                        setLoading(false);
                }
        };

        useEffect(() => {
                fetchProjectData();
        }, [id]);

        const { project, stats = {}, paymentBreakdown = [] } = data || {};
        const totalFromPayments = useMemo(
                () => paymentBreakdown.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
                [paymentBreakdown]
        );

        const isCompleted = project?.isClosed || (stats?.remainingAmount || 0) <= 0;

        const projectImages = useMemo(() => {
                if (!project) return [];

                const normalizedImages = (project.images || [])
                        .map((image) => (typeof image === "string" ? image : image?.url))
                        .filter(Boolean);

                if (normalizedImages.length > 0) return normalizedImages;

                return project.imageUrl ? [project.imageUrl] : [];
        }, [project]);

        useEffect(() => {
                setCurrentImageIndex(0);
        }, [project?._id]);

        if (loading) {
                return (
                        <div className='flex items-center justify-center py-20'>
                                <div className='h-10 w-10 animate-spin rounded-full border-4 border-ajv-mint border-t-ajv-green' />
                        </div>
                );
        }

        if (!project) {
                return <div className='px-4 py-10 text-center text-ajv-moss'>المشروع غير موجود</div>;
        }

        const hasMultipleImages = projectImages.length > 1;

        const showNextImage = () => {
                setCurrentImageIndex((prev) => (prev + 1) % projectImages.length);
        };

        const showPreviousImage = () => {
                setCurrentImageIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length);
        };

        const handleTouchStart = (e) => {
                setTouchStartX(e.touches[0].clientX);
        };

        const handleTouchEnd = (e) => {
                if (touchStartX === null || !hasMultipleImages) return;
                const touchEndX = e.changedTouches[0].clientX;
                const deltaX = touchEndX - touchStartX;

                if (deltaX > 40) {
                        showPreviousImage();
                } else if (deltaX < -40) {
                        showNextImage();
                }

                setTouchStartX(null);
        };

        return (
                <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-10'>
                        <div className='overflow-hidden rounded-3xl bg-white shadow card-shadow'>
                                <div
                                        className='relative h-72 w-full'
                                        onTouchStart={handleTouchStart}
                                        onTouchEnd={handleTouchEnd}
                                >
                                        {projectImages.length > 0 ? (
                                                <img
                                                        src={projectImages[currentImageIndex]}
                                                        alt={project.title}
                                                        className='h-full w-full object-cover'
                                                />
                                        ) : (
                                                <div className='flex h-full w-full items-center justify-center bg-ajv-cream text-ajv-moss'>
                                                        <HandHeart className='h-10 w-10' />
                                                </div>
                                        )}
                                        {hasMultipleImages && (
                                                <>
                                                        <button
                                                                type='button'
                                                                className='absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-ajv-moss shadow hover:bg-white'
                                                                onClick={showNextImage}
                                                        >
                                                                <ArrowLeft className='h-5 w-5' />
                                                        </button>
                                                        <button
                                                                type='button'
                                                                className='absolute left-4 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-ajv-moss shadow hover:bg-white'
                                                                onClick={showPreviousImage}
                                                        >
                                                                <ArrowRight className='h-5 w-5' />
                                                        </button>
                                                </>
                                        )}
                                        <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white'>
                                                <p className='text-sm text-white/80'>{project.category}</p>
                                                <h1 className='mt-1 text-3xl font-bold'>{project.title}</h1>
                                        </div>
                                </div>

                                <div className='grid gap-6 p-6 lg:grid-cols-3'>
                                        <div className='lg:col-span-2 space-y-4'>
                                                <p className='text-ajv-moss/90 leading-relaxed'>{project.description}</p>

                                                <div className='rounded-2xl border border-ajv-mint/60 bg-ajv-cream p-4'>
                                                        <div className='flex flex-wrap items-center justify-between gap-3 text-ajv-moss'>
                                                                <div>
                                                                        <p className='text-xs text-ajv-moss/70'>إجمالي الهدف</p>
                                                                        <p className='text-xl font-bold'>{formatNumber(stats.targetAmount || 0)}</p>
                                                                </div>
                                                                <div>
                                                                        <p className='text-xs text-ajv-moss/70'>ما تم جمعه</p>
                                                                        <p className='text-xl font-bold'>{formatNumber(stats.currentAmount || 0)}</p>
                                                                </div>
                                                                <div>
                                                                        <p className='text-xs text-ajv-moss/70'>المتبقي</p>
                                                                        <p className='text-xl font-bold'>{formatNumber(stats.remainingAmount || 0)}</p>
                                                                </div>
                                                        </div>
                                                        <div className='mt-3 h-2 w-full rounded-full bg-white'>
                                                                <div
                                                                        className='h-2 rounded-full bg-ajv-green'
                                                                        style={{ width: `${Math.min(stats.progress || 0, 100)}%` }}
                                                                />
                                                        </div>
                                                        <p className='mt-2 text-sm text-ajv-moss/70'>نسبة الإنجاز {formatNumber(stats.progress || 0)}%</p>
                                                </div>
                                        </div>

                                        <div className='space-y-3 rounded-2xl border border-ajv-mint/70 bg-white p-4 shadow-sm'>
                                                <p className='text-lg font-bold text-ajv-moss'>تبرع الآن</p>
                                                <p className='text-sm text-ajv-moss/80'>اختر المبلغ واضغط متابعة لاختيار تطبيق الدفع.</p>
                                                <button
                                                        className='flex w-full items-center justify-center gap-2 rounded-xl bg-ajv-green px-4 py-3 text-white shadow-lg hover:bg-ajv-moss disabled:cursor-not-allowed disabled:opacity-60'
                                                        onClick={() => setOpenDonation(true)}
                                                        disabled={isCompleted}
                                                >
                                                        {isCompleted ? "اكتمل جمع التبرعات" : "بدء التبرع"}
                                                        <ArrowLeft className='h-4 w-4' />
                                                </button>
                                                {isCompleted && (
                                                        <p className='text-center text-xs font-semibold text-ajv-moss'>
                                                                تم اكتمال جمع التبرعات لهذا المشروع، يمكن إعادة فتحه من لوحة التحكم.
                                                        </p>
                                                )}
                                        </div>
                                </div>
                        </div>

                        <section className='mt-8 rounded-3xl border border-ajv-mint/60 bg-white p-6 shadow card-shadow'>
                                <div className='mb-4 flex items-center justify-between'>
                                        <h2 className='text-xl font-bold text-ajv-moss'>توزيع التبرعات حسب التطبيق</h2>
                                        <span className='text-sm text-ajv-moss/70'>إجمالي المبالغ: {formatNumber(totalFromPayments)}</span>
                                </div>
                                <div className='grid gap-3 md:grid-cols-2'>
                                        {paymentBreakdown.length === 0 && <p className='text-ajv-moss/80'>لا توجد تبرعات مسجلة بعد.</p>}
                                        {paymentBreakdown.map((item) => (
                                                <BreakdownItem key={item.paymentMethodId} item={item} total={totalFromPayments} />
                                        ))}
                                </div>
                        </section>

                        <DonationFlow
                                open={openDonation}
                                onClose={() => setOpenDonation(false)}
                                project={project}
                                paymentMethods={paymentMethods}
                                defaultAmount={stats.remainingAmount || 10000}
                                onDonationComplete={() => {
                                        setOpenDonation(false);
                                        setLoading(true);
                                        fetchProjectData();
                                }}
                        />
                </div>
        );
};

export default ProjectDetailPage;
