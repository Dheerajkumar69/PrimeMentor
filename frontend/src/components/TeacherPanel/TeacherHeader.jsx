import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext.jsx';
// Assuming assets.js is correctly defined relative to src/
import { assets } from '../../assets/assets.js'; 
import { toast } from 'react-hot-toast'; // Using react-hot-toast for feedback
import { LogOut } from 'lucide-react';

const TeacherHeader = () => {
    const navigate = useNavigate();
    // Assuming backendUrl, setTeacherToken, and setTeacherData are available in AppContext
    const { teacherData, setTeacherToken, setTeacherData, backendUrl } = useContext(AppContext);
    
    // Safety check: if data isn't loaded yet, don't render header content
    if (!teacherData) {
        return (
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="container mx-auto p-4 flex justify-between items-center">
                    <span className="text-xl font-bold text-indigo-600">PRIME MENTOR</span>
                    <span className="text-sm text-gray-500">Loading...</span>
                </div>
            </header>
        );
    }

    const handleLogout = () => {
        // 1. Clear state
        setTeacherToken(null);
        setTeacherData(null);
        
        // 2. Clear localStorage
        localStorage.removeItem('teacherToken');
        
        // 3. Redirect and show success message
        toast.success("Logged out successfully.");
        navigate('/');
    };

    // Construct image URL (FIXED: Changed '/uploads/' to '/images/' to match server.js static path)
    // Using a ternary for safer URL construction and fallback
    const teacherImage = (teacherData.image && backendUrl) 
        ? `${backendUrl}/images/${teacherData.image}` 
        : assets.person_icon; // Placeholder image from assets

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            {/* Responsive Padding */}
            <div className="container mx-auto px-4 py-3 sm:p-4 flex justify-between items-center">
                
                {/* Left Side: Logo and Name */}
                <div className="flex items-center space-x-2">
                    {/* Responsive Logo Size */}
                    <img 
                        // Assuming PRIMEMENTOR.png is accessible via 'src/assets/PRIMEMENTOR.png'
                        src={assets.primementor} 
                        alt="Prime Mentor Logo" 
                        className="h-6 w-auto sm:h-8 cursor-pointer"
                        onClick={() => navigate('/teacher/dashboard')} // Navigate to dashboard, not home
                    />
                    <span className="text-base sm:text-xl font-bold text-indigo-600 hidden xs:block">PRIME MENTOR</span>
                </div>

                {/* Right Side: Teacher Info, Picture, and Logout */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    
                    {/* Responsive Name Display */}
                    <span className="text-gray-700 font-medium text-xs sm:text-sm md:text-base hidden sm:block">
                        Hi, {teacherData.name}
                    </span>
                    
                    {/* Profile Picture - Responsive Size */}
                    <img 
                        src={teacherImage} 
                        alt={`${teacherData.name}'s Profile`} 
                        className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full border-2 border-indigo-500"
                        // Fallback handling in case image URL is broken
                        onError={(e) => { e.target.onerror = null; e.target.src='data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%235c6bcf' rx='20'/%3E%3Ctext x='50%25' y='60%25' font-family='Arial' font-size='16' font-weight='bold' text-anchor='middle' fill='white'%3ET%3C/text%3E%3C/svg%3E' }}
                    />

                    {/* Logout Button - Responsive Size */}
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md transition duration-200 text-xs sm:text-sm flex items-center"
                    >
                        <LogOut size={16} className='mr-1 hidden sm:inline-block' />
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TeacherHeader;