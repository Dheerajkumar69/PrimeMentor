// frontend/src/components/Enrollment/Enrollment.jsx
import React, { useState, useEffect } from 'react';
// FIX: Ensure AlertTriangle is imported for error display
import { Mail, Phone, Lock, CreditCard, AlertTriangle } from 'lucide-react'; 
import { useLocation, useSearchParams } from 'react-router-dom';
import Step1Account from './Step1Account.jsx';
import Step2Schedule from './Step2Schedule.jsx';
import Step3Payment from './Step3Payment.jsx'; 
import { assets } from '../../assets/assets.js';

// 🛑 PERSISTENCE KEY 🛑
const ENROLLMENT_DATA_KEY = 'enrollment_in_progress';
// 🛑 END PERSISTENCE KEY 🛑

export default function Enrollment() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    // Safely destructure state. This is only reliable on initial flow, not on redirect.
    const initialLocationState = location.state || {};
    
    // Internal state variables for persistence
    const [currentQuizData, setCurrentQuizData] = useState(initialLocationState.quizData || null);
    const [currentPurchaseType, setCurrentPurchaseType] = useState(initialLocationState.purchaseType || 'TRIAL');

    // States to manage the multi-step form
    const [step, setStep] = useState(1);
    
    // Data states (initialized from location.state or persistence)
    const [studentDetails, setStudentDetails] = useState({});
    const [guardianDetails, setGuardianDetails] = useState({});
    
    const [finalBookingPayload, setFinalBookingPayload] = useState(null);

    // Determine the product from quizData/purchaseType for display
    const [productDetails, setProductDetails] = useState({
        name: 'Trial Session (1 session)',
        price: initialLocationState.quizData?.price || 70, 
        sessionPrice: initialLocationState.quizData?.sessionPrice || initialLocationState.quizData?.price || 70, 
        sessions: 1 
    });

    // 🛑 CORE FIX: Handle Step and State Restoration from localStorage 🛑
    useEffect(() => {
        const currentStep = parseInt(searchParams.get('step')) || 1;
        setStep(currentStep);

        const storedData = localStorage.getItem(ENROLLMENT_DATA_KEY);
        let restoredPayload = null;

        if (storedData) {
            try {
                restoredPayload = JSON.parse(storedData);
            } catch (e) {
                console.error("Error parsing enrollment data from local storage:", e);
                localStorage.removeItem(ENROLLMENT_DATA_KEY);
            }
        }
        
        // 🛑 CRITICAL FIX: Restore Purchase Type and Quiz Data first 🛑
        // Fallback chain: Stored data > Initial URL state > Current state
        const quizDataToUse = restoredPayload?.quizData || initialLocationState.quizData || currentQuizData;
        const purchaseTypeToUse = restoredPayload?.purchaseType || initialLocationState.purchaseType || currentPurchaseType;
        
        setCurrentQuizData(quizDataToUse);
        setCurrentPurchaseType(purchaseTypeToUse);
        
        // 1. Initialize Product Details
        const initialPrice = Math.round(quizDataToUse?.price || 70); 
        const initialSessionPrice = Math.round(quizDataToUse?.sessionPrice || initialPrice);
        let sessions = purchaseTypeToUse === 'STARTER_PACK' ? 6 : 1;
        
        // **CRUCIAL PRICE CALCULATION**
        // Calculate the total price based on the restored/initial state values
        const calculatedPrice = Math.round(initialSessionPrice * sessions);
        const productName = sessions > 1 ? `Starter Pack (${sessions} sessions)` : 'Trial Session (1 session)';
        
        setProductDetails(prev => ({
            name: productName,
            price: calculatedPrice, // Use the fresh calculated value
            sessionPrice: initialSessionPrice,
            sessions: sessions
        }));
        // **END CRUCIAL PRICE CALCULATION**


        // 2. Restore or Initialize Account Data (Step 1)
        if (restoredPayload && (currentStep >= 2 || currentStep === 3)) {
            // Restore details if returning to Step 2 or 3
            setStudentDetails(restoredPayload.studentDetails);
            setGuardianDetails(restoredPayload.guardianDetails);
            
            // Restore final payload if returning to Step 3
            if (currentStep === 3) {
                // Sync the payment amount in the restored payload to the freshly calculated price
                restoredPayload.paymentAmount = calculatedPrice; 
                setFinalBookingPayload(restoredPayload);
            }
        } else if (quizDataToUse) {
             // Initial load based on restored/location quizData
             const { isParent, name, email, contactNumber } = quizDataToUse;

             if (isParent === false) { // Student
                setStudentDetails({ first: name?.firstName || '', last: name?.lastName || '', email: email || '' });
                setGuardianDetails(prev => ({ ...prev, phone: contactNumber || '' }));
             } else if (isParent === true) { // Parent
                setGuardianDetails({ first: name?.firstName || '', last: name?.lastName || '', email: email || '', phone: contactNumber || '' });
                setStudentDetails({ first: '', last: '', email: '' });
             }
        }
    }, [initialLocationState, searchParams]);
    // 🛑 END CORE FIX 🛑


    // 🛑 HANDLER: Saves data to local storage and transitions to Step 2 🛑
    const handleAccountNext = (currentStudentDetails, currentGuardianDetails) => {
        // Prepare partial payload for persistence
        const partialPayload = {
            studentDetails: currentStudentDetails,
            guardianDetails: currentGuardianDetails,
            // 🛑 CRITICAL: PERSIST purchaseType and quizData 🛑
            purchaseType: currentPurchaseType,
            quizData: currentQuizData
        };
        // Save partial payload
        localStorage.setItem(ENROLLMENT_DATA_KEY, JSON.stringify(partialPayload));
        
        // Update local state
        setStudentDetails(currentStudentDetails);
        setGuardianDetails(currentGuardianDetails);
        
        // Navigate to Step 2
        setStep(2);
    }
    
    // 🛑 HANDLER: Saves FINAL payload to local storage and transitions to Step 3 🛑
    const handleScheduleNext = (payload) => {
        // Save FINAL payload (including scheduling info)
        localStorage.setItem(ENROLLMENT_DATA_KEY, JSON.stringify(payload));
        
        // Update local state
        setFinalBookingPayload(payload);
        
        // Navigate to Step 3
        setStep(3);
    }
    
    // Handler to go back to Step 1 (used by Step 2)
    const handleBackToStep1 = () => {
         setStep(1); 
    }


    const renderStepContent = () => {
        const quizDataToPass = currentQuizData;
        const purchaseTypeToPass = currentPurchaseType;

        switch(step) {
            case 1:
                return (
                    <Step1Account 
                        studentDetails={studentDetails}
                        setStudentDetails={setStudentDetails}
                        guardianDetails={guardianDetails}
                        setGuardianDetails={setGuardianDetails}
                        onNext={handleAccountNext}
                        quizData={quizDataToPass} 
                        enrollmentDataKey={ENROLLMENT_DATA_KEY}
                    />
                );
            case 2:
                return <Step2Schedule 
                        quizData={quizDataToPass} 
                        purchaseType={purchaseTypeToPass} 
                        onNext={handleScheduleNext}
                        onBack={handleBackToStep1}
                        studentDetails={studentDetails}
                        guardianDetails={guardianDetails}
                        productDetails={productDetails}
                        enrollmentDataKey={ENROLLMENT_DATA_KEY}
                    />;
                
            case 3:
                if (!finalBookingPayload) {
                    return (
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200">
                            <AlertTriangle size={24} className="text-red-500 mx-auto mb-4" />
                            <p className="text-red-500 text-center">Error: Booking details missing. Please go back to the scheduling step.</p>
                            <button 
                                onClick={() => setStep(2)}
                                className="mt-4 w-full bg-blue-600 text-white font-bold py-2 rounded-lg"
                            >
                                Go Back to Step 2 (Schedule)
                            </button>
                        </div>
                    );
                }

                return (
                    <Step3Payment 
                        bookingPayload={finalBookingPayload} 
                        productDetails={productDetails} 
                    />
                );
            default:
                return null;
        }
    };

    // Helper to format the price string based on the purchase type
    const formatPriceDisplay = () => {
        if (productDetails.sessions > 1) {
            const total = productDetails.price;
            return `$${productDetails.sessionPrice} X ${productDetails.sessions} = $${total}`;
        }
        return `$${productDetails.price}`;
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <header className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <span className="text-xl sm:text-2xl font-bold text-blue-600">PRIME</span>
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">MENTOR</span>
                        <span className="text-xl sm:text-2xl font-bold text-orange-500">ENROLMENT</span>
                    </div>
                    {/* Responsive Step Indicators (updated for step 3) */}
                    <div className="flex items-center space-x-4 sm:space-x-6 text-gray-400 font-medium text-sm md:text-base">
                        <div onClick={() => setStep(1)} className={`flex items-center cursor-pointer ${step === 1 ? 'text-orange-500' : ''}`}>
                            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 ${step === 1 ? 'bg-orange-500 text-white' : 'border-2 border-gray-300'}`}>1</span>
                            <span className="hidden xs:inline">Account</span>
                        </div>
                        <div onClick={() => setStep(2)} className={`flex items-center cursor-pointer ${step === 2 ? 'text-orange-500' : ''}`}>
                            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 ${step === 2 ? 'bg-orange-500 text-white' : 'border-2 border-gray-300'}`}>2</span>
                            <span className="hidden xs:inline">Schedule</span>
                        </div>
                        <div className="flex items-center">
                            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 ${step === 3 ? 'text-orange-500 bg-orange-500 text-white' : 'border-2 border-gray-300'}`}>3</span>
                            <span className="hidden xs:inline">Payment</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area - Responsive padding */}
            <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                        {renderStepContent()} 
                    </div>
                    {/* Order Summary Sidebar */}
                    <div className="w-full lg:w-96 order-first lg:order-last">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-4">
                            <h3 className="text-lg sm:text-xl font-bold text-orange-600 mb-4">
                                {currentQuizData?.year ? `Year ${currentQuizData.year}` : 'Your'} {currentQuizData?.subject || 'Mathematics'} {productDetails.name}
                            </h3>
                            <div className="mt-6 border-t pt-4">
                                <h4 className="font-bold text-gray-800 mb-2 text-base">Pricing for your session</h4>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{productDetails.name}</span>
                                    <span>{formatPriceDisplay()}</span> 
                                </div>
                                <div className="flex justify-between font-bold text-lg text-gray-800 border-t border-dashed pt-2">
                                    <span>Total</span>
                                    <span>${productDetails.price}</span>
                                </div>
                            </div>
                            <div className="mt-8">
                                <h4 className="text-sm sm:text-base font-semibold mb-2">Accepted Payment Methods</h4>
                                <div className="flex items-center space-x-2">
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