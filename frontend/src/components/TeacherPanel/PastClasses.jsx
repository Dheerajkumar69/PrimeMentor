import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import CourseCardTeacher from "./CourseCardTeacher.jsx";
import { History, Send, X, CheckCircle } from "lucide-react"; // Added Send, X, CheckCircle

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Utility function to parse date and time (handles 12h AM/PM format)
const parseClassDateTime = (classData) => {
    // preferredDate is the Australian YYYY-MM-DD string
    if (!classData.preferredDate || !classData.scheduleTime) return null;

    try {
        // Parse YYYY-MM-DD without timezone shift
        const dateParts = classData.preferredDate.split("-").map(Number);
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

        if (isNaN(dateObj.getTime())) return null;

        // 1. Safely extract the first part of the time string (e.g., '4:00pm')
        const timeString12h = classData.scheduleTime.split(' - ')[0];
        if (!timeString12h) return null;

        // 2. Convert 12h to 24h
        let [timeHours, timeMinutes] = timeString12h.replace(/[^0-9:]/g, '').split(':').map(Number);
        let period = timeString12h.slice(-2).toLowerCase();

        if (isNaN(timeHours) || isNaN(timeMinutes)) return null;

        if (period === 'pm' && timeHours !== 12) {
            timeHours += 12;
        }
        if (period === 'am' && timeHours === 12) {
            timeHours = 0;
        }

        // 3. Create a Date object interpreted as the Australian local moment
        const classStart = new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
            timeHours,
            timeMinutes,
            0
        );

        const bufferTimeMinutes = 60; // Class duration buffer
        const classEndTime = new Date(classStart.getTime() + bufferTimeMinutes * 60000);

        return { classStart, classEndTime };
    } catch (e) {
        console.error("Parsing failed:", e);
        return null;
    }
};

const isClassInPast = (classData) => {
    const times = parseClassDateTime(classData);
    if (!times) return false;

    const now = new Date();
    return times.classEndTime < now;
};

