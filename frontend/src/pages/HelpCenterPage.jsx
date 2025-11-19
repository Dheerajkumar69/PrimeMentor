// frontend/src/pages/HelpCenterPage.jsx

import React from 'react';
import { HelpCircle, FileText, User } from 'lucide-react';

// Import Header and Footer based on your folder structure
import Header from '../components/Home/Header.jsx';
import Footer from '../components/Home/Footer.jsx';
import { assets } from '../assets/assets';

// --- HELP CENTER Content Data Structure (Based on a typical help center structure) ---
const helpCenterContent = [
    {
        id: 1,
        question: "Getting Started: How to Book Your First Session",
        answer: (
            <ul className="list-disc ml-5 space-y-2">
                <li><b>Step 1:</b> Visit the 'Booking' page or click the 'Free Assessment' button.</li>
                <li><b>Step 2:</b> Select your child's subject, grade level, and preferred time slots.</li>
                <li><b>Step 3:</b> Complete the registration form with your contact and payment details.</li>
                <li><b>Step 4:</b> You will receive a confirmation email with the session details and a link to your virtual classroom.</li>
            </ul>
        ),
        icon: <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 2,
        question: "Managing Your Account & Profile",
        answer: "To update your personal information, change your password, or modify your subscription, log into your student dashboard and click on 'Profile Settings'. All changes can be made there instantly.",
        icon: <User className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 3,
        question: "What to do if you face technical issues during a session?",
        answer: "If you encounter any issues (video, audio, or connection), first check your internet connection. If the problem persists, refresh the page. If that fails, immediately contact our technical support team via live chat or phone, and they will help you reconnect or reschedule.",
        icon: <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 4,
        question: "Accessing Session Recordings and Study Materials",
        answer: "All session recordings, homework assignments, and supplementary materials are available in the 'My Courses' section of your student dashboard within 1 hour of the session ending. You can download or view them at any time.",
        icon: <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 5,
        question: "How to Request a Tutor Change or Special Subject",
        answer: "If you need a different tutor or a highly specialized subject not listed, please send an email to support@primementor.com with a detailed request. We will review it and aim to accommodate your needs within 48 hours.",
        icon: <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    // You can add more content from your image here following the same structure
];
// --------------------------------------------------------


const HelpCenterPage = () => {
    // CSS for the full-page background effect (Same as FaqPage)
    const backgroundStyle = {
        // Assuming 'assets.banner' contains the URL for 'BANNER PIC.jpg'
        backgroundImage: `url('${assets.banner}')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed', // Makes the background image fixed while content scrolls
        backgroundPosition: 'center center',
    };

    return (
        // Outer wrapper for the background image
        <div style={backgroundStyle} className="min-h-screen">

            {/* Semi-transparent overlay to ensure text readability across the entire page (Same as FaqPage) */}
            <div className="bg-gray-900/80 min-h-screen flex flex-col">

                {/* Header must be integrated here */}
                <Header />

                <main className="flex-grow">

                    {/* Page Banner / Title Section (Same as FaqPage, only title changes) */}
                    <div className="relative pt-40 text-white flex items-center justify-center border-b border-gray-700/50">
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-widest animate-in fade-in duration-1000">
                            HELP CENTER
                        </h1>
                    </div>

                    {/* Main Content Area: Help Center List */}
                    <div className="container mx-auto px-4 py-16 max-w-5xl">

                        {/* Introduction Text Section (Adapted from FaqPage) */}
                        <div className="text-center mb-16 space-y-6 text-white">
                            <h2 className="text-4xl font-bold text-teal-400 flex items-center justify-center">
                                <HelpCircle className="w-8 h-8 mr-3" /> Dedicated Support & Guidance
                            </h2>
                            <p className="text-gray-200 leading-relaxed text-lg max-w-3xl mx-auto">
                                Welcome to Prime Mentor's Help Center. Find detailed guides, troubleshooting steps, and tips to ensure a smooth learning journey for your child.
                            </p>
                        </div>


                        {/* Help Center List Section (Replacing Contact Form/Details) */}
                        <div className="space-y-6">
                            {helpCenterContent.map((item) => (
                                <div 
                                    key={item.id} 
                                    // Custom styling for a question block, similar to the FaqPage's list items
                                    className="bg-white/95 p-6 rounded-xl shadow-2xl border-l-8 border-orange-500 hover:shadow-orange-300/50 transition duration-300 transform hover:scale-[1.01]"
                                >
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-start gap-3">
                                        <span className="text-orange-500 font-extrabold text-2xl flex-shrink-0">{item.id}.</span> 
                                        {item.question}
                                    </h3>
                                    <div className="text-gray-600 pl-8 pt-2 border-l border-gray-300 ml-4 leading-relaxed">
                                        {/* Renders the answer, which can be a string or a list component */}
                                        {item.answer}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                    </div>
                </main>

            </div>
        </div>
    );
};

export default HelpCenterPage;