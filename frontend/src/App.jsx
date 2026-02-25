// frontend/src/App.jsx

import React, { useContext, useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';

// --- STATIC IMPORTS (Necessary for App Shell or Modals) ---
import { AppContext } from './context/AppContext.jsx';
import TeacherLogin from './components/TeacherPanel/TeacherLogin.jsx';
import AdminLogin from './components/AdminPanel/AdminLogin.jsx';
import AssessmentModal from './components/Booking/AssessmentModal.jsx';
import AssessmentCallout from './components/Home/AssessmentCallout.jsx';
import Header from './components/Home/Header.jsx';
import Footer from './components/Home/Footer.jsx';
// --- NEW IMPORT: Chatbot Widget ---
import ChatbotWidget from './components/Chatbot/ChatbotWidget.jsx';
// --- NEW IMPORT: Scroll Restoration Component ---
import ScrollToTop from './components/Home/ScrollToTop.jsx'; // <-- IMPORT ScrollToTop HERE

// --- DYNAMIC IMPORTS (Lazy Loading for Page Routes) ---
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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

// --------------------------------------------------------
// --- UTILITY COMPONENTS ---
// --------------------------------------------------------

/**
 * Loading Fallback Component for Suspense.
 */
const Fallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-4 bg-white rounded-lg shadow-md flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">Loading page content...</span>
        </div>
    </div>
);


/**
 * Component to protect the Admin Dashboard route.
 * Renders the children only if the user is admin authenticated.
 */
const AdminRouteGuard = ({ isAuthenticated, children }) => {
    return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

// --------------------------------------------------------
// --- MAIN APP COMPONENT ---
// --------------------------------------------------------

const App = () => {
    const { isSignedIn, isLoaded } = useUser();
    const location = useLocation();

    const { showTeacherLogin, setShowTeacherLogin, teacherToken } = useContext(AppContext);

    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
        !!localStorage.getItem('adminAuthenticated')
    );

    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [isAssessmentCalloutOpen, setIsAssessmentCalloutOpen] = useState(false);

    // --- Authentication and Context Handlers (unchanged) ---
    useEffect(() => {
        const checkAuth = () => {
            setIsAdminAuthenticated(!!localStorage.getItem('adminAuthenticated'));
        };
        checkAuth();
        const handleStorageChange = (e) => {
            if (e.key === 'adminAuthenticated') {
                setIsAdminAuthenticated(e.newValue === 'true');
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => { window.removeEventListener('storage', handleStorageChange); };
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const isHomePage = window.location.pathname === '/';
        if (isHomePage && !isSignedIn) {
            setIsAssessmentCalloutOpen(true);
        } else {
            setIsAssessmentCalloutOpen(false);
        }
    }, [isLoaded, isSignedIn]);

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
        console.log("New Assessment Request successfully submitted to DB:", data);
    }, []);
    // --- End Handlers ---

    // Logic to hide the main site Header/Footer on specific routes (dashboards, login pages)
    const hideNavPaths = [
        '/teacher/dashboard',
        '/admin/login',
        '/admin/dashboard',
        '/booking',
        '/enrollment',
        '/payment-status'
    ];

    const shouldHideNav = showTeacherLogin || hideNavPaths.some(path => location.pathname.startsWith(path));

    // The state is still needed to block pointer events on the background
    const isModalOpen = showTeacherLogin || isAssessmentModalOpen;


    return (
        <div className="min-h-screen bg-white">
            <Toaster position="top-center" reverseOrder={false} />

            {/* 1. SCROLL TO TOP INTEGRATION: Must be placed inside the component 
               so it can access the useLocation() hook from react-router-dom. */}
            <ScrollToTop />
            {/* ------------------------------------------------------------ */}

            {/* Modals are placed outside the main content flow */}
            {showTeacherLogin && <TeacherLogin setShowTeacherLogin={setShowTeacherLogin} />}
            <AssessmentModal
                isOpen={isAssessmentModalOpen}
                onClose={() => setIsAssessmentModalOpen(false)}
                onSubmissionComplete={handleSubmissionComplete}
            />

            {/* --- INTEGRATION: Chatbot Widget is placed here, floating above all content --- */}
            <ChatbotWidget />

            {/* Main Content Wrapper: Disables pointer events when a full-screen modal is open */}
            <div className={`relative z-10 ${isModalOpen ? 'pointer-events-none' : ''}`}>

                {/* Header and Assessment Callout are STATIC imports */}
                {!shouldHideNav && <Header />}

                <AssessmentCallout
                    isOpen={isAssessmentCalloutOpen}
                    onClose={() => setIsAssessmentCalloutOpen(false)}
                    onBookFreeAssessment={handleCalloutBook}
                />

                {/* Wrap all Routes with Suspense for lazy loading */}
                <Suspense fallback={<Fallback />}>
                    <Routes>
                        <Route
                            path="/"
                            element={<Home setIsAssessmentModalOpen={setIsAssessmentModalOpen} />}
                        />

                        {/* Public Pages (Now Lazy Loaded) */}
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/faq" element={<FaqPage />} />
                        <Route path="/help-center" element={<HelpCenterPage />} />
                        <Route path="/support" element={<SupportPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                        <Route path="/refund-policy" element={<RefundPolicyPage />} />

                        {/* Auth & Protected Pages (Now Lazy Loaded) */}
                        <Route path="/admin/login" element={<AdminLogin setAdminAuthenticated={setIsAdminAuthenticated} />} />

                        <Route
                            path="/admin/dashboard"
                            element={
                                <AdminRouteGuard isAuthenticated={isAdminAuthenticated}>
                                    <AdminDashboard onLogout={handleAdminLogout} />
                                </AdminRouteGuard>
                            }
                        />

                        <Route
                            path="/teacher/dashboard"
                            element={
                                teacherToken
                                    ? <TeacherDashboard />
                                    : <Navigate to="/" replace />
                            }
                        />

                        {/* Clerk Protected Routes (Wrapped around Lazy Loaded Components) */}
                        <Route path="/booking" element={
                            <SignedIn><Booking /></SignedIn>
                        } />
                        <Route path="/booking" element={<SignedOut><RedirectToSignIn /></SignedOut>} />

                        <Route path="/enrollment" element={
                            <SignedIn><Enrollment /></SignedIn>
                        } />
                        <Route path="/enrollment" element={<SignedOut><RedirectToSignIn /></SignedOut>} />

                        <Route path="/payment-status" element={
                            <SignedIn><PaymentSuccessRedirect /></SignedIn>
                        } />
                        <Route path="/payment-status" element={<SignedOut><RedirectToSignIn /></SignedOut>} />

                        <Route path="/my-courses" element={
                            <SignedIn><MyCourses /></SignedIn>
                        } />
                        <Route path="/my-courses" element={<SignedOut><RedirectToSignIn /></SignedOut>} />

                        {/* 404 Catch-All Route */}
                        <Route path="*" element={<NotFoundPage />} />

                    </Routes>
                </Suspense>
            </div>
            {/* Footer is conditionally rendered and STATIC */}
            {!shouldHideNav && <Footer />}
        </div>
    );
};

export default App;