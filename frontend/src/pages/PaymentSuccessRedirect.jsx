// frontend/src/pages/PaymentSuccessRedirect.jsx (No change needed)

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { Loader2, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';

const FINISH_PAYMENT_API_ENDPOINT = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/user/finish-eway-payment`;

// Local storage keys (must match Step3Payment)
const EWAY_BOOKING_PAYLOAD_KEY = 'eway_booking_payload';
const EWAY_ACCESS_CODE_KEY = 'eway_access_code';
const EWAY_PRODUCT_DETAILS_KEY = 'eway_product_details';


const PaymentSuccessRedirect = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [searchParams] = useSearchParams();

    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('Verifying payment and finalizing your course enrollment...');

    useEffect(() => {
        const accessCode = searchParams.get('AccessCode');
        const clerkId = searchParams.get('clerkId');

        // --- 1. Basic Validation ---
        if (!accessCode || !clerkId) {
            setStatus('error');
            setMessage("Invalid payment return link. Missing essential transaction details (AccessCode/ClerkID).");
            return;
        }

        // --- 2. Retrieve Stored Payload (best-effort — backend has MongoDB fallback) ---
        const storedPayloadJSON = localStorage.getItem(EWAY_BOOKING_PAYLOAD_KEY);
        const storedAccessCode = localStorage.getItem(EWAY_ACCESS_CODE_KEY);

        // Warn but DO NOT block — backend has PendingPayload in MongoDB as fallback
        if (storedAccessCode && storedAccessCode !== accessCode) {
            console.warn('⚠️ Access code mismatch — localStorage may be stale. Proceeding with backend fallback.');
        }

        if (!storedPayloadJSON) {
            console.warn('⚠️ localStorage booking payload missing (cleared during eWAY redirect). Backend will use MongoDB-cached PendingPayload.');
        }

        // Parse if available, otherwise pass null — backend resolves from PendingPayload
        const storedPayload = storedPayloadJSON ? JSON.parse(storedPayloadJSON) : null;

        // --- 3. Finalize Payment and Booking ---
        const finishPayment = async () => {
            try {
                const token = await getToken();

                const response = await axios.post(
                    FINISH_PAYMENT_API_ENDPOINT,
                    {
                        accessCode: accessCode,
                        clerkId: clerkId,
                        bookingPayload: storedPayload,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data.success) {
                    setStatus('success');
                    // Message now includes the confirmation email information
                    setMessage('Payment verified. Course enrollment confirmed! A confirmation email has been sent. Redirecting now.');

                    // Clean up storage
                    localStorage.removeItem(EWAY_BOOKING_PAYLOAD_KEY);
                    localStorage.removeItem(EWAY_ACCESS_CODE_KEY);
                    localStorage.removeItem(EWAY_PRODUCT_DETAILS_KEY);

                    // 🛑 FINAL REDIRECT TO MYCOURSES with Refresh Trigger 🛑
                    setTimeout(() => {
                        navigate('/my-courses?refresh=' + Date.now());
                    }, 2000);
                } else {
                    // Backend failed to finalize booking (e.g., payment declined, or a server issue after payment)
                    throw new Error(response.data.message || 'Payment verification failed. Please check your courses dashboard.');
                }
            } catch (err) {
                console.error('eWAY finalization failed:', err);
                setStatus('error');
                setMessage(err.response?.data?.message || err.message || 'An unexpected error occurred during confirmation.');
            }
        };

        finishPayment();

    }, [searchParams, getToken, navigate]);

    const displayIcon = {
        loading: <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />,
        success: <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />,
        error: <AlertTriangle size={48} className="text-red-600 mx-auto mb-4" />,
    };

    const bgColor = {
        loading: 'bg-blue-50 border-blue-300',
        success: 'bg-green-50 border-green-300',
        error: 'bg-red-50 border-red-300',
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 pt-[80px]">
            <div className={`p-6 md:p-10 rounded-xl shadow-lg border text-center max-w-lg w-full ${bgColor[status]}`}>
                {displayIcon[status]}
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {status === 'loading' ? 'Processing Payment...' : status === 'success' ? 'Payment Successful!' : 'Payment Failed/Error'}
                </h2>
                <p className="text-gray-700">{message}</p>
                {status === 'error' && (
                    <button
                        onClick={() => navigate('/my-courses')}
                        className="mt-4 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition"
                    >
                        Go to My Courses
                    </button>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccessRedirect;