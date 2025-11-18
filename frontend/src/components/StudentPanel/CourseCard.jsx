// frontend/src/components/StudentPanel/CourseCard.jsx

import React, { useState, useEffect } from 'react';
// Import the custom hook
import useCountdown from '../../utils/useCountdown.js'; 
// Added Zap for the link status/display
import { Book, Clock, User, ArrowRight, Calendar, Video, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
// CRITICAL IMPORT: Use the new getNextSession utility
import { formatDate, getMeetingTime, getNextSession } from '../../utils/dateUtils.js';

// Helper function to extract and convert the 12-hour preferred time string to a 24-hour HH:MM string.
const get24HourTimeFromDisplay = (preferredTime) => {
    if (!preferredTime) return null;

    // Assuming preferredTime is "HH:MM AM/PM - HH:MM AM/PM"
    const [startTimeStr] = preferredTime.split(' ');
    
    // Extract time and period (AM/PM)
    let timePart = startTimeStr.replace(/[^0-9:]/g, ''); // Get "HH:MM"
    let period = startTimeStr.slice(-2).toLowerCase(); // Get "am" or "pm"

    let [hour, minute] = timePart.split(':').map(Number);
    
    // Adjust hour for 24-hour format
    if (period === 'pm' && hour !== 12) {
        hour += 12;
    }
    if (period === 'am' && hour === 12) {
        hour = 0;
    }
    
    // Format hour and minute back into a standardized 'HH:MM' string
    const hour24 = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');

    return `${hour24}:${minuteStr}`;
};


const CourseCard = ({ course }) => {
    // 1. Define the possible colors
    const colors = [
        'bg-gradient-to-br from-orange-500 to-red-600',
        'bg-gradient-to-br from-purple-600 to-indigo-800',
        'bg-gradient-to-br from-green-500 to-emerald-700',
        'bg-gradient-to-br from-blue-500 to-cyan-600'
    ];
    
    // 👇 FIX: Use useState with a lazy initializer function to calculate the random color only ONCE.
    const [cardColor] = useState(() => {
        return colors[Math.floor(Math.random() * colors.length)];
    });
    
    const [buttonState, setButtonState] = useState('Join Meeting');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true); 
    
    // 💡 FIX 1: Use getNextSession to correctly initialize the state
    const [nextSession] = useState(getNextSession(course));
    
    // 👇 FIX: Get the 24-hour time string required by useCountdown
    const nextSessionTime24h = get24HourTimeFromDisplay(nextSession.time);

    // 👇 NEW: Use the custom countdown hook with the CORRECTED 24h time!
    const countdown = useCountdown(nextSession.date, nextSessionTime24h);

    // Use the correct property: zoomMeetingLink
    const zoomLink = course.zoomMeetingLink; 

    useEffect(() => {
        // Use the date and time from the correctly initialized nextSession state
        const scheduledTime = getMeetingTime(nextSession.date, nextSession.time); 
        
        const checkMeetingStatus = () => {
            const now = new Date();

            // 1. Check essential requirements: Schedule and Link (NO CHANGE TO EXISTING LOGIC)
            if (!scheduledTime) {
                setButtonState('Setup Required');
                setIsButtonDisabled(true);
                return;
            }
            if (!zoomLink) {
                setButtonState('Link Pending');
                setIsButtonDisabled(true);
                return;
            }

            // 2. Link is present: check time window (15 mins before to 60 mins after)
            const activeBeforeMinutes = 15;
            const activeStartTime = new Date(scheduledTime.getTime() - activeBeforeMinutes * 60000);
            const activeEndTime = new Date(scheduledTime.getTime() + 60 * 60000); // Assuming 60 min class window

            if (now >= activeStartTime && now <= activeEndTime) {
                setButtonState('JOIN MEETING');
                setIsButtonDisabled(false); 
            } else if (now > activeEndTime) {
                setButtonState('Session Completed');
                setIsButtonDisabled(true); 
            } else {
                // Before active time window
                setButtonState(`Active ${activeBeforeMinutes} mins before`); 
                setIsButtonDisabled(true); 
            }
        };
        
        checkMeetingStatus();
        // Adjust interval check based on the criticality of the time window
        const interval = setInterval(checkMeetingStatus, 30000); // Existing 30s interval

        // 💡 FIX 2: Ensure useEffect dependencies use the session details
        return () => clearInterval(interval);
    }, [nextSession.date, nextSession.time, zoomLink]); 

    const handleButtonClick = () => {
        // (NO CHANGE TO EXISTING LOGIC)
        if (buttonState === 'JOIN MEETING' && !isButtonDisabled && zoomLink) {
            window.open(zoomLink, '_blank');
        } else if (zoomLink) {
             alert(`The meeting link is available, but the meeting is currently inactive. It will be active 15 minutes before the scheduled time.`);
        } else if (buttonState === 'Link Pending') {
            alert('The Administrator has not yet scheduled the manual Zoom link. Please check back later!');
        }
    };

    // Helper function to format the countdown output for display (Made Smaller)
    const formatCountdown = (time) => {
        // Define a function to create a single countdown segment's JSX
        const Segment = ({ value, label }) => (
            // Decreased w-16 to w-14, text-xl to text-lg, and p-1.5 to p-1
            <div className="text-center bg-gray-700/80 text-white rounded-md p-1 w-14">
                <span className="font-mono text-lg font-bold block leading-none">{String(value).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase font-medium block mt-0.5 opacity-75">{label}</span>
            </div>
        );

        const segments = [];
        
        if (time.days > 0) {
            segments.push(<Segment key="days" value={time.days} label="Days" />);
        }
        segments.push(<Segment key="hours" value={time.hours} label="Hrs" />); // Changed 'Hours' to 'Hrs'
        segments.push(<Segment key="minutes" value={time.minutes} label="Mins" />); // Changed 'Mins' to 'M Mins'
        segments.push(<Segment key="seconds" value={time.seconds} label="Secs" />);
        
        return (
            <div className="flex justify-center gap-1.5"> {/* Reduced gap */}
                {segments}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100 relative"
        >
            {/* Top section with course title and icon: reduced height/padding slightly */}
            {/* Using the fixed 'cardColor' state */}
            <div className={`${cardColor} h-18 sm:h-20 p-3 flex items-center justify-between`}>
                <div className="flex flex-col">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 leading-tight">{course.name}</h3>
                    <p className="text-xs text-white/90 font-medium">{course.teacher}</p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center text-primary-500 shadow-md">
                    <Book size={16} className='sm:w-5 sm:h-5' />
                </div>
            </div>

            {/* Main content area: reduced padding */}
            <div className="p-3">
                <p className="text-gray-600 text-xs mb-3 line-clamp-2">{course.description}</p>
                
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-gray-500 text-xs mb-3">
                    <div className="flex items-center gap-1">
                        <User size={11} className='text-gray-400' />
                        <span className="font-medium truncate">{course.teacher}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={11} className='text-gray-400' />
                        <span className='truncate'>{course.duration}</span>
                    </div>
                </div>

                {/* Displaying enrollment and session details */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <Calendar size={11} className='text-gray-400' />
                        <p className="text-xs font-semibold">Enrolled: <span className="font-normal text-gray-700">{formatDate(course.enrollmentDate)}</span></p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <Clock size={11} className='text-gray-400' />
                        <p className="text-xs font-semibold">
                            {/* Display correct label based on session type */}
                            {nextSession.isWeekly ? 'Next Weekly Session:' : 'Session Date:'} 
                            <span className={`font-normal ${nextSession.isWeekly ? 'text-blue-700' : 'text-orange-700'} ml-1`}>
                                {formatDate(nextSession.date)} at {nextSession.time || 'TBD'}
                            </span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600 mb-2">
                        <Book size={11} className='text-gray-400' />
                        <p className="text-xs font-semibold">
                            {nextSession.isWeekly ? 'Total Sessions:' : 'Sessions Left:'} 
                            <span className="font-normal text-green-700 ml-1">
                                {course.sessionsRemaining || (nextSession.isWeekly ? '6' : 'N/A')}
                            </span>
                        </p>
                    </div>
                    
                    {/* 👇 COMPACT COUNTDOWN DISPLAY */}
                    {!countdown.isExpired && nextSession.date && nextSessionTime24h && (
                         <div className="mt-2 p-2 bg-orange-600 rounded-lg shadow-inner text-center"> {/* Reduced padding to p-2 */}
                            <h4 className="text-white text-xs font-bold uppercase mb-1 tracking-wider"> {/* Reduced text-sm to text-xs and mb-2 to mb-1 */}
                                Class Starts In
                            </h4>
                            {formatCountdown(countdown)}
                        </div>
                    )}
                    {/* ---------------------------------- */}
                </div>

                {/* --- CRITICAL VISIBILITY FIX: Display Zoom Link Explicitly --- */}
                {zoomLink && (
                    <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                        <p className="text-blue-700 font-semibold text-xs flex items-center mb-1">
                            <Zap className="h-3 w-3 mr-1" />
                            Meeting Link:
                        </p>
                        <a 
                            href={zoomLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800 underline text-xs break-all ml-4"
                        >
                            Click to Join (Visible Link)
                        </a>
                    </div>
                )}
                {/* ------------------------------------------- */}

                {/* Action button */}
                <button 
                    onClick={handleButtonClick}
                    disabled={isButtonDisabled}
                    className={`mt-4 w-full flex items-center justify-center gap-1.5 text-white font-semibold py-2.5 px-4 rounded-full shadow-md transition-all duration-300 text-sm 
                        ${isButtonDisabled 
                            ? (zoomLink ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 cursor-not-allowed') 
                            : 'bg-gradient-to-r from-green-500 to-teal-600 hover:shadow-lg transform hover:-translate-y-0.5'}`}
                >
                    {buttonState === 'JOIN MEETING' && !isButtonDisabled && <Video size={16} />}
                    <span>{buttonState}</span>
                    {(buttonState !== 'JOIN MEETING' || isButtonDisabled) && <ArrowRight size={16} />}
                </button>
            </div>
        </motion.div>
    );
};

export default CourseCard;