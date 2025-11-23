import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";

const AdminPage = () => {
        const [projects, setProjects] = useState([]);
        const [paymentMethods, setPaymentMethods] = useState([]);
        const [donations, setDonations] = useState([]);
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
        });
        const [paymentForm, setPaymentForm] = useState({
                name: "",
                accountNumber: "",
                image: "",
                imagePreview: "",
                isActive: true,
        });

        const readFileAsDataURL = (file) => {
                return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                });
        };

        const loadData = async () => {
                try {
                        const [projectsRes, paymentsRes, donationsRes] = await Promise.all([
                                apiClient.get("/projects"),
                                apiClient.get("/payment-methods?includeInactive=true"),
                                apiClient.get("/donations"),
                        ]);
                        setProjects(projectsRes);
                        setPaymentMethods(paymentsRes);
                        setDonations(donationsRes);
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

                const base64 = await readFileAsDataURL(file);
                setProjectForm((previous) => ({ ...previous, image: base64, imagePreview: base64 }));
        };

        const handlePaymentImageChange = async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const base64 = await readFileAsDataURL(file);
                setPaymentForm((previous) => ({ ...previous, image: base64, imagePreview: base64 }));
        };

        const handleProjectSubmit = async (e) => {
                e.preventDefault();
                try {
                        await apiClient.post("/projects", {
                                ...projectForm,
                                targetAmount: Number(projectForm.targetAmount),
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

        const updateLocalProject = (id, key, value) => {
                setProjects((prev) => prev.map((project) => (project._id === id ? { ...project, [key]: value } : project)));
        };

        return (
                <div className='mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-10'>
                        <h1 className='mt-6 text-3xl font-bold text-ajv-moss'>لوحة تحكم المشرف</h1>
                        <p className='text-ajv-moss/80'>إدارة المشاريع ووسائل الدفع وتصفح التبرعات المسجلة.</p>

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
                                                                                <p className='text-xs text-ajv-moss/70'>المتحصل: {project.currentAmount?.toLocaleString("ar-EG") || 0} / الهدف {project.targetAmount?.toLocaleString("ar-EG")}</p>
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
                                                                        <td className='px-3 py-2'>{donation.amount?.toLocaleString("ar-EG")}</td>
                                                                        <td className='px-3 py-2'>{donation.paymentMethod?.name}</td>
                                                                        <td className='px-3 py-2'>{donation.donorName || donation.donorPhone || "مجهول"}</td>
                                                                        <td className='px-3 py-2'>{new Date(donation.createdAt).toLocaleDateString("ar-EG")}</td>
                                                                </tr>
                                                        ))}
                                                </tbody>
                                        </table>
                                </div>
                        </section>
                </div>
        );
};

export default AdminPage;
