import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import { Mail, CheckCircle } from 'lucide-react';

const NewsletterSection = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email && /\S+@\S+\.\S+/.test(email.trim())) {
            setSubscribed(true);
            setEmail('');
        }
    };

    return (
        <div className="flex items-center justify-center py-12 sm:py-16 bg-gray-50 p-4 sm:p-8 font-sans">
            <div className="relative w-full max-w-5xl mx-auto my-4">

                {/* Floating Abstract Shape */}
                <div className="hidden sm:block absolute top-0 left-0 w-[400px] h-[300px] bg-red-400 opacity-10 filter blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                {/* Main Hero Card Container */}
                <div
                    className="relative bg-[#1A0C30] rounded-3xl sm:rounded-[60px] shadow-2xl p-6 sm:p-8 lg:p-12 text-white min-h-[300px] sm:min-h-[360px] flex items-center overflow-hidden"
                    style={{
                        boxShadow: '0 0 40px rgba(70, 0, 150, 0.5), 0 0 20px rgba(70, 0, 150, 0.5), inset 0 0 8px rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(70, 0, 150, 0.3)'
                    }}
                >
                    {/* Internal Background Shapes */}
                    <div className="hidden sm:block absolute bottom-0 right-0 w-full h-full pointer-events-none">
                        <div className="absolute bottom-0 right-0 w-[550px] h-[450px] bg-gradient-to-br from-blue-500 to-green-500 opacity-30 rounded-full transform translate-x-1/4 translate-y-1/4"></div>
                    </div>

                    {/* Content Wrapper */}
                    <div className="relative z-10 flex flex-col md:flex-row items-center w-full">

                        {/* Image Section (Left) */}
                        <div className="w-full md:w-1/3 flex justify-center md:justify-start absolute md:relative top-0 md:top-0">
                            <div
                                className="w-[200px] h-[300px] lg:w-[300px] lg:h-[450px] overflow-hidden hidden md:block"
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '0%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 20
                                }}
                            >
                                <img
                                    src={assets.newsletter}
                                    alt="Professional woman"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="md:hidden mb-6 flex justify-center w-full">
                                <img
                                    src={assets.newsletter}
                                    alt="Professional woman"
                                    className="w-32 h-auto object-cover rounded-xl shadow-lg"
                                />
                            </div>
                        </div>

                        {/* Text + CTA Section (Right) */}
                        <div className="w-full md:w-2/3 md:pl-8 text-center md:text-left pt-20 md:pt-0 mt-20">
                            <h2
                                className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold mb-3 sm:mb-4 leading-tight"
                                style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}
                            >
                                Transforming the Future of Teaching
                            </h2>
                            <p className="text-white/80 text-base sm:text-xl mb-6">
                                Discover our innovative solutions and see how we help students to achieve success and growth.
                            </p>

                            {/* Newsletter CTA */}
                            {subscribed ? (
                                <div className="flex items-center justify-center md:justify-start gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-6 py-3 max-w-md mx-auto md:mx-0">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-green-300 font-semibold text-sm">Thank you for subscribing! We'll keep you updated.</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto md:mx-0">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-orange-400 transition text-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold hover:shadow-lg transition transform hover:scale-[1.02] active:scale-100 text-sm whitespace-nowrap"
                                    >
                                        Subscribe
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsletterSection;