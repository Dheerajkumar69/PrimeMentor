// frontend/src/components/Enrollment/Enrollment.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, CreditCard } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Step1Account from './Step1Account.jsx';
import Step2Schedule from './Step2Schedule.jsx';
import Step3Payment from './Step3Payment.jsx'; 
// 🛑 NEW: Stripe Imports 🛑
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
// Assuming 'assets' holds your image paths
import { assets } from '../../assets/assets.js';

// 🛑 NEW: Load Stripe.js with the Publishable Key 🛑
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
// 🛑 END Stripe Setup 🛑

export default function Enrollment() {
    const location = useLocation();
    // Safely destructure quizData and purchaseType from location state
    // We now look for 'sessionPrice' which is passed from Booking.jsx
    const { quizData, purchaseType } = location.state || {};
    
    // States to manage the multi-step form
    const [step, setStep] = useState(1);
    
    // Data states
    const [studentDetails, setStudentDetails] = useState({ 
        first: quizData?.name?.firstName || '', 
        last: quizData?.name?.lastName || '', 
        email: quizData?.email || '' 
    });
    const [guardianDetails, setGuardianDetails] = useState({ 
        first: '', last: '', email: '', phone: '' 
    });
    
    // 🛑 NEW STATE: To hold the complete data packet for Step3Payment 🛑
    const [finalBookingPayload, setFinalBookingPayload] = useState(null);

    // Determine the product from quizData/purchaseType for display
    const [productDetails, setProductDetails] = useState({
        name: 'Trial Session (1 session)',
        price: quizData?.price || 70, // Total price
        sessionPrice: quizData?.sessionPrice || quizData?.price || 70, // Price per session
        sessions: 1 // Number of sessions
    });

    useEffect(() => {
        let productName = '';
        // Ensure we are using whole numbers for currency calculations
        let total = Math.round(quizData?.price || 70); 
        let sessionPrice = Math.round(quizData?.sessionPrice || total);
        let sessions = 1;

        if (purchaseType === 'STARTER_PACK') {
            sessions = 6; // NOTE: Changed from 7 to 6 based on Step2Schedule logic (6 sessions)
            total = Math.round(sessionPrice * sessions);
            productName = `Starter Pack (${sessions} sessions)`;
        } else if (purchaseType === 'TRIAL') {
            productName = 'Trial Session (1 session)';
        } else {
             productName = 'Trial Session (1 session)';
             total = 70;
             sessionPrice = 70;
        }
        
        // Ensure total price is accurate based on calculated values
        const finalPrice = Math.round(sessionPrice * sessions);

        setProductDetails({
            name: productName,
            price: finalPrice, // Use final calculated price
            sessionPrice: sessionPrice,
            sessions: sessions
        });

        // Initialize state based on quizData (Account details logic remains unchanged)
        if (quizData) {
            const { isParent, name, email, contactNumber } = quizData;
            // Default initialization (mostly done for clarity, Step1Account useEffect will refine it)
            if (isParent === false) { // Student
                setStudentDetails({ first: name?.firstName || '', last: name?.lastName || '', email: email || '' });
                setGuardianDetails(prev => ({ ...prev, phone: contactNumber || '' }));
            } else if (isParent === true) { // Parent
                setGuardianDetails({ first: name?.firstName || '', last: name?.lastName || '', email: email || '', phone: contactNumber || '' });
                setStudentDetails({ first: '', last: '', email: '' }); // Ensure student section is clear initially
            }
        }
    }, [purchaseType, quizData]);

    // 🛑 NEW: Handler to capture the final payload from Step2Schedule 🛑
    const handleScheduleNext = (payload) => {
        setFinalBookingPayload(payload);
        setStep(3);
    }

    const renderStepContent = () => {
        switch(step) {
            case 1:
                return (
                    <Step1Account 
                        studentDetails={studentDetails}
                        setStudentDetails={setStudentDetails}
                        guardianDetails={guardianDetails}
                        setGuardianDetails={setGuardianDetails}
                        onNext={() => setStep(2)}
                        quizData={quizData} 
                    />
                );
            case 2:
                // --- Pass productDetails to Step2Schedule to use for payload amount ---
                return <Step2Schedule 
                        quizData={quizData} 
                        purchaseType={purchaseType} 
                        onNext={handleScheduleNext} // 🛑 Pass the new handler 🛑
                        studentDetails={studentDetails}
                        guardianDetails={guardianDetails}
                        productDetails={productDetails} // 🛑 NEW: Pass product details 🛑
                    />;
                
            case 3:
                // 🛑 WRAP Step3Payment in Stripe Elements 🛑
                
                if (!finalBookingPayload) {
                    // Should not happen, but safe check
                    return <div className="text-red-500">Error: Booking details missing. Please go back to Step 2.</div>;
                }

                const options = {
                    // Passed to elements object and used by Payment Element
                    mode: 'payment',
                    amount: Math.round(finalBookingPayload.paymentAmount * 100), // Amount in cents
                    currency: 'aud',
                    locale: 'en',
                    // 🛑 CRITICAL FIX: Allows use of stripe.createPaymentMethod 🛑
                    paymentMethodCreation: 'manual', 
                };

                return (
                    <Elements stripe={stripePromise} options={options}>
                        <Step3Payment 
                            bookingPayload={finalBookingPayload} 
                            productDetails={productDetails} 
                        />
                    </Elements>
                );
            default:
                return null;
        }
    };

    // Helper to format the price string based on the purchase type
    const formatPriceDisplay = () => {
        if (productDetails.sessions > 1) {
            // FIX: Ensure no floating point issues by rounding the price.
            const total = productDetails.price; // Already calculated and rounded
            return `$${productDetails.sessionPrice} X ${productDetails.sessions} = $${total}`;
        }
        return `$${productDetails.price}`;
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <header className="bg-white border-b border-gray-200">
                {/* Responsive Header Container (unchanged) */}
                <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <span className="text-xl sm:text-2xl font-bold text-blue-600">PRIME</span>
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">MENTOR</span>
                        <span className="text-xl sm:text-2xl font-bold text-orange-500">ENROLMENT</span>
                    </div>
                    {/* Responsive Step Indicators (updated for step 3) */}
                    <div className="flex items-center space-x-4 sm:space-x-6 text-gray-400 font-medium text-sm md:text-base">
                        <div className={`flex items-center ${step === 1 ? 'text-orange-500' : ''}`}>
                            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 ${step === 1 ? 'bg-orange-500 text-white' : 'border-2 border-gray-300'}`}>1</span>
                            <span className="hidden xs:inline">Account</span>
                        </div>
                        <div className={`flex items-center ${step === 2 ? 'text-orange-500' : ''}`}>
                            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 ${step === 2 ? 'bg-orange-500 text-white' : 'border-2 border-gray-300'}`}>2</span>
                            <span className="hidden xs:inline">Schedule</span>
                        </div>
                        <div className={`flex items-center ${step === 3 ? 'text-orange-500' : ''}`}>
                            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 ${step === 3 ? 'bg-orange-500 text-white' : 'border-2 border-gray-300'}`}>3</span>
                            <span className="hidden xs:inline">Payment</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area - Responsive padding */}
            <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Content Layout: Stacked on mobile/tablet (flex-col), side-by-side on large screens (lg:flex-row) */}
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                        {/* 🛑 Renders Step3Payment inside Stripe Elements 🛑 */}
                        {renderStepContent()} 
                    </div>
                    {/* Order Summary Sidebar (unchanged) */}
                    <div className="w-full lg:w-96 order-first lg:order-last">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-4">
                            <h3 className="text-lg sm:text-xl font-bold text-orange-600 mb-4">
                                {quizData?.year ? `Year ${quizData.year}` : 'Your'} {quizData?.subject || 'Mathematics'} {productDetails.name}
                            </h3>
                            <div className="mt-6 border-t pt-4">
                                <h4 className="font-bold text-gray-800 mb-2 text-base">Pricing for your session</h4>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{productDetails.name}</span>
                                    {/* Display the calculation string or single price */}
                                    <span>{formatPriceDisplay()}</span> 
                                </div>
                                <div className="flex justify-between font-bold text-lg text-gray-800 border-t border-dashed pt-2">
                                    <span>Total</span>
                                    {/* Display the total final price */}
                                    <span>${productDetails.price}</span>
                                </div>
                            </div>
                            <div className="mt-8">
                                <h4 className="text-sm sm:text-base font-semibold mb-2">Accepted Payment Methods</h4>
                                <div className="flex items-center space-x-2">
                                    {/* These images need to be in your assets folder */}
                                    <img src={assets.visa} className='h-6 sm:h-8 w-auto' alt="Visa" />
                                    <img src={assets.mastercard} className='h-6 sm:h-8 w-auto' alt="Mastercard" />
                                </div>
                                <div className="flex items-center space-x-2 mt-4 text-gray-600">
                                    <Lock size={16} />
                                    <span className="text-xs">We use 128-bit SSL encryption to secure your details</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer (unchanged) */}
            <footer className="bg-white border-t border-gray-200 py-6 sm:py-8 mt-8 sm:mt-12">
                <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold mb-2">Need some help?</h3>
                        <p className="text-xs sm:text-sm text-gray-600">If you have any questions about your enrolment, please contact our learning advisors</p>
                        <div className="mt-4 text-xs sm:text-sm text-gray-600">
                            <p>Mon-Fri: 9am to 7pm</p>
                            <p>Sat-Sun: 10am to 2pm</p>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2 text-gray-700 mb-2">
                            <Phone size={18} />
                            <span className='text-sm'>+61433552127</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                            <Mail size={18} />
                            <span className='text-sm'>rajwinderkhakh@gmail.com</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-base">Prime Mentor PTY Ltd.</p>
                        <p className="text-xs sm:text-sm text-gray-600">Office 1, Floor 1, 105a High Street Cranbourne Vic 3977</p>
                        <p className="text-xs sm:text-sm text-gray-600">ABN 32 672 503 678</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}