import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AdminPage from "./pages/AdminPage";
import AchievementDetailPage from "./pages/AchievementDetailPage";
import AchievementsPage from "./pages/AchievementsPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import SignUpPage from "./pages/SignUpPage";
import TrustPage from "./pages/TrustPage";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";
import { useUserStore } from "./stores/useUserStore";

function App() {
        const user = useUserStore((state) => state.user);
        const checkAuth = useUserStore((state) => state.checkAuth);
        const checkingAuth = useUserStore((state) => state.checkingAuth);

        useEffect(() => {
                checkAuth();
        }, [checkAuth]);

        if (checkingAuth) {
                return <LoadingSpinner />;
        }

        return (
                <div className='min-h-screen bg-gradient-to-b from-ajv-cream to-white text-ajv-green'>
                        <Navbar />
                        <main className='pt-24'>
                                <Routes>
                                        <Route path='/' element={<HomePage />} />
                                        <Route path='/achievements' element={<AchievementsPage />} />
                                        <Route path='/achievements/:id' element={<AchievementDetailPage />} />
                                        <Route path='/trust' element={<TrustPage />} />
                                        <Route path='/projects/:id' element={<ProjectDetailPage />} />
                                        <Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
                                        <Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
                                        <Route
                                                path='/admin'
                                                element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
                                        />
                                </Routes>
                        </main>
                        <Footer />
                        <Toaster position='top-center' />
                </div>
        );
}

export default App;
