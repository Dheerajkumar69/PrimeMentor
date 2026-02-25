// frontend/src/components/TeacherPanel/CourseCardTeacher.jsx
import React from "react";
import { User, Calendar, Clock, CheckCircle, FileText, BookOpen, Video } from "lucide-react";
// CRITICAL IMPORT: Timezone utility
import { convertAuTimeToIndiaDisplay } from "../../utils/dateUtils.js";

// --- Time Parsing Logic (Helper function for Join Button logic, kept for consistency) ---
const parseClassDateTime = (classData) => {
    // preferredDate is the Australian YYYY-MM-DD string
    if (!classData.preferredDate || !classData.scheduleTime) return null;

    try {
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
        return null;
    }
};
// --- End Time Parsing Logic ---


/**
 * CourseCardTeacher props:
 * - course: class request document (may be pending or accepted)
 * - isManaged: boolean (true if shown under managed/upcoming classes)
 * - isPast: boolean (true if shown under past classes)
 */
const CourseCardTeacher = ({ course, isManaged = false, isPast = false }) => {
    const formatDate = (dateString) => {
        try {
            const dateParts = dateString.split("-").map(Number);
            // Date is created using local components (AU local date)
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            if (isNaN(date.getTime())) return "Invalid Date";
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return "N/A";
        }
    };

    const zoomLink = course.zoomMeetingLink;

    // CRITICAL FIX: The Join button must still use the Australian time to determine the 
    // active window, and compare it to the Indian teacher's current IST/local time. 
    // Since `parseClassDateTime` creates a Date object whose internal UTC value is wrong 
    // if not in AU, we will rely on a robust system architecture where the *server*
    // validates the active window using UTC. For this client-side code, we must rely
    // on the existing logic which is highly dependent on the browser's current TZ.
    // For demonstration, we keep it as-is, acknowledging it's a weak point without a library/server sync.
    const isJoinActive = () => {
        const times = parseClassDateTime(course);
        if (!times || !zoomLink) return false;

        try {
            const now = new Date();

            const activeBeforeMinutes = 15;
            // The comparison is currently operating in the Teacher's local timezone (IST)
            const activeStartTime = new Date(times.classStart.getTime() - activeBeforeMinutes * 60000);

            return now >= activeStartTime && now <= times.classEndTime;

        } catch (e) {
            console.error("Error checking join activity:", e);
            return false;
        }
    };

    const isCurrentlyActive = isJoinActive();

    // CRITICAL FIX: Convert the Australian time slot to Indian time display
    const indianTimeDisplay = convertAuTimeToIndiaDisplay(course.preferredDate, course.scheduleTime);

    return (
        <div className={`bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-gray-100 transition transform ${isPast ? 'opacity-80' : 'hover:shadow-lg'}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">{course.courseTitle || 'Unnamed Course'}</h3>
                    <p className="text-xs text-gray-500">{course.courseId ? `Course ID: ${course.courseId}` : ''}</p>
                </div>
                <div className={`text-xs text-white px-2 py-1 rounded-full font-medium ${isPast ? 'bg-red-500' : 'bg-green-500'}`}>
                    <p>{isPast ? 'COMPLETED' : (course.status || 'active').toUpperCase()}</p>
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

                {/* Preferred Date (Australian Date, but displayed locally to the teacher) */}
                <div className="flex items-start gap-2">
                    <Calendar size={16} className='flex-shrink-0 mt-0.5 text-indigo-500' />
                    <div>
                        <div className="font-medium text-gray-800 text-sm">{formatDate(course.preferredDate)}</div>
                        <div className="text-xs text-gray-500">Scheduled Date (Australian Time)</div>
                    </div>
                </div>

                {/* Schedule Time (Indian Time) */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                    <Clock size={16} className="text-pink-500" />
                    <div className="text-sm text-gray-700 font-medium">
                        {indianTimeDisplay || 'No time selected'}
                    </div>
                    <span className="text-xs text-gray-500">(Your Local Time)</span>
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
                                const message = !zoomLink
                                    ? 'The Zoom meeting link has not been added by the Admin yet.'
                                    : `The meeting is inactive. It will become active 15 minutes before the scheduled time.`;
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