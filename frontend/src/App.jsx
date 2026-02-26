// frontend/src/App.jsx

import React, { useContext, useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AppContext } from './context/AppContext.jsx';
import TeacherLogin from './components/TeacherPanel/TeacherLogin.jsx';
import StudentLogin from './components/StudentPanel/StudentLogin.jsx';
import AdminLogin from './components/AdminPanel/AdminLogin.jsx';
import AssessmentModal from './components/Booking/AssessmentModal.jsx';
import AssessmentCallout from './components/Home/AssessmentCallout.jsx';
import Header from './components/Home/Header.jsx';
import Footer from './components/Home/Footer.jsx';
import ChatbotWidget from './components/Chatbot/ChatbotWidget.jsx';
import ScrollToTop from './components/Home/ScrollToTop.jsx';

// Lazy-loaded page routes
const Home = lazy(() => import('./pages/Home.jsx'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard.jsx'));
const Booking = lazy(() => import('./pages/Booking.jsx'));
const MyCourses = lazy(() => import('./pages/MyCourses.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const FaqPage = lazy(() => import('./pages/FaqPage.jsx'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage.jsx'));
const SupportPage = lazy(() => import('./pages/SupportPage.jsx'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.jsx'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage.jsx'));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage.jsx'));
const Courses = lazy(() => import('./pages/Courses.jsx'));
const Enrollment = lazy(() => import('./components/Enrollment/Enrollment.jsx'));
const AdminDashboard = lazy(() => import('./components/AdminPanel/AdminDashboard.jsx'));
const PaymentSuccessRedirect = lazy(() => import('./pages/PaymentSuccessRedirect.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));


const Fallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-4 bg-white rounded-lg shadow-md flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">Loading...</span>
        </div>
    </div>
);

const AdminRouteGuard = ({ isAuthenticated, children }) =>
    isAuthenticated ? children : <Navigate to="/admin/login" replace />;

// Guard for student-protected routes
const StudentRouteGuard = ({ isSignedIn, studentLoading, children }) => {
    // Still verifying the stored token — don't redirect yet
    if (studentLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (isSignedIn) return children;
    return <Navigate to="/" replace />;
};

const App = () => {
    const location = useLocation();
    const {
        showTeacherLogin, setShowTeacherLogin, teacherToken,
        showStudentLogin, setShowStudentLogin,
        isSignedIn, studentLoading,
        adminToken,
    } = useContext(AppContext);

    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
        !!localStorage.getItem('adminAuthenticated')
    );
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [isAssessmentCalloutOpen, setIsAssessmentCalloutOpen] = useState(false);

    useEffect(() => {
        const checkAuth = () => setIsAdminAuthenticated(!!localStorage.getItem('adminAuthenticated'));
        checkAuth();
        const handleStorageChange = (e) => {
            if (e.key === 'adminAuthenticated') setIsAdminAuthenticated(e.newValue === 'true');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Show callout only on home page when not signed in
    useEffect(() => {
        const isHomePage = window.location.pathname === '/';
        setIsAssessmentCalloutOpen(isHomePage && !isSignedIn);
    }, [isSignedIn]);

    const handleCalloutBook = () => {
        setIsAssessmentCalloutOpen(false);
        setIsAssessmentModalOpen(true);
    };

    const handleAdminLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminAuthenticated');
        setIsAdminAuthenticated(false);
        window.location.href = '/admin/login';
    };

    const handleSubmissionComplete = useCallback((data) => {
        console.log("Assessment submitted:", data);
    }, []);

    const hideNavPaths = ['/teacher/dashboard', '/admin/login', '/admin/dashboard', '/booking', '/enrollment', '/payment-status'];
    const shouldHideNav = showTeacherLogin || showStudentLogin || hideNavPaths.some(p => location.pathname.startsWith(p));
    const isModalOpen = showTeacherLogin || showStudentLogin || isAssessmentModalOpen;

    return (
        <div className="min-h-screen bg-white">
            <Toaster position="top-center" reverseOrder={false} />
            <ScrollToTop />

            {/* Modals */}
            {showTeacherLogin && <TeacherLogin setShowTeacherLogin={setShowTeacherLogin} />}
            {showStudentLogin && <StudentLogin setShowStudentLogin={setShowStudentLogin} />}
            <AssessmentModal
                isOpen={isAssessmentModalOpen}
                onClose={() => setIsAssessmentModalOpen(false)}
                onSubmissionComplete={handleSubmissionComplete}
            />

            <ChatbotWidget />

            <div className={`relative z-10 ${isModalOpen ? 'pointer-events-none' : ''}`}>
                {!shouldHideNav && <Header />}

                <AssessmentCallout
                    isOpen={isAssessmentCalloutOpen}
                    onClose={() => setIsAssessmentCalloutOpen(false)}
                    onBookFreeAssessment={handleCalloutBook}
                />

                <Suspense fallback={<Fallback />}>
                    <Routes>
                        <Route path="/" element={<Home setIsAssessmentModalOpen={setIsAssessmentModalOpen} />} />

                        {/* Public pages */}
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/faq" element={<FaqPage />} />
                        <Route path="/help-center" element={<HelpCenterPage />} />
                        <Route path="/support" element={<SupportPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                        <Route path="/refund-policy" element={<RefundPolicyPage />} />

                        {/* Admin */}
                        <Route path="/admin/login" element={<AdminLogin setAdminAuthenticated={setIsAdminAuthenticated} />} />
                        <Route path="/admin/dashboard" element={
                            <AdminRouteGuard isAuthenticated={isAdminAuthenticated}>
                                <AdminDashboard onLogout={handleAdminLogout} />
                            </AdminRouteGuard>
                        } />

                        {/* Teacher */}
                        <Route path="/teacher/dashboard" element={
                            teacherToken ? <TeacherDashboard /> : <Navigate to="/" replace />
                        } />

                        {/* Student-protected routes — show spinner while hydrating, redirect home if not signed in */}
                        <Route path="/booking" element={<StudentRouteGuard isSignedIn={isSignedIn} studentLoading={studentLoading}><Booking /></StudentRouteGuard>} />
                        <Route path="/enrollment" element={<StudentRouteGuard isSignedIn={isSignedIn} studentLoading={studentLoading}><Enrollment /></StudentRouteGuard>} />
                        <Route path="/payment-status" element={<StudentRouteGuard isSignedIn={isSignedIn} studentLoading={studentLoading}><PaymentSuccessRedirect /></StudentRouteGuard>} />
                        <Route path="/my-courses" element={<StudentRouteGuard isSignedIn={isSignedIn} studentLoading={studentLoading}><MyCourses /></StudentRouteGuard>} />

                        {/* Password reset — public */}
                        <Route path="/reset-password" element={<ResetPassword />} />

                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </div>

            {!shouldHideNav && <Footer />}
        </div>
    );
};

export default App;