// frontend/src/components/Home/PricingSection.jsx

import React, { useState, useContext, useEffect } from 'react';
import PricingFlow from '../Pricing/PricingFlow.jsx';
import { AppContext } from '../../context/AppContext.jsx';
import { SignInButton } from '@clerk/clerk-react';
import { Sparkles, TrendingUp, Loader } from 'lucide-react';
import axios from 'axios';

export default function PricingSection() {
    const { isSignedIn, backendUrl } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialClassFlowData, setInitialClassFlowData] = useState(null);
    const [buttons, setButtons] = useState([]);
    const [loadingPrices, setLoadingPrices] = useState(true);

    // Fetch pricing from backend on mount
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const apiBase = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const response = await axios.get(`${apiBase}/api/admin/pricing`);
                const { classRanges } = response.data;
                setButtons([
                    { label: 'Class 2-6', range: '2-6', price: classRanges['2-6'].sessionPrice },
                    { label: 'Class 7-9', range: '7-9', price: classRanges['7-9'].sessionPrice },
                    { label: 'Class 10-12', range: '10-12', price: classRanges['10-12'].sessionPrice },
                ]);
            } catch (err) {
                console.error('Failed to fetch pricing, using defaults:', err);
                // Fallback to hardcoded defaults if API fails
                setButtons([
                    { label: 'Class 2-6', range: '2-6', price: 22 },
                    { label: 'Class 7-9', range: '7-9', price: 25 },
                    { label: 'Class 10-12', range: '10-12', price: 27 },
                ]);
            } finally {
                setLoadingPrices(false);
            }
        };
        fetchPricing();
    }, [backendUrl]);

    const handleButtonClick = (classRange, price) => {
        if (isSignedIn) {
            setInitialClassFlowData({ initialClassRange: classRange, basePrice: price });
            setIsModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setInitialClassFlowData(null);
    };

    const customAnimations = `
        /* Enhanced Pulse Glow for the main container */
        @keyframes pulse-glow { 
            0% { box-shadow: 0 0 10px rgba(249, 115, 22, 0.7), 0 0 20px rgba(249, 115, 22, 0.5); } 
            50% { box-shadow: 0 0 25px rgba(255, 100, 0, 1), 0 0 40px rgba(249, 115, 22, 0.8); } 
            100% { box-shadow: 0 0 10px rgba(249, 115, 22, 0.7), 0 0 20px rgba(249, 115, 22, 0.5); } 
        }

        /* Subtle background particle movement */
        @keyframes float-light {
             0%, 100% { transform: translateY(0) scale(1); }
             50% { transform: translateY(-15px) scale(1.1); }
        }
    `;

    // Find the lowest price for the circle display
    const lowestPrice = buttons.length > 0 ? Math.min(...buttons.map(b => b.price)) : '...';

    return (
        <div id="pricing" className="relative py-16 sm:py-20 overflow-hidden bg-gray-900 min-h-[550px]">
            <style>{customAnimations}</style>

            {/* Background elements */}
            <div className="hidden sm:block absolute inset-0 z-0">
                <span className="absolute top-[20%] left-[20%] w-3 h-3 bg-white rounded-full animate-[float-light_8s_infinite] opacity-30 blur-sm"></span>
                <span className="absolute bottom-[25%] right-[20%] w-4 h-4 bg-orange-400 rounded-full animate-[float-light_10s_infinite_reverse] opacity-30 blur-sm"></span>
                <span className="absolute top-[50%] left-[60%] w-2 h-2 bg-cyan-400 rounded-full animate-[float-light_6s_infinite] opacity-30 blur-sm"></span>
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                {/* Outer Card with Enhanced Glow */}
                <div className="relative p-6 sm:p-8 md:p-12 lg:p-16 rounded-xl sm:rounded-3xl backdrop-filter backdrop-blur-md bg-white/5 border border-gray-700 shadow-2xl animate-[pulse-glow_4s_infinite_ease-in-out]">

                    {/* STATIC PRICE CIRCLE - POSITIONED TOP-RIGHT */}
                    <div
                        className={`absolute top-4 right-4 sm:top-8 sm:right-8 
                                     w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 
                                     bg-gradient-to-br from-orange-500 to-red-600 
                                     rounded-full flex flex-col items-center justify-center 
                                     text-white font-extrabold text-center text-md md:text-xl 
                                     shadow-3xl border-4 border-white/70 
                                     z-40 transition-all duration-300 ease-in-out hover:scale-105`}
                    >
                        <span className='text-xs sm:text-lg mb-1 mt-2 font-semibold'>Starts from</span>
                        <div className="flex flex-col items-center leading-none">
                            <span className='text-2xl sm:text-4xl md:text-5xl font-black'>${lowestPrice}</span>
                            <span className="text-sm sm:text-md md:text-lg font-bold">onwards</span>
                        </div>
                        <TrendingUp className="w-3 h-3 sm:w-4 mt-0.5 text-green-300" />
                    </div>

                    <div className="relative z-20 pt-16 sm:pt-12">
                        {/* Title and Subtitle */}
                        <h2 className="text-white text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 mt-12">
                            Unlock Your Personalized Pricing
                        </h2>
                        <p className="text-gray-300 text-base sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto">
                            Complete a quick questionnaire (in less than 1 minute) to determine your ideal learning package.
                        </p>

                        {/* Responsive Button Layout */}
                        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                            {loadingPrices ? (
                                <Loader className="w-8 h-8 text-orange-400 animate-spin mx-auto" />
                            ) : isSignedIn ? (
                                <>
                                    {buttons.map((button) => (
                                        <button
                                            key={button.range}
                                            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-10 rounded-full shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:ring-4 ring-orange-400 text-lg tracking-wider"
                                            onClick={() => handleButtonClick(button.range, button.price)}
                                        >
                                            View Pricing for {button.label}
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <SignInButton mode="modal">
                                    <button
                                        className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold py-4 px-12 rounded-full shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:ring-4 ring-orange-400 text-lg tracking-wider"
                                    >
                                        Login to Start Pricing Flow
                                    </button>
                                </SignInButton>
                            )}
                        </div>
                    </div>
                </div>

                {isModalOpen && <PricingFlow isOpen={isModalOpen} onClose={closeModal} initialClassFlowData={initialClassFlowData} />}
            </div>
        </div>
    );
}