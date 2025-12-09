// frontend/src/components/StudentPanel/UserProfileCard.jsx

import React, { useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { User, Zap } from 'lucide-react';
// 🚨 New: Import the assets structure for a local image fallback 🚨
import { assets } from '../../assets/assets.js'; 

const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

// Helper function to calculate time slot statistics (UNCHANGED)
const calculateMonthlyStats = (courses, currentMonthStart) => {
    // ... (logic remains the same)
    const today = new Date();
    const lastMonthStart = new Date(currentMonthStart);
    lastMonthStart.setMonth(currentMonthStart.getMonth() - 1);
    
    // Define the date ranges for the current month in 10-day increments
    const ranges = [
        { label: `1-10 ${currentMonthStart.toLocaleString('en-AU', { month: 'short' })}`, start: new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), 1), end: new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), 10) },
        { label: `11-20 ${currentMonthStart.toLocaleString('en-AU', { month: 'short' })}`, start: new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), 11), end: new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), 20) },
        { label: `21-31 ${currentMonthStart.toLocaleString('en-AU', { month: 'short' })}`, start: new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), 21), end: new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0) },
    ];
    
    const statData = [];

    const prevMonthEnd = new Date(currentMonthStart);
    prevMonthEnd.setDate(0); 
    const prevMonthPeriod = { 
        label: `21-${prevMonthEnd.getDate()} ${prevMonthEnd.toLocaleString('en-AU', { month: 'short' })}`, 
        start: new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 21), 
        end: prevMonthEnd 
    };
    
    const sessionDates = courses
        .map(c => c.preferredDate)
        .filter((value, index, self) => value && self.indexOf(value) === index);

    let prevClasses = 0;
    sessionDates.forEach(dateStr => {
        const dateParts = dateStr.split("-").map(Number);
        const sessionDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        if (sessionDate >= prevMonthPeriod.start && sessionDate <= prevMonthPeriod.end) {
            prevClasses++;
        }
    });

    statData.push({ ...prevMonthPeriod, count: prevClasses });
    
    ranges.forEach(range => {
        let count = 0;
        sessionDates.forEach(dateStr => {
            const dateParts = dateStr.split("-").map(Number);
            const sessionDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

            const endLimit = range.end > today ? today : range.end;
            
            if (sessionDate >= range.start && sessionDate <= endLimit) {
                count++;
            }
        });

        if (range.start <= today || count > 0) {
            statData.push({ ...range, count: count });
        }
    });
    
    return statData;
};


