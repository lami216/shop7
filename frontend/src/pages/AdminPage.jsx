import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { formatNumber } from "../utils/numberFormat";

const AdminPage = () => {
        const [projects, setProjects] = useState([]);
        const [paymentMethods, setPaymentMethods] = useState([]);
        const [donations, setDonations] = useState([]);
        const [achievements, setAchievements] = useState([]);
        const MAX_PROJECT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
        const [activeTab, setActiveTab] = useState("projects");
        const [projectForm, setProjectForm] = useState({
                title: "",
                shortDescription: "",
                description: "",
                category: "المشاريع العامة",
                image: "",
                imagePreview: "",
                targetAmount: 0,
                status: "active",
                isActive: true,
                isClosed: false,
        });
        const [paymentForm, setPaymentForm] = useState({
                name: "",
                accountNumber: "",
                image: "",
                imagePreview: "",
                isActive: true,
        });
        const [achievementForm, setAchievementForm] = useState({
                _id: null,
                title: "",
                shortDescription: "",
                fullDescription: "",
                date: "",
                location: "",
                images: [],
                videos: [""],
                showOnHome: false,
        });

        const readFileAsDataURL = (file) => {
                return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                });
        };

        const formatDateForInput = (value) => {
                if (!value) return "";
                try {
                        return new Date(value).toISOString().slice(0, 10);
                } catch {
                        return "";
                }
        };

        const loadData = async () => {
                try {
                        const [projectsRes, paymentsRes, donationsRes, achievementsRes] = await Promise.all([
                                apiClient.get("/projects"),
                                apiClient.get("/payment-methods?includeInactive=true"),
                                apiClient.get("/donations"),
                                apiClient.get("/achievements"),
                        ]);
                        setProjects(projectsRes);
                        setPaymentMethods(paymentsRes);
                        setDonations(donationsRes);
                        setAchievements(achievementsRes || []);
                } catch (error) {
                        toast.error("تحتاج لتسجيل الدخول كمسؤول لإدارة المنصة");
                }
        };

        useEffect(() => {
                loadData();
        }, []);

        const handleProjectImageChange = async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                if (file.size > MAX_PROJECT_IMAGE_SIZE) {
                        toast.error("حجم الصورة يتجاوز 10 ميجابايت، يرجى اختيار صورة أصغر");
                        return;
                }

                const base64 = await readFileAsDataURL(file);
                setProjectForm((previous) => ({ ...previous, image: base64, imagePreview: base64 }));
        };

        const handlePaymentImageChange = async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const base64 = await readFileAsDataURL(file);
                setPaymentForm((previous) => ({ ...previous, image: base64, imagePreview: base64 }));
        };

        const handleAchievementImagesChange = async (event) => {
                const files = Array.from(event.target.files || []);
                if (!files.length) return;

                const uploads = await Promise.all(files.map((file) => readFileAsDataURL(file)));
                setAchievementForm((prev) => ({ ...prev, images: [...prev.images, ...uploads.filter(Boolean)] }));
        };

        const handleRemoveAchievementImage = (index) => {
                setAchievementForm((prev) => ({
                        ...prev,
                        images: prev.images.filter((_, idx) => idx !== index),
                }));
        };

        const handleReorderAchievementImage = (index, direction) => {
                setAchievementForm((prev) => {
                        const images = [...prev.images];
                        const swapWith = direction === "up" ? index - 1 : index + 1;

                        if (swapWith < 0 || swapWith >= images.length) return prev;

                        [images[index], images[swapWith]] = [images[swapWith], images[index]];
                        return { ...prev, images };
                });
        };

        const handleVideoFieldChange = (index, value) => {
                setAchievementForm((prev) => {
                        const videos = [...prev.videos];
                        videos[index] = value;
                        return { ...prev, videos };
                });
        };

        const addVideoField = () => {
                setAchievementForm((prev) => ({ ...prev, videos: [...prev.videos, ""] }));
        };

        const removeVideoField = (index) => {
                setAchievementForm((prev) => ({
                        ...prev,
                        videos: prev.videos.filter((_, idx) => idx !== index),
                }));
        };

        const handleProjectSubmit = async (e) => {
                e.preventDefault();
                try {
                        await apiClient.post("/projects", {
                                ...projectForm,
                                targetAmount: Number(projectForm.targetAmount),
                                isClosed: Boolean(projectForm.isClosed),
                        });
                        toast.success("تمت إضافة المشروع بنجاح");
                        setProjectForm({
                                title: "",
                                shortDescription: "",
                                description: "",
                                category: "المشاريع العامة",
                                image: "",
                                imagePreview: "",
                                targetAmount: 0,
                                status: "active",
                                isActive: true,
                                isClosed: false,
                        });
                        loadData();
                } catch (error) {
                        toast.error(error.response?.data?.message || "تعذر إضافة المشروع");
                }
        };

        const handleProjectUpdate = async (id, updates) => {
                try {
                        await apiClient.patch(`/projects/${id}`, updates);
                        toast.success("تم تحديث المشروع");
                        loadData();
                } catch (error) {
                        toast.error("تعذر تحديث المشروع");
                }
        };

        const handlePaymentSubmit = async (e) => {
                e.preventDefault();
                try {
                        await apiClient.post("/payment-methods", paymentForm);
                        toast.success("تمت إضافة وسيلة الدفع");
                        setPaymentForm({ name: "", accountNumber: "", image: "", imagePreview: "", isActive: true });
                        loadData();
                } catch (error) {
                        toast.error(error.response?.data?.message || "تعذر إضافة وسيلة الدفع");
                }
        };

        const handlePaymentUpdate = async (id, updates) => {
                try {
                        await apiClient.patch(`/payment-methods/${id}`, updates);
                        toast.success("تم تحديث وسيلة الدفع");
                        loadData();
                } catch (error) {
                        toast.error("تعذر تحديث وسيلة الدفع");
                }
        };

        const handlePaymentDelete = async (id) => {
                try {
                        await apiClient.delete(`/payment-methods/${id}`);
                        toast.success("تم حذف وسيلة الدفع");
                        loadData();
                } catch (error) {
                        toast.error("تعذر حذف وسيلة الدفع");
                }
        };

        const resetAchievementForm = () => {
                setAchievementForm({
                        _id: null,
                        title: "",
                        shortDescription: "",
                        fullDescription: "",
                        date: "",
                        location: "",
                        images: [],
                        videos: [""],
                        showOnHome: false,
                });
        };

        const handleAchievementSubmit = async (e) => {
                e.preventDefault();
                try {
                        const payload = {
                                title: achievementForm.title,
                                shortDescription: achievementForm.shortDescription,
                                fullDescription: achievementForm.fullDescription,
                                date: achievementForm.date,
                                location: achievementForm.location,
                                images: achievementForm.images,
                                videos: achievementForm.videos.filter((video) => video && video.trim()),
                                showOnHome: Boolean(achievementForm.showOnHome),
                        };

                        if (achievementForm._id) {
                                await apiClient.patch(`/achievements/${achievementForm._id}`, payload);
                                toast.success("تم تحديث الإنجاز");
                        } else {
                                await apiClient.post("/achievements", payload);
                                toast.success("تمت إضافة الإنجاز بنجاح");
                        }

                        resetAchievementForm();
                        loadData();
                } catch (error) {
                        toast.error(error.response?.data?.message || "تعذر حفظ الإنجاز");
                }
        };

        const handleAchievementEdit = (achievement) => {
                setAchievementForm({
                        _id: achievement._id,
                        title: achievement.title || "",
                        shortDescription: achievement.shortDescription || "",
                        fullDescription: achievement.fullDescription || "",
                        date: formatDateForInput(achievement.date),
                        location: achievement.location || "",
                        images: achievement.images || [],
                        videos: achievement.videos?.length ? achievement.videos : [""],
                        showOnHome: Boolean(achievement.showOnHome),
                });
                setActiveTab("achievements");
        };

        const handleAchievementDelete = async (id) => {
                if (!window.confirm("هل أنت متأكد من حذف هذا الإنجاز؟")) return;
                try {
                        await apiClient.delete(`/achievements/${id}`);
                        toast.success("تم حذف الإنجاز");
                        loadData();
                } catch (error) {
                        toast.error("تعذر حذف الإنجاز");
                }
        };

        const updateLocalProject = (id, key, value) => {
                setProjects((prev) => prev.map((project) => (project._id === id ? { ...project, [key]: value } : project)));
        };

        const projectDonationsMap = useMemo(() => {
                const grouped = new Map();
                donations.forEach((donation) => {
                        const projectId = donation.project?._id || donation.projectId;
                        if (!projectId) return;

                        if (!grouped.has(projectId)) {
                                grouped.set(projectId, { donations: [], total: 0 });
                        }

                        const entry = grouped.get(projectId);
                        entry.donations.push(donation);
                        entry.total += Number(donation.amount) || 0;
                });

                return grouped;
        }, [donations]);

        return (
                <div className='mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-10'>
                        <h1 className='mt-6 text-3xl font-bold text-ajv-moss'>لوحة تحكم المشرف</h1>
                        <p className='text-ajv-moss/80'>إدارة المشاريع ووسائل الدفع وتصفح التبرعات المسجلة.</p>

                        <div className='mt-6 flex flex-wrap gap-3'>
                                <button
                                        className={`rounded-full px-4 py-2 text-sm font-semibold shadow ${
                                                activeTab === "projects"
                                                        ? "bg-ajv-green text-white"
                                                        : "bg-white text-ajv-moss border border-ajv-mint hover:bg-ajv-mint/50"
                                        }`}
                                        onClick={() => setActiveTab("projects")}
                                >
                                        المشاريع والتبرعات
                                </button>
                                <button
                                        className={`rounded-full px-4 py-2 text-sm font-semibold shadow ${
                                                activeTab === "achievements"
                                                        ? "bg-ajv-green text-white"
                                                        : "bg-white text-ajv-moss border border-ajv-mint hover:bg-ajv-mint/50"
                                        }`}
                                        onClick={() => setActiveTab("achievements")}
                                >
                                        الإنجازات
                                </button>
                        </div>

                        {activeTab === "projects" && (
                                <>
                                        <section className='mt-6 grid gap-6 lg:grid-cols-2'>
                                                <div className='rounded-2xl border border-ajv-mint/60 bg-white p-5 shadow card-shadow'>
                                                        <h2 className='text-xl font-bold text-ajv-moss'>إضافة مشروع جديد</h2>
                                                        <form onSubmit={handleProjectSubmit} className='mt-4 grid gap-3'>
                                                                <input
                                                                        type='text'
                                                                        required
                                                                        placeholder='عنوان المشروع'
                                                                        value={projectForm.title}
                                                                        onChange={(e) => setProjectForm((p) => ({ ...p, title: e.target.value }))}
                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                />
                                                                <input
                                                                        type='text'
                                                                        required
                                                                        placeholder='وصف مختصر'
                                                                        value={projectForm.shortDescription}
                                                                        onChange={(e) => setProjectForm((p) => ({ ...p, shortDescription: e.target.value }))}
                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                />
                                                                <textarea
                                                                        rows={3}
                                                                        required
                                                                        placeholder='الوصف التفصيلي'
                                                                        value={projectForm.description}
                                                                        onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                />
                                                                <div className='grid gap-3 md:grid-cols-2'>
                                                                        <input
                                                                                type='text'
                                                                                placeholder='الفئة'
                                                                                value={projectForm.category}
                                                                                onChange={(e) => setProjectForm((p) => ({ ...p, category: e.target.value }))}
                                                                                className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                        />
                                                                        <input
                                                                                type='number'
                                                                                required
                                                                                placeholder='الهدف المالي'
                                                                                value={projectForm.targetAmount}
                                                                                onChange={(e) => setProjectForm((p) => ({ ...p, targetAmount: e.target.value }))}
                                                                                className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                        />
                                                                </div>
                                                                <div className='space-y-2'>
                                                                        <label className='block text-sm font-semibold text-ajv-moss'>صورة المشروع</label>
                                                                        <input
                                                                                type='file'
                                                                                accept='image/*'
                                                                                required
                                                                                onChange={handleProjectImageChange}
                                                                                className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                        />
                                                                        {projectForm.imagePreview && (
                                                                                <img
                                                                                        src={projectForm.imagePreview}
                                                                                        alt='معاينة صورة المشروع'
                                                                                        className='h-32 w-full rounded-xl border border-ajv-mint object-cover'
                                                                                />
                                                                        )}
                                                                </div>
                                                                <div className='grid gap-3 md:grid-cols-3'>
                                                                        <select
                                                                                value={projectForm.status}
                                                                                onChange={(e) => setProjectForm((p) => ({ ...p, status: e.target.value }))}
                                                                                className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                        >
                                                                                <option value='active'>معروض</option>
                                                                                <option value='hidden'>مخفي</option>
                                                                                <option value='draft'>مسودة</option>
                                                                        </select>
                                                                        <label className='flex items-center gap-2 text-sm text-ajv-moss'>
                                                                                <input
                                                                                        type='checkbox'
                                                                                        checked={projectForm.isActive}
                                                                                        onChange={(e) => setProjectForm((p) => ({ ...p, isActive: e.target.checked }))}
                                                                                />
                                                                                مفعل
                                                                        </label>
                                                                        <label className='flex items-center gap-2 text-sm text-ajv-moss'>
                                                                                <input
                                                                                        type='checkbox'
                                                                                        checked={projectForm.isClosed}
                                                                                        onChange={(e) => setProjectForm((p) => ({ ...p, isClosed: e.target.checked }))}
                                                                                />
                                                                                إغلاق التبرعات
                                                                        </label>
                                                                        <button
                                                                                type='submit'
                                                                                className='rounded-xl bg-ajv-green px-4 py-2 text-sm font-semibold text-white shadow hover:bg-ajv-moss'
                                                                        >
                                                                                حفظ المشروع
                                                                        </button>
                                                                </div>
                                                        </form>
                                                </div>

                                                <div className='rounded-2xl border border-ajv-mint/60 bg-white p-5 shadow card-shadow'>
                                                        <h2 className='text-xl font-bold text-ajv-moss'>إضافة تطبيق دفع</h2>
                                                        <form onSubmit={handlePaymentSubmit} className='mt-4 grid gap-3'>
                                                                <input
                                                                        type='text'
                                                                        required
                                                                        placeholder='اسم التطبيق'
                                                                        value={paymentForm.name}
                                                                        onChange={(e) => setPaymentForm((p) => ({ ...p, name: e.target.value }))}
                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                />
                                                                <input
                                                                        type='text'
                                                                        required
                                                                        placeholder='رقم الحساب أو الهاتف'
                                                                        value={paymentForm.accountNumber}
                                                                        onChange={(e) => setPaymentForm((p) => ({ ...p, accountNumber: e.target.value }))}
                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                />
                                                                <div className='space-y-2'>
                                                                        <label className='block text-sm font-semibold text-ajv-moss'>شعار التطبيق</label>
                                                                        <input
                                                                                type='file'
                                                                                accept='image/*'
                                                                                required
                                                                                onChange={handlePaymentImageChange}
                                                                                className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                        />
                                                                        {paymentForm.imagePreview && (
                                                                                <img
                                                                                        src={paymentForm.imagePreview}
                                                                                        alt='معاينة شعار التطبيق'
                                                                                        className='h-24 w-full rounded-xl border border-ajv-mint object-cover'
                                                                                />
                                                                        )}
                                                                </div>
                                                                <label className='flex items-center gap-2 text-sm text-ajv-moss'>
                                                                        <input
                                                                                type='checkbox'
                                                                                checked={paymentForm.isActive}
                                                                                onChange={(e) => setPaymentForm((p) => ({ ...p, isActive: e.target.checked }))}
                                                                        />
                                                                        مفعل
                                                                </label>
                                                                <button
                                                                        type='submit'
                                                                        className='rounded-xl bg-ajv-green px-4 py-2 text-sm font-semibold text-white shadow hover:bg-ajv-moss'
                                                                >
                                                                        حفظ التطبيق
                                                                </button>
                                                        </form>
                                                </div>
                                        </section>

                        <section className='mt-8 grid gap-6 lg:grid-cols-2'>
                                <div className='rounded-2xl border border-ajv-mint/60 bg-white p-5 shadow card-shadow'>
                                        <h3 className='text-lg font-bold text-ajv-moss'>المشاريع الحالية</h3>
                                        <div className='mt-4 space-y-3'>
                                                {projects.map((project) => (
                                                        <div key={project._id} className='rounded-xl border border-ajv-mint/60 p-3 shadow-sm'>
                                                                <div className='flex items-center justify-between gap-3'>
                                                                        <div>
                                                                                <p className='text-sm font-semibold text-ajv-moss'>{project.title}</p>
                                                                                <p className='text-xs text-ajv-moss/70'>المتحصل: {formatNumber(project.currentAmount || 0)} / الهدف {formatNumber(project.targetAmount || 0)}</p>
                                                                        </div>
                                                                        <label className='flex items-center gap-2 text-sm text-ajv-moss'>
                                                                                <input
                                                                                        type='checkbox'
                                                                                        checked={project.isActive}
                                                                                        onChange={(e) => {
                                                                                                updateLocalProject(project._id, "isActive", e.target.checked);
                                                                                                handleProjectUpdate(project._id, { isActive: e.target.checked });
                                                                                        }}
                                                                                />
                                                                                مفعل
                                                                        </label>
                                                                        <label className='flex items-center gap-2 text-sm text-ajv-moss'>
                                                                                <input
                                                                                        type='checkbox'
                                                                                        checked={project.isClosed}
                                                                                        onChange={(e) => {
                                                                                                updateLocalProject(project._id, "isClosed", e.target.checked);
                                                                                                handleProjectUpdate(project._id, { isClosed: e.target.checked });
                                                                                        }}
                                                                                />
                                                                                إغلاق التبرعات
                                                                        </label>
                                                                </div>
                                                                <div className='mt-2 grid gap-2 md:grid-cols-3'>
                                                                        <input
                                                                                type='number'
                                                                                value={project.targetAmount}
                                                                                onChange={(e) => updateLocalProject(project._id, "targetAmount", Number(e.target.value))}
                                                                                className='w-full rounded-lg border border-ajv-mint px-3 py-2 text-sm text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                        />
                                                                        <select
                                                                                value={project.status}
                                                                                onChange={(e) => updateLocalProject(project._id, "status", e.target.value)}
                                                                                className='w-full rounded-lg border border-ajv-mint px-3 py-2 text-sm text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                        >
                                                                                <option value='active'>معروض</option>
                                                                                <option value='hidden'>مخفي</option>
                                                                                <option value='draft'>مسودة</option>
                                                                        </select>
                                                                        <button
                                                                                onClick={() =>
                                                                                        handleProjectUpdate(project._id, {
                                                                                                targetAmount: Number(project.targetAmount),
                                                                                                status: project.status,
                                                                                                isActive: project.isActive,
                                                                                                isClosed: project.isClosed,
                                                                                        })
                                                                                }
                                                                                className='rounded-lg bg-ajv-green px-3 py-2 text-xs font-semibold text-white shadow hover:bg-ajv-moss'
                                                                        >
                                                                                حفظ التعديلات
                                                                        </button>
                                                                </div>
                                                        </div>
                                                ))}
                                        </div>
                                </div>

                                <div className='rounded-2xl border border-ajv-mint/60 bg-white p-5 shadow card-shadow'>
                                        <h3 className='text-lg font-bold text-ajv-moss'>وسائل الدفع</h3>
                                        <div className='mt-4 space-y-3'>
                                                {paymentMethods.map((method) => (
                                                        <div key={method._id} className='flex items-center justify-between rounded-xl border border-ajv-mint/60 p-3 shadow-sm'>
                                                                <div>
                                                                        <p className='text-sm font-semibold text-ajv-moss'>{method.name}</p>
                                                                        <p className='text-xs text-ajv-moss/70'>{method.accountNumber}</p>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                        <label className='flex items-center gap-1 text-sm text-ajv-moss'>
                                                                                <input
                                                                                        type='checkbox'
                                                                                        checked={method.isActive}
                                                                                        onChange={(e) => handlePaymentUpdate(method._id, { isActive: e.target.checked })}
                                                                                />
                                                                                مفعل
                                                                        </label>
                                                                        <button
                                                                                onClick={() => handlePaymentDelete(method._id)}
                                                                                className='rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700'
                                                                        >
                                                                                حذف
                                                                        </button>
                                                                </div>
                                                        </div>
                                                ))}
                                        </div>
                                </div>
                        </section>

                        <section className='mt-8 rounded-2xl border border-ajv-mint/60 bg-white p-5 shadow card-shadow'>
                                <h3 className='text-lg font-bold text-ajv-moss'>تفاصيل التبرعات لكل مشروع</h3>
                                <div className='mt-4 space-y-4'>
                                        {projects.map((project) => {
                                                const projectStats = projectDonationsMap.get(project._id) || { donations: [], total: 0 };
                                                const donorsCount = projectStats.donations.length;
                                                const progress = project.targetAmount > 0 ? Math.min(100, Math.round((projectStats.total / project.targetAmount) * 100)) : 0;

                                                return (
                                                        <div key={project._id} className='rounded-xl border border-ajv-mint/40 bg-ajv-cream/40 p-4 shadow-sm'>
                                                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                                                        <div>
                                                                                <p className='text-sm font-semibold text-ajv-moss'>{project.title}</p>
                                                                                <p className='text-xs text-ajv-moss/70'>مجموع التبرعات: {formatNumber(projectStats.total)} / الهدف {formatNumber(project.targetAmount || 0)}</p>
                                                                        </div>
                                                                        <div className='flex flex-wrap items-center gap-2 text-xs text-ajv-moss'>
                                                                                <span className='rounded-full bg-white px-3 py-1 shadow-sm'>المتبرعون: {formatNumber(donorsCount)}</span>
                                                                                <span className='rounded-full bg-white px-3 py-1 shadow-sm'>الحالة: {project.isClosed ? "مغلق" : "مفتوح"}</span>
                                                                        </div>
                                                                </div>
                                                                <div className='mt-3 h-2 w-full rounded-full bg-white'>
                                                                        <div className='h-2 rounded-full bg-ajv-green' style={{ width: `${progress}%` }} />
                                                                </div>
                                                                <p className='mt-1 text-xs text-ajv-moss/70'>نسبة الإنجاز {formatNumber(progress)}%</p>

                                                                <div className='mt-4 overflow-x-auto rounded-xl border border-ajv-mint/40 bg-white'>
                                                                        <table className='min-w-full text-right text-sm text-ajv-moss'>
                                                                                <thead>
                                                                                        <tr className='bg-ajv-cream text-xs text-ajv-moss'>
                                                                                                <th className='px-3 py-2'>اسم المتبرع</th>
                                                                                                <th className='px-3 py-2'>الهاتف</th>
                                                                                                <th className='px-3 py-2'>المبلغ</th>
                                                                                                <th className='px-3 py-2'>التطبيق</th>
                                                                                                <th className='px-3 py-2'>الإيصال</th>
                                                                                        </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                        {projectStats.donations.length === 0 && (
                                                                                                <tr>
                                                                                                        <td colSpan={5} className='px-3 py-3 text-center text-ajv-moss/70'>
                                                                                                                لا توجد تبرعات مسجلة لهذا المشروع بعد.
                                                                                                        </td>
                                                                                                </tr>
                                                                                        )}
                                                                                        {projectStats.donations.map((donation) => (
                                                                                                <tr key={donation._id} className='border-b border-ajv-mint/30 hover:bg-ajv-mint/20'>
                                                                                                        <td className='px-3 py-2'>{donation.payerName || donation.donorName || "مجهول"}</td>
                                                                                                        <td className='px-3 py-2'>{donation.phone || donation.donorPhone || "-"}</td>
                                                                                                        <td className='px-3 py-2'>{formatNumber(donation.amount || 0)}</td>
                                                                                                        <td className='px-3 py-2'>{donation.paymentApp || donation.paymentMethod?.name || "غير محدد"}</td>
                                                                                                        <td className='px-3 py-2'>
                                                                                                                {donation.receiptImageUrl ? (
                                                                                                                        <a
                                                                                                                                href={donation.receiptImageUrl}
                                                                                                                                target='_blank'
                                                                                                                                rel='noopener noreferrer'
                                                                                                                                className='rounded-lg bg-ajv-green px-3 py-1 text-xs font-semibold text-white shadow hover:bg-ajv-moss'
                                                                                                                        >
                                                                                                                                عرض الإيصال
                                                                                                                        </a>
                                                                                                                ) : (
                                                                                                                        <span className='text-ajv-moss/60'>لا يوجد</span>
                                                                                                                )}
                                                                                                        </td>
                                                                                                </tr>
                                                                                        ))}
                                                                                </tbody>
                                                                        </table>
                                                                </div>
                                                        </div>
                                                );
                                        })}
                                </div>
                        </section>

                                        <section className='mt-8 rounded-2xl border border-ajv-mint/60 bg-white p-5 shadow card-shadow'>
                                                <h3 className='text-lg font-bold text-ajv-moss'>سجل التبرعات</h3>
                                                <div className='mt-4 overflow-x-auto'>
                                                        <table className='min-w-full text-right text-sm text-ajv-moss'>
                                                                <thead>
                                                                        <tr className='border-b border-ajv-mint/60 bg-ajv-cream text-xs text-ajv-moss'>
                                                                                <th className='px-3 py-2'>المشروع</th>
                                                                                <th className='px-3 py-2'>المبلغ</th>
                                                                                <th className='px-3 py-2'>التطبيق</th>
                                                                                <th className='px-3 py-2'>المتبرع</th>
                                                                                <th className='px-3 py-2'>التاريخ</th>
                                                                        </tr>
                                                                </thead>
                                                                <tbody>
                                                                        {donations.map((donation) => (
                                                                                <tr key={donation._id} className='border-b border-ajv-mint/30 hover:bg-ajv-mint/20'>
                                                                                        <td className='px-3 py-2'>{donation.project?.title}</td>
                                                                                        <td className='px-3 py-2'>{formatNumber(donation.amount || 0)}</td>
                                                                                        <td className='px-3 py-2'>{donation.paymentMethod?.name}</td>
                                                                                        <td className='px-3 py-2'>{donation.donorName || donation.donorPhone || "مجهول"}</td>
                                                                                        <td className='px-3 py-2'>{new Date(donation.createdAt).toLocaleDateString("en-US")}</td>
                                                                                </tr>
                                                                        ))}
                                                                </tbody>
                                                        </table>
                                                </div>
                                        </section>
                                </>
                        )}

                        {activeTab === "achievements" && (
                                <div className='mt-6 space-y-6'>
                                        <div className='rounded-2xl border border-ajv-mint/60 bg-white p-5 shadow card-shadow'>
                                                <div className='flex items-start justify-between gap-3'>
                                                        <div>
                                                                <h2 className='text-xl font-bold text-ajv-moss'>إضافة أو تعديل إنجاز</h2>
                                                                <p className='text-sm text-ajv-moss/70'>وثّق حملات الشباب التطوعية بالصور والفيديوهات.</p>
                                                        </div>
                                                        {achievementForm._id && (
                                                                <button
                                                                        onClick={resetAchievementForm}
                                                                        className='text-sm text-ajv-green underline'
                                                                >
                                                                        إلغاء التعديل
                                                                </button>
                                                        )}
                                                </div>
                                                <form onSubmit={handleAchievementSubmit} className='mt-4 grid gap-3'>
                                                        <div className='grid gap-3 md:grid-cols-2'>
                                                                <input
                                                                        type='text'
                                                                        required
                                                                        placeholder='عنوان الإنجاز'
                                                                        value={achievementForm.title}
                                                                        onChange={(e) => setAchievementForm((p) => ({ ...p, title: e.target.value }))}
                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                />
                                                                <input
                                                                        type='date'
                                                                        required
                                                                        value={achievementForm.date}
                                                                        onChange={(e) => setAchievementForm((p) => ({ ...p, date: e.target.value }))}
                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                />
                                                        </div>
                                                        <input
                                                                type='text'
                                                                required
                                                                placeholder='وصف قصير للإنجاز'
                                                                value={achievementForm.shortDescription}
                                                                onChange={(e) => setAchievementForm((p) => ({ ...p, shortDescription: e.target.value }))}
                                                                className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                        />
                                                        <textarea
                                                                rows={4}
                                                                required
                                                                placeholder='الوصف التفصيلي'
                                                                value={achievementForm.fullDescription}
                                                                onChange={(e) => setAchievementForm((p) => ({ ...p, fullDescription: e.target.value }))}
                                                                className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                        />
                                                        <div className='grid gap-3 md:grid-cols-2'>
                                                                <input
                                                                        type='text'
                                                                        placeholder='المكان (اختياري)'
                                                                        value={achievementForm.location}
                                                                        onChange={(e) => setAchievementForm((p) => ({ ...p, location: e.target.value }))}
                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                />
                                                                <label className='flex items-center gap-2 text-sm text-ajv-moss'>
                                                                        <input
                                                                                type='checkbox'
                                                                                checked={achievementForm.showOnHome}
                                                                                onChange={(e) => setAchievementForm((p) => ({ ...p, showOnHome: e.target.checked }))}
                                                                        />
                                                                        عرض في الرئيسية
                                                                </label>
                                                        </div>

                                                        <div className='grid gap-3 md:grid-cols-2'>
                                                                <div className='space-y-2'>
                                                                        <label className='text-sm font-semibold text-ajv-moss'>صور الإنجاز (يتم رفعها عبر ImageKit)</label>
                                                                        <input
                                                                                type='file'
                                                                                accept='image/*'
                                                                                multiple
                                                                                onChange={handleAchievementImagesChange}
                                                                                className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                        />
                                                                        {achievementForm.images.length > 0 && (
                                                                                <div className='grid gap-2 rounded-xl border border-ajv-mint/60 bg-ajv-cream/30 p-3'>
                                                                                        {achievementForm.images.map((image, idx) => (
                                                                                                <div key={idx} className='flex items-center justify-between gap-2 rounded-lg bg-white p-2 shadow-sm'>
                                                                                                        <div className='flex items-center gap-2'>
                                                                                                                <img src={image} alt={`صورة ${idx + 1}`} className='h-16 w-16 rounded-lg object-cover' />
                                                                                                                <span className='text-xs text-ajv-moss/70'>الصورة {idx + 1}</span>
                                                                                                        </div>
                                                                                                        <div className='flex items-center gap-2'>
                                                                                                                <button
                                                                                                                        type='button'
                                                                                                                        onClick={() => handleReorderAchievementImage(idx, "up")}
                                                                                                                        className='rounded-lg bg-ajv-cream px-2 py-1 text-xs text-ajv-moss hover:bg-ajv-mint/70'
                                                                                                                >
                                                                                                                        ↑
                                                                                                                </button>
                                                                                                                <button
                                                                                                                        type='button'
                                                                                                                        onClick={() => handleReorderAchievementImage(idx, "down")}
                                                                                                                        className='rounded-lg bg-ajv-cream px-2 py-1 text-xs text-ajv-moss hover:bg-ajv-mint/70'
                                                                                                                >
                                                                                                                        ↓
                                                                                                                </button>
                                                                                                                <button
                                                                                                                        type='button'
                                                                                                                        onClick={() => handleRemoveAchievementImage(idx)}
                                                                                                                        className='rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-700'
                                                                                                                >
                                                                                                                        حذف
                                                                                                                </button>
                                                                                                        </div>
                                                                                                </div>
                                                                                        ))}
                                                                                </div>
                                                                        )}
                                                                </div>

                                                                <div className='space-y-2'>
                                                                        <div className='flex items-center justify-between'>
                                                                                <label className='text-sm font-semibold text-ajv-moss'>روابط الفيديو (يوتيوب أو فيسبوك)</label>
                                                                                <button
                                                                                        type='button'
                                                                                        onClick={addVideoField}
                                                                                        className='flex h-8 w-8 items-center justify-center rounded-full bg-ajv-green text-white shadow hover:bg-ajv-moss'
                                                                                >
                                                                                        +
                                                                                </button>
                                                                        </div>
                                                                        <div className='space-y-2 rounded-xl border border-ajv-mint/60 bg-ajv-cream/30 p-3'>
                                                                                {achievementForm.videos.map((video, idx) => (
                                                                                        <div key={idx} className='flex items-center gap-2'>
                                                                                                <input
                                                                                                        type='url'
                                                                                                        placeholder='رابط فيديو يوتيوب أو فيسبوك'
                                                                                                        value={video}
                                                                                                        onChange={(e) => handleVideoFieldChange(idx, e.target.value)}
                                                                                                        className='w-full rounded-xl border border-ajv-mint px-3 py-2 text-ajv-moss focus:border-ajv-green focus:outline-none'
                                                                                                />
                                                                                                {achievementForm.videos.length > 1 && (
                                                                                                        <button
                                                                                                                type='button'
                                                                                                                onClick={() => removeVideoField(idx)}
                                                                                                                className='rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700'
                                                                                                        >
                                                                                                                حذف
                                                                                                        </button>
                                                                                                )}
                                                                                        </div>
                                                                                ))}
                                                                        </div>
                                                                </div>
                                                        </div>

                                                        <div className='flex flex-wrap items-center gap-3 pt-2'>
                                                                <button
                                                                        type='submit'
                                                                        className='rounded-xl bg-ajv-green px-5 py-2 text-sm font-semibold text-white shadow hover:bg-ajv-moss'
                                                                >
                                                                        حفظ الإنجاز
                                                                </button>
                                                                {achievementForm._id && (
                                                                        <span className='text-sm text-ajv-moss/70'>يتم تعديل: {achievementForm.title}</span>
                                                                )}
                                                        </div>
                                                </form>
                                        </div>

                                        <div className='rounded-2xl border border-ajv-mint/60 bg-white p-5 shadow card-shadow'>
                                                <h3 className='text-lg font-bold text-ajv-moss'>الإنجازات الحالية</h3>
                                                <div className='mt-4 grid gap-3 md:grid-cols-2'>
                                                        {achievements.length === 0 && (
                                                                <div className='col-span-2 rounded-xl border border-ajv-mint/60 bg-ajv-cream/40 p-4 text-center text-ajv-moss/80'>
                                                                        لا توجد إنجازات مضافة بعد.
                                                                </div>
                                                        )}
                                                        {achievements.map((achievement) => (
                                                                <div key={achievement._id} className='flex flex-col justify-between rounded-xl border border-ajv-mint/60 bg-white p-4 shadow-sm'>
                                                                        <div className='space-y-1'>
                                                                                <p className='text-sm font-semibold text-ajv-moss'>{achievement.title}</p>
                                                                                <p className='text-xs text-ajv-moss/70 line-clamp-2'>{achievement.shortDescription}</p>
                                                                                <p className='text-xs text-ajv-moss/60'>التاريخ: {new Date(achievement.date).toLocaleDateString("ar-EG")}</p>
                                                                                <div className='flex flex-wrap gap-2 text-[11px] text-ajv-moss'>
                                                                                        <span className='rounded-full bg-ajv-cream px-2 py-1 shadow-sm'>صور: {achievement.images?.length || 0}</span>
                                                                                        <span className='rounded-full bg-ajv-cream px-2 py-1 shadow-sm'>فيديوهات: {achievement.videos?.length || 0}</span>
                                                                                        {achievement.showOnHome && (
                                                                                                <span className='rounded-full bg-ajv-green px-2 py-1 font-semibold text-white shadow'>
                                                                                                        يظهر في الرئيسية
                                                                                                </span>
                                                                                        )}
                                                                                </div>
                                                                        </div>
                                                                        <div className='mt-3 flex items-center gap-2'>
                                                                                <button
                                                                                        onClick={() => handleAchievementEdit(achievement)}
                                                                                        className='flex-1 rounded-lg bg-ajv-green px-3 py-2 text-xs font-semibold text-white shadow hover:bg-ajv-moss'
                                                                                >
                                                                                        تعديل
                                                                                </button>
                                                                                <button
                                                                                        onClick={() => handleAchievementDelete(achievement._id)}
                                                                                        className='rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700'
                                                                                >
                                                                                        حذف
                                                                                </button>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>
                                        </div>
                                </div>
                        )}
                </div>
        );
};

export default AdminPage;
