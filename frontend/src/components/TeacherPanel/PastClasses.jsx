import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import CourseCardTeacher from "./CourseCardTeacher.jsx"; 
import { History } from "lucide-react"; 

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// 🛑 FIX APPLIED: Robust date and time parsing 🛑
const parseClassDateTime = (classData) => {
    if (!classData.preferredDate || !classData.scheduleTime) return null;
    
    try {
        // Step 1: Parse Date (safely create Date object from potentially non-ISO string)
        const dateObj = new Date(classData.preferredDate);
        if (isNaN(dateObj)) {
            console.error("Invalid Date String:", classData.preferredDate);
            return null; 
        }

        // Step 2: Robustly Parse Time (Handles potential empty strings from split)
        const timeString = classData.scheduleTime.split(/[ -]/)[0]; // Use start time only

        if (!timeString) return null;

        const [timeHours, timeMinutes] = timeString.split(':')
            .filter(s => s.trim() !== '') // Filter out empty strings before trimming and parsing
            .map(s => parseInt(s.trim()));
            
        if (isNaN(timeHours) || isNaN(timeMinutes)) return null;

        // Use the year, month, and day from the parsed date, and apply the time
        const classStart = new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
            timeHours,
            timeMinutes,
            0 // seconds
        );

        // Assuming a 60-minute class duration
        const bufferTimeMinutes = 60; 
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
    // Check if the class end time is older than the current time
    return times.classEndTime < now;
};


const PastClasses = () => {
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
    if (loading) return <div className="text-center py-8">Loading past classes...</div>;
    if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

    return (
        <div>
            <div className="text-base sm:text-lg font-semibold mb-4 text-gray-700 flex items-center">
                <History className="w-5 h-5 mr-2 text-red-500" />
                Total Past Classes: {pastClasses.length} {pastClasses.length !== 1 ? 'Classes' : 'Class'} completed
            </div>

            {/* Responsive Grid for Course Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {pastClasses.length > 0 ? pastClasses.map(c => (
                    <CourseCardTeacher
                        key={c._id}
                        course={c}
                        isManaged={true} 
                        isPast={true} 
                    />
                )) : (
                    <div className="col-span-full text-center py-12 sm:py-16 text-gray-500 bg-white border-2 border-dashed border-gray-200 rounded-xl shadow-inner">
                        <p className="text-lg sm:text-xl font-medium">You have no recorded past classes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PastClasses;