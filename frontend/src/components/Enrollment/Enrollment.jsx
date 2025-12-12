// frontend/src/components/Enrollment/Enrollment.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
    
    const initialLocationState = location.state || {};
    
    // Internal state variables for persistence
    const [currentQuizData, setCurrentQuizData] = useState(initialLocationState.quizData || null);
    const [currentPurchaseType, setCurrentPurchaseType] = useState(initialLocationState.purchaseType || 'TRIAL');

    // States to manage the multi-step form
    const [step, setStep] = useState(1);
    
    // Data states
    const [studentDetails, setStudentDetails] = useState({});
    const [guardianDetails, setGuardianDetails] = useState({});
    
    const [finalBookingPayload, setFinalBookingPayload] = useState(null);

    // Determine the product from quizData/purchaseType for display
    const [productDetails, setProductDetails] = useState({
        name: 'Trial Session (1 session)',
        price: initialLocationState.quizData?.price || 70, 
        sessionPrice: initialLocationState.quizData?.sessionPrice || initialLocationState.quizData?.price || 70, 
        sessions: 1,
        // 💡 NEW: Initialize fixed discount
        fixedDiscount: initialLocationState.quizData?.fixedDiscount || 0
    });

    // 🚨 NEW PROMO CODE STATES 🚨
    const [promoCodeData, setPromoCodeData] = useState({
        code: null, // The applied code string
        discountPercentage: 0, 
        discountAmount: 0, // Calculated discount amount in AUD (for % off)
        originalPrice: 0 // Price before discount
    });
    
    // 💡 MEMOIZED: Total non-fixed discounts 💡
    const totalPercentageDiscount = useMemo(() => {
        return promoCodeData.discountAmount;
    }, [promoCodeData.discountAmount]);

    // 🟢 MEMOIZED: Calculate Final Price (Discounted Price)
    const finalPaymentAmount = useMemo(() => {
        const originalPrice = productDetails.price;
        // Sum of fixed discount (from Booking.jsx) and percentage discount (from promo code)
        const totalDiscount = productDetails.fixedDiscount + totalPercentageDiscount;
        
        // Ensure discount doesn't exceed the original price
        const finalPrice = Math.max(0, originalPrice - totalDiscount);
        
        // Round to 2 decimal places for payment
        return parseFloat(finalPrice.toFixed(2));
    }, [productDetails.price, productDetails.fixedDiscount, totalPercentageDiscount]);
    
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
        
        const quizDataToUse = restoredPayload?.quizData || initialLocationState.quizData || currentQuizData;
        const purchaseTypeToUse = restoredPayload?.purchaseType || initialLocationState.purchaseType || currentPurchaseType;
        
        setCurrentQuizData(quizDataToUse);
        setCurrentPurchaseType(purchaseTypeToUse);
        
        // 1. Initialize Product Details
        // 🚨 FIX: Use parseFloat() for precision, NOT Math.round() 🚨
        const initialPrice = parseFloat(quizDataToUse?.price || 70); 
        const initialSessionPrice = parseFloat(quizDataToUse?.sessionPrice || initialPrice);
        const fixedDiscount = parseFloat(quizDataToUse?.fixedDiscount || 0); // 💡 NEW
        let sessions = purchaseTypeToUse === 'STARTER_PACK' ? 6 : 1;
        
        // The original price before *any* discount (fixed $5 + percentage promo) is applied
        // We reverse the calculation done in Booking.jsx to get the non-discounted total
        const totalBasePriceBeforeFixedDiscount = sessions > 1 
            ? initialPrice + fixedDiscount // Starter pack price + fixed $5 discount removed earlier
            : initialPrice; // Trial price, fixed discount is 0 anyway
        
        const productName = sessions > 1 ? `Starter Pack (${sessions} sessions)` : 'Trial Session (1 session)';
        
        setProductDetails(prev => ({
            name: productName,
            // The price displayed here is the total price *before* promo code, but *after* the fixed $5.
            // But for clear display, let's use the total base price *before* the fixed $5.
            price: parseFloat(totalBasePriceBeforeFixedDiscount.toFixed(2)), 
            sessionPrice: parseFloat(initialSessionPrice.toFixed(2)),
            sessions: sessions,
            fixedDiscount: fixedDiscount // 💡 NEW: Store the fixed $5 discount
        }));
        // **END CRUCIAL ORIGINAL PRICE CALCULATION**

        // 🚨 RESTORE PROMO CODE DATA 🚨
        if (restoredPayload?.promoCodeData) {
            // Restore the promo code data and recalculate the percentage discount amount 
            const restoredCode = restoredPayload.promoCodeData.code;
            const restoredPercent = restoredPayload.promoCodeData.discountPercentage;
            
            let calculatedDiscount = 0;
            if (restoredCode && restoredPercent > 0) {
                // Apply percentage discount to the price *before* any discounts
                 calculatedDiscount = totalBasePriceBeforeFixedDiscount * (restoredPercent / 100);
            }
            
            setPromoCodeData({
                code: restoredCode,
                discountPercentage: restoredPercent,
                discountAmount: parseFloat(calculatedDiscount.toFixed(2)),
                originalPrice: parseFloat(totalBasePriceBeforeFixedDiscount.toFixed(2))
            });
        }
        // 🚨 END RESTORE PROMO CODE DATA 🚨

        // 2. Restore or Initialize Account Data (Step 1)
        if (restoredPayload && (currentStep >= 2 || currentStep === 3)) {
            setStudentDetails(restoredPayload.studentDetails);
            setGuardianDetails(restoredPayload.guardianDetails);
            
            // Restore final payload if returning to Step 3
            if (currentStep === 3) {
                // Sync the payment amount in the restored payload to the freshly calculated final price
                const totalDiscount = (restoredPayload.promoCodeData?.discountAmount || 0) + fixedDiscount;
                const currentFinalPrice = totalBasePriceBeforeFixedDiscount - totalDiscount;
                restoredPayload.paymentAmount = currentFinalPrice; 
                setFinalBookingPayload(restoredPayload);
            }
        } else if (quizDataToUse) {
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

    // 🛑 HANDLER: Saves data to local storage and transitions to Step 2 🛑
    const handleAccountNext = (currentStudentDetails, currentGuardianDetails) => {
        const partialPayload = {
            studentDetails: currentStudentDetails,
            guardianDetails: currentGuardianDetails,
            purchaseType: currentPurchaseType,
            quizData: currentQuizData,
            // 🚨 PERSIST PROMO DATA 🚨
            promoCodeData: promoCodeData
        };
        localStorage.setItem(ENROLLMENT_DATA_KEY, JSON.stringify(partialPayload));
        
        setStudentDetails(currentStudentDetails);
        setGuardianDetails(currentGuardianDetails);
        
        setStep(2);
    }
    
    // 🛑 HANDLER: Saves FINAL payload to local storage and transitions to Step 3 🛑
    const handleScheduleNext = (fullPayloadFromStep2) => { // Rename argument for clarity

        // Use the structure provided by Step 2, but overwrite payment and promo details
        // with the latest values from Enrollment.jsx's state.
        const finalPayload = {
            ...fullPayloadFromStep2, // Includes courseDetails, scheduleDetails, studentDetails, guardianDetails
            
            // 🚨 CRITICAL: OVERWRITE PAYMENT INFO WITH LATEST CALCULATED VALUES 🚨
            paymentAmount: finalPaymentAmount, // Use the latest discounted amount
            promoCode: promoCodeData.code,
            // 💡 Save the total discount applied (fixed + percentage)
            appliedDiscountAmount: parseFloat((productDetails.fixedDiscount + promoCodeData.discountAmount).toFixed(2)),
            
            // 🚨 CRITICAL: Re-add promoCodeData for persistence/restoration in Step 3 🚨
            promoCodeData: promoCodeData
        };
        
        localStorage.setItem(ENROLLMENT_DATA_KEY, JSON.stringify(finalPayload));
        
        setFinalBookingPayload(finalPayload);
        
        setStep(3);
    }
    
    const handleBackToStep1 = () => {
        setStep(1); 
    }
    
    // 🚨 HANDLER: Update Promo Code Data (Percentage Discount) 🚨
    const handlePromoCodeUpdate = (newPromoCodeData) => {
        // Calculate the percentage discount based on the original price *before* any discounts
        const originalPrice = productDetails.price; 
        let calculatedDiscount = 0;
        
        if (newPromoCodeData.discountPercentage > 0) {
            calculatedDiscount = originalPrice * (newPromoCodeData.discountPercentage / 100);
        }

        const updatedData = {
            ...newPromoCodeData,
            discountAmount: parseFloat(calculatedDiscount.toFixed(2)),
            originalPrice: originalPrice
        };

        setPromoCodeData(updatedData);

        // Also update local storage immediately for persistence
        const storedData = localStorage.getItem(ENROLLMENT_DATA_KEY);
        let partialPayload = {};
        if (storedData) {
            try {
                partialPayload = JSON.parse(storedData);
            } catch (e) {}
        }
        
        // Only update the promo code part in storage
        partialPayload.promoCodeData = updatedData;
        localStorage.setItem(ENROLLMENT_DATA_KEY, JSON.stringify(partialPayload));
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
                        // 🚨 PASS PROMO PROPS 🚨
                        promoCodeData={promoCodeData}
                        onPromoCodeUpdate={handlePromoCodeUpdate}
                        finalPaymentAmount={finalPaymentAmount}
                        enrollmentDataKey={ENROLLMENT_DATA_KEY}
                    />;
                
            case 3:
                if (!finalBookingPayload || finalBookingPayload.paymentAmount === undefined) {
                    // Force rebuild payload if something is missing
                    return (
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200">
                            <AlertTriangle size={24} className="text-red-500 mx-auto mb-4" />
                            <p className="text-red-500 text-center">Error: Payment details missing. Please go back to the scheduling step.</p>
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
                        // 🚨 PASS FINAL PRICE and PROMO DATA 🚨
                        finalPaymentAmount={finalPaymentAmount}
                        promoCodeData={promoCodeData}
                    />
                );
            default:
                return null;
        }
    };

    // Helper to format the price string based on the purchase type (Original Price Display)
    const formatPriceDisplay = () => {
        const total = productDetails.price; 
        if (productDetails.sessions > 1) {
            return `$${productDetails.sessionPrice.toFixed(2)} X ${productDetails.sessions} = $${total.toFixed(2)}`;
        }
        return `$${total.toFixed(2)}`;
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
                            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2 ${step === 3 ? 'text-orange-500 bg-orange-500' : 'border-2 border-gray-300'}`}>3</span>
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
                                    <span>{productDetails.name} (Base Price)</span>
                                    {/* Display Original Price Calculation (before any discount) */}
                                    <span className={productDetails.fixedDiscount > 0 || promoCodeData.code ? 'line-through text-gray-400' : ''}>
                                        {formatPriceDisplay()}
                                    </span> 
                                </div>
                                {/* 💡 NEW: Fixed $5 Discount Row 💡 */}
                                {productDetails.fixedDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600 my-1 font-semibold">
                                        <span>Fixed Starter Pack Discount</span>
                                        <span>-${productDetails.fixedDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                {/* 🚨 Percentage Discount Row 🚨 */}
                                {promoCodeData.code && (
                                    <div className="flex justify-between text-sm text-green-600 my-1 font-semibold">
                                        <span>Promo Discount ({promoCodeData.discountPercentage}%) - {promoCodeData.code}</span>
                                        <span>-${promoCodeData.discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg text-gray-800 border-t border-dashed pt-2">
                                    <span>Total Due</span>
                                    <span className={productDetails.fixedDiscount > 0 || promoCodeData.code ? 'text-red-600' : 'text-gray-800'}>
                                        ${finalPaymentAmount.toFixed(2)}
                                    </span>
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
                    </div>
                </div>
            </footer>
        </div>
    );
}