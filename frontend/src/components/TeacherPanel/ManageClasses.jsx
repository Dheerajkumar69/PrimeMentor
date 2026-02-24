import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import CourseCardTeacher from "./CourseCardTeacher.jsx";
import { CalendarCheck, Zap } from "lucide-react";

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
            dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(),
            timeHours, timeMinutes, 0
        );
        const bufferTimeMinutes = 60; // Class duration buffer
        const classEndTime = new Date(classStart.getTime() + bufferTimeMinutes * 60000);

        return { classStart, classEndTime };
    } catch (e) {
        console.error("Parsing failed:", e);
        return null;
    }
};

// Utility function to determine if a class is in the past
const isClassInPast = (classData) => {
    const times = parseClassDateTime(classData);
    if (!times) return false;
    const now = new Date();
    return times.classEndTime < now;
};


const ManageClasses = () => {
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeTicker, setTimeTicker] = useState(0);

    const fetchAllAssignedClasses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('teacherToken');

            // Assuming this endpoint fetches all ClassRequests assigned to the logged-in teacher
            const res = await axios.get(`${getBackendUrl()}/api/teacher/class-requests`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.data.success) {
                const sortedClasses = res.data.requests.sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate));
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
        const dataInterval = setInterval(fetchAllAssignedClasses, 30000);
        const timeInterval = setInterval(() => {
            setTimeTicker(prev => prev + 1);
        }, 5000);

        return () => {
            clearInterval(dataInterval);
            clearInterval(timeInterval);
        }
    }, [fetchAllAssignedClasses]);

    // Filter for current and upcoming classes that are 'accepted' (meaning assigned and ready)
    const currentClasses = useMemo(() => {
        return assignedClasses
            .filter(c => c.status === 'accepted' && !isClassInPast(c));
    }, [assignedClasses, timeTicker]);


    // --- UI START ---
    if (loading) return <div className="text-center py-8">Loading current classes...</div>;
    if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

    return (
        <div>
            <div className="text-base sm:text-lg font-semibold mb-4 text-gray-700 flex items-center">
                <CalendarCheck className="w-5 h-5 mr-2 text-green-500" />
                Upcoming Classes: {currentClasses.length} {currentClasses.length !== 1 ? 'Classes' : 'Class'} scheduled
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {currentClasses.length > 0 ? currentClasses.map(c => (
                    // We pass the zoomMeetingLink here. CourseCardTeacher must be updated to use it.
                    <div key={c._id} className="relative">
                        <CourseCardTeacher
                            course={c}
                            isManaged={true}
                            isPast={false}
                        />
                        {/* Display Zoom Link directly on the card for high visibility */}
                        {c.zoomMeetingLink && (
                            <div className="mt-2 p-3 bg-indigo-100 border-l-4 border-indigo-500 rounded-md">
                                <p className="text-indigo-700 font-semibold text-sm flex items-center mb-1">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Join Class:
                                </p>
                                <a
                                    href={c.zoomMeetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 underline text-xs font-medium break-all"
                                >
                                    Click to Join Meeting
                                </a>
                            </div>
                        )}
                        {!c.zoomMeetingLink && (
                            <div className="mt-2 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
                                <p className="text-yellow-700 font-medium text-xs">
                                    Meeting link pending: The Admin is scheduling the manual Zoom meeting.
                                </p>
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="col-span-full text-center py-12 sm:py-16 text-gray-500 bg-white border-2 border-dashed border-gray-200 rounded-xl shadow-inner">
                        <p className="text-lg sm:text-xl font-medium">No current or upcoming classes to manage.</p>
                        <p className="text-sm mt-2">Classes assigned by the Admin will appear here once accepted.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageClasses;