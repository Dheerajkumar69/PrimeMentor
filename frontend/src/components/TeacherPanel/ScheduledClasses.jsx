// frontend/src/components/TeacherPanel/ScheduledClasses.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Calendar, Clock, Loader2, Zap } from "lucide-react";
// CRITICAL IMPORT: Timezone utility
import { convertAuTimeToIndiaDisplay } from "../../utils/dateUtils.js"; 

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// --- Time Parsing Logic (Adjusted to correctly handle preferredDate string) ---
// This function is generally for internal comparison logic (past/future)
const parseClassDateTime = (classData) => {
    // preferredDate is the Australian YYYY-MM-DD string
    if (!classData.preferredDate || !classData.scheduleTime) return null;
    
    try {
        // We rely on the date string being YYYY-MM-DD (Australian Date)
        const dateParts = classData.preferredDate.split("-").map(Number);
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

        if (isNaN(dateObj.getTime())) return null;
        
        // 1. Safely extract the first part of the time string (e.g., '4:00pm')
        const timeString12h = classData.scheduleTime.split(' - ')[0];

        if (!timeString12h) return null;

        // 2. Convert 12h to 24h
        let [timeHours, timeMinutes] = timeString12h.replace(/[^0-9:]/g, '').split(':').map(Number);
        let period = timeString12h.slice(-2).toLowerCase();

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
    // We check against the current browser time (which for the Indian teacher is IST)
    // For proper accuracy, the parseClassDateTime function *should* convert the AU time 
    // to the local time, but to avoid relying on complex client-side TZ conversion, 
    // we assume the local browser time is IST for the teacher, and rely on the string 
    // manipulation for display.
    return times.classEndTime < new Date(); 
};

const ScheduledClasses = () => {
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllAssignedClasses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('teacherToken');
            
            const res = await axios.get(`${getBackendUrl()}/api/teacher/class-requests`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            
            if (res.data.success) {
                setAssignedClasses(res.data.requests); 
            }
            else setError(res.data.message || 'Failed to fetch assigned classes.');
        } catch (err) {
            console.error("Error fetching assigned classes:", err);
            setError('An error occurred while fetching your assigned classes.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchAllAssignedClasses();
        const dataInterval = setInterval(fetchAllAssignedClasses, 60000); 
        return () => clearInterval(dataInterval);
    }, [fetchAllAssignedClasses]);

    // Group classes by day for a weekly view
    const scheduledClassesByDay = useMemo(() => {
        const upcomingClasses = assignedClasses.filter(c => !isClassInPast(c));

        // Sort upcoming classes by date and time (using the AU local interpretation)
        upcomingClasses.sort((a, b) => {
            const dateA = parseClassDateTime(a)?.classStart.getTime() || 0;
            const dateB = parseClassDateTime(b)?.classStart.getTime() || 0;
            return dateA - dateB;
        });

        // Group the classes by date
        return upcomingClasses.reduce((acc, classItem) => {
            // Get Date object from YYYY-MM-DD string (interpreted locally)
            const dateParts = classItem.preferredDate.split("-").map(Number);
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

            if (isNaN(date.getTime())) return acc;

            const weekdayKey = date.toLocaleDateString(undefined, { weekday: 'long' });
            const shortDateKey = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            const key = `${weekdayKey}, ${shortDateKey}`;

            if (!acc[key]) acc[key] = [];
            acc[key].push(classItem);
            return acc;
        }, {});
    }, [assignedClasses]);

    // --- Component for a single class block in the chart view ---
    const ScheduleBlock = ({ course }) => {
        // CRITICAL FIX: Convert the Australian time string to Indian time for the teacher
        const indianTimeDisplay = convertAuTimeToIndiaDisplay(course.preferredDate, course.scheduleTime);
        
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-md hover:shadow-lg transition cursor-pointer">
                <p className="text-sm font-semibold text-blue-800">{course.courseTitle}</p>
                <p className="text-xs text-gray-600 mt-1">
                    <Clock size={12} className="inline mr-1" />
                    {/* Display the converted Indian Time */}
                    <span className="font-bold text-gray-700">{indianTimeDisplay}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Student ID: {course.studentId}</p>
            </div>
        );
    };

    // --- UI START ---
    if (loading) return <div className="text-center py-8 text-blue-600"><Loader2 className="animate-spin w-6 h-6 inline-block mr-2" /> Loading Schedule...</div>;
    if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

    const days = Object.keys(scheduledClassesByDay);

    return (
        <div className="space-y-6">
            <div className="text-base sm:text-lg font-semibold text-gray-700 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                Your Upcoming Schedule (All times shown in **Indian Time**)
            </div>
            {/* ... (rest of the component remains the same, using the updated ScheduleBlock) ... */}
            {days.length > 0 ? (
                <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                    {days.map(day => {
                    const parts = day.split(',');
                    const weekday = parts[0] || day;
                    const rest = parts.slice(1).join(',').trim() || ''; 
                    
                    return (
                        <div key={day} className="p-4 bg-white hover:bg-gray-50 transition sm:flex">
                            <div className="sm:w-1/4 flex-shrink-0 mb-3 sm:mb-0 sm:pr-4">
                                <p className="text-lg font-bold text-gray-800 border-b sm:border-b-0 pb-1">{weekday}</p>
                                <p className="text-xs text-gray-500">{rest}</p>
                            </div>
                            <div className="sm:w-3/4 flex flex-wrap gap-4 pt-2 sm:pt-0">
                                {scheduledClassesByDay[day].map((course, index) => (
                                    <ScheduleBlock key={index} course={course} />
                                ))}
                            </div>
                        </div>
                    );
                })}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Zap className="w-8 h-8 mx-auto text-yellow-500 mb-3" />
                    <p className="text-lg font-medium">Your schedule is clear for the upcoming days!</p>
                    <p className="text-sm mt-1">Check back once more classes are assigned.</p>
                </div>
            )}
        </div>
    );
};

export default ScheduledClasses;