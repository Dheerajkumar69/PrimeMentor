// frontend/src/pages/TermsOfServicePage.jsx

import React from 'react';
// Importing HelpCircle for the title banner just like FaqPage, 
// and ScrollText for the content icon to differentiate it slightly.
import { HelpCircle, ScrollText } from 'lucide-react'; 

// Import Header and Footer based on your folder structure
import Header from '../components/Home/Header.jsx';
import Footer from '../components/Home/Footer.jsx';
import { assets } from '../assets/assets';

// --- TERMS OF SERVICE CONTENT DATA STRUCTURE (From your images) ---
const tosContent = [
    {
        id: 1,
        title: "Services Provided:",
        content: (
            <p>
                We offer tutoring services for students from <b>KG to Year 12</b> in subjects such as Math, English, Science, and more. Services include online tutoring, course materials, and personalized learning plans.
            </p>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 2,
        title: "User Responsibilities:",
        content: (
            <ul className="list-disc ml-5 space-y-1">
                <li>You are responsible for providing <b>accurate information</b> when signing up.</li>
                <li>You agree to use our services for lawful purposes only.</li>
                <li>You must ensure that your internet connection and devices are functional for online sessions.</li>
            </ul>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 3,
        title: "Payments:",
        content: (
            <ul className="list-disc ml-5 space-y-1">
                <li>Payment is required <b>prior to or at the time</b> of the service.</li>
                <li>We accept payments via credit/debit cards and PayPal.</li>
                <li>All fees are non-refundable unless specified otherwise in our Refund Policy.</li>
            </ul>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 4,
        title: "Cancellations & Rescheduling:",
        content: (
            <p>
                Sessions must be canceled or rescheduled <b>24 hours in advance</b> to avoid cancellation fees.
            </p>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 5,
        title: "Intellectual Property:",
        content: (
            <p>
                All materials, content, and intellectual property provided by Prime Mentor are <b>owned by us</b> and cannot be reproduced or shared without our consent.
            </p>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 6,
        title: "Privacy:",
        content: (
            <p>
                Your personal information is protected according to our <b>Privacy Policy</b>. We will never share or sell your information to third parties without your consent.
            </p>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 7,
        title: "Limitation of Liability:",
        content: (
            <p>
                We are <b>not liable</b> for any indirect, incidental, or consequential damages arising from the use of our services. We are also not responsible for issues beyond our control, such as connectivity problems.
            </p>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 8,
        title: "Changes to Terms:",
        content: (
            <p>
                Prime Mentor reserves the right to update or modify these terms at any time. Changes will be posted on the website, and you are encouraged to review them regularly.
            </p>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 9,
        title: "Contact Us:",
        content: (
            <div className="space-y-1">
                <p>For any questions or concerns about our terms, please contact us at:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Email: <b>info.primementor@gmail.com</b></li>
                    <li>Phone: <b>ABN 32 672 503 678</b></li>
                </ul>
            </div>
        ),
        icon: <ScrollText className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
];
// --------------------------------------------------------


const TermsOfServicePage = () => {
    // Styling copied directly from FaqPage.jsx
    const backgroundStyle = {
        backgroundImage: `url('${assets.banner}')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center center',
    };

    return (
        <div style={backgroundStyle} className="min-h-screen">
            <div className="bg-gray-900/80 min-h-screen flex flex-col">

                <Header />

                <main className="flex-grow">

                    {/* Page Banner / Title Section (Title changed to TERMS OF SERVICE) */}
                    <div className="relative pt-40 text-white flex items-center justify-center border-b border-gray-700/50">
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-widest animate-in fade-in duration-1000">
                            TERMS OF SERVICE
                        </h1>
                    </div>

                    {/* Main Content Area: TOS List - Same container styling as FAQ */}
                    <div className="container mx-auto px-4 py-16 max-w-5xl">

                        {/* Introduction Text Section (Content changed) */}
                        <div className="text-center mb-16 space-y-6 text-white">
                            <h2 className="text-4xl font-bold text-teal-400 flex items-center justify-center">
                                <ScrollText className="w-8 h-8 mr-3" /> Agreement and Conditions
                            </h2>
                            <p className="text-gray-200 leading-relaxed text-lg max-w-3xl mx-auto">
                                By using Prime Mentor's website and services, you agree to the following terms and conditions. Please review them carefully.
                            </p>
                        </div>


                        {/* TOS List Section - Same list styling as FAQ */}
                        <div className="space-y-6">
                            {tosContent.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="bg-white/95 p-6 rounded-xl shadow-2xl border-l-8 border-orange-500 hover:shadow-orange-300/50 transition duration-300 transform hover:scale-[1.01]"
                                >
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-start gap-3">
                                        <span className="text-orange-500 font-extrabold text-2xl flex-shrink-0">{item.id}.</span> 
                                        {item.title} 
                                    </h3>
                                    <div className="text-gray-600 pl-8 pt-2 border-l border-gray-300 ml-4 leading-relaxed">
                                        {item.content} 
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                    </div>
                </main>

                <Footer />

            </div>
        </div>
    );
};

export default TermsOfServicePage;