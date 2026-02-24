// frontend/src/components/AdminPanel/AdminDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, LogOut, BookOpen, Users as UsersIcon, Briefcase, ClipboardList, History, MessageSquare, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Import management components
import StudentManagement from './StudentManagement.jsx';
import TeacherManagement from './TeacherManagement.jsx';
import SyllabusManagement from './SyllabusManagement.jsx';
import AssessmentBookings from './AssessmentBookings.jsx';
import PastClassSubmissions from './PastClassSubmissions.jsx';
import FeedbackManagement from './FeedbackManagement.jsx';
import PricingManagement from './PricingManagement.jsx';
import ClassRequestsView from './ClassRequestsView.jsx';

// Base URL for API calls
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * AdminDashboard component displays the administrative interface.
 * @param {object} props
 * @param {function} props.onLogout - Function to log the admin out and reset state.
 */
export default function AdminDashboard({ onLogout, assessmentRequests: initialAssessmentRequests }) {
    const navigate = useNavigate();

    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('adminAuthenticated') === 'true'
    );

    // --- STATE MODIFICATION ---
    // 🛑 NEW DEFAULT TAB (You requested to default to 'past-classes', changing to 'feedback' might be more impactful)
    const [activeTab, setActiveTab] = useState('feedback'); // Default to the new feedback tab
    const [assessmentRequests, setAssessmentRequests] = useState(initialAssessmentRequests || []);

    // State for managed data
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classRequests, setClassRequests] = useState([]);

    const [dataLoading, setDataLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Redirect if not authenticated (remains the same)
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/admin/login', { replace: true });
        }
    }, [isAuthenticated, navigate]);


    // Utility function for fetching data (remains the same)
    const fetchData = async (endpoint, setter) => {
        const token = localStorage.getItem('adminToken');

        if (!token || !isAuthenticated) {
            setFetchError('Authentication token missing. Please log in.');
            if (onLogout) onLogout();
            return;
        }

        try {
            setDataLoading(true);
            setFetchError(null);

            const response = await axios.get(`${BACKEND_URL}/api/admin/${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setter(response.data);
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error.response?.data || error.message);

            let message = error.response?.data?.message || 'A network error occurred.';
            if (error.response?.status === 403 || error.response?.status === 401) {
                message = "Session expired or unauthorized. Logging out...";
                if (onLogout) onLogout();
            }

            setFetchError(message);
            setter([]);
        } finally {
            setDataLoading(false);
        }
    };

    // Fetch data based on the active tab change (Modified)
    useEffect(() => {
        if (isAuthenticated) {
            if (activeTab === 'student') {
                fetchData('students', setStudents);
            } else if (activeTab === 'teacher') {
                fetchData('teachers', setTeachers);
            }
            // 'syllabus', 'assessment', 'past-classes', and 'feedback' components handle their own fetching.
        }
    }, [activeTab, isAuthenticated, onLogout]);

    // Logout handler (remains the same)
    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminToken');
            navigate('/admin/login', { replace: true });
        }
    }

    // --- Utility/Rendering Functions (Modified for new tab) ---
    const tabClass = "px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200";

    const renderContent = () => {
        if (!isAuthenticated) {
            return <div className='text-center p-10 text-red-600 font-medium'>Please log in to access the dashboard.</div>;
        }

        if (fetchError) {
            return <div className='text-center p-10 text-red-600 font-medium'>{fetchError}</div>;
        }

        switch (activeTab) {
            case 'student':
                return <StudentManagement key={activeTab} students={students} />;
            case 'teacher':
                return <TeacherManagement key={activeTab} teachers={teachers} />;
            case 'syllabus':
                return <SyllabusManagement key={activeTab} />;
            case 'requests':
                return <ClassRequestsView key={activeTab} />;
            case 'assessment':
                return <AssessmentBookings key={activeTab} />;
            case 'past-classes':
                return <PastClassSubmissions key={activeTab} />;
            // 🟢 NEW CASE 🟢
            case 'feedback':
                return <FeedbackManagement key={activeTab} />;
            case 'pricing':
                return <PricingManagement key={activeTab} />;
            default:
                return null;
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <header className="bg-white p-6 rounded-xl shadow-lg flex justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
                    <LayoutDashboard className="w-7 h-7 mr-3 text-orange-500" />
                    Prime Mentor Admin
                </h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </header>

            <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 mb-6 flex space-x-4 overflow-x-auto">

                    <button
                        onClick={() => setActiveTab('student')}
                        className={`${tabClass} ${activeTab === 'student' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <UsersIcon className='inline w-4 h-4 mr-1' /> Student Management
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        className={`${tabClass} ${activeTab === 'teacher' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <Briefcase className='inline w-4 h-4 mr-1' /> Teacher Management
                    </button>
                    <button
                        onClick={() => setActiveTab('syllabus')}
                        className={`${tabClass} ${activeTab === 'syllabus' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                    >
                        <BookOpen className='inline w-4 h-4 mr-1' /> Syllabus
                    </button>
                    {/* --- Assessment Enquiries --- */}
                    <button
                        onClick={() => setActiveTab('assessment')}
                        className={`${tabClass} ${activeTab === 'assessment' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-orange-500'} flex items-center`}
                    >
                        <ClipboardList className='w-4 h-4 mr-1' /> Assessment Enquiries
                    </button>

                    {/* --- Past Class Submissions --- */}
                    <button
                        onClick={() => setActiveTab('past-classes')}
                        className={`${tabClass} ${activeTab === 'past-classes' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-red-500'} flex items-center`}
                    >
                        <History className='w-4 h-4 mr-1' /> Past Class Submissions
                    </button>

                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`${tabClass} ${activeTab === 'feedback' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-purple-500'} flex items-center`}
                    >
                        <MessageSquare className='w-4 h-4 mr-1' /> Student Feedback
                    </button>

                    {/* Pricing Management Tab */}
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`${tabClass} ${activeTab === 'pricing' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-500'} flex items-center`}
                    >
                        <DollarSign className='w-4 h-4 mr-1' /> Pricing
                    </button>
                </div>

                {/* Render Active Tab Content */}
                {renderContent()}
            </div>
        </div>
    );
}