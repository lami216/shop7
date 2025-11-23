import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clipboard, ClipboardCheck, HandHeart } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

const suggestedAmounts = [5000, 10000, 20000, 50000];

const DonationFlow = ({ open, onClose, project, paymentMethods = [], defaultAmount = 10000, onDonationComplete }) => {
        const [amount, setAmount] = useState(defaultAmount);
        const [selectedPayment, setSelectedPayment] = useState(null);
        const [step, setStep] = useState("methods");
        const [copied, setCopied] = useState(false);
        const [donorName, setDonorName] = useState("");
        const [donorPhone, setDonorPhone] = useState("");
        const [loading, setLoading] = useState(false);

        const activePayments = useMemo(() => paymentMethods.filter((m) => m.isActive !== false), [paymentMethods]);

        useEffect(() => {
                if (open) {
                        setStep("methods");
                        setCopied(false);
                }
        }, [open]);

        useEffect(() => {
                if (open) {
                        setAmount(defaultAmount);
                }
        }, [defaultAmount, open]);

        const handleCopy = async (text) => {
                try {
                        await navigator.clipboard.writeText(text);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                } catch (error) {
                        console.error(error);
                        toast.error("تعذّر نسخ الرقم");
                }
        };

        const handleSubmit = async () => {
                if (!selectedPayment) {
                        return toast.error("اختر تطبيق الدفع لإكمال العملية");
                }
                setLoading(true);
                try {
                        await apiClient.post("/donations", {
                                projectId: project._id,
                                paymentMethodId: selectedPayment,
                                amount: Number(amount),
                                donorName,
                                donorPhone,
                        });
                        toast.success("تم تسجيل تبرعك وتعليمات الدفع بانتظارك");
                        onDonationComplete?.();
                        onClose();
                } catch (error) {
                        toast.error(error.response?.data?.message || "حدث خطأ في تسجيل التبرع");
                } finally {
                        setLoading(false);
                }
        };

        if (!open) return null;

        const selected = activePayments.find((m) => m._id === selectedPayment);

        return (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm'>
                        <div className='w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl card-shadow'>
                                <div className='flex items-center justify-between border-b border-ajv-mint/60 pb-4'>
                                        <div>
                                                <p className='text-xs text-ajv-moss/70'>خطوة {step === "methods" ? "1" : "2"} من 2</p>
                                                <h3 className='text-xl font-bold text-ajv-moss'>تبرعك لمشروع {project.title}</h3>
                                        </div>
                                        <button
                                                className='rounded-full bg-ajv-cream px-3 py-1 text-sm text-ajv-moss hover:bg-ajv-mint'
                                                onClick={onClose}
                                        >
                                                إغلاق
                                        </button>
                                </div>

                                {step === "methods" && (
                                        <div className='mt-4 space-y-4'>
                                                <div className='flex flex-wrap gap-2'>
                                                        {suggestedAmounts.map((value) => (
                                                                <button
                                                                        key={value}
                                                                        onClick={() => setAmount(value)}
                                                                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                                                                amount === value
                                                                                        ? "border-ajv-green bg-ajv-mint text-ajv-moss"
                                                                                        : "border-ajv-mint bg-white hover:bg-ajv-cream"
                                                                        }`}
                                                                >
                                                                        {value.toLocaleString("ar-EG")} MRU
                                                                </button>
                                                        ))}
                                                        <input
                                                                type='number'
                                                                value={amount}
                                                                min={1}
                                                                onChange={(e) => setAmount(Number(e.target.value))}
                                                                className='w-32 rounded-full border border-ajv-mint bg-white px-3 py-2 text-sm text-ajv-moss shadow-sm focus:border-ajv-green focus:outline-none'
                                                                placeholder='مبلغ آخر'
                                                        />
                                                </div>

                                                <div className='grid gap-3 sm:grid-cols-2'>
                                                        {activePayments.map((method) => (
                                                                <button
                                                                        key={method._id}
                                                                        onClick={() => setSelectedPayment(method._id)}
                                                                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-right transition card-shadow ${
                                                                                selectedPayment === method._id
                                                                                        ? "border-ajv-green bg-ajv-mint"
                                                                                        : "border-transparent bg-white hover:border-ajv-mint"
                                                                        }`}
                                                                >
                                                                        <div className='flex items-center gap-3'>
                                                                                <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-ajv-cream'>
                                                                                        {method.imageUrl ? (
                                                                                                <img src={method.imageUrl} alt={method.name} className='h-10 w-10 rounded-md object-contain' />
                                                                                        ) : (
                                                                                                <HandHeart className='h-6 w-6 text-ajv-green' />
                                                                                        )}
                                                                                </div>
                                                                                <div className='text-right'>
                                                                                        <p className='font-semibold text-ajv-moss'>{method.name}</p>
                                                                                        <p className='text-xs text-ajv-moss/70'>{method.accountNumber}</p>
                                                                                </div>
                                                                        </div>
                                                                        <ArrowLeft className='h-5 w-5 text-ajv-moss/60' />
                                                                </button>
                                                        ))}
                                                </div>

                                                <div className='flex items-center justify-between rounded-xl bg-ajv-cream px-4 py-3 text-ajv-moss'>
                                                        <div>
                                                                <p className='text-sm text-ajv-moss/80'>المبلغ المختار</p>
                                                                <p className='text-lg font-bold'>{amount.toLocaleString("ar-EG")} MRU</p>
                                                        </div>
                                                        <button
                                                                className='rounded-full bg-ajv-green px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-ajv-moss disabled:opacity-60'
                                                                onClick={() => setStep("confirm")}
                                                                disabled={!selectedPayment}
                                                        >
                                                                متابعة
                                                        </button>
                                                </div>
                                        </div>
                                )}

                                {step === "confirm" && selected && (
                                        <div className='mt-4 space-y-4'>
                                                <div className='rounded-xl border border-ajv-mint/70 bg-ajv-mint/40 p-4'>
                                                        <p className='text-sm text-ajv-moss/80'>أرسل المبلغ التالي عبر التطبيق المحدد</p>
                                                        <p className='mt-2 text-2xl font-bold text-ajv-moss'>
                                                                {amount.toLocaleString("ar-EG")} MRU
                                                        </p>
                                                        <p className='mt-2 text-ajv-moss'>
                                                                إلى الرقم <span className='font-semibold'>{selected.accountNumber}</span> عبر {selected.name}
                                                        </p>
                                                        <button
                                                                onClick={() => handleCopy(selected.accountNumber)}
                                                                className='mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-ajv-moss shadow'
                                                        >
                                                                {copied ? <ClipboardCheck className='h-4 w-4' /> : <Clipboard className='h-4 w-4' />} نسخ الرقم
                                                        </button>
                                                </div>

                                                <div className='grid gap-3 sm:grid-cols-2'>
                                                        <input
                                                                type='text'
                                                                value={donorName}
                                                                onChange={(e) => setDonorName(e.target.value)}
                                                                placeholder='اسم المتبرع (اختياري)'
                                                                className='w-full rounded-xl border border-ajv-mint bg-white px-4 py-3 text-sm text-ajv-moss shadow-sm focus:border-ajv-green focus:outline-none'
                                                        />
                                                        <input
                                                                type='tel'
                                                                value={donorPhone}
                                                                onChange={(e) => setDonorPhone(e.target.value)}
                                                                placeholder='رقم الهاتف (اختياري)'
                                                                className='w-full rounded-xl border border-ajv-mint bg-white px-4 py-3 text-sm text-ajv-moss shadow-sm focus:border-ajv-green focus:outline-none'
                                                        />
                                                </div>

                                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                                        <button
                                                                className='rounded-full border border-ajv-mint px-4 py-2 text-sm text-ajv-moss hover:bg-ajv-cream'
                                                                onClick={() => setStep("methods")}
                                                        >
                                                                الرجوع
                                                        </button>
                                                        <button
                                                                onClick={handleSubmit}
                                                                disabled={loading}
                                                                className='flex items-center gap-2 rounded-full bg-ajv-green px-5 py-2 text-white shadow-lg hover:bg-ajv-moss disabled:opacity-60'
                                                        >
                                                                {loading ? "يتم الحفظ..." : "تأكيد تسجيل التبرع"}
                                                        </button>
                                                </div>
                                        </div>
                                )}
                        </div>
                </div>
        );
};

export default DonationFlow;
