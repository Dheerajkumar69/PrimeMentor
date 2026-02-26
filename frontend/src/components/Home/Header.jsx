// frontend/src/components/Home/Header.jsx

import { Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginHovered, setIsLoginHovered] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const { setShowTeacherLogin, setShowStudentLogin, studentData, logoutStudent, isSignedIn } = useContext(AppContext);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    const handleScroll = () => setIsMenuOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMenuOpen]);

  const baseButtonClasses = "px-4 py-2 sm:px-6 sm:py-3 font-semibold text-sm sm:text-base rounded-full transition transform hover:-translate-y-0.5 duration-300 relative overflow-hidden whitespace-nowrap";

  const handleLogout = () => {
    logoutStudent();
    navigate('/');
    setIsMenuOpen(false);
  };

  const displayName = studentData?.name || studentData?.email || 'Student';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-4 group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 relative cursor-pointer transform transition-transform duration-300 group-hover:scale-105">
            <img src={assets.primementor} alt="Prime Mentor Logo" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-orange-500">Prime</span>
              <span className="text-xl sm:text-2xl font-bold text-orange-600">Mentor</span>
            </div>
            <p className="hidden md:block text-sm text-gray-600 font-medium">Personalised Online Tutoring</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          <a href="#why" className="text-gray-700 hover:text-orange-500 transition font-medium">Why Prime Mentor</a>
          <Link to="/courses" className="text-gray-700 hover:text-orange-500 transition font-medium">Courses</Link>
          <a href="#how" className="text-gray-700 hover:text-orange-500 transition font-medium">How It Works</a>
          <a href="#testimonials" className="text-gray-700 hover:text-orange-500 transition font-medium">Testimonials</a>
          <a href="/contact" className="text-gray-700 hover:text-orange-500 transition font-medium">Contact Us</a>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link to="/my-courses" className="hidden lg:block text-gray-700 hover:text-orange-500 transition font-medium">My Courses</Link>
              <span className="hidden lg:block text-gray-300">|</span>
              <span className="text-gray-700 font-medium text-sm whitespace-nowrap">Hello, {displayName.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition font-medium"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Teacher Login */}
              <button
                onClick={() => setShowTeacherLogin(true)}
                className={`${baseButtonClasses} hidden lg:block ${isLoginHovered ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-700 hover:text-orange-500 border border-gray-300'}`}
                onMouseEnter={() => setIsLoginHovered(true)}
                onMouseLeave={() => setIsLoginHovered(false)}
              >
                Teacher Login
              </button>

              {/* Student Login */}
              <button
                onClick={() => setShowStudentLogin(true)}
                className={`${baseButtonClasses} bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl`}
              >
                Login / Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="w-7 h-7 text-gray-700" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden bg-white border-t border-gray-200">
          <nav className="container mx-auto px-4 py-4 flex flex-col items-start gap-2">
            <a href="#why" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium border-b border-gray-100">Why Prime Mentor</a>
            <Link to="/courses" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium border-b border-gray-100">Courses</Link>
            <a href="#how" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium border-b border-gray-100">How It Works</a>
            <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium border-b border-gray-100">Testimonials</a>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium">Contact Us</Link>

            <div className="w-full border-t border-gray-200 my-2" />

            {isSignedIn ? (
              <>
                <Link to="/my-courses" onClick={() => setIsMenuOpen(false)} className="w-full py-2 text-orange-600 font-semibold text-left border-b border-gray-100">My Courses</Link>
                <div className="flex items-center justify-between w-full pt-2">
                  <p className="font-medium text-gray-700">Hello, {displayName.split(' ')[0]}</p>
                  <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-500 font-medium">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setShowTeacherLogin(true); setIsMenuOpen(false); }}
                  className="w-full py-3 text-gray-700 font-semibold text-left hover:text-orange-500 transition border-b border-gray-100"
                >
                  Teacher Login
                </button>
                <button
                  onClick={() => { setShowStudentLogin(true); setIsMenuOpen(false); }}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold text-center hover:shadow-lg transition mt-2"
                >
                  Student Login / Sign Up
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;