// frontend/src/pages/SupportPage.jsx

import React, { useState } from 'react';
// Added Loader to show sending state
import { Mail, Phone, HelpCircle, User, Loader } from 'lucide-react'; 

// Import Header and Footer based on your folder structure
import Header from '../components/Home/Header.jsx';
import Footer from '../components/Home/Footer.jsx';
import { assets } from '../assets/assets';

// --- Support Content Data Structure (Part 1: Text and Contact) ---
const supportTopics = [
    {
        title: "Sign-Up & Account Help",
        description: "Need assistance with registration or managing your account? We've got you covered!",
    },
    {
        title: "Tutoring Support",
        description: "Have questions about subjects or lessons? We're happy to provide more details.",
        
    },
    {
        title: "Technical Issues",
        description: "Trouble accessing your session? Let us help you troubleshoot.",
    },
    {
        title: "Payments & Billing",
        description: "For payment or billing-related queries, feel free to reach out.",
    },
];

// --- Support Content Part 1 Component (Structured like an FAQ item) ---
const SupportTextBlock = ({ title, content }) => (
    <div className="bg-white/95 p-6 rounded-xl shadow-2xl border-l-8 border-orange-500 hover:shadow-orange-300/50 transition duration-300 transform hover:scale-[1.01]">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-start gap-3">
            <span className="text-orange-500 font-extrabold text-2xl flex-shrink-0">•</span> 
            {title}
        </h3>
        <div className="text-gray-600 pl-8 pt-2 border-l border-gray-300 ml-4 leading-relaxed">
            {content}
        </div>
    </div>
);

const SupportPage = () => {
    // State for user feedback messages
    const [formMessage, setFormMessage] = useState('');
    // State for loading/disabling the button
    const [loading, setLoading] = useState(false); 
    // State for error feedback
    const [error, setError] = useState(null);     

    // Endpoint: REUSE THE CONTACT API
    const CONTACT_API_URL = '/api/contact'; 

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        setFormMessage('');
        setError(null);
        
        // 1. Capture form data and include the source field
        const formData = {
            name: e.target.fullName.value, 
            email: e.target.email.value,
            // phone is not an input here, so we don't include it in formData.
            message: e.target.message.value, 
            source: 'Support Page', // 💡 KEY: Identifies the form source
        };

        try {
            const response = await fetch(CONTACT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send support request.');
            }

            // Success
            setFormMessage("Your support request has been submitted successfully! We will be in touch shortly.");
            e.target.reset();
            
        } catch (err) {
            console.error("Submission error:", err);
            setError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
            setTimeout(() => {
                setFormMessage('');
                setError(null);
            }, 8000); 
        }
    };

    // Use the same background style as FaqPage.jsx
    const backgroundStyle = {
        backgroundImage: `url('${assets.banner}')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center center',
    };
    
    // Placeholder image for the tutor on the right side of the form
    const tutorImageUrl = "https://images.pexels.com/photos/5905711/pexels-photo-5905711.jpeg?auto=compress&cs=tinysrgb&w=600"; 

    return (
        <div style={backgroundStyle} className="min-h-screen">
            <div className="bg-gray-900/80 min-h-screen flex flex-col">
                <Header />

                <main className="flex-grow">
                    
                    {/* Page Banner / Title Section (Like FaqPage) */}
                    <div className="relative pt-40 text-white flex items-center justify-center border-b border-gray-700/50">
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-widest uppercase animate-in fade-in duration-1000">
                            Support
                        </h1>
                    </div>

                    {/* Main Content Area */}
                    <div className="container mx-auto px-4 py-16 max-w-5xl">
                        
                        {/* 1. Support Center Introduction and Topics (Modular blocks like FAQ) */}
                        <div className="text-center mb-12 space-y-4 text-white">
                            <h2 className="text-4xl font-bold text-teal-400 flex items-center justify-center">
                                <HelpCircle className="w-8 h-8 mr-3" /> Support Center
                            </h2>
                            <p className="text-gray-200 leading-relaxed text-lg max-w-3xl mx-auto">
                                Welcome to Prime Mentor's Support Center! We're here to assist with any questions or issues you may have. Here's how we can help:
                            </p>
                        </div>
                        
                        <div className="space-y-6 mb-16">
                            <h3 className="text-2xl font-bold text-orange-400">Common Support Topics:</h3>
                            {supportTopics.map((item, index) => (
                                <SupportTextBlock 
                                    key={index} 
                                    title={item.title} 
                                    content={item.description} 
                                />
                            ))}
                            
                            {/* Contact Us Block (Also structured like a 'part') */}
                            <SupportTextBlock 
                                title="Contact Us"
                                content={
                                    <ul className="space-y-2 list-none pl-0">
                                        <li className="flex items-center">
                                            <Mail className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                                            <strong className="text-gray-900">Email:</strong> <a href="mailto:info.primementor@gmail.com" className="hover:text-orange-500 text-blue-600">info.primementor@gmail.com</a>
                                        </li>
                                        <li className="flex items-center">
                                            <Phone className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                                            <strong className="text-gray-900">Phone:</strong> <a href="tel:32672503678" className="hover:text-orange-500 text-blue-600">ABN 32 672 503 678</a>
                                        </li>
                                    </ul>
                                }
                            />
                        </div>


                        {/* 2. Submit a Request Section (Form and Image) - UPDATED FORM */}
                        <div className="pt-8 border-t border-gray-700/50">
                            <h2 className="text-4xl font-extrabold text-center text-white mb-12">Submit a Request</h2>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                
                                {/* Form Section (Styled for visibility against the background) */}
                                <div className="bg-white/95 p-8 rounded-xl shadow-2xl border-l-8 border-blue-500">
                                    
                                    {/* Success/Error Messages */}
                                    {formMessage && (
                                        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg font-medium text-center">
                                            {formMessage}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg font-medium text-center">
                                            {error}
                                        </div>
                                    )}
                                    
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        
                                        {/* Full Name Input */}
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="text" id="fullName" name="fullName" required
                                                placeholder="Full Name"
                                                className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                                            />
                                        </div>
                                        
                                        {/* Email Address Input */}
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" id="email" name="email" required
                                                placeholder="Email Address"
                                                className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                                            />
                                        </div>
                                        
                                        {/* 💡 ADDED: Message/Details Input for Support Request */}
                                        <div className="relative">
                                            <textarea 
                                                id="message" name="message" rows="5" required
                                                placeholder="Describe your issue or request in detail..."
                                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 resize-none bg-gray-50 text-gray-900"
                                            ></textarea>
                                        </div>


                                        {/* Submit Button */}
                                        <button 
                                            type="submit"
                                            disabled={loading} // Disable button while loading
                                            className={`w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition duration-300 shadow-xl shadow-blue-500/50 uppercase tracking-wider text-lg 
                                                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-blue-700'}`
                                            }
                                        >
                                            {loading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : 'Submit Request'}
                                        </button>
                                    </form>
                                </div>
                                
                                {/* Image Section */}
                                <div className="hidden lg:block">
                                    <img 
                                        src={tutorImageUrl} 
                                        alt="Tutor helping a student online"
                                        className="rounded-xl shadow-2xl object-cover w-full h-full max-h-[300px]"
                                    />
                                </div>

                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SupportPage;