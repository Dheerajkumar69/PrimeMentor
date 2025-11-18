import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Calendar, Clock, Loader2, Zap } from "lucide-react";

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// 🛑 FIX APPLIED: Robust time parsing inside parseClassDateTime 🛑
const parseClassDateTime = (classData) => {
    if (!classData.preferredDate || !classData.scheduleTime) return null;
    
    try {
        const dateObj = new Date(classData.preferredDate);
        if (isNaN(dateObj)) return null;
        
        // 1. Safely extract the first part of the time string
        const timeParts = classData.scheduleTime.split(/[ -]/);
        const timeString = timeParts[0];

        // 2. Check if the time string is valid
        if (!timeString) return null;

        // 3. Split into hours and minutes, ensuring 's' is treated as a string before calling .trim()
        const [timeHours, timeMinutes] = timeString.split(':')
            .map(s => String(s || '').trim()) // Ensure 's' is a string and trim it
            .filter(s => s !== '')           // Filter out empty strings
            .map(s => parseInt(s));          // Parse the resulting string
            
        // 4. Validate parsed components
        if (isNaN(timeHours) || isNaN(timeMinutes)) return null;


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
            
            // Fetch ALL assigned classes
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
    // --- Replace the existing scheduledClassesByDay useMemo with this ---
    const scheduledClassesByDay = useMemo(() => {
        // 1. Filter out past classes
        const upcomingClasses = assignedClasses.filter(c => !isClassInPast(c));

        // 2. Sort upcoming classes by date and time
        upcomingClasses.sort((a, b) => {
            const dateA = parseClassDateTime(a)?.classStart.getTime() || 0;
            const dateB = parseClassDateTime(b)?.classStart.getTime() || 0;
            return dateA - dateB;
        });

        // 3. Group the classes by date, but build a deterministic key:
        //    weekdayKey and shortDateKey explicitly, then combine with our own comma.
        return upcomingClasses.reduce((acc, classItem) => {
            const date = new Date(classItem.preferredDate);
            if (isNaN(date)) return acc;

            const weekdayKey = date.toLocaleDateString(undefined, { weekday: 'long' });
            const shortDateKey = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            const key = `${weekdayKey}, ${shortDateKey}`; // guaranteed structure

            if (!acc[key]) acc[key] = [];
            acc[key].push(classItem);
            return acc;
        }, {});
    }, [assignedClasses]);

    // --- Component for a single class block in the chart view ---
    const ScheduleBlock = ({ course }) => (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-md hover:shadow-lg transition cursor-pointer">
            <p className="text-sm font-semibold text-blue-800">{course.courseTitle}</p>
            <p className="text-xs text-gray-600 mt-1">
                <Clock size={12} className="inline mr-1" />
                {course.scheduleTime}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Student ID: {course.studentId}</p>
        </div>
    );

    // --- UI START ---
    if (loading) return <div className="text-center py-8 text-blue-600"><Loader2 className="animate-spin w-6 h-6 inline-block mr-2" /> Loading Schedule...</div>;
    if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

    const days = Object.keys(scheduledClassesByDay);

    return (
        <div className="space-y-6">
            <div className="text-base sm:text-lg font-semibold text-gray-700 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                Your Upcoming Schedule ({days.length} Scheduled Day{days.length !== 1 ? 's' : ''})
            </div>

            {days.length > 0 ? (
                <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                    {days.map(day => {
                    // day is guaranteed to be "Weekday, shortDate" from above
                    const parts = day.split(',');
                    const weekday = parts[0] || day; // fallback to whole string if unexpected
                    const rest = parts.slice(1).join(',').trim() || ''; // join remainder in case locale had extra commas
                
                    return (
                        <div key={day} className="p-4 bg-white hover:bg-gray-50 transition sm:flex">
                            {/* Day Column (Chart Y-Axis Label) */}
                            <div className="sm:w-1/4 flex-shrink-0 mb-3 sm:mb-0 sm:pr-4">
                                <p className="text-lg font-bold text-gray-800 border-b sm:border-b-0 pb-1">{weekday}</p>
                                <p className="text-xs text-gray-500">{rest}</p>
                            </div>
                    
                            {/* Schedule Timeline (Chart Area) */}
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