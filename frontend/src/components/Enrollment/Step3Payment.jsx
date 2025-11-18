// frontend/src/components/Enrollment/Step3Payment.jsx
import React, { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
// 🛑 NEW: Stripe Element Imports 🛑
import { 
    useStripe, 
    useElements, 
    PaymentElement, 
} from '@stripe/react-stripe-js';

// Using a generic API endpoint for payment processing
const PAYMENT_API_ENDPOINT = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/user/process-payment`;

const Step3Payment = ({ bookingPayload, productDetails }) => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    
    // 🛑 NEW: Stripe Hooks 🛑
    const stripe = useStripe();
    const elements = useElements();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Removed manual card state and validation as PaymentElement handles this.

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            setError("Payment gateway is not ready. Please wait a moment.");
            return;
        }

        setIsLoading(true);

        try {
            // 🛑 1. CRITICAL FIX: Call elements.submit() FIRST 🛑
            // This triggers form validation and payment method collection internally.
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message);
                setIsLoading(false);
                return;
            }

            // 2. Securely Create Payment Method from Payment Element
            // This step is now safe because elements.submit() has completed.
            const result = await stripe.createPaymentMethod({
                elements,
                params: {
                    billing_details: {
                        name: bookingPayload.studentDetails?.first + ' ' + bookingPayload.studentDetails?.last,
                        email: bookingPayload.studentDetails?.email || bookingPayload.guardianDetails?.email,
                    }
                }
            });

            if (result.error) {
                // Show error to your customer (e.g., incorrect details)
                setError(result.error.message);
                setIsLoading(false);
                return;
            }

            const paymentMethodId = result.paymentMethod.id;
            
            // 3. Prepare the final payload for the server
            const finalPayload = {
                ...bookingPayload,
                paymentMethodId: paymentMethodId, // <-- send the secure PaymentMethod ID to the backend
                currency: 'AUD', 
                amount: Math.round(bookingPayload.paymentAmount * 100), // Convert to cents
                cardHolderEmail: bookingPayload.studentDetails?.email || bookingPayload.guardianDetails?.email,
                customerIP: '127.0.0.1', 
                customerName: bookingPayload.studentDetails?.first + ' ' + bookingPayload.studentDetails?.last,
            };

            console.log('Sending final payment payload to server (masked)...');

            // 4. Send the Payment Method ID and booking data to the backend
            const token = await getToken();

            const response = await axios.post(
                PAYMENT_API_ENDPOINT,
                finalPayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.success) {
                // Handle 3DS Challenge (requiresAction) if needed
                if (response.data.requiresAction) {
                    console.log("Handling 3DS challenge...");
                    const { clientSecret } = response.data;

                    const confirmResult = await stripe.confirmCardPayment(clientSecret, {
                        elements, // Pass elements to confirm the payment
                        confirmParams: {
                            return_url: `${window.location.origin}/my-courses?payment_intent=${clientSecret}`,
                        }
                    });

                    if (confirmResult.error) {
                         throw new Error(confirmResult.error.message || '3DS challenge failed.');
                    }
                    if (confirmResult.paymentIntent.status !== 'succeeded') {
                         throw new Error(`Payment confirmation failed. Status: ${confirmResult.paymentIntent.status}`);
                    }
                }
                
                // Final success state
                setSuccess(true);
                // Redirect to MyCourses on final success
                setTimeout(() => {
                    navigate('/my-courses');
                }, 2000);
            } else {
                // If backend responds with data but success is false (e.g., payment declined)
                throw new Error(response.data.message || 'Payment failed. Please check your card details.');
            }

        } catch (err) {
            console.error('Payment processing failed:', err);
            // Display specific error message
            setError(err.response?.data?.message || err.message || 'An unexpected error occurred during payment.');
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-green-50 p-6 md:p-10 rounded-xl shadow-lg border border-green-300 text-center">
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
                <p className="text-gray-700">Your enrollment is confirmed. Redirecting to your courses...</p>
            </div>
        );
    }

    // Determine if the Pay button should be disabled
    const isButtonDisabled = isLoading || !stripe || !elements;

    return (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <CreditCard size={24} className="mr-3 text-blue-600" />
                Step 3: Secure Payment
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 mb-6">
                <p className="font-semibold text-base">Amount Due: <span className='text-lg font-bold'>${bookingPayload.paymentAmount} AUD</span></p>
                <p className="text-sm">You are paying for the **{productDetails.name}**.</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* 🛑 STRIPE PAYMENT ELEMENT 🛑 */}
                <div className="mb-6">
                    <PaymentElement options={{layout: "auto"}} />
                </div>
                {/* 🛑 END STRIPE ELEMENT 🛑 */}

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
                            <span>Processing Payment...</span>
                        </>
                    ) : (
                        <span>Pay ${bookingPayload.paymentAmount} AUD Now</span>
                    )}
                </button>
                <p className="mt-4 text-xs text-center text-gray-500">
                    Your payment details are securely processed by **Stripe**.
                </p>
            </form>
        </div>
    );
};

export default Step3Payment;