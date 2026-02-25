// frontend/src/components/Home/Header.jsx

import { Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useClerk, UserButton, useUser, SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginHovered, setIsLoginHovered] = useState(false);
  const menuRef = useRef(null);

  // Fix #16: Close mobile menu on outside click or scroll
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
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

  const navigate = useNavigate();

  const { setShowTeacherLogin } = useContext(AppContext);

  const { openSignIn } = useClerk();
  const { user } = useUser();

  // Define a shared base class for the buttons
  const baseButtonClasses = "px-4 py-2 sm:px-6 sm:py-3 font-semibold text-sm sm:text-base rounded-full transition transform hover:-translate-y-0.5 duration-300 relative overflow-hidden whitespace-nowrap";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-all duration-300">
      {/* Container: Added mobile/tablet padding, reduced py for a compact header */}
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

        {/* Logo and Brand Text - Optimized for Mobile */}
        <Link to="/" className="flex items-center gap-2 sm:gap-4 group">
          {/* Logo Container: Reduced size for mobile, w-14 h-14, up to w-20 h-20 on desktop */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 relative cursor-pointer transform transition-transform duration-300 group-hover:scale-105">
            <img src={assets.primementor} alt="Prime Mentor Logo" className="w-full h-full object-contain" />
          </div>
          {/* Brand Text: Hidden on mobile (default), visible on sm+ screens */}
          <div className="hidden sm:block">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold text-orange-500">Prime</span>
              <span className="text-xl sm:text-2xl font-bold text-orange-600">Mentor</span>
            </div>
            {/* Tagline: Hidden on small screens, visible on md+ screens */}
            <p className="hidden md:block text-sm text-gray-600 font-medium">Personalised Online Tutoring</p>
          </div>
        </Link>

        {/* Main Navigation - Desktop (lg+ screens) */}
        <nav className="hidden lg:flex items-center gap-6">
          <a href="#why" className="text-gray-700 hover:text-orange-500 transition font-medium">Why Prime Mentor</a>
          {/* ⭐ UPDATE: Courses Link (Desktop) ⭐ */}
          <Link to="/courses" className="text-gray-700 hover:text-orange-500 transition font-medium">Courses</Link>
          <a href="#how" className="text-gray-700 hover:text-orange-500 transition font-medium">How It Works</a>
          <a href="#testimonials" className="text-gray-700 hover:text-orange-500 transition font-medium">Testimonials</a>
          <a href="/contact" className="text-gray-700 hover:text-orange-500 transition font-medium">Contact Us</a>
        </nav>

        {/* Action Buttons - Desktop (md+ screens) */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          {
            user
              ? <div className='flex items-center gap-2'>
                {/* My Courses link hidden on tablet/small desktop, visible on large desktop (lg+) */}
                <Link to="/my-courses" className="hidden lg:block text-gray-700 hover:text-orange-500 transition font-medium">My Courses</Link>
                <p className="hidden lg:block">|</p>
                <p className="text-gray-700 font-medium mr-4 text-sm whitespace-nowrap">Hello, {user.firstName || user.emailAddresses[0].emailAddress}</p>
              </div>
              : <div className='flex items-center gap-2'>
                <SignedOut>
                  {/* Teacher Login Button */}
                  <button
                    onClick={e => setShowTeacherLogin(true)}
                    className={`${baseButtonClasses} hidden lg:block ${isLoginHovered ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-700 hover:text-orange-500 border border-gray-300'}`}
                    onMouseEnter={() => setIsLoginHovered(true)}
                    onMouseLeave={() => setIsLoginHovered(false)}
                  >
                    Teacher Login
                  </button>

                  {/* Student Login Button - Styled as default CTA */}
                  <SignInButton mode="modal" signUpFallbackRedirectUrl="/">
                    <button
                      onClick={e => openSignIn()}
                      className={`${baseButtonClasses} bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl`}
                    >
                      Login/Sign Up
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
          }

          <SignedIn>
            {/* User Profile Button when signed in */}
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 md:w-10 md:h-10" } }} />
          </SignedIn>
        </div>

        {/* Mobile Menu Button - Visible below md breakpoint */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="w-7 h-7 text-gray-700" />
        </button>
      </div>

      {/* Mobile Menu (Updated with Clerk components) - Visible below md breakpoint */}
      {isMenuOpen && (
        <div ref={menuRef} className="md:hidden bg-white border-t border-gray-200">
          <nav className="container mx-auto px-4 py-4 flex flex-col items-start gap-2">
            <a href="#why" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium border-b border-gray-100">Why Prime Mentor</a>
            {/* ⭐ UPDATE: Courses Link (Mobile) - Changed to Link component ⭐ */}
            <Link to="/courses" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium border-b border-gray-100">Courses</Link>
            <a href="#how" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium border-b border-gray-100">How It Works</a>
            <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium border-b border-gray-100">Testimonials</a>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="w-full text-gray-700 hover:text-orange-500 transition py-2 font-medium">Contact Us</Link>

            <div className="w-full border-t border-gray-200 my-2"></div>

            {user && (
              <Link to="/my-courses" onClick={() => setIsMenuOpen(false)} className="w-full py-2 text-orange-600 font-semibold text-left border-b border-gray-100">
                My Courses
              </Link>
            )}

            <SignedOut>
              <button
                onClick={e => { e.preventDefault(); setShowTeacherLogin(true); setIsMenuOpen(false); }}
                className="w-full py-3 text-gray-700 font-semibold text-left hover:text-orange-500 transition border-b border-gray-100"
              >
                Teacher Login
              </button>
              <SignInButton mode="modal">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold text-center hover:shadow-lg transition mt-2"
                >
                  Student Login / Sign Up
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center justify-between w-full pt-2">
                <p className="font-medium text-gray-700">Account</p>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
              </div>
            </SignedIn>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;