import React, { useState, useContext } from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Send, User, MessageSquare, Star } from 'lucide-react';
import { AppContext } from '../context/AppContext.jsx';

// Import Header and Footer based on your folder structure
import Header from '../components/Home/Header.jsx'; 
import Footer from '../components/Home/Footer.jsx'; 
import { assets } from '../assets/assets';

const ContactPage = () => {
    // State for user feedback messages
    const [formMessage, setFormMessage] = useState('');
    // State for loading/disabling the button
    const [loading, setLoading] = useState(false);
    // State for error feedback
    const [error, setError] = useState(null);

    const { backendUrl } = useContext(AppContext);

    // Endpoint for your backend Express route
    const CONTACT_API_URL = `${backendUrl}/api/contact`; 

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        setFormMessage('');
        setError(null);
        
        // 1. Capture form data from input 'name' attributes
        const formData = {
            name: e.target.name.value,
            email: e.target.email.value,
            phone: e.target.phone.value,
            message: e.target.message.value,
        };

        try {
            // 2. Send data as JSON to your backend API
            const response = await fetch(CONTACT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            
            if (!response.ok) {
                // Handle API error response
                throw new Error(data.message || 'Failed to send message.');
            }

            // Success
            setFormMessage("Thank you for your message! We will get back to you shortly.");
            e.target.reset(); // Clear the form
            
        } catch (err) {
            console.error("Submission error:", err);
            setError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
            // Clear messages after a few seconds
            setTimeout(() => {
                setFormMessage('');
                setError(null);
            }, 8000); 
        }
    };

    // CSS for the full-page background effect
    const backgroundStyle = {
        backgroundImage: `url('${assets.banner}')`, 
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed', 
        backgroundPosition: 'center center',
    };
        
    // URL-encoded version of the address for Google Maps embedding
    const encodedAddress = encodeURIComponent('Office 1, Floor 1, 105a High Street Cranbourne Vic 3977');
    
    // Google Maps Embed URL
    const mapEmbedUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;


    return (
        // Outer wrapper for the background image
        <div style={backgroundStyle} className="min-h-screen">
            
            {/* Semi-transparent overlay to ensure text readability across the entire page */}
            <div className="bg-gray-900/80 min-h-screen flex flex-col">
                
                <Header />

                <main className="flex-grow">
                    
                    {/* Page Banner / Title Section */}
                    <div className="relative pt-40 text-white flex items-center justify-center border-b border-gray-700/50">
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-widest uppercase animate-in fade-in duration-1000">
                            Contact Us
                        </h1>
                    </div>

                    {/* Main Content Area */}
                    <div className="container mx-auto px-4 py-16 max-w-7xl">
                        
                        {/* 1. Introduction Text Section */}
                        <div className="text-center mb-20 space-y-10 text-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                                
                                {/* Mission Card 1 */}
                                <div className="bg-blue-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-t-8 border-blue-400 hover:shadow-blue-500/50 transition duration-500 transform hover:scale-[1.03]">
                                    <Star className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-blue-300 mb-4 flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 mr-2" /> Excellence in Support
                                    </h3>
                                    <p className="text-gray-200 leading-relaxed text-lg">
                                        At Prime Mentor, we believe in providing <b>excellent support</b> to our students and their families. Whether you're curious about our wide range of courses, need help choosing the best program for your child, or require assistance with a particular subject, <b>we are here to guide you every step of the way</b>.
                                    </p>
                                </div>
                                
                                {/* Mission Card 2 */}
                                <div className="bg-orange-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-t-8 border-orange-400 hover:shadow-orange-500/50 transition duration-500 transform hover:scale-[1.03]">
                                    <Send className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-orange-300 mb-4 flex items-center justify-center">
                                        <User className="w-6 h-6 mr-2" /> Accessible & Personalized
                                    </h3>
                                    <p className="text-gray-200 leading-relaxed text-lg">
                                        Our goal is to make learning <b>accessible, engaging, and effective</b> for students of all ages. We understand that each student's needs are <b>unique</b>, and we ensure your educational experience is <b>seamless, personalized</b>, and tailored to your child's academic goals.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Contact Form and Details Section (Horizontal Alignment) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                            
                            {/* Get In Touch - Form (Left Side) */}
                            <div className="lg:order-1 order-2 bg-white p-8 rounded-xl shadow-2xl">
                                <h2 className="text-3xl font-bold text-orange-600 mb-8 border-b pb-2">Get In Touch</h2>
                                
                                {/* Display Success Message */}
                                {formMessage && (
                                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg font-medium">
                                        {formMessage}
                                    </div>
                                )}
                                
                                {/* Display Error Message */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    
                                    {/* First Name */}
                                    <div className="relative">
                                        <input 
                                            type="text" id="name" name="name" required
                                            placeholder="First Name"
                                            className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-gray-50 text-gray-900"
                                        />
                                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>
                                    
                                    {/* Email Address */}
                                    <div className="relative">
                                        <input 
                                            type="email" id="email" name="email" required
                                            placeholder="Email Address"
                                            className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-gray-50 text-gray-900"
                                        />
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>

                                    {/* Phone Number */}
                                    <div className="relative">
                                        <input 
                                            type="tel" id="phone" name="phone" 
                                            placeholder="Phone Number"
                                            className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-gray-50 text-gray-900"
                                        />
                                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>

                                    {/* Message */}
                                    <div className="relative">
                                        <textarea 
                                            id="message" name="message" rows="5" maxLength="180" required
                                            placeholder="Your message..."
                                            className="w-full p-4 pt-4 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 resize-none bg-gray-50 text-gray-900"
                                        ></textarea>
                                        <span className="absolute bottom-3 right-4 text-xs text-gray-400">0/180</span>
                                    </div>

                                    {/* Submit Button */}
                                    <button 
                                        type="submit"
                                        disabled={loading} // Disable while loading
                                        className={`w-full text-white font-bold py-4 px-6 rounded-lg transition duration-300 shadow-xl shadow-orange-500/50 uppercase tracking-wider 
                                            ${loading 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-orange-600 hover:bg-orange-700'}`
                                        }
                                    >
                                        {loading ? 'Sending...' : 'Submit'}
                                    </button>
                                </form>
                            </div>

                            {/* Contact Details and Social Media (Right Side) */}
                            <div className="lg:order-2 order-1 space-y-6">
                                <h2 className="text-3xl font-bold text-teal-400 mb-6">Contact Details</h2>
                                
                                <div className="space-y-4">
                                    
                                    {/* Mobile */}
                                    <div className="bg-teal-600/90 text-white p-6 rounded-xl flex items-start shadow-xl border-b-4 border-teal-400 transition hover:bg-teal-700/90">
                                        <Phone className="w-6 h-6 mr-4 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-light uppercase opacity-80">Mobile</h3>
                                            <p className="text-xl font-bold">ABN 32 672 503 678</p>
                                        </div>
                                    </div>
                                    
                                    {/* Email */}
                                    <div className="bg-teal-600/90 text-white p-6 rounded-xl flex items-start shadow-xl border-b-4 border-teal-400 transition hover:bg-teal-700/90">
                                        <Mail className="w-6 h-6 mr-4 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-light uppercase opacity-80">Email</h3>
                                            <p className="text-lg font-bold break-words">info.primementor@gmail.com</p>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="bg-teal-600/90 text-white p-6 rounded-xl flex items-start shadow-xl border-b-4 border-teal-400 transition hover:bg-teal-700/90">
                                        <MapPin className="w-6 h-6 mr-4 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-light uppercase opacity-80">Address</h3>
                                            <p className="text-lg font-bold">Office 1, Floor 1, 105a High Street Cranbourne Vic 3977</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div className="pt-6">
                                    <h3 className="text-xl font-bold text-gray-200 mb-4">Social Media:</h3>
                                    <div className="flex space-x-4">
                                        <a href="https://www.facebook.com/profile.php?id=61581803430914" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-teal-600 text-white rounded-lg flex items-center justify-center hover:bg-orange-500 transition duration-300 shadow-lg" aria-label="Facebook">
                                            <Facebook className="w-6 h-6" />
                                        </a>
                                        <a href="#" className="w-12 h-12 bg-teal-600 text-white rounded-lg flex items-center justify-center hover:bg-orange-500 transition duration-300 shadow-lg" aria-label="Twitter">
                                            <Twitter className="w-6 h-6" />
                                        </a>
                                        <a href="https://www.instagram.com/primementorofficial/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-teal-600 text-white rounded-lg flex items-center justify-center hover:bg-orange-500 transition duration-300 shadow-lg" aria-label="Instagram">
                                            <Instagram className="w-6 h-6" />
                                        </a>
                                        <a href="https://www.youtube.com/@primementorofficial" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-teal-600 text-white rounded-lg flex items-center justify-center hover:bg-orange-500 transition duration-300 shadow-lg" aria-label="Youtube">
                                            <Youtube className="w-6 h-6" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 3. Map Section */}
                        <div className="w-full rounded-xl overflow-hidden shadow-2xl border-4 border-gray-700/50 mt-12">
                            <iframe
                                title="Prime Mentor Location"
                                src={mapEmbedUrl}
                                width="100%"
                                height="400"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>

                    </div>
                </main>
                
            </div>
        </div>
    );
};

export default ContactPage;