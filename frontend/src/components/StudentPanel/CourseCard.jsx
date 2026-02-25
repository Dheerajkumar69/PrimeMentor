// frontend/src/components/StudentPanel/CourseCard.jsx
import { useState, useEffect } from "react"
// Import the custom hook
import useCountdown from "../../utils/useCountdown.js"
// Added Zap for the link status/display
import { Book, Clock, User, ArrowRight, Calendar, Video, Zap } from "lucide-react"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
// CRITICAL IMPORT: Use formatDate and getMeetingTime utilities
import { formatDate, getMeetingTime } from "../../utils/dateUtils.js"

// Helper function to extract and convert the 12-hour preferred time string to a 24-hour HH:MM string.
const get24HourTimeFromDisplay = (preferredTime) => {
    if (!preferredTime) return null
    // Assuming preferredTime is "HH:MMam/pm - HH:MMam/pm" or "HH:MM AM/PM - HH:MM AM/PM"
    const [startTimeStr] = preferredTime.split(" - ")
    if (!startTimeStr) return null

    // Extract time and period (AM/PM)
    const timePart = startTimeStr.replace(/[^0-9:]/g, "") // Get "HH:MM"
    const period = startTimeStr.slice(-2).toLowerCase() // Get "am" or "pm"
    let [hour, minute] = timePart.split(":").map(Number)

    if (isNaN(hour) || isNaN(minute)) return null

    // Adjust hour for 24-hour format
    if (period === "pm" && hour !== 12) {
        hour += 12
    }
    if (period === "am" && hour === 12) {
        hour = 0
    }

    // Format hour and minute back into a standardized 'HH:MM' string
    const hour24 = String(hour).padStart(2, "0")
    const minuteStr = String(minute).padStart(2, "0")
    return `${hour24}:${minuteStr}`
}

