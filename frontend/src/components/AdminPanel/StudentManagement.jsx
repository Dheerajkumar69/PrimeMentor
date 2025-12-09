// frontend/components/AdminPanel/StudentManagement.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { User, Book, ClipboardList, Clock, CheckCircle, Bell, UserPlus, Zap, X } from 'lucide-react';
import Select from 'react-select'; 

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// MODIFIED: Use 'en-AU' locale for date display consistent with Australian context
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
        // Assuming dateString is YYYY-MM-DD
        const parts = dateString.split("-").map(Number);
        // Construct date using local components
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        if (isNaN(date.getTime())) return "Invalid Date";
        
        return date.toLocaleDateString('en-AU', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return "N/A";
    }
};

// --- Sub-Component: Student Row (KEEP AS IS) ---
const StudentRow = ({ student }) => {
    const totalCourses = student.courses.length;
    const enrolledStatus = totalCourses > 0 ? 'Enrolled' : 'None';
    const statusClass = enrolledStatus === 'Enrolled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

    return (
        <tr className="border-t hover:bg-blue-50 transition duration-150 align-top">
            {/* Student Details */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    {student.studentName || 'N/A'}
                </div>
                <span className='block text-xs text-gray-500'>{student.email}</span>
            </td>
            
            {/* Enrollment Status */}
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                    {enrolledStatus} ({totalCourses})
                </span>
            </td>

            {/* Booked Courses */}
            <td className="px-6 py-4 text-sm text-gray-600">
                <div className='space-y-3'>
                    {student.courses.length > 0 ? (
                        student.courses.map((course, index) => (
                            <div key={course._id || index} className="flex flex-col text-xs border-b pb-2 last:border-b-0 last:pb-0">
                                <span className='font-bold text-gray-800 flex items-center'>
                                    <Book className='w-3 h-3 mr-1 text-orange-500' /> {course.name}
                                </span>
                                <span className='text-gray-500 ml-4'>Tutor: {course.teacher || 'Unassigned'}</span>
                                <span className='text-gray-500 ml-4 flex items-center'>
                                    <CheckCircle className={`w-3 h-3 mr-1 ${course.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}`} />
                                    {course.status} | {course.sessionsRemaining} Sessions Left
                                </span>
                                <span className='text-gray-500 ml-4 flex items-center'>
                                    <Clock className='w-3 h-3 mr-1' />
                                    {formatDate(course.preferredDate)} @ {course.preferredTime}
                                </span>
                            </div>
                        ))
                    ) : (
                        <span className='text-gray-400 italic'>No courses booked.</span>
                    )}
                </div>
            </td>
            
            {/* Actions */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {/* Add links to student profile/invoicing here */}
            </td>
        </tr>
    );
};

// --- Sub-Component: Pending Request Row (Assignment Phase) ---
const PendingRequestRow = ({ request, teachers, onAssignSuccess }) => {
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState(null);

    const teacherOptions = useMemo(() => teachers.map(t => ({
        value: t._id,
        label: `${t.name} (${t.email})`,
        subject: t.subject 
    })), [teachers]);

    const handleAssign = async () => {
        // ... (handleAssign logic remains UNCHANGED)
        if (!selectedTeacherId) {
            setError('Please select a teacher.');
            return;
        }
        setIsAssigning(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) throw new Error("Missing Admin token. Please log in.");
            
            const res = await axios.put(`${getBackendUrl()}/api/admin/assign-teacher/${request._id}`, 
                { teacherId: selectedTeacherId }, 
                { headers: { Authorization: `Bearer ${token}` } } 
            );

            if (res.data.message) {
                alert(`Successfully assigned to ${res.data.assignedTeacherName}. Now awaiting Zoom link.`);
                onAssignSuccess(request._id, res.data.request); // Pass the updated request to the parent
            }
        } catch (err) {
            console.error('Assignment error:', err);
            if (err.response && err.response.status === 403) {
                 localStorage.removeItem('adminToken');
                 window.location.href = '/admin/login'; 
                 return;
            }
            setError(err.response?.data?.message || 'Failed to assign teacher.');
        } finally {
            setIsAssigning(false);
        }
    };

    const isTrial = request.purchaseType === 'TRIAL';
    
    // 🛑 CRITICAL FIX: Display the specific date and time for all sessions 🛑
    const preferredSchedule = `${formatDate(request.preferredDate)} @ ${request.scheduleTime}`;
    
    // Only show the full Mon-Fri/Sat preference if it's a Starter Pack, for context
    const weeklyContext = !isTrial && request.preferredTimeMonFri ? `(M-F: ${request.preferredTimeMonFri} / Sat: ${request.preferredTimeSaturday})` : '';


    return (
        <tr className="border-t hover:bg-yellow-50 transition duration-150 align-top bg-white">
            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-red-500" />
                    {request.studentName}
                </div>
                <span className='block text-xs text-gray-500'>{request.studentId}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-700">
                <span className="font-bold">{request.courseTitle}</span>
                <span className='block text-xs text-gray-500 mt-1'>Type: {request.purchaseType} | Subject: {request.subject}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                <div className='text-xs'>
                    <p className='font-medium flex items-center'>
                        <Clock className='w-3 h-3 mr-1' /> 
                        {preferredSchedule}
                    </p>
                    {weeklyContext && <p className='text-gray-500 italic mt-0.5'>{weeklyContext}</p>}
                    <p className='text-gray-500'>Postcode: {request.postcode || 'N/A'}</p>
                    <p className='text-gray-500'>Requested: {formatDate(request.enrollmentDate)}</p>
                </div>
            </td>
            <td className="px-6 py-4 text-sm">
                <div className='space-y-2'>
                    <Select
                        options={teacherOptions}
                        onChange={(option) => setSelectedTeacherId(option.value)}
                        placeholder="Select Teacher..."
                        className="text-xs"
                        isDisabled={isAssigning}
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    <button
                        onClick={handleAssign}
                        disabled={!selectedTeacherId || isAssigning}
                        className="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        <UserPlus className="w-4 h-4 mr-1" />
                        {isAssigning ? 'Assigning...' : 'Approve & Assign'}
                    </button>
                </div>
            </td>
        </tr>
    );
};


// --- NEW Sub-Component: Accepted Class Row (Zoom Link Phase) ---
const AcceptedClassRow = ({ request, onLinkSuccess }) => {
    const [zoomLink, setZoomLink] = useState(request.zoomMeetingLink || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showInput, setShowInput] = useState(!request.zoomMeetingLink); // Show input if link is missing initially

    const handleAddZoomLink = async () => {
        // ... (handleAddZoomLink logic remains UNCHANGED)
        if (!zoomLink || !zoomLink.startsWith('http')) {
            setError('Please enter a valid Zoom meeting URL (must start with http/https).');
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) throw new Error("Missing Admin token. Please log in.");
            
            const res = await axios.put(`${getBackendUrl()}/api/admin/add-zoom-link/${request._id}`, 
                { zoomMeetingLink: zoomLink }, 
                { headers: { Authorization: `Bearer ${token}` } } 
            );

            if (res.data.message) {
                alert('Zoom link successfully added/updated.');
                onLinkSuccess(request._id, res.data.request);
                setShowInput(false);
            }
        } catch (err) {
            console.error('Zoom link error:', err);
            if (err.response && err.response.status === 403) {
                 localStorage.removeItem('adminToken');
                 window.location.href = '/admin/login'; 
                 return;
            }
            setError(err.response?.data?.message || 'Failed to save Zoom link.');
        } finally {
            setIsSaving(false);
        }
    };

    const isTrial = request.purchaseType === 'TRIAL';
    // 🛑 CRITICAL FIX: Display the specific date and time for all sessions 🛑
    const preferredSchedule = `${formatDate(request.preferredDate)} @ ${request.scheduleTime}`;
    
    // Only show the full Mon-Fri/Sat preference if it's a Starter Pack, for context
    const weeklyContext = !isTrial && request.preferredTimeMonFri ? `(M-F: ${request.preferredTimeMonFri} / Sat: ${request.preferredTimeSaturday})` : '';


    
    // 🛑 FIX START: Safely extract teacher name from the populated object 🛑
    const teacherDisplay = request.teacherId 
        ? (typeof request.teacherId === 'object' ? request.teacherId.name : request.teacherId)
        : 'Unassigned';
    // 🛑 FIX END 🛑

    return (
        <tr className="border-t hover:bg-green-50 transition duration-150 align-top bg-white">
            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-green-500" />
                    {request.studentName}
                </div>
                {/* 🛑 FIX APPLICATION: Use the safe display variable 🛑 */}
                <span className='block text-xs text-gray-500'>Tutor: {teacherDisplay}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-700">
                <span className="font-bold">{request.courseTitle}</span>
                <span className='block text-xs text-gray-500 mt-1'>Schedule: {preferredSchedule}</span>
                {weeklyContext && <span className='block text-xs text-gray-500 italic mt-0.5'>{weeklyContext}</span>}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                {showInput ? (
                    <div className='space-y-2'>
                        <input
                            type="url"
                            placeholder="Enter Zoom Link (https://...)"
                            value={zoomLink}
                            onChange={(e) => {setZoomLink(e.target.value); setError(null);}}
                            className="w-full p-2 border border-gray-300 rounded-md text-xs focus:ring-blue-500"
                            disabled={isSaving}
                        />
                        <button
                            onClick={handleAddZoomLink}
                            disabled={isSaving || !zoomLink}
                            className="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Zap className="w-4 h-4 mr-1" />
                            {isSaving ? 'Saving...' : (request.zoomMeetingLink ? 'Update Link' : 'Add Link')}
                        </button>
                    </div>
                ) : (
                    <div className='flex flex-col items-start'>
                        <p className='text-xs font-medium flex items-center text-blue-700 mb-1'>
                            <Zap className='w-4 h-4 mr-1' /> Link Added
                        </p>
                        <a 
                            href={zoomLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-500 hover:underline text-xs break-all"
                        >
                            {zoomLink.substring(0, 50)}...
                        </a>
                        <button 
                            onClick={() => setShowInput(true)} 
                            className='mt-2 text-xs text-indigo-500 hover:text-indigo-700 underline'
                        >
                            Edit Link
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};


// --- Main Component: StudentManagement ---
export default function StudentManagement({ students: initialStudents }) {
    const [activeTab, setActiveTab] = useState('requests');
    const [students, setStudents] = useState(initialStudents || []);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [acceptedClasses, setAcceptedClasses] = useState([]); // NEW STATE for accepted classes
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
             setLoading(false);
             return; 
        }

        const headers = { Authorization: `Bearer ${token}` }; 

        try {
            // 1. Fetch Pending Requests
            const pendingRes = await axios.get(`${getBackendUrl()}/api/admin/pending-requests`, { headers });
            setPendingRequests(pendingRes.data);

            // 🛑 CRITICAL FIX: Use the implemented route /accepted-requests 🛑
            const acceptedRes = await axios.get(`${getBackendUrl()}/api/admin/accepted-requests`, { headers });
            setAcceptedClasses(acceptedRes.data);
            
            // 3. Fetch Teachers 
            if (teachers.length === 0) {
                const teachersRes = await axios.get(`${getBackendUrl()}/api/admin/teachers`, { headers });
                setTeachers(teachersRes.data);
            }

            // 4. Fetch Students 
            if (activeTab === 'students' && students.length === 0) {
                 const studentsRes = await axios.get(`${getBackendUrl()}/api/admin/students`, { headers });
                 setStudents(studentsRes.data);
            }
        } catch (err) {
            console.error("Error fetching admin data:", err);
            // ... (error handling) ...
        } finally {
            setLoading(false);
        }
    }, [activeTab, students.length, teachers.length]);

    useEffect(() => {
        // 🛑 FIX 2: Call fetchData once on mount
        fetchData();

        // 🛑 FIX 3: Set up polling interval to refetch data periodically
        const intervalId = setInterval(() => {
            fetchData();
        }, 15000); // Poll every 15 seconds (15000 milliseconds)

        // Clean up the interval when the component unmounts or dependencies change
        return () => clearInterval(intervalId);
    }, [fetchData]); // Dependency array should include fetchData

    const handleAssignmentSuccess = (requestId, updatedRequest) => {
        // 1. Remove the processed request from the PENDING list
        setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        
        // 2. Add the newly 'accepted' request to the ACCEPTED list
        // We use the full updatedRequest object received from the backend response.
        setAcceptedClasses(prev => {
            // Check to avoid duplicates, although theoretically it shouldn't happen here
            if (!prev.find(r => r._id === updatedRequest._id)) {
                return [...prev, updatedRequest];
            }
            return prev;
        });

        // 3. Force students list update (to show course status change)
        setStudents([]); 
    };

    const handleLinkSuccess = (requestId, updatedRequest) => {
        // Update the item in the acceptedClasses list
        setAcceptedClasses(prev => prev.map(r => r._id === requestId ? updatedRequest : r));
        // Also re-fetch students to update the "Booked Courses" list
        setStudents([]); 
    };
    
    // --- Render Logic ---
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-700 flex items-center">
                <ClipboardList className='w-6 h-6 mr-2 text-blue-500' /> Admin Management Panel
            </h2>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`py-3 px-1 text-sm font-medium transition duration-150 border-b-2 ${activeTab === 'requests' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center`}
                    >
                        <Bell className='w-5 h-5 mr-2' />
                        Pending Requests ({pendingRequests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('accepted')}
                        className={`py-3 px-1 text-sm font-medium transition duration-150 border-b-2 ${activeTab === 'accepted' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center`}
                    >
                        <Zap className='w-5 h-5 mr-2' />
                        Accepted Classes ({acceptedClasses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`py-3 px-1 text-sm font-medium transition duration-150 border-b-2 ${activeTab === 'students' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center`}
                    >
                        <User className='w-5 h-5 mr-2' />
                        All Students ({students.length})
                    </button>
                </nav>
            </div>

            {loading && <div className="text-center py-8">Loading data...</div>}

            {/* Pending Requests Tab Content */}
            {activeTab === 'requests' && !loading && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-700">Class Assignment Queue</h3>
                    <div className="overflow-x-auto border rounded-xl shadow-inner">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule Preference</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Teacher</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingRequests.length > 0 ? (
                                    pendingRequests.map((request) => (
                                        <PendingRequestRow 
                                            key={request._id} 
                                            request={request} 
                                            teachers={teachers} 
                                            onAssignSuccess={handleAssignmentSuccess}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500 italic">No pending class requests. 🎉</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Accepted Classes Tab Content (NEW) */}
            {activeTab === 'accepted' && !loading && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-700">Accepted Classes (Add Zoom Link)</h3>
                    <div className="overflow-x-auto border rounded-xl shadow-inner">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student & Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course & Schedule</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zoom Link</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {acceptedClasses.length > 0 ? (
                                    acceptedClasses.map((request) => (
                                        <AcceptedClassRow
                                            key={request._id}
                                            request={request}
                                            onLinkSuccess={handleLinkSuccess}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500 italic">No accepted classes awaiting Zoom links.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* All Students Tab Content (Original functionality) */}
            {activeTab === 'students' && !loading && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-700">Student Enrollment Records</h3>
                    <div className="overflow-x-auto border rounded-xl shadow-inner">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked Courses</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <StudentRow key={student.clerkId} student={student} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500 italic">No student records found in the database.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}