import React from "react";
import { User, Calendar, Clock, CheckCircle, FileText, BookOpen, Video } from "lucide-react";

// 🛑 FIX APPLIED: Robust time parsing inside parseClassDateTime 🛑
const parseClassDateTime = (classData) => {
    if (!classData.preferredDate || !classData.scheduleTime) return null;
    
    try {
        const dateObj = new Date(classData.preferredDate);
        if (isNaN(dateObj)) return null;
        
        // Use only the start time part, splitting on common delimiters
        const timeString = classData.scheduleTime.split(/[ -]/)[0]; 

        if (!timeString) return null;

        const [timeHours, timeMinutes] = timeString.split(':')
            .map(s => String(s || '').trim()) // Ensure 's' is a string and trim it
            .filter(s => s !== '')          // Filter out empty strings
            .map(s => parseInt(s));         // Parse the resulting string
            
        if (isNaN(timeHours) || isNaN(timeMinutes)) return null;

        const classStart = new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
            timeHours,
            timeMinutes,
            0
        );

        const bufferTimeMinutes = 60; 
        const classEndTime = new Date(classStart.getTime() + bufferTimeMinutes * 60000);

        return { classStart, classEndTime };
    } catch (e) {
        return null;
    }
};
// 🛑 End New Parsing Logic 🛑


/**
 * CourseCardTeacher props:
 * - course: class request document (may be pending or accepted)
 * - isManaged: boolean (true if shown under managed/upcoming classes)
 * - isPast: boolean (true if shown under past classes)
 */
const CourseCardTeacher = ({ course, isManaged = false, isPast = false }) => {
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date)) return "Invalid Date";
            return date.toLocaleDateString(undefined, {
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
        });
        } catch {
            return "N/A";
        }
    };

    // --- CRITICAL CHANGE: Use course.zoomMeetingLink ---
    const zoomLink = course.zoomMeetingLink;

    // Function to check if the 'Join Meeting' button should be active
    const isJoinActive = () => {
        const times = parseClassDateTime(course);
        // The button is inactive if the meeting link is missing, regardless of time
        if (!times || !zoomLink) return false;

        try {
            const now = new Date();

            // Define Active Window: 15 minutes BEFORE start to 60 minutes AFTER start
            const activeBeforeMinutes = 15;
            const activeStartTime = new Date(times.classStart.getTime() - activeBeforeMinutes * 60000);
            
            // Check if current time is within the active window
            return now >= activeStartTime && now <= times.classEndTime;

        } catch (e) {
            console.error("Error checking join activity:", e);
            return false; 
        }
    };

    const isCurrentlyActive = isJoinActive();

    return (
        <div className={`bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-gray-100 transition transform ${isPast ? 'opacity-80' : 'hover:shadow-lg'}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">{course.courseTitle || 'Unnamed Course'}</h3>
                    <p className="text-xs text-gray-500">{course.courseId ? `Course ID: ${course.courseId}` : ''}</p>
                </div>
                <div className={`text-xs text-white px-2 py-1 rounded-full font-medium ${isPast ? 'bg-red-500' : 'bg-green-500'}`}>
                    <p>{isPast ? 'COMPLETED' : course.status.toUpperCase()}</p>
                </div>
            </div>

            <div className="mt-3 text-sm text-gray-600 space-y-2">
                {/* Student Details */}
                <div className="flex items-start gap-2">
                    <User size={16} className='flex-shrink-0 mt-0.5 text-blue-500' />
                    <div>
                        <div className="font-medium text-gray-800 text-sm">{course.studentName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Student ID: {course.studentId || 'N/A'}</div>
                    </div>
                </div>

                {/* Preferred Date */}
                <div className="flex items-start gap-2">
                    <Calendar size={16} className='flex-shrink-0 mt-0.5 text-indigo-500' />
                    <div>
                        <div className="font-medium text-gray-800 text-sm">{formatDate(course.preferredDate)}</div>
                        <div className="text-xs text-gray-500">Scheduled Date</div>
                    </div>
                </div>

                {/* Schedule Time */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                    <Clock size={16} className="text-pink-500" />
                    <div className="text-sm text-gray-700 font-medium">{course.scheduleTime || 'No time selected'}</div>
                </div>
                
                {/* Zoom Link Status (Explicitly shown) */}
                {isManaged && !isPast && (
                    <div className="flex items-center gap-2 pt-1 pb-1">
                        <Video size={16} className={`${zoomLink ? 'text-teal-500' : 'text-orange-500'}`} />
                        <div className="text-xs text-gray-700">
                           Link Status: <span className={`font-semibold ${zoomLink ? 'text-teal-600' : 'text-orange-600'}`}>
                                {zoomLink ? 'Ready' : 'Pending Admin Setup'}
                           </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 mt-4 border-t pt-4 border-gray-100">
                
                {/* Button for Past Classes (View Details/Review) */}
                {isPast && (
                    <a
                        href={`/teacher/past-class/${course._id}`} // Example link
                        className={`flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm`}
                    >
                        <BookOpen size={16} /> View Summary
                    </a>
                )}
                
                {/* Button for Managed/Upcoming Classes (Open Meeting) */}
                {isManaged && !isPast && (
                    <a
                        // Use the new zoomLink
                        href={zoomLink || '#'} 
                        target="_blank"
                        rel="noreferrer"
                        className={`flex-1 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm
                            ${isCurrentlyActive 
                                ? 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-300/50' 
                                : 'bg-gray-400 cursor-not-allowed'
                            }
                        `}
                        onClick={(e) => {
                            if (!isCurrentlyActive) {
                                e.preventDefault();
                                // Display a more specific message based on the status
                                const message = !zoomLink 
                                    ? 'The Zoom meeting link has not been added by the Admin yet.' 
                                    : `The meeting is inactive. It will become active 15 minutes before the scheduled time (${course.scheduleTime}).`;
                                alert(message);
                            }
                        }}
                    >
                        <Video size={16} /> {isCurrentlyActive ? 'JOIN MEETING' : 'Meeting Inactive'}
                    </a>
                )}
            </div>
        </div>
    );
};

export default CourseCardTeacher;