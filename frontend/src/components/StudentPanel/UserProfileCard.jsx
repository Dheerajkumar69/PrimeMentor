// frontend/src/components/StudentPanel/UserProfileCard.jsx

import React, { useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { User, Zap } from 'lucide-react';

const UserProfileCard = ({ studentCourses }) => {
  const { user } = useUser();
  const { signOut } = useAuth();

  // --- DERIVE DYNAMIC DATA FROM PROPS ---

  // 1. Calculate quick stats
  const totalCourses = studentCourses.length;
  const completedCourses = studentCourses.filter(c => (c.progress || 0) >= 100).length;
  const activeCourses = totalCourses - completedCourses;
  
  // 2. Derive Unique Mentors from enrolled courses
  const uniqueMentors = useMemo(() => {
    const mentorsMap = new Map();
    studentCourses.forEach(course => {
      // Assuming course object has 'teacher' (name) and 'subject' (expertise)
      if (course.teacher && !mentorsMap.has(course.teacher)) {
        mentorsMap.set(course.teacher, {
          name: course.teacher,
          expertise: course.name, // Use the first course name as a placeholder for expertise
          // In a real app, you would fetch the image URL and real expertise
          imageUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(course.teacher)}` 
        });
      }
    });
    // Convert Map to array
    return Array.from(mentorsMap.values());
  }, [studentCourses]);

  // --- USER DATA FROM CLERK ---
  const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress.split('@')[0] || 'Student';
  const userProfileImageUrl = user?.imageUrl || 'https://i.pravatar.cc/150?u=clerk-user'; // Fallback

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
          />
          {/* Progress Indicator (Mock) - This is hardcoded (32%) and should be updated from a real progress data source */}
          <div className="absolute top-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
            32%
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900">Good Morning, {userName} 👋</h3>
        <p className="text-sm text-gray-500 text-center mt-1">
          Continue your learning to achieve your goals!
        </p>
      </div>

      {/* Statistics Section (Bar Chart - Still Mock Data) */}
      {/* 🛑 UPDATE REQUIRED: This section requires real data on sessions/activity over time, which must be fetched from your backend API. 🛑 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Zap size={18} className="text-red-500" />
          Statistics
        </h4>
        <div className="flex justify-between items-end h-20 space-x-2">
          {/* Mock Bar Chart kept for UI consistency until real data is available */}
          <div className="flex flex-col items-center">
            <div className="w-4 h-12 bg-blue-400 rounded-t-lg" style={{ height: '48px' }}></div>
            <span className="text-xs text-gray-500 mt-1">1-10 Aug</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-8 bg-blue-400 rounded-t-lg" style={{ height: '32px' }}></div>
            <span className="text-xs text-gray-500 mt-1">11-20 Aug</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-16 bg-blue-600 rounded-t-lg" style={{ height: '64px' }}></div>
            <span className="text-xs text-gray-500 mt-1">21-30 Aug</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-10 bg-blue-400 rounded-t-lg" style={{ height: '40px' }}></div>
            <span className="text-xs text-gray-500 mt-1">Current</span>
          </div>
        </div>
      </div>

      {/* Quick Stats (Now Dynamic) */}
      <div className="grid grid-cols-3 gap-2 text-center text-gray-700 mb-6 border-t pt-4">
        <div>
          <p className="text-2xl font-bold text-orange-600">{totalCourses}</p>
          <p className="text-xs">Total</p>
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
      
      {/* Mentor Section (Now Dynamic) */}
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
                  <img src={mentor.imageUrl} alt="Mentor" className="w-8 h-8 rounded-full mr-3 object-cover" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mentor.name}</p>
                    {/* Display the course name as their expertise for context */}
                    <p className="text-xs text-gray-500">Mentor ({mentor.expertise})</p>
                  </div>
                </div>
                {/* Follow Button remains a static action element
                <button className="text-xs text-orange-500 border border-orange-300 px-3 py-1 rounded-full hover:bg-orange-50">
                  Follow
                </button> */}
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