const CourseCard = ({ course }) => {
    // 1. Define the possible colors
    const colors = [
        "bg-gradient-to-br from-orange-500 to-red-600",
        "bg-gradient-to-br from-purple-600 to-indigo-800",
        "bg-gradient-to-br from-green-500 to-emerald-700",
        "bg-gradient-to-br from-blue-500 to-cyan-600",
    ]

    // 👇 FIX: Use useState with a lazy initializer function to calculate the random color only ONCE.
    const [cardColor] = useState(() => {
        return colors[Math.floor(Math.random() * colors.length)]
    })

    // 🚨 MODIFIED: Initial button state reflects Link Pending 🚨
    const [buttonState, setButtonState] = useState("Link Pending")
    const [isButtonDisabled, setIsButtonDisabled] = useState(true)

    // This is the specific date/time assigned to THIS session card
    const sessionDate = course.preferredDate // Already in YYYY-MM-DD format from MyCourses flattening
    const sessionTime = course.preferredTime // The time slot for this specific session
    const isWeekly = course.isWeeklySession || false

    // 👇 Get the 24-hour time string required by useCountdown
    const sessionTime24h = get24HourTimeFromDisplay(sessionTime)

    // 👇 Use the custom countdown hook with the session's specific date/time
    // NOTE: useCountdown MUST interpret sessionDate/sessionTime24h as the user's local time.
    const countdown = useCountdown(sessionDate, sessionTime24h)

    // Use the correct property: zoomMeetingUrl (as used in the backend/teacher card)
    const zoomLink = course.zoomMeetingUrl // 🚨 Using zoomMeetingUrl property

    useEffect(() => {
        // Use the date and time from the course's own properties
        // getMeetingTime creates a Date object whose local components match the session details
        const scheduledTime = getMeetingTime(sessionDate, sessionTime)

        const checkMeetingStatus = () => {
            const now = new Date()

            // 1. Check essential requirements: Schedule and Link
            if (!scheduledTime) {
                setButtonState("Setup Required")
                setIsButtonDisabled(true)
                return
            }
            if (!zoomLink) {
                setButtonState("Link Pending")
                setIsButtonDisabled(true)
                return
            }

            // 2. Link is present: check time window (15 mins before to 60 mins after)
            const activeBeforeMinutes = 15
            // Comparison operates in the student's browser local timezone (AU)
            const activeStartTime = new Date(scheduledTime.getTime() - activeBeforeMinutes * 60000)
            const activeEndTime = new Date(scheduledTime.getTime() + 60 * 60000) // Assuming 60 min class window

            if (now >= activeStartTime && now <= activeEndTime) {
                setButtonState("JOIN MEETING")
                setIsButtonDisabled(false) // 🚨 ACTIVE 🚨
            } else if (now > activeEndTime) {
                setButtonState("Session Completed")
                setIsButtonDisabled(true)
            } else {
                // Before active time window 🚨 NEW TEXT 🚨
                setButtonState(`Tap to Join When Active`)
                setIsButtonDisabled(true)
            }
        }

        checkMeetingStatus()
        const interval = setInterval(checkMeetingStatus, 30000)
        return () => clearInterval(interval)
    }, [sessionDate, sessionTime, zoomLink])

    // 🚨 UPDATED: Handle button click 🚨
    const handleButtonClick = () => {
        if (buttonState === "JOIN MEETING" && !isButtonDisabled && zoomLink) {
            // If active, join the meeting
            window.open(zoomLink, "_blank")
        } else if (zoomLink) {
            // If link is present but inactive, provide instructional feedback
            toast("The meeting link is ready, but the class is currently inactive. Please tap the button when the countdown ends or during the 15-minute activation window.", { icon: "⏳", duration: 5000 })
        } else if (buttonState === "Link Pending") {
            // If link is completely missing
            toast("The Administrator has not yet scheduled the Zoom link. Please check back later!", { icon: "⏳", duration: 4000 })
        }
    }

    // Helper function to format the countdown output for display (UNCHANGED)
    const formatCountdown = (time) => {
        const Segment = ({ value, label }) => (
            <div className="text-center bg-gray-700/80 text-white rounded-md p-1 w-14">
                <span className="font-mono text-lg font-bold block leading-none">{String(value).padStart(2, "0")}</span>
                <span className="text-[10px] uppercase font-medium block mt-0.5 opacity-75">{label}</span>
            </div>
        )
        const segments = []

        if (time.days > 0) {
            segments.push(<Segment key="days" value={time.days} label="Days" />)
        }
        segments.push(<Segment key="hours" value={time.hours} label="Hrs" />)
        segments.push(<Segment key="minutes" value={time.minutes} label="Mins" />)
        segments.push(<Segment key="seconds" value={time.seconds} label="Secs" />)

        return <div className="flex justify-center gap-1.5">{segments}</div>
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100 relative"
        >
            {/* Top section with course title and icon */}
            <div className={`${cardColor} h-18 sm:h-20 p-3 flex items-center justify-between`}>
                <div className="flex flex-col">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 leading-tight">{course.name}</h3>
                    <p className="text-xs text-white/90 font-medium">{course.teacher}</p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center text-primary-500 shadow-md">
                    <Book size={16} className="sm:w-5 sm:h-5" />
                </div>
            </div>

            {/* Main content area */}
            <div className="p-3">
                <p className="text-gray-600 text-xs mb-3 line-clamp-2">{course.description}</p>

                {/* Removed duplicate teacher from metadata grid. Now only duration is shown here. */}
                <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                    <Clock size={11} className="text-gray-400" />
                    <span className="truncate">{course.duration}</span>
                </div>

                {/* Displaying enrollment and session details */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <Calendar size={11} className="text-gray-400" />
                        <p className="text-xs font-semibold">
                            Enrolled: <span className="font-normal text-gray-700">{formatDate(course.enrollmentDate)}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <Clock size={11} className="text-gray-400" />
                        <p className="text-xs font-semibold">
                            Session Date:
                            <span className={`font-normal ${isWeekly ? "text-blue-700" : "text-orange-700"} ml-1`}>
                                {formatDate(sessionDate)} at {sessionTime || "TBD"}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-1 text-gray-600 mb-2">
                        <Book size={11} className="text-gray-400" />
                        <p className="text-xs font-semibold">
                            {isWeekly ? "Pack Sessions:" : "Sessions Left:"}
                            <span className="font-normal text-green-700 ml-1">
                                {course.sessionsRemaining || (isWeekly ? "6" : "N/A")}
                            </span>
                        </p>
                    </div>

                    {/* 👇 COMPACT COUNTDOWN DISPLAY - Uses specific session date/time */}
                    {!countdown.isExpired && sessionDate && sessionTime24h && (
                        <div className="mt-2 p-2 bg-orange-600 rounded-lg shadow-inner text-center">
                            <h4 className="text-white text-xs font-bold uppercase mb-1 tracking-wider">Class Starts In</h4>
                            {formatCountdown(countdown)}
                        </div>
                    )}
                </div>

                {/* 🚨 MODIFIED: Display Zoom Link Explicitly (similar to teacher card) 🚨 */}
                {zoomLink ? (
                    <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                        <p className="text-blue-700 font-semibold text-xs flex items-center mb-1">
                            <Zap className="h-3 w-3 mr-1" />
                            Meeting Link:
                        </p>
                        {/* Direct link for high visibility, similar to teacher card */}
                        <a
                            href={zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-xs break-all ml-4 font-medium"
                        >
                            Click to Join Meeting
                        </a>
                    </div>
                ) : (
                    <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-500 rounded-md">
                        <p className="text-yellow-700 font-semibold text-xs flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            Link Status: <span className="ml-1 font-medium">Pending Admin Setup</span>
                        </p>
                    </div>
                )}

                {/* Action button */}
                <button
                    onClick={handleButtonClick}
                    // Button is disabled only if the link is NOT READY and we are NOT in the active window
                    disabled={isButtonDisabled && !zoomLink}
                    className={`mt-4 w-full flex items-center justify-center gap-1.5 text-white font-semibold py-2.5 px-4 rounded-full shadow-md transition-all duration-300 text-sm
                        ${buttonState === "JOIN MEETING" && !isButtonDisabled
                            ? "bg-gradient-to-r from-green-500 to-teal-600 hover:shadow-lg transform hover:-translate-y-0.5" // Active Join
                            : zoomLink && isButtonDisabled
                                ? "bg-gray-400 cursor-not-allowed" // Link present but inactive/completed
                                : "bg-yellow-500 cursor-not-allowed" // Link missing
                        }`}
                >
                    {buttonState === "JOIN MEETING" && !isButtonDisabled && <Video size={16} />}
                    <span>
                        {buttonState === "JOIN MEETING"
                            ? "JOIN MEETING"
                            : zoomLink
                                ? "Tap to Join When Active" // 🚨 New Text When Inactive but Link Exists 🚨
                                : buttonState}
                    </span>
                    {(buttonState !== "JOIN MEETING" || isButtonDisabled) && <ArrowRight size={16} />}
                </button>
            </div>
        </motion.div>
    )
}

export default CourseCard;