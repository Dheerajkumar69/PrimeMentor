// frontend/src/components/Enrollment/Step3Payment.jsx
import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

// Using the new API endpoint for payment initiation
const INITIATE_PAYMENT_API_ENDPOINT = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/user/initiate-payment`;

// Local storage keys for state persistence across redirects
const EWAY_BOOKING_PAYLOAD_KEY = 'eway_booking_payload';
const EWAY_ACCESS_CODE_KEY = 'eway_access_code';
const EWAY_PRODUCT_DETAILS_KEY = 'eway_product_details';

const Step3Payment = ({ bookingPayload, productDetails }) => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [searchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    // State to manage the payload across redirects
    const [persistedPayload, setPersistedPayload] = useState(bookingPayload);
    const [persistedProductDetails, setPersistedProductDetails] = useState(productDetails);
    
    // --- 🛑 MODIFICATION: Handle Payment Return Here (Redirect to status page) 🛑 ---
    useEffect(() => {
        const accessCode = searchParams.get('AccessCode');
        const clerkId = searchParams.get('clerkId');
        
        // If we detect the return parameters, redirect to the dedicated PaymentSuccessRedirect page
        if (accessCode && clerkId) {
            navigate(`/payment-status?AccessCode=${accessCode}&clerkId=${clerkId}`, { replace: true });
            return;
        } 
        
        // If no accessCode is present, this is a clean step 3 page load.
        // We rely on the parent (Enrollment.jsx) to handle state restoration.
        // We only clear the transient EWAY keys here.
        localStorage.removeItem(EWAY_ACCESS_CODE_KEY);
        // We only need to check/set the persisted payload once on mount.
        setPersistedPayload(bookingPayload);
        setPersistedProductDetails(productDetails);
        
    }, [searchParams, navigate, bookingPayload, productDetails]);
    // --- 🛑 END MODIFICATION 🛑 ---


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        // Use current payload from props/parent state
        const payloadToSend = persistedPayload || bookingPayload;

        try {
            // 1. Store booking payload in Local Storage before redirecting
            localStorage.setItem(EWAY_BOOKING_PAYLOAD_KEY, JSON.stringify(payloadToSend));
            localStorage.setItem(EWAY_PRODUCT_DETAILS_KEY, JSON.stringify(productDetails));

            // 2. Call backend to create the Shared Payment URL
            const token = await getToken();
            const response = await axios.post(
                INITIATE_PAYMENT_API_ENDPOINT,
                { bookingPayload: payloadToSend },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.success && response.data.redirectUrl) {
                // 3. Save the AccessCode before redirect
                localStorage.setItem(EWAY_ACCESS_CODE_KEY, response.data.accessCode);

                // 4. Redirect the customer to the eWAY Shared Page
                window.location.href = response.data.redirectUrl;

            } else {
                throw new Error(response.data.message || 'Failed to get eWAY redirect link.');
            }

        } catch (err) {
            console.error('eWAY payment initiation failed:', err);
            // Revert loading state and clean up storage on failure
            localStorage.removeItem(EWAY_BOOKING_PAYLOAD_KEY);
            localStorage.removeItem(EWAY_ACCESS_CODE_KEY);
            localStorage.removeItem(EWAY_PRODUCT_DETAILS_KEY);

            setError(err.response?.data?.message || err.message || 'An unexpected error occurred during payment initiation.');
            setIsLoading(false);
        }
    };

    // Use the current or persisted payload/product details
    const currentPayload = persistedPayload || bookingPayload;
    const currentProductDetails = persistedProductDetails || productDetails;

    if (currentPayload === null) {
         return <div className="text-red-500 p-6">Loading payment details... Please wait or go back to Step 2.</div>;
    }


    // Determine if the Pay button should be disabled
    const isButtonDisabled = isLoading;

    return (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <CreditCard size={24} className="mr-3 text-blue-600" />
                Step 3: Secure Payment
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 mb-6">
                <p className="font-semibold text-base">Amount Due: <span className='text-lg font-bold'>${currentPayload.paymentAmount} AUD</span></p>
                <p className="text-sm">You are paying for the <b>{currentProductDetails.name}</b>.</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* eWAY Shared Page Notice */}
                <div className="mb-6 border-l-4 border-yellow-500 bg-yellow-50 p-4 text-yellow-800">
                    <p className="font-semibold">Payment Method:</p>
                    <p className="text-sm">You will be securely redirected to the <b>eWAY Shared Payment Page</b> to enter your card details and finalize the payment.</p>
                </div>

                {/* ERROR DISPLAY */}
                {error && (
                    <div className="flex items-center p-3 mb-4 text-red-700 bg-red-100 rounded-lg" role="alert">
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium">
                            {error}
                        </span>
                    </div>
                )}
                
                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className={`w-full font-bold py-3 rounded-lg transition text-base sm:text-lg flex items-center justify-center space-x-2
                        ${isButtonDisabled ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Redirecting to Payment...</span>
                        </>
                    ) : (
                        <span>Pay ${currentPayload.paymentAmount} AUD Now</span>
                    )}
                </button>
                <p className="mt-4 text-xs text-center text-gray-500">
                    Your payment details are securely processed by <b>eWAY</b>.
                </p>
            </form>
        </div>
    );
};

export default Step3Payment;