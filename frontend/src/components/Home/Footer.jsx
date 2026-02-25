import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Facebook, Twitter, Youtube, Instagram, MapPin, Phone, Mail, ChevronRight, ArrowUp, Shield } from 'lucide-react';
import { assets } from '../../assets/assets';

export default function Footer() {
    const navigate = useNavigate();
    const location = useLocation();

    // New function to navigate and scroll to the top immediately
    const navigateAndScrollToTop = (path) => {
        navigate(path);
        // Use an immediate scroll to ensure the new page starts at the top
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Navigate to home page first (if not already there) then scroll to anchor
    const navigateToAnchor = (hash) => {
        if (location.pathname !== '/') {
            navigate('/');
            // Wait for the home page to render, then scroll to the section
            setTimeout(() => {
                const el = document.getElementById(hash);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        } else {
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const customAnimations = `
        @keyframes logo-pulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.05); opacity: 1; }
        }

        @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes subtle-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
    `;

    return (
        <footer id='contact' className="relative bg-gray-50 pt-20 pb-8">
            <style>{customAnimations}</style>

            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Column 1: Brand Info */}
                    <div className="animate-[fade-in-up_1s_ease-out_forwards]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 relative animate-[logo-pulse_4s_ease-in-out_infinite]">
                                <img src={assets.primementor} alt="" />
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-orange-500">Prime</span>
                                    <span className="text-xl font-bold text-orange-600">Mentor</span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium">Personalised Online Tutoring</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            <span className="font-bold text-gray-900">Prime Mentor</span> provides personalized, face-to-face online tutoring for students in classes 2-12. Our expert tutors bring learning to life with engaging sessions tailored to each student's unique needs.
                        </p>
                        <div className="space-y-3">
                            {/* UPDATED: Mail Link */}
                            <a href="mailto:info@primementor.com.au" className="flex items-center gap-3 text-gray-700 hover:text-orange-500 transition">
                                <Mail className="w-5 h-5 text-orange-500" />
                                <span>info@primementor.com.au</span>
                            </a>
                            {/* UPDATED: MapPin Link */}
                            <a
                                href="https://www.google.com/maps/search/?api=1&query=Office+1,+Floor+1,+105a+High+Street+Cranbourne+Vic+3977"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-gray-700 hover:text-orange-500 transition"
                            >
                                <MapPin className="w-5 h-5 text-orange-500" />
                                <span>Office 1, Floor 1, 105a High Street Cranbourne Vic 3977</span>
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Links */}
                    <div className="animate-[fade-in-up_1s_ease-out_0.2s_forwards]">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            LINKS
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <button onClick={() => navigateToAnchor('home')} className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left">
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Home
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigateToAnchor('why')} className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left">
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Why Prime Mentor
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigateToAnchor('how')} className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left">
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    How It Works
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigateToAnchor('tutors')} className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left">
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Our Tutors
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigateToAnchor('testimonials')} className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left">
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Testimonials
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigateToAnchor('pricing')} className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left">
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Pricing
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Support - Buttons are updated to use navigateAndScrollToTop */}
                    <div className="animate-[fade-in-up_1s_ease-out_0.4s_forwards]">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">SUPPORT</h3>
                        <ul className="space-y-3">
                            <li>
                                <button
                                    onClick={() => navigateAndScrollToTop('/contact')}
                                    className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left"
                                >
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Contact Us
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigateAndScrollToTop('/faq')}
                                    className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left"
                                >
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    FAQ
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigateAndScrollToTop('/help-center')}
                                    className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left"
                                >
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Help Center
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigateAndScrollToTop('/support')}
                                    className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left"
                                >
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Support
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigateAndScrollToTop('/privacy-policy')}
                                    className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left"
                                >
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Privacy Policy
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigateAndScrollToTop('/terms-of-service')}
                                    className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left"
                                >
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Terms of Service
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigateAndScrollToTop('/refund-policy')}
                                    className="text-gray-600 hover:text-orange-500 transition flex items-center gap-2 group p-0 bg-transparent border-none w-full text-left"
                                >
                                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                                    Refund Policy
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Student Success Gallery */}
                    <div className="animate-[fade-in-up_1s_ease-out_0.6s_forwards]">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">STUDENT SUCCESS</h3>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <img
                                src="https://images.pexels.com/photos/5905713/pexels-photo-5905713.jpeg?auto=compress&cs=tinysrgb&w=200"
                                alt="Student writing"
                                className="w-full h-20 object-cover rounded-lg transform transition hover:scale-110 hover:shadow-lg"
                            />
                            <img
                                src="https://images.pexels.com/photos/5905703/pexels-photo-5905703.jpeg?auto=compress&cs=tinysrgb&w=200"
                                alt="Student on laptop"
                                className="w-full h-20 object-cover rounded-lg transform transition hover:scale-110 hover:shadow-lg"
                            />
                            {/* **FIX: Replaced the third image with the user-provided URL** */}
                            <img
                                src="https://images.pexels.com/photos/8363150/pexels-photo-8363150.jpeg?auto=compress&cs=tinysrgb&w=200"
                                alt="A kid handing out a best teacher trophy"
                                className="w-full h-20 object-cover rounded-lg transform transition hover:scale-110 hover:shadow-lg"
                            />
                            <img
                                src="https://images.pexels.com/photos/5212702/pexels-photo-5212702.jpeg?auto=compress&cs=tinysrgb&w=200"
                                alt="Group study"
                                className="w-full h-20 object-cover rounded-lg transform transition hover:scale-110 hover:shadow-lg"
                            />
                            <img
                                src="https://images.pexels.com/photos/4144926/pexels-photo-4144926.jpeg?auto=compress&cs=tinysrgb&w=200"
                                alt="Online tutor session"
                                className="w-full h-20 object-cover rounded-lg transform transition hover:scale-110 hover:shadow-lg"
                            />
                            <img
                                src="https://images.pexels.com/photos/5905466/pexels-photo-5905466.jpeg?auto=compress&cs=tinysrgb&w=200"
                                alt="Smiling student at desk"
                                className="w-full h-20 object-cover rounded-lg transform transition hover:scale-110 hover:shadow-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Separator and Bottom Bar */}
                <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600">
                        © All rights are reserved by Prime Mentor PTY Ltd Australia.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">Follow us:</span>
                        <div className="flex gap-3">
                            <a href="https://www.facebook.com/profile.php?id=61581803430914" className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition hover:scale-110">
                                <Facebook className="w-5 h-5 text-white" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition hover:scale-110">
                                <Twitter className="w-5 h-5 text-white" />
                            </a>
                            <a href="https://www.youtube.com/@primementorofficial" className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition hover:scale-110">
                                <Youtube className="w-5 h-5 text-white" />
                            </a>
                            <a href="https://www.instagram.com/primementorofficial/" className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition hover:scale-110">
                                <Instagram className="w-5 h-5 text-white" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 w-14 h-14 bg-gray-900 hover:bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110 z-50 animate-[subtle-float_3s_ease-in-out_infinite]"
            >
                <ArrowUp className="w-6 h-6" />
            </button>
        </footer>
    );
}