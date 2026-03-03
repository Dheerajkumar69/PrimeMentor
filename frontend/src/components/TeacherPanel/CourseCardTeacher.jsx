// frontend/src/components/TeacherPanel/CourseCardTeacher.jsx
import React from "react";
import { User, Calendar, Clock, CheckCircle, FileText, BookOpen, Video } from "lucide-react";
// CRITICAL IMPORT: Timezone-correct meeting time calculation
import { convertAuTimeToIndiaDisplay, getMeetingTime } from "../../utils/dateUtils.js";

// --- Time Parsing Logic removed — now using getMeetingTime from dateUtils.js ---

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

    // FIXED: Uses getMeetingTime which produces a UTC-correct Date object
    // anchored to Australia/Melbourne. Date.now() comparisons work in ANY timezone.
    const isJoinActive = () => {
        const classStart = getMeetingTime(course.preferredDate, course.scheduleTime);
        if (!classStart || !zoomLink) return false;

        try {
            const now = Date.now();
            const activeBeforeMinutes = 15;
            const bufferTimeMinutes = 60; // Class duration

            const activeStartTime = classStart.getTime() - activeBeforeMinutes * 60000;
            const classEndTime = classStart.getTime() + bufferTimeMinutes * 60000;

            return now >= activeStartTime && now <= classEndTime;
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