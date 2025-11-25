// frontend/src/App.jsx

import React, { useContext, useState, useCallback, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react'; 

// Import Context
import { AppContext } from './context/AppContext.jsx';

// Import Pages/Sections
// ... (All page imports remain the same) ...
import Home from './pages/Home.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx'; 
import Booking from './pages/Booking.jsx';
import MyCourses from './pages/MyCourses.jsx'; 
import ContactPage from './pages/ContactPage.jsx'; 
import FaqPage from './pages/FaqPage.jsx'; 
import HelpCenterPage from './pages/HelpCenterPage.jsx'; 
import SupportPage from './pages/SupportPage.jsx'; 
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'; 
import TermsOfServicePage from './pages/TermsOfServicePage.jsx'; 
import RefundPolicyPage from './pages/RefundPolicyPage.jsx'; 
import Courses from './pages/Courses.jsx'; 

// Import Components
import TeacherLogin from './components/TeacherPanel/TeacherLogin.jsx';
import Enrollment from './components/Enrollment/Enrollment.jsx';
import Footer from './components/Home/Footer.jsx';
import AdminLogin from './components/AdminPanel/AdminLogin.jsx';
import AdminDashboard from './components/AdminPanel/AdminDashboard.jsx';
import AssessmentModal from './components/Booking/AssessmentModal.jsx';
import AssessmentCallout from './components/Home/AssessmentCallout.jsx'; 
import Header from './components/Home/Header.jsx'; 
import PaymentSuccessRedirect from './pages/PaymentSuccessRedirect.jsx';

/**
 * Component to protect the Admin Dashboard route.
 * Renders the children only if the user is admin authenticated.
 */
const AdminRouteGuard = ({ isAuthenticated, children }) => {
    return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

const App = () => {
    const { isSignedIn, isLoaded } = useUser();
    const location = useLocation();
    
    const { showTeacherLogin, setShowTeacherLogin } = useContext(AppContext); 
    
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
    
    // Logic to hide the main site Header on specific routes (dashboards, login pages)
    const hideHeaderPaths = [
        '/teacher/dashboard', 
        '/admin/login', 
        '/admin/dashboard',
        '/booking',
        '/enrollment'      
    ];
    
    // Header should be hidden if the modal is open OR if we are on a specific path
    const shouldHideHeader = showTeacherLogin || hideHeaderPaths.some(path => location.pathname.startsWith(path));

    // The state is still needed to block pointer events on the background
    const isModalOpen = showTeacherLogin || isAssessmentModalOpen;


    return (
        <div className="min-h-screen bg-white">
            
            {/* Teacher Login Modal (always rendered, but conditionally visible) */}
            {showTeacherLogin && <TeacherLogin setShowTeacherLogin={setShowTeacherLogin} />}
            
            {/* 🛑 FIX: AssessmentModal is moved OUTSIDE the main content wrapper 🛑 */}
            <AssessmentModal 
                isOpen={isAssessmentModalOpen} 
                onClose={() => setIsAssessmentModalOpen(false)} 
                onSubmissionComplete={handleSubmissionComplete} 
            />
            {/* 🛑 End of Modal Move 🛑 */}

            {/* Main Content Wrapper: This now only affects the background content */}
            <div className={`relative z-10 ${isModalOpen ? 'pointer-events-none' : ''}`}>
                
                {/* Header is conditionally rendered based on path and modal state */}
                {!shouldHideHeader && <Header />}             
                

                <AssessmentCallout
                    isOpen={isAssessmentCalloutOpen}
                    onClose={() => setIsAssessmentCalloutOpen(false)}
                    onBookFreeAssessment={handleCalloutBook}
                />

                <Routes>
                    <Route 
                        path="/" 
                        element={<Home setIsAssessmentModalOpen={setIsAssessmentModalOpen} />} 
                    />
                    
                    {/* ⭐ Other routes remain the same ⭐ */}
                    <Route path="/courses" element={<Courses />} /> 
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/help-center" element={<HelpCenterPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                    <Route path="/refund-policy" element={<RefundPolicyPage />} /> 
                    
                    <Route 
                        path="/admin/login" 
                        element={<AdminLogin setAdminAuthenticated={setIsAdminAuthenticated} />} 
                    />
                    <Route 
                        path="/admin/dashboard" 
                        element={
                            <AdminRouteGuard isAuthenticated={isAdminAuthenticated}>
                                <AdminDashboard 
                                    onLogout={handleAdminLogout} 
                                />
                            </AdminRouteGuard>
                        } 
                    />

                    <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                    
                    <Route path="/booking" element={
                        <>
                            <SignedIn><Booking /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />
                    
                    <Route path="/enrollment" element={
                        <>
                            <SignedIn><Enrollment /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />

                    <Route path="/payment-status" element={
                        <>
                            <SignedIn><PaymentSuccessRedirect /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />

                    <Route path="/my-courses" element={
                        <>
                            <SignedIn><MyCourses /></SignedIn>
                            <SignedOut><RedirectToSignIn /></SignedOut>
                        </>
                    } />
                </Routes>
            </div>
            {!shouldHideHeader && <Footer />}
        </div>
    );
};

export default App;