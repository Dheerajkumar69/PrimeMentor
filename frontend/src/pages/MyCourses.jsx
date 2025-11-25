// frontend/src/pages/MyCourses.jsx

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { motion } from 'framer-motion';
// 👇 NEW IMPORT
import { useLocation } from 'react-router-dom';
import Header from '../components/Home/Header.jsx';
import Footer from '../components/Home/Footer.jsx';
import CourseCard from '../components/StudentPanel/CourseCard.jsx';
import UserProfileCard from '../components/StudentPanel/UserProfileCard.jsx';

const MyCourses = () => {
    const { user } = useUser();
    const { isSignedIn, getToken } = useAuth();
    // 👇 NEW HOOK
    const location = useLocation(); 
    
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 👇 MODIFIED DEPENDENCY ARRAY
    useEffect(() => {
        const fetchCourses = async () => {
            if (!isSignedIn) {
                setIsLoading(false);
                return;
            }

            try {
                const token = await getToken();
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

                // Fetch courses
                const response = await axios.get(`${backendUrl}/api/user/courses`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // --- LOGIC: Flatten weekly courses into individual session cards ---
                const rawCourses = response.data.courses || [];
                const sessions = [];

                const getSessionDate = (startDate, sessionIndex) => {
                    const date = new Date(startDate);
                    
                    if (isNaN(date)) return date; 

                    let count = 0;
                    let currentDate = new Date(date.getTime());
                    
                    // Only advance the date if we are calculating subsequent sessions
                    while (count < sessionIndex) {
                        currentDate.setDate(currentDate.getDate() + 1);
                        // Skip Sundays (0)
                        if (currentDate.getDay() !== 0) { 
                            count++;
                        }
                    }
                    return currentDate;
                };

                rawCourses.forEach(course => {
                    // 🛑 FIX: Robust check for Starter Pack fields 🛑
                    const isStarterPack = 
                        course.sessionsRemaining > 1 && 
                        typeof course.preferredTimeMonFri === 'string' && 
                        typeof course.preferredTimeSaturday === 'string' && 
                        course.preferredDate; 

                    if (isStarterPack) {
                        // Use sessionsRemaining from the course model
                        for (let i = 0; i < course.sessionsRemaining; i++) { 
                            const sessionDate = getSessionDate(course.preferredDate, i);
                            
                            // 🛑 FIX: Check for Invalid Date Object before processing 🛑
                            if (isNaN(sessionDate.getTime())) { 
                                console.error("Invalid session date found, skipping session:", course);
                                continue;
                            }
                            
                            const dayOfWeek = sessionDate.getDay(); 
                            let sessionTime = course.preferredTimeMonFri;
                            
                            if (dayOfWeek === 6) { // Saturday
                                sessionTime = course.preferredTimeSaturday;
                            } else if (dayOfWeek === 0) {
                                continue; // Skip Sundays (0)
                            }

                            // Create a new card object for each session
                            sessions.push({
                                ...course,
                                zoomMeetingLink: course.zoomMeetingUrl || null, 
                                _id: `${course._id}-session-${i}`,
                                name: `${course.name} (Session ${i + 1}/${course.sessionsRemaining})`,
                                preferredDate: sessionDate.toISOString(), 
                                preferredTime: sessionTime, 
                                isWeeklySession: true, 
                                description: `Part of your ${course.sessionsRemaining}-session Starter Pack. Consistent time: ${course.preferredTimeMonFri} / ${course.preferredTimeSaturday}`
                            });
                        }
                    } else {
                        // Single trial session or regular course (handles old data format gracefully)
                        sessions.push({
                            ...course,
                            zoomMeetingLink: course.zoomMeetingUrl || null, 
                        });
                    }
                });

                setCourses(sessions);
                setError(null);
            } catch (err) {
                // Display server error message if available
                const serverMessage = err.response?.data?.message || err.message;
                console.error('Failed to fetch courses (Full Error):', err);
                
                const finalError = err.response?.data?.message || 'Internal Server Error while fetching courses.';
                setError(`Failed to load your courses. Error: ${finalError}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    // 👇 CRITICAL FIX: Add location.search to dependency array
    }, [isSignedIn, getToken, location.search]); 
    
    // ... (rest of the component code remains the same) ...
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center min-h-screen bg-gray-50 pt-20">
                    <p className="text-xl text-gray-700">Loading your courses...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center min-h-screen bg-gray-50 pt-20">
                    <p className="text-xl text-red-500">{error}</p>
                </div>
            </>
        );
    }

    const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress.split('@')[0] || 'Learner';

    return (
        <>
            <Header />
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
                                <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Courses ({courses.length})</h2>

                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="bg-white rounded-xl p-4 sm:p-6 shadow-xl border border-gray-100"
                                >
                                    {courses.length === 0 ? (
                                        <motion.div variants={itemVariants} className="text-center py-12">
                                            <p className="text-2xl font-bold text-gray-800 mb-4">No active enrollments!</p>
                                            <p className="text-lg text-gray-600 mb-8">
                                                Start your journey by exploring available courses.
                                            </p>
                                            <motion.a
                                                variants={itemVariants}
                                                href="/#courses"
                                                className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition transform hover:-translate-y-1 hover:shadow-xl"
                                            >
                                                Explore Courses
                                            </motion.a>
                                        </motion.div>
                                        ) : (

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {courses.map((course) => (
                                                <motion.div key={course._id || course.name} variants={itemVariants}>
                                                    <CourseCard course={course} />
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            <aside className="col-span-1 lg:col-span-3 order-1 lg:order-2">
                                <UserProfileCard studentCourses={courses} />
                            </aside>

                        </div>
                    </div> 
                </div>
            </div>
            {/* <Footer /> */}
        </>
    );
};

export default MyCourses;