const UserProfileCard = ({ studentCourses }) => {
    const { user } = useUser();
    const { signOut } = useAuth();
    
    const today = new Date();
    const currentMonthStart = getStartOfMonth(today);

    // --- AGGREGATE SESSIONS --- (UNCHANGED)
    const { totalSessions, completedSessions, aggregatedCourses } = useMemo(() => {
        let total = 0;
        let completed = 0;
        const coursesMap = new Map();

        studentCourses.forEach(session => {
            const isCompleted = session.status === 'completed' || session.status === 'passed';
            const courseKey = session.name.split(' (')[0].trim(); 
            
            total++;
            if (isCompleted || (session.status !== 'pending' && session.isPast)) { 
                 completed++;
            }
            
            if (!coursesMap.has(courseKey)) {
                coursesMap.set(courseKey, {
                    sessionsRemaining: session.sessionsRemaining || 0,
                    teacher: session.teacher,
                    name: courseKey,
                    // Note: We don't rely on these aggregated stats for total/active count anymore
                    // but they are helpful for mentor grouping below.
                });
            }
        });

        return { 
            totalSessions: total, 
            completedSessions: completed,
            aggregatedCourses: Array.from(coursesMap.values())
        };
    }, [studentCourses]);


    // 1. Calculate quick stats (UNCHANGED)
    const totalCourses = aggregatedCourses.length;
    const activeCourses = aggregatedCourses.filter(c => c.sessionsRemaining > 0).length;
    const completedCourses = totalCourses - activeCourses;

    // 2. Progress Percentage (Based on session count)
    const overallProgress = totalSessions > 0 
        ? Math.round((completedSessions / totalSessions) * 100) 
        : 0;

    // 3. Derive Monthly Bar Chart Data (UNCHANGED)
    const monthlyStats = useMemo(() => calculateMonthlyStats(studentCourses, currentMonthStart), [studentCourses, currentMonthStart]);
    const maxClassesInPeriod = Math.max(...monthlyStats.map(stat => stat.count), 1);
    
    // 4. Derive Unique Mentors (use the teacher's name as a unique seed for the image)
    const uniqueMentors = useMemo(() => {
        const mentorsMap = new Map();
        
        studentCourses
            .filter(session => session.sessionsRemaining > 0 && session.teacher && session.teacher !== 'Pending Teacher')
            .forEach(session => {
            
            const teacherName = session.teacher.split('(')[0].trim();
            if (!mentorsMap.has(teacherName)) {
                mentorsMap.set(teacherName, {
                    name: teacherName,
                    expertise: session.name.split(' - ')[0].trim(), 
                    // 🚨 FIX: Use a robust dynamic avatar URL 🚨
                    imageUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(teacherName)}&backgroundColor=008c7f,800080,0000ff&backgroundType=solid,gradient`,
                    fallbackUrl: assets.mentor_avatar // Use a local asset as the ultimate fallback
                });
            }
        });
        return Array.from(mentorsMap.values());
    }, [studentCourses]);

    // --- USER DATA FROM CLERK ---
    const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress.split('@')[0] || 'Student';
    // 🚨 FIX: Prioritize Clerk's own image URL 🚨
    const userProfileImageUrl = user?.imageUrl || assets.PRIMEMENTOR; // Use Clerk image or PRIMEMENTOR logo as fallback

    const cardVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="sticky top-[90px] p-6 bg-white rounded-xl shadow-2xl border border-gray-100 h-fit"
        >
            <div className="flex flex-col items-center border-b pb-4 mb-4">
                {/* Profile Picture and Greeting */}
                <div className="relative mb-4">
                    <img
                        src={userProfileImageUrl}
                        alt="User Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-orange-500 shadow-md"
                        // 🚨 Added onError handler to fallback 🚨
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = assets.PRIMEMENTOR; // Fallback to local logo if Clerk URL fails
                        }}
                    />
                    {/* Progress Indicator (Dynamic) */}
                    <div className="absolute top-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {overallProgress}%
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900">Good Morning, {userName} 👋</h3>
                <p className="text-sm text-gray-500 text-center mt-1">
                    Continue your learning to achieve your goals!
                </p>
            </div>

            {/* --- DYNAMIC STATISTICS SECTION --- */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Zap size={18} className="text-red-500" />
                    Statistics
                </h4>
                <div className="flex justify-between items-end h-20 space-x-2">
                    {monthlyStats.map((stat, index) => {
                        const isCurrentPeriod = index === monthlyStats.length - 1;
                        // Scale height based on max classes booked (max height 64px)
                        const barHeight = stat.count === 0 ? 4 : Math.max(16, Math.round((stat.count / maxClassesInPeriod) * 64)); 
                        
                        return (
                            <div key={index} className="flex flex-col items-center">
                                <div 
                                    className={`w-4 rounded-t-lg transition-all duration-500 ${isCurrentPeriod ? 'bg-blue-600' : 'bg-blue-400'}`} 
                                    style={{ height: `${barHeight}px` }} 
                                    title={`${stat.count} classes booked`}
                                ></div>
                                <span className="text-xs text-gray-500 mt-1">
                                    {stat.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Stats (Session-Based) */}
            <div className="grid grid-cols-3 gap-2 text-center text-gray-700 mb-6 border-t pt-4">
                <div>
                    <p className="text-2xl font-bold text-orange-600">{totalCourses}</p>
                    <p className="text-xs">Courses</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-green-600">{activeCourses}</p>
                    <p className="text-xs">Active</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-purple-600">{completedCourses}</p>
                    <p className="text-xs">Completed</p>
                </div>
            </div>
            
            {/* Mentor Section (Dynamic with Seeded Image) */}
            <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                    <span className='flex items-center gap-2'><User size={18} className="text-blue-500" /> Your Mentors ({uniqueMentors.length})</span>
                    <button className='text-blue-500 hover:text-blue-700 text-sm font-medium'>See All</button>
                </h4>
                
                <div className="space-y-3">
                    {uniqueMentors.length > 0 ? (
                        uniqueMentors.map((mentor, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    {/* 🚨 Mentor Image with Fallback 🚨 */}
                                    <img 
                                        src={mentor.imageUrl} 
                                        alt={mentor.name} 
                                        className="w-8 h-8 rounded-full mr-3 object-cover" 
                                        onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = mentor.fallbackUrl; // Fallback to local student_tutor asset
                                        }}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{mentor.name}</p>
                                        <p className="text-xs text-gray-500">Mentor ({mentor.expertise})</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-sm text-gray-500 p-3 text-center">No mentors currently assigned for your active courses.</p>
                    )}
                </div>
            </div>

            {/* Action Button */}
            <button 
                onClick={() => signOut({ redirectUrl: '/' })}
                className="w-full mt-4 bg-gray-200 text-gray-700 font-semibold py-2 rounded-full hover:bg-gray-300 transition"
            >
                Sign Out
            </button>
        </motion.div>
    );
};

export default UserProfileCard;