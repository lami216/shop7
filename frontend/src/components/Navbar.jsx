import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useUserStore } from "../stores/useUserStore";

const Navbar = () => {
        const [open, setOpen] = useState(false);
        const { user } = useUserStore();
        const navLinks = [
                { to: "/", label: "الرئيسية" },
                ...(user?.role === "admin" ? [{ to: "/admin", label: "لوحة التحكم" }] : []),
        ];

        return (
                <header className='fixed top-0 inset-x-0 z-40 border-b border-ajv-mint/60 bg-white/95 backdrop-blur-lg'>
                        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10'>
                                <div className='flex items-center gap-3'>
                                        <button
                                                className='flex h-10 w-10 items-center justify-center rounded-full border border-ajv-mint bg-white text-ajv-green shadow-sm sm:hidden'
                                                onClick={() => setOpen((prev) => !prev)}
                                                aria-label='Toggle menu'
                                        >
                                                <Menu className='h-5 w-5' />
                                        </button>
                                        <Link to='/' className='flex items-center gap-3'>
                                                <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-ajv-mint text-lg font-bold text-ajv-green shadow-md'>
                                                        AJV
                                                </div>
                                                <div className='flex flex-col leading-tight'>
                                                        <span className='text-sm font-semibold uppercase text-ajv-moss'>
                                                                Association de la Jeunesse de Voullaniya
                                                        </span>
                                                        <span className='text-xs text-ajv-green/70'>رابطة شباب الفلّانية</span>
                                                </div>
                                        </Link>
                                </div>

                                <nav className='hidden items-center gap-6 font-semibold text-ajv-moss sm:flex'>
                                        {navLinks.map((link) => (
                                                <NavLink
                                                        key={link.to}
                                                        to={link.to}
                                                        className={({ isActive }) =>
                                                                `rounded-full px-4 py-2 transition ${
                                                                        isActive
                                                                                ? "bg-ajv-mint text-ajv-moss shadow"
                                                                                : "hover:bg-ajv-mint/70"
                                                                }`
                                                        }
                                                >
                                                        {link.label}
                                                </NavLink>
                                        ))}
                                </nav>

                                <div className='flex items-center gap-2 text-ajv-moss'>
                                        <button className='flex h-10 w-10 items-center justify-center rounded-full border border-ajv-mint bg-white shadow-sm'>
                                                <Search className='h-5 w-5' />
                                        </button>
                                        <button className='flex h-10 w-10 items-center justify-center rounded-full border border-ajv-mint bg-white shadow-sm'>
                                                <ShoppingBag className='h-5 w-5' />
                                        </button>
                                        <Link
                                                to={user ? "/admin" : "/login"}
                                                className='flex h-10 w-10 items-center justify-center rounded-full border border-ajv-mint bg-white shadow-sm'
                                        >
                                                <UserRound className='h-5 w-5' />
                                        </Link>
                                </div>
                        </div>

                        {open && (
                                <div className='border-t border-ajv-mint/70 bg-white px-6 py-3 sm:hidden'>
                                        <nav className='flex flex-col gap-3 text-ajv-moss'>
                                                {navLinks.map((link) => (
                                                        <NavLink
                                                                key={link.to}
                                                                to={link.to}
                                                                className={({ isActive }) =>
                                                                        `rounded-xl px-3 py-2 ${
                                                                                isActive ? "bg-ajv-mint text-ajv-moss" : "bg-ajv-cream"
                                                                        }`
                                                                }
                                                                onClick={() => setOpen(false)}
                                                        >
                                                                {link.label}
                                                        </NavLink>
                                                ))}
                                        </nav>
                                </div>
                        )}
                </header>
        );
};

export default Navbar;
