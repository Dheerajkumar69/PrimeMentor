// frontend/src/pages/MyCourses.jsx
import { useState, useEffect, useCallback } from "react"
import { useUser, useAuth } from "@clerk/clerk-react"
import axios from "axios"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { useLocation, useNavigate } from "react-router-dom"

import Footer from "../components/Home/Footer.jsx"
import CourseCard from "../components/StudentPanel/CourseCard.jsx"
import UserProfileCard from "../components/StudentPanel/UserProfileCard.jsx"
import PastClasses from "../components/StudentPanel/PastClasses.jsx"
import RepeatClassModal from "../components/StudentPanel/RepeatClassModal.jsx"
import { getMeetingTime } from "../utils/dateUtils.js"

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
}
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
}

/**
 * Determines if a session has finished (1 hour past its scheduled start time).
 */
const isSessionPast = (session) => {
    if (!session.preferredDate || !session.preferredTime) return false
    const scheduledStart = getMeetingTime(session.preferredDate, session.preferredTime)
    if (!scheduledStart || isNaN(scheduledStart.getTime())) return false
    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60000)
    const now = new Date()
    return now > scheduledEnd
}




const MyCourses = () => {
    const { user, isLoaded } = useUser()
    const { isSignedIn, getToken } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const [courses, setCourses] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // State to track which sessions have submitted feedback locally
    const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState(new Set());

    // State for the Repeat Class Modal
    const [repeatModalOpen, setRepeatModalOpen] = useState(false);
    const [repeatCourse, setRepeatCourse] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            if (!isLoaded || !isSignedIn) {
                setIsLoading(false)
                setCourses([])
                return
            }
            try {
                const token = await getToken()
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
                const response = await axios.get(`${backendUrl}/api/user/courses`, {
                    headers: { Authorization: `Bearer ${token}` },
                })


                const rawCourses = response.data.courses || []
                const sessions = []

                /**
                 * Calculates the date for the Nth non-Sunday session, starting from the preferredDate.
                 * @param {string} startDateString - The start date in YYYY-MM-DD format.
                 * @param {number} sessionIndex - The zero-based index (0 to 5).
                 * @returns {string} The calculated session date in YYYY-MM-DD format.
                 */
                const getSessionDate = (startDateString, sessionIndex) => {
                    if (!startDateString) return null



                    const dateParts = startDateString.split("-").map(Number)
                    // Start from the chosen date using UTC components
                    const year = dateParts[0];
                    const month = dateParts[1] - 1;
                    const day = dateParts[2];

                    // Initialize to midnight UTC of the start day
                    let currentDate = new Date(Date.UTC(year, month, day));
                    let sessionsFound = 0

                    // Iterate through consecutive calendar days
                    while (sessionsFound <= sessionIndex) {
                        // Check if the current day is NOT Sunday (0) using UTC day getter
                        if (currentDate.getUTCDay() !== 0) {
                            if (sessionsFound === sessionIndex) {
                                // Return as YYYY-MM-DD string using UTC getters
                                const yyyy = currentDate.getUTCFullYear()
                                const mm = String(currentDate.getUTCMonth() + 1).padStart(2, "0")
                                const dd = String(currentDate.getUTCDate()).padStart(2, "0")
                                const finalDateStr = `${yyyy}-${mm}-${dd}`;

                                return finalDateStr;
                            }
                            sessionsFound++
                        }
                        // Move to the next calendar day using UTC setter
                        currentDate.setUTCDate(currentDate.getUTCDate() + 1)
                    }
                    return null
                }

                const getTimeSlotForDate = (dateString, monFriTime, satTime) => {
                    if (!dateString) return monFriTime
                    const dateParts = dateString.split("-").map(Number)
                    // CRITICAL: Date constructor here MUST use local components
                    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
                    const dayOfWeek = dateObj.getDay()

                    // Saturday = 6, Mon-Fri = 1-5
                    return dayOfWeek === 6 ? satTime : monFriTime
                }

                rawCourses.forEach((course) => {
                    // If essential date/time info is missing, push minimal data
                    if (!course.preferredDate || !course.preferredTime) {
                        sessions.push({
                            ...course,
                            isWeeklySession: false,
                            name: `${course.name} (Data Pending)`,
                        })
                        return
                    }

                    const isStarterPack =
                        course.sessionsRemaining > 1 && course.preferredTimeMonFri && course.preferredTimeSaturday

                    if (isStarterPack) {

                        for (let i = 0; i < course.sessionsRemaining; i++) {
                            const sessionDateStr = getSessionDate(course.preferredDate, i)

                            if (!sessionDateStr) continue

                            // Determine the correct time slot for this specific day
                            const sessionTime = getTimeSlotForDate(
                                sessionDateStr,
                                course.preferredTimeMonFri,
                                course.preferredTimeSaturday,
                            )

                            sessions.push({
                                ...course,
                                _id: `${course._id}-session-${i}`,
                                name: `${course.name.split("(")[0].trim()} (Session ${i + 1}/${course.sessionsRemaining})`,
                                preferredDate: sessionDateStr, // Unique date for this session
                                preferredTime: sessionTime, // Correct time based on day of week
                                isWeeklySession: true,
                                description: `Session ${i + 1} of your ${course.sessionsRemaining}-session Starter Pack.`,
                            })
                        }
                    } else {
                        // Single session (Trial)
                        sessions.push({
                            ...course,
                            preferredDate: course.preferredDate ? course.preferredDate.substring(0, 10) : null,
                            isWeeklySession: false,
                        })
                    }
                })


                setCourses(sessions)
                setError(null)
            } catch (err) {
                const finalError = err.response?.data?.message || "Internal Server Error while fetching courses."
                setError(`Failed to load your courses. Error: ${finalError}`)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourses()
    }, [isLoaded, isSignedIn, getToken, location.search])

    // 🛑 NEW HANDLER: Update local state after successful submission
    const handleFeedbackSubmission = useCallback((courseId, feedbackData) => {
        // Add the course ID to the set of submitted IDs
        setSubmittedFeedbackIds(prev => new Set(prev).add(courseId));
        toast.success(`Thank you! Feedback for ${feedbackData.courseName} submitted.`);
    }, []);

    // --- Filtering Logic (MODIFIED to include feedbackSubmitted status) ---
    const upcomingSessions = courses.filter((session) => !isSessionPast(session));

    const pastSessions = courses.filter((session) => isSessionPast(session)).map(session => ({
        ...session,
        feedbackSubmitted: submittedFeedbackIds.has(session._id)
    }));

    // Handler: open the repeat modal for a past session
    const handleRepeatRequest = useCallback((course) => {
        setRepeatCourse(course);
        setRepeatModalOpen(true);
    }, []);




    if (isLoading || !isLoaded) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 pt-20">
                <p className="text-xl text-gray-700">Loading user profile and courses...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50 pt-20">
                <p className="text-xl text-red-500">Authentication required. Please log in.</p>
            </div>
        )
    }

    const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress.split("@")[0] || "Learner"

    return (
        <>
            <div className="min-h-screen bg-gray-50 pt-[80px]">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-900 text-white pt-12 sm:pt-12 pb-8 shadow-xl mb-10">
                    <div className="mx-auto max-w-8xl px-6">
                        <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 flex justify-center items-center">
                            My Learning Dashboard
                        </h1>
                        <p className="text-lg sm:text-xl font-medium text-purple-200 flex justify-center items-center">
                            Welcome back, <span className="font-bold text-white">{userName}</span>. Your next lesson awaits!
                        </p>
                    </div>
                </div>

                <div className="w-full pb-10 sm:pb-16">
                    <div className="mx-auto max-w-8xl px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="col-span-1 lg:col-span-9 order-2 lg:order-1">
                                {/* 1. UPCOMING SESSIONS */}
                                <h2 className="text-3xl font-bold text-gray-800 mb-6">Upcoming Sessions ({upcomingSessions.length})</h2>
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="bg-white rounded-xl p-4 sm:p-6 shadow-xl border border-gray-100 mb-10"
                                >
                                    {upcomingSessions.length === 0 ? (
                                        <motion.div variants={itemVariants} className="text-center py-12">
                                            <p className="text-2xl font-bold text-gray-800 mb-4">No upcoming sessions!</p>
                                            <p className="text-lg text-gray-600 mb-8">Book your next session to continue learning.</p>
                                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                                <motion.button
                                                    variants={itemVariants}
                                                    onClick={() => {
                                                        // Pre-fill from last course if available
                                                        const lastCourse = courses.length > 0 ? courses[courses.length - 1] : null;
                                                        const quizData = lastCourse ? {
                                                            year: lastCourse.year || 8,
                                                            subject: lastCourse.subject || 'Mathematics',
                                                            initialClassRange: lastCourse.classRange || '7-9',
                                                            name: { firstName: user?.firstName || '', lastName: user?.lastName || '' },
                                                            email: user?.emailAddresses?.[0]?.emailAddress || '',
                                                            needs: "I'm ready to extend my learning",
                                                            state: lastCourse.state || 'New South Wales',
                                                        } : {};
                                                        navigate('/booking', { state: { quizData } });
                                                    }}
                                                    className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition transform hover:-translate-y-1 hover:shadow-xl"
                                                >
                                                    Book Another Session
                                                </motion.button>
                                                <motion.a
                                                    variants={itemVariants}
                                                    href="/courses"
                                                    className="inline-block bg-white text-orange-500 border-2 border-orange-500 font-semibold py-3 px-8 rounded-full shadow-lg transition transform hover:-translate-y-1 hover:shadow-xl"
                                                >
                                                    Explore Courses
                                                </motion.a>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {upcomingSessions.map((course) => (
                                                <motion.div key={course._id} variants={itemVariants}>
                                                    <CourseCard course={course} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                {/* 2. PAST SESSIONS SECTION */}
                                <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-10">Past Classes ({pastSessions.length})</h2>
                                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                                    <PastClasses
                                        courses={pastSessions}
                                        onFeedbackSubmit={handleFeedbackSubmission}
                                        onRepeatRequest={handleRepeatRequest}
                                    />
                                </motion.div>
                            </div>

                            <aside className="col-span-1 lg:col-span-3 order-1 lg:order-2">
                                <UserProfileCard studentCourses={upcomingSessions} />
                            </aside>
                        </div>

                        {/* The FeedbackFormModal is now managed inside PastClasses.jsx */}
                    </div>
                </div>
            </div>
            {/* Repeat Class Modal */}
            <RepeatClassModal
                course={repeatCourse}
                isOpen={repeatModalOpen}
                onClose={() => { setRepeatModalOpen(false); setRepeatCourse(null); }}
                onSuccess={() => { /* Could refresh courses here if needed */ }}
            />
            <Footer />
        </>
    )
}

export default MyCourses;