import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import DonationFlow from "./DonationFlow";
import { formatNumber } from "../utils/numberFormat";

const amountOptions = [5000, 10000, 20000, 50000];

const ProgressBar = ({ progress }) => (
        <div className='w-full rounded-full bg-ajv-mint'>
                <div
                        className='h-2 rounded-full bg-ajv-green transition-all'
                        style={{ width: `${Math.min(progress, 100)}%` }}
                />
        </div>
);

const ProjectCard = ({ project, paymentMethods, onDonationComplete }) => {
        const [selectedAmount, setSelectedAmount] = useState(amountOptions[1]);
        const [customAmount, setCustomAmount] = useState("");
        const [open, setOpen] = useState(false);
        const [currentImageIndex, setCurrentImageIndex] = useState(0);

        const displayAmount = customAmount ? Number(customAmount) : selectedAmount;
        const isCompleted = project.isClosed || (project.remainingAmount || 0) <= 0;

        const projectImages = useMemo(() => {
                const images = (project?.images || [])
                        .map((image) => (typeof image === "string" ? image : image?.url))
                        .filter(Boolean);

                if (images.length > 0) return images;
                return project?.imageUrl ? [project.imageUrl] : [];
        }, [project]);

        useEffect(() => {
                setCurrentImageIndex(0);
        }, [project?._id]);

        const hasMultipleImages = projectImages.length > 1;

        const handleOpen = () => {
                if (customAmount) {
                        setSelectedAmount(Number(customAmount));
                }
                setOpen(true);
        };

        const showNextImage = () => {
                setCurrentImageIndex((prev) => (prev + 1) % projectImages.length);
        };

        const showPreviousImage = () => {
                setCurrentImageIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length);
        };

        return (
                <div className='relative flex flex-col overflow-hidden rounded-2xl bg-white p-4 text-right shadow card-shadow border border-ajv-mint/50'>
                        <div className='relative h-48 w-full overflow-hidden rounded-xl'>
                                {projectImages.length > 0 ? (
                                        <img
                                                src={projectImages[currentImageIndex]}
                                                alt={project.title}
                                                className='h-full w-full object-cover'
                                        />
                                ) : (
                                        <div className='flex h-full w-full items-center justify-center bg-ajv-cream text-ajv-moss'>
                                                <Info className='h-8 w-8' />
                                        </div>
                                )}
                                {hasMultipleImages && (
                                        <>
                                                <button
                                                        type='button'
                                                        onClick={showNextImage}
                                                        className='absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-1 text-ajv-moss shadow hover:bg-white'
                                                >
                                                        <ArrowLeft className='h-4 w-4' />
                                                </button>
                                                <button
                                                        type='button'
                                                        onClick={showPreviousImage}
                                                        className='absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-1 text-ajv-moss shadow hover:bg-white'
                                                >
                                                        <ArrowLeft className='h-4 w-4 rotate-180' />
                                                </button>
                                                <div className='absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/70 px-2 py-1'>
                                                        {projectImages.map((_, index) => (
                                                                <span
                                                                        key={`${project._id}-dot-${index}`}
                                                                        className={`h-2 w-2 rounded-full ${
                                                                                index === currentImageIndex ? "bg-ajv-green" : "bg-ajv-mint"
                                                                        }`}
                                                                />
                                                        ))}
                                                </div>
                                        </>
                                )}
                                <span className='absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ajv-moss'>
                                        {project.category}
                                </span>
                        </div>

                        <div className='mt-4 space-y-2'>
                                <Link to={`/projects/${project._id}`} className='group flex items-center justify-between gap-3 text-ajv-moss'>
                                        <h3 className='text-lg font-bold leading-tight group-hover:text-ajv-green'>{project.title}</h3>
                                        <ArrowLeft className='h-4 w-4 text-ajv-moss/70 group-hover:text-ajv-green' />
                                </Link>
                                <p className='text-sm text-ajv-moss/80'>{project.shortDescription}</p>
                        </div>

                        <div className='mt-4 space-y-2 rounded-xl bg-ajv-cream p-3'>
                                <div className='flex items-center justify-between text-xs font-semibold text-ajv-moss'>
                                        <span>تم جمعه</span>
                                        <span>المتبقي</span>
                                </div>
                                <div className='flex items-center justify-between text-lg font-bold text-ajv-moss'>
                                        <span>{formatNumber(project.currentAmount || 0)}</span>
                                        <span>{formatNumber(project.remainingAmount || 0)}</span>
                                </div>
                                <ProgressBar progress={project.progress || 0} />
                                <div className='text-left text-xs text-ajv-moss/70'>هدف المشروع {formatNumber(project.targetAmount || 0)}</div>
                        </div>

                        <div className='mt-4 space-y-3'>
                                <div className='flex flex-wrap gap-2'>
                                        {amountOptions.map((amount) => (
                                                <button
                                                        key={amount}
                                                        onClick={() => {
                                                                setSelectedAmount(amount);
                                                                setCustomAmount("");
                                                        }}
                                                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                                                                selectedAmount === amount && !customAmount
                                                                        ? "border-ajv-green bg-ajv-mint text-ajv-moss"
                                                                        : "border-ajv-mint bg-white hover:bg-ajv-cream"
                                                        }`}
                                                >
                                                        {formatNumber(amount)} MRU
                                                </button>
                                        ))}
                                        <input
                                                type='number'
                                                value={customAmount}
                                                onChange={(e) => setCustomAmount(e.target.value)}
                                                placeholder='مبلغ آخر'
                                                className='w-28 rounded-full border border-ajv-mint bg-white px-3 py-2 text-sm text-ajv-moss shadow-sm focus:border-ajv-green focus:outline-none'
                                        />
                                </div>
                                <div className='space-y-2'>
                                        <button
                                                onClick={handleOpen}
                                                disabled={isCompleted}
                                                className='flex w-full items-center justify-center gap-2 rounded-xl bg-ajv-green px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-ajv-moss disabled:cursor-not-allowed disabled:opacity-60'
                                        >
                                                {isCompleted ? "اكتمل جمع التبرعات" : "تبرع الآن"}
                                        </button>
                                        {isCompleted && (
                                                <p className='text-center text-xs font-semibold text-ajv-moss'>
                                                        تم إغلاق التبرعات لهذا المشروع بعد اكتمال الهدف أو إغلاقه.
                                                </p>
                                        )}
                                </div>
                        </div>

                        <DonationFlow
                                open={open}
                                onClose={() => setOpen(false)}
                                project={project}
                                paymentMethods={paymentMethods}
                                defaultAmount={displayAmount}
                                onDonationComplete={onDonationComplete}
                        />
                </div>
        );
};

export default ProjectCard;
