// frontend/src/pages/Courses.jsx

import React, { useState, useEffect } from 'react';
import { Users, School, GraduationCap, ChevronRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Course Card Component
const CourseCard = ({ course }) => {
  const Icon = course.icon;
  const navigate = useNavigate();

  const handleEnrollClick = () => {
    // Navigate to home page first, then try scrolling to pricing
    navigate('/');
    // Use a MutationObserver approach: wait for pricing section to render
    const scrollToPricing = () => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
        return true;
      }
      return false;
    };
    // Try immediately, then retry a few times for lazy-loaded content
    if (!scrollToPricing()) {
      let attempts = 0;
      const interval = setInterval(() => {
        if (scrollToPricing() || attempts++ > 10) clearInterval(interval);
      }, 200);
    }
  };

  return (
    <div className={`
      ${course.color} text-white p-8 rounded-2xl 
      shadow-xl transition-all duration-500 
      transform hover:scale-[1.03] cursor-pointer 
      flex flex-col h-full
      ${course.hoverShadow}
    `}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-10 h-10 text-white/90" />
        <span className="text-sm font-bold uppercase tracking-wider bg-white/20 px-4 py-2 rounded-full">{course.grades}</span>
      </div>

      <h3 className="text-3xl font-extrabold mb-3 leading-snug">{course.title}</h3>
      <p className="text-white/80 mb-6 flex-grow text-lg">{course.description}</p>

      {/* Price and Tagline */}
      <div className="mt-auto pt-4 border-t border-white/30">
        <div className="flex justify-between items-center mb-3">
          <span className="text-3xl font-extrabold tracking-tight">{course.price}</span>
          <button
            onClick={handleEnrollClick}
            className="flex items-center text-lg font-semibold bg-white text-gray-800 py-2 px-6 rounded-full hover:bg-gray-100 transition-colors duration-300"
          >
            Enroll Now <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
        <p className="text-sm italic text-white/90 font-medium pt-2">
          {course.tagline}
        </p>
      </div>
    </div>
  );
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const apiBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiBase}/api/admin/pricing`);
        const { classRanges } = response.data;

        setCourses([
          {
            id: 1,
            title: "Primary Years Excellence",
            grades: "Classes 2 - 6",
            price: `$${classRanges['2-6']?.sessionPrice || 22} / hr`,
            icon: Users,
            description: "Build a rock-solid academic foundation. Focus on core skills in Math, English, and Science through engaging, interactive lessons.",
            tagline: "Interactive online Zoom sessions to spark curiosity and confidence early on!",
            color: "bg-green-600",
            hoverShadow: "hover:shadow-green-500/50"
          },
          {
            id: 2,
            title: "Middle School Mastery",
            grades: "Classes 7 - 9",
            price: `$${classRanges['7-9']?.sessionPrice || 25} / hr`,
            icon: School,
            description: "Deepen subject understanding and critical thinking. Prepare for high school with advanced coursework and conceptual clarity.",
            tagline: "Dedicated one-on-one and small group Zoom classes focusing on conceptual clarity and exam success!",
            color: "bg-blue-600",
            hoverShadow: "hover:shadow-blue-500/50"
          },
          {
            id: 3,
            title: "High School Achievement",
            grades: "Classes 10 - 12",
            price: `$${classRanges['10-12']?.sessionPrice || 27} / hr`,
            icon: GraduationCap,
            description: "Targeted support for board exams and university entrance. Master complex topics with focused, personalized tutoring.",
            tagline: "Premium online Zoom tutoring tailored for Board Exams, AP, and college readiness!",
            color: "bg-red-600",
            hoverShadow: "hover:shadow-red-500/50"
          },
        ]);
      } catch (err) {
        console.error('Failed to fetch pricing for courses, using defaults:', err);
        // Fallback to defaults
        setCourses([
          {
            id: 1, title: "Primary Years Excellence", grades: "Classes 2 - 6", price: "$22 / hr",
            icon: Users, description: "Build a rock-solid academic foundation. Focus on core skills in Math, English, and Science through engaging, interactive lessons.",
            tagline: "Interactive online Zoom sessions to spark curiosity and confidence early on!", color: "bg-green-600", hoverShadow: "hover:shadow-green-500/50"
          },
          {
            id: 2, title: "Middle School Mastery", grades: "Classes 7 - 9", price: "$25 / hr",
            icon: School, description: "Deepen subject understanding and critical thinking. Prepare for high school with advanced coursework and conceptual clarity.",
            tagline: "Dedicated one-on-one and small group Zoom classes focusing on conceptual clarity and exam success!", color: "bg-blue-600", hoverShadow: "hover:shadow-blue-500/50"
          },
          {
            id: 3, title: "High School Achievement", grades: "Classes 10 - 12", price: "$27 / hr",
            icon: GraduationCap, description: "Targeted support for board exams and university entrance. Master complex topics with focused, personalized tutoring.",
            tagline: "Premium online Zoom tutoring tailored for Board Exams, AP, and college readiness!", color: "bg-red-600", hoverShadow: "hover:shadow-red-500/50"
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-12 bg-gray-50 font-inter">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
            Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Online Learning Path</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Our <b>Courses</b> offer <b>personalized, real-time tutoring</b> tailored to the unique academic needs of every grade level, ensuring maximum understanding and top grades.
          </p>
        </header>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default Courses;