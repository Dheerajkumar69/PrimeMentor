import React from 'react';
import { X, ArrowRight } from 'lucide-react'; 
import { assets } from '../../assets/assets';

/**
 * A permanent, fixed-position popup styled like a modal with a blurred background,
 * featuring the price starting point, now implementing a two-column (Content + Image) layout.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Controls the visibility.
 * @param {function} props.onClose - Function to manually close the popup.
 * @param {function} props.onBookFreeAssessment - Function to trigger the main booking modal.
 */
export default function AssessmentCallout({ isOpen, onClose, onBookFreeAssessment }) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-black/30 transition-opacity duration-300 "
            role="dialog"
            aria-modal="true"
        >
            {/* Custom fade-in animation for the inner modal */}
            <style>
                {`
                    @keyframes fadeIn {
                        0% { opacity: 0; transform: scale(0.95); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    .animate-fadeIn {
                        animation: fadeIn 0.3s ease-out forwards;
                    }
                `}
            </style>
            
            {/* Main Popup Container - Now using flex for two columns on medium screens and up */}
            <div 
                // Increased max-w to 4xl to accommodate the image side
                className="relative bg-white rounded-lg shadow-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row transform transition-all duration-300 scale-100 opacity-100 animate-fadeIn"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition p-1 rounded-full z-10"
                    aria-label="Close popup"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Left Column: Content */}
                <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center text-center md:text-left">
                    
                    {/* Main Title/Offer */}
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                        Start Strong with <br /><span className="text-orange-600">PrimeMentor!</span>
                    </h2>
                    
                    {/* Description */}
                    <p className="mt-4 text-base sm:text-lg text-gray-700">
                        Book your <b>Free Assessment</b> now to get a personalized learning roadmap for your child's success.
                    </p>

                    {/* ✅ MODIFIED: Changed text-xl to text-sm and added md:text-xl for desktop view.
                       Note: I kept the overall paragraph padding/margin/etc. but adjusted the actual text sizes. */}
                    <p className="mt-4 text-sm md:text-xl font-semibold text-gray-900 bg-yellow-100 px-6 py-3 rounded-full border border-yellow-300 shadow-md transition duration-300 hover:scale-[1.03] hover:shadow-lg cursor-default inline-flex items-center mx-auto md:mx-0">
                        Classes starts from &nbsp;<span className="text-xxl text-orange-600 font-extrabold"> $22</span> <span className='text-sm md:text-xl text-gray-500 ml-1'>/ session</span>
                    </p>

                    {/* Button */}
                    <button
                        onClick={onBookFreeAssessment}
                        className="mt-6 sm:mt-8 w-full md:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-amber-600 hover:bg-amber-700 transition duration-150 transform hover:scale-[1.02] flex items-center justify-center mx-auto md:mx-0"
                    >
                        Book Free Assessment
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                </div>
                
                {/* Right Column: Image */}
                <div className="flex-1 md:block hidden min-h-[200px] md:min-h-auto"> 
                    <img
                        src={assets.studentTutor} 
                        alt="A student and tutor reviewing notes"
                        className="w-full h-full object-cover rounded-r-lg" 
                    />
                </div>
            </div>
        </div>
    );
}