// frontend/src/pages/PrivacyPolicyPage.jsx

import React, { useState } from 'react';
import { Shield, Mail, User, Phone, BookOpen, Lock, Cookie, AlertTriangle } from 'lucide-react';

// Import Header and Footer based on your folder structure
import Header from '../components/Home/Header.jsx';
import Footer from '../components/Home/Footer.jsx';
import { assets } from '../assets/assets';

// --- Privacy Policy Content Data Structure ---
const privacyPolicyContent = [
    {
        id: 1,
        title: "Information We Collect",
        content: (
            <ul className="list-disc ml-5 space-y-3">
                <li>
                    <strong className="text-gray-900">Personal Details:</strong> Name, email, phone number, and payment information when you sign up.
                </li>
                <li>
                    <strong className="text-gray-900">Usage Data:</strong> Data regarding your use of our website and services, including session times and preferences.
                </li>
            </ul>
        ),
        icon: <User className="w-5 h-5 text-teal-600 flex-shrink-0" />,
    },
    {
        id: 2,
        title: "How We Use Your Information",
        content: (
            <ul className="list-disc ml-5 space-y-3">
                <li>To provide and personalize tutoring services.</li>
                <li>To communicate with you about your account, sessions, and offers.</li>
                <li>To improve our services and website experience.</li>
            </ul>
        ),
        icon: <BookOpen className="w-5 h-5 text-teal-600 flex-shrink-0" />,
    },
    {
        id: 3,
        title: "How We Protect Your Information",
        content: (
            <ul className="list-disc ml-5 space-y-3">
                <li>We use SSL encryption to secure your data during transmission.</li>
                <li>We never sell or share your personal information with third parties without your consent, except as required by law.</li>
            </ul>
        ),
        icon: <Lock className="w-5 h-5 text-teal-600 flex-shrink-0" />,
    },
    {
        id: 4,
        title: "Cookies",
        content: (
            <>
                We use cookies to improve user experience and analyze website traffic. You can disable cookies in your browser settings, but it may affect site functionality.
            </>
        ),
        icon: <Cookie className="w-5 h-5 text-teal-600 flex-shrink-0" />,
    },
    {
        id: 5,
        title: "Your Rights",
        content: (
            <ul className="list-disc ml-5 space-y-3">
                <li>You can access, update, or delete your personal information at any time.</li>
                <li>You can opt out of marketing emails by clicking the unsubscribe link in any email.</li>
            </ul>
        ),
        icon: <AlertTriangle className="w-5 h-5 text-teal-600 flex-shrink-0" />,
    },
];
// --------------------------------------------------------

const PrivacyPolicyPage = () => {
    // CSS for the full-page background effect
    const backgroundStyle = {
        backgroundImage: `url('${assets.banner}')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed', // Makes the background image fixed while content scrolls
        backgroundPosition: 'center center',
    };

    return (
        // Outer wrapper for the background image
        <div style={backgroundStyle} className="min-h-screen">

            {/* Semi-transparent overlay to ensure text readability across the entire page */}
            <div className="bg-gray-900/80 min-h-screen flex flex-col">

                {/* Header must be integrated here */}
                <Header />

                <main className="flex-grow">

                    {/* Page Banner / Title Section */}
                    <div className="relative pt-40 pb-16 text-white flex items-center justify-center border-b border-gray-700/50">
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-widest animate-in fade-in duration-1000">
                            PRIVACY POLICY
                        </h1>
                    </div>

                    {/* Main Content Area: Privacy Policy List */}
                    <div className="container mx-auto px-4 py-16 max-w-5xl">

                        {/* Introduction Text Section */}
                        <div className="text-center mb-16 space-y-6 text-white">
                            <h2 className="text-4xl font-bold text-orange-400 flex items-center justify-center">
                                <Shield className="w-8 h-8 mr-3" /> At Prime Mentor, Your Privacy is Important to Us
                            </h2>
                            <p className="text-gray-200 leading-relaxed text-lg max-w-3xl mx-auto">
                                This Privacy Policy outlines how we collect, use, and protect your personal information when you use our services.
                            </p>
                        </div>


                        {/* Privacy Policy List Section */}
                        <div className="space-y-8">
                            {privacyPolicyContent.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white/95 p-8 rounded-xl shadow-2xl border-l-8 border-teal-600 hover:shadow-teal-300/50 transition duration-300 transform hover:scale-[1.01]"
                                >
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-start gap-3">
                                        <span className="text-teal-600 font-extrabold text-3xl flex-shrink-0">{item.id}.</span>
                                        {item.title}
                                    </h3>
                                    <div className="text-gray-600 pl-10 pt-2 border-l border-gray-300 ml-4 leading-relaxed text-lg">
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Contact Section */}
                        <div className="mt-16 bg-white/95 p-8 rounded-xl shadow-2xl border-l-8 border-orange-600">
                            <h2 className="text-2xl font-bold text-orange-600 mb-4 flex items-center">
                                <Mail className="w-6 h-6 mr-2" /> 6. Contact Us
                            </h2>
                            <p className="text-gray-600 mb-4">
                                If you have any questions or concerns about your privacy, please contact us at:
                            </p>
                            <ul className="space-y-2 text-lg">
                                <li className="flex items-center text-gray-800">
                                    <Mail className="w-5 h-5 mr-3 text-teal-600 flex-shrink-0" />
                                    Email: <strong className="ml-2">[info.primementor@gmail.com]</strong>
                                </li>
                            </ul>
                        </div>

                    </div>
                </main>

            </div>
        </div>
    );
};

export default PrivacyPolicyPage;