// 🛑 NEW COMPONENT: PastClassSubmissionForm 🛑
const PastClassSubmissionForm = ({ onSubmissionSuccess }) => {
    const [formData, setFormData] = useState({
        sessionDate: '',
        sessionTime: '10:00 - 11:00', // Default value
        duration: '60 minutes', // Default value
        studentName: '',
        topic: '',
        subTopic: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error'
    const [isFormOpen, setIsFormOpen] = useState(false);

    const timeOptions = [
        '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00',
        '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
    ];

    const durationOptions = ['30 minutes', '45 minutes', '60 minutes', '90 minutes', '120 minutes'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSubmissionStatus(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionStatus(null);

        const token = localStorage.getItem('teacherToken');
        if (!token) {
            alert('You must be logged in to submit a class.');
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await axios.post(`${getBackendUrl()}/api/teacher/past-class/submit`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setSubmissionStatus('success');
                // Reset form state after successful submission (except for defaults)
                setFormData(prev => ({
                    ...prev,
                    sessionDate: '',
                    studentName: '',
                    topic: '',
                    subTopic: '',
                }));
                if (onSubmissionSuccess) onSubmissionSuccess();
            } else {
                setSubmissionStatus('error');
                console.error(res.data.message);
            }
        } catch (error) {
            setSubmissionStatus('error');
            console.error("Submission failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsFormOpen(false);
        setSubmissionStatus(null);
    };

    if (!isFormOpen) {
        return (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-md">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-blue-700">Submit Completed Class Report</h3>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition"
                    >
                        <Send className="w-5 h-5 mr-2" />
                        Start Submission
                    </button>
                </div>
                <p className="mt-2 text-sm text-blue-600">
                    Use this form to log the details of a class you have completed for administrative record-keeping.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-lg relative">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <Send className="w-5 h-5 mr-2 text-blue-600" />
                Past Class Submission Form
            </h3>

            <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                aria-label="Close form"
            >
                <X className="w-6 h-6" />
            </button>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Session Date */}
                <div>
                    <label htmlFor="sessionDate" className="block text-sm font-medium text-gray-700">SESSION DATE <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        id="sessionDate"
                        name="sessionDate"
                        value={formData.sessionDate}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    />
                </div>

                {/* Session Time */}
                <div>
                    <label htmlFor="sessionTime" className="block text-sm font-medium text-gray-700">SESSION TIME <span className="text-red-500">*</span></label>
                    <select
                        id="sessionTime"
                        name="sessionTime"
                        value={formData.sessionTime}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
                    >
                        {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>

                {/* Duration */}
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">DURATION <span className="text-red-500">*</span></label>
                    <select
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
                    >
                        {durationOptions.map(dur => (
                            <option key={dur} value={dur}>{dur}</option>
                        ))}
                    </select>
                </div>

                {/* Student Name */}
                <div>
                    <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">STUDENT NAME <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="studentName"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Jane Doe"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    />
                </div>

                {/* Topic */}
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700">TOPIC <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="topic"
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Algebra: Quadratic Equations"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    />
                </div>

                {/* Sub Topic */}
                <div>
                    <label htmlFor="subTopic" className="block text-sm font-medium text-gray-700">SUB TOPIC (Optional)</label>
                    <input
                        type="text"
                        id="subTopic"
                        name="subTopic"
                        value={formData.subTopic}
                        onChange={handleChange}
                        placeholder="e.g., Completing the Square"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    />
                </div>

                {/* Submission Button and Status */}
                <div className="md:col-span-2 flex items-center justify-between mt-4">
                    {submissionStatus === 'success' && (
                        <p className="flex items-center text-green-600 font-medium">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Class submitted successfully!
                        </p>
                    )}
                    {submissionStatus === 'error' && (
                        <p className="flex items-center text-red-600 font-medium">
                            <X className="w-5 h-5 mr-2" />
                            Submission failed. Please try again.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex items-center px-6 py-3 font-bold rounded-lg transition ${isSubmitting
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                            } ml-auto`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Class Details'}
                        {!isSubmitting && <Send className="w-5 h-5 ml-2" />}
                    </button>
                </div>
            </form>
        </div>
    );
};


const PastClasses = () => {
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submissionKey, setSubmissionKey] = useState(0); // For dummy box

    const handleSubmissionSuccess = () => {
        // You could trigger a re-fetch of all classes here if you were tracking them in a single list
        // For now, we'll just log it and potentially force a re-render of the past classes list below.
        console.log("Past Class submission successful from form.");
        // Increment key to trigger a re-render/re-fetch in the next component if needed
        setSubmissionKey(prev => prev + 1);
    };

    const fetchAllAssignedClasses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('teacherToken');

            const res = await axios.get(`${getBackendUrl()}/api/teacher/class-requests`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.data.success) {
                // Sort classes by preferredDate (oldest first)
                const sortedClasses = res.data.requests.sort((a, b) => new Date(b.preferredDate) - new Date(a.preferredDate));
                setAssignedClasses(sortedClasses);
            }
            else setError(res.data.message || 'Failed to fetch assigned classes.');
        } catch (err) {
            console.error("Error fetching assigned classes:", err);
            setError('An error occurred while fetching your assigned classes.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchAllAssignedClasses();
    }, [fetchAllAssignedClasses]);

    // Filter for past classes
    const pastClasses = useMemo(() => {
        return assignedClasses.filter(c => isClassInPast(c));
    }, [assignedClasses]);


    // --- UI START ---

    return (
        <div>
            {/* 🛑 PAST CLASS SUBMISSION FORM 🛑 */}
            <PastClassSubmissionForm onSubmissionSuccess={handleSubmissionSuccess} />

            <div className="text-base sm:text-lg font-semibold mb-4 text-gray-700 flex items-center mt-8 pt-4 border-t border-gray-200">
                <History className="w-5 h-5 mr-2 text-red-500" />
                Classes Filtered as Past: {pastClasses.length} {pastClasses.length !== 1 ? 'Classes' : 'Class'} completed
            </div>



            {/* Responsive Grid for Course Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-8">Loading past classes...</div>
                ) : error ? (
                    <div className="col-span-full text-red-500 text-center py-8">{error}</div>
                ) : pastClasses.length > 0 ? pastClasses.map(c => (
                    <CourseCardTeacher
                        key={c._id}
                        course={c}
                        isManaged={true}
                        isPast={true}
                    />
                )) : (
                    <div className="col-span-full text-center py-12 sm:py-16 text-gray-500 bg-white border-2 border-dashed border-gray-200 rounded-xl shadow-inner">
                        <p className="text-lg sm:text-xl font-medium">No system-tracked classes found in the past.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PastClasses;