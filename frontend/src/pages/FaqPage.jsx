// frontend/src/pages/FaqPage.jsx

import React from 'react';
import { HelpCircle, Star, MessageSquare } from 'lucide-react';

// Import Header and Footer based on your folder structure
import Header from '../components/Home/Header.jsx';
import Footer from '../components/Home/Footer.jsx';
import { assets } from '../assets/assets';

// --- FAQ Content Data Structure (from your image) ---
const faqContent = [
    {
        id: 1,
        question: "What subjects do you offer tutoring for?",
        answer: "We offer tutoring in Math, English, Science, and more for KG to Year 12 students. If you need a specific subject, just ask!",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 2,
        question: "How do I sign up for tutoring?",
        answer: "Simply visit our Sign-Up Page, choose your subject and schedule, and we'll match you with an expert tutor. You can choose online or in-person sessions.",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 3,
        question: "Are the lessons personalized?",
        answer: "Yes! Each lesson is customized to suit your child's needs and pace, ensuring the best learning outcomes.",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 4,
        question: "How much do the sessions cost?",
        answer: "Tutoring starts from $22 per session. Prices may vary by subject and level. Contact us for more detailed pricing.",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 5,
        question: "Do you offer a free trial?",
        answer: "Yes, we offer a free trial session for new students to experience our teaching style before committing.",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 6,
        question: "How do online sessions work?",
        answer: "Our online sessions are conducted via video conferencing with interactive tools like whiteboards and screen sharing for a seamless learning experience.",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 7,
        question: "How can I track my child's progress?",
        answer: "We provide progress reports after each session to track your child's improvements and areas for focus.",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 8,
        question: "Can I choose my child's tutor?",
        answer: "Yes, you can request a specific tutor. We match your child with the best-fit tutor based on their needs.",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 9,
        question: "How do I cancel or reschedule a session?",
        answer: "You can reschedule or cancel a session with 24-hour notice. Cancellations made after that may incur a fee.",
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 10,
        question: "How can I contact you?",
        answer: (
            <ul className="list-disc ml-5 space-y-1">
                <li>Email: info.primementor@gmail.com</li>
                <li>Phone: ABN 32 672 503 678</li>
                <li>Contact Form: Visit our Contact Us page.</li>
            </ul>
        ),
        icon: <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
];
// --------------------------------------------------------


const FaqPage = () => {
    // CSS for the full-page background effect (Same as ContactPage)
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

            {/* Semi-transparent overlay to ensure text readability across the entire page (Same as ContactPage) */}
            <div className="bg-gray-900/80 min-h-screen flex flex-col">

                {/* Header must be integrated here */}
                <Header />

                <main className="flex-grow">

                    {/* Page Banner / Title Section (Same as ContactPage, only title changes) */}
                    <div className="relative pt-40 text-white flex items-center justify-center border-b border-gray-700/50">
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-widest animate-in fade-in duration-1000">
                            FAQ's
                        </h1>
                    </div>

                    {/* Main Content Area: FAQ List */}
                    <div className="container mx-auto px-4 py-16 max-w-5xl">

                        {/* Introduction Text Section (Adapted from ContactPage's cards) */}
                        <div className="text-center mb-16 space-y-6 text-white">
                            <h2 className="text-4xl font-bold text-teal-400 flex items-center justify-center">
                                <HelpCircle className="w-8 h-8 mr-3" /> Frequently Asked Questions
                            </h2>
                            <p className="text-gray-200 leading-relaxed text-lg max-w-3xl mx-auto">
                                Welcome to Prime Mentor's FAQ page! Below are answers to the most common questions. If you can't find what you're looking for, feel free to contact us!
                            </p>
                        </div>


                        {/* FAQ Accordion/List Section (Replacing Contact Form/Details) */}
                        <div className="space-y-6">
                            {faqContent.map((item, index) => (
                                <div 
                                    key={item.id} 
                                    // Custom styling for a question block, similar to the ContactPage's list items
                                    className="bg-white/95 p-6 rounded-xl shadow-2xl border-l-8 border-orange-500 hover:shadow-orange-300/50 transition duration-300 transform hover:scale-[1.01]"
                                >
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-start gap-3">
                                        <span className="text-orange-500 font-extrabold text-2xl flex-shrink-0">{item.id}.</span> 
                                        {item.question}
                                    </h3>
                                    <p className="text-gray-600 pl-8 pt-2 border-l border-gray-300 ml-4 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        {/* Removed Map Section for FAQ page as it's not relevant */}

                    </div>
                </main>


            </div>
        </div>
    );
};

export default FaqPage;