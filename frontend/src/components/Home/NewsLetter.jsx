import React from 'react';
import { assets } from '../../assets/assets';

// IMPORTANT: Updated path to "src/assets/women.jpg" to match the large image style.
// If you want to use the transparent logo, change this back to "src/assets/newsletter_logo.png"

const NewsletterSection = () => {
    return (
        // Outer container: Reduced vertical padding for a tighter fit.
        <div className="flex items-center justify-center py-12 sm:py-16 bg-gray-50 p-4 sm:p-8 font-sans">
            <div className="relative w-full max-w-5xl mx-auto my-4">
                
                {/* Floating Abstract Shape (Top-Left Corner outside the main card) - Hidden on mobile */}
                <div className="hidden sm:block absolute top-0 left-0 w-[400px] h-[300px] bg-red-400 opacity-10 filter blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                
                {/* Main Hero Card Container (Dark Background) */}
                <div 
                    // Responsive Padding and height
                    className="relative bg-[#1A0C30] rounded-3xl sm:rounded-[60px] shadow-2xl p-6 sm:p-8 lg:p-12 text-white min-h-[300px] sm:min-h-[360px] flex items-center overflow-hidden" 
                    style={{ 
                        boxShadow: '0 0 40px rgba(70, 0, 150, 0.5), 0 0 20px rgba(70, 0, 150, 0.5), inset 0 0 8px rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(70, 0, 150, 0.3)'
                    }}
                >
                    
                    {/* Internal Wavy Layers (Abstract background shapes for decoration) - Hidden on mobile */}
                    <div className="hidden sm:block absolute bottom-0 right-0 w-full h-full pointer-events-none">
                        {/* Abstract shape to mimic the fluid background from the reference image */}
                        <div className="absolute bottom-0 right-0 w-[550px] h-[450px] bg-gradient-to-br from-blue-500 to-green-500 opacity-30 rounded-full transform translate-x-1/4 translate-y-1/4"></div>
                    </div>

                    {/* Content Wrapper - Using z-10 to layer it above the abstract shapes */}
                    {/* Layout: Stacked on mobile/tablet (flex-col), side-by-side on desktop (md:flex-row) */}
                    <div className="relative z-10 flex flex-col md:flex-row items-center w-full">
                        
                        {/* Image Section (Left) - REVERTED TO VERTICAL CENTERING AND SLIGHTLY LARGER SIZE */}
                        <div className="w-full md:w-1/3 flex justify-center md:justify-start absolute md:relative top-0 md:top-0">
                            
                            {/* Desktop/Tablet Image Container - Hidden on mobile, visible on medium+ screens */}
                            <div 
                                // Increased width and height to match the prominent size in the reference image
                                className="w-[200px] h-[300px] lg:w-[300px] lg:h-[450px] overflow-hidden hidden md:block" 
                                style={{ 
                                    position: 'absolute', 
                                    top: '50%', // Centered vertically
                                    left: '0%', // Stick to the left edge
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

                            {/* Mobile Fallback: Display normally if screen is small, centered */}
                            <div className="md:hidden mb-6 flex justify-center w-full">
                                <img 
                                    src={assets.newsletter} 
                                    alt="Professional woman"
                                    className="w-32 h-auto object-cover rounded-xl shadow-lg"
                                />
                            </div>
                        </div>

                        {/* Text Section (Right) - Full width on mobile/tablet, 2/3 width on desktop */}
                        {/* **FIX: Reduced pt-32 to pt-20 for mobile to prevent text being cut off** */}
                        <div className="w-full md:w-2/3 md:pl-8 text-center md:text-left pt-20 md:pt-0 mt-20">
                            {/* Responsive Title Size */}
                            <h2 
                                className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold mb-3 sm:mb-4 leading-tight"
                                style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}
                            > 
                                Transforming the Future of Teaching
                            </h2>
                            {/* Responsive Subtitle Size */}
                            <p className="text-white/80 text-base sm:text-xl">
                                Discover our innovative solutions and see how we help students to achieve success and growth.
                            </p>

                            {/* Call-to-Action is intentionally removed */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsletterSection;