// frontend/src/pages/RefundPolicyPage.jsx

import React, { useState } from 'react'; 
import { Shield, DollarSign, CreditCard, Mail, User, Phone, Send, Loader } from 'lucide-react'; 

// Import Header and Footer based on your folder structure
import Header from '../components/Home/Header.jsx';
import Footer from '../components/Home/Footer.jsx';
import { assets } from '../assets/assets';

// --- Refund Policy Content Data Structure (Remains the same) ---
const refundPolicyContent = [
    {
        id: 1,
        title: "Cancellation & Refunds",
        content: (
            <ul className="list-disc ml-5 space-y-3">
                <li>
                    <strong className="text-gray-900">Session Cancellations:</strong> You can cancel or reschedule a session up to <strong className="text-gray-900">24 hours before the scheduled time without any charges.</strong>
                </li>
                <li>
                    <strong className="text-gray-900">Late Cancellations:</strong> If you cancel a session within 24 hours of the scheduled time, <strong className="text-gray-900">a cancellation fee may apply.</strong>
                </li>
                <li>
                    <strong className="text-gray-900">Refund Requests:</strong> Refunds are provided for <strong className="text-gray-900">prepaid sessions that have not been attended.</strong> No refunds for completed sessions.
                </li>
            </ul>
        ),
        icon: <DollarSign className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 2,
        title: "Dissatisfaction with Services",
        content: (
            <>
                If you are not satisfied with our tutoring services, please contact us within <strong className="text-gray-900">48 hours of the session.</strong> We will work with you to resolve the issue, including offering an alternative tutor or a complimentary session.
            </>
        ),
        icon: <Shield className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
    {
        id: 3,
        title: "Payment Disputes & Contact",
        content: (
            <>
                For any payment disputes or questions, please contact us immediately at <strong className="text-gray-900 text-base">[rajwinderkhakh@gmail.com] or [+61433552127].</strong> We will review the issue and aim to resolve it promptly.
                <p className="mt-3">
                    For a formal refund request, please use the form below.
                </p>
            </>
        ),
        icon: <CreditCard className="w-5 h-5 text-orange-500 flex-shrink-0" />,
    },
];
// --------------------------------------------------------

// --- Refund Request Form Component with API Logic ---
const RefundRequestForm = () => {
    const [formMessage, setFormMessage] = useState('');
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null); 

    const CONTACT_API_URL = '/api/contact'; 

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        
        // 1. Client-side validation check
        if (!e.target.checkValidity()) {
            e.target.reportValidity(); 
            return;
        }

        setLoading(true);
        setFormMessage('');
        setError(null);
        
        // 2. Capture ALL form data
        const formData = {
            name: e.target.name.value,
            email: e.target.email.value,
            phone: e.target.phone.value,
            address: e.target.address.value,
            accountName: e.target.accountName.value,
            bank: e.target.bank.value,
            accountNumber: e.target.accountNumber.value,
            bsb: e.target.bsb.value,
            amountPaid: e.target.amountPaid.value,
            paymentDate: e.target.paymentDate.value,
            reason: e.target.reason.value,
            source: 'Refund Request', // 💡 KEY: Identifies the form source
        };

        try {
            // 3. Send data as JSON to your backend API
            const response = await fetch(CONTACT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit refund request.');
            }

            // Success
            setFormMessage("Your refund request has been submitted successfully! We will process it within 5-7 business days.");
            e.target.reset(); 
            
        } catch (err) {
            console.error("Submission error:", err);
            setError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
            setTimeout(() => {
                setFormMessage('');
                setError(null);
            }, 8000);
        }
    };

    return (
        <div className="mt-16 bg-white p-8 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-orange-600 mb-8 border-b pb-2 flex items-center">
                <DollarSign className="w-7 h-7 mr-2" /> Formal Refund Request Form
            </h2>

            {/* Success Message */}
            {formMessage && (
                <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg font-medium border border-green-200">
                    {formMessage}
                </div>
            )}
             {/* Error Message */}
             {error && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg font-medium border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* 1. Personal Details */}
                <h3 className="text-xl font-semibold text-gray-800 pt-4 border-t">Personal Details <span className="text-red-500">*</span></h3>
                
                {/* Name */}
                <div className="relative">
                    <input 
                        type="text" id="name" name="name" required
                        placeholder="Full Name"
                        className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                
                {/* Email Address */}
                <div className="relative">
                    <input 
                        type="email" id="email" name="email" required
                        placeholder="Email Address"
                        className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                {/* Phone Number - MANDATORY */}
                <div className="relative">
                    <input 
                        type="tel" id="phone" name="phone" required 
                        placeholder="Phone Number"
                        className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                
                {/* Address */}
                <div className="relative">
                    <textarea 
                        id="address" name="address" rows="2" required
                        placeholder="Full Address"
                        className="w-full p-4 pt-4 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 resize-none bg-gray-50 text-gray-900"
                    ></textarea>
                </div>

                {/* 2. Banking Details */}
                <h3 className="text-xl font-semibold text-gray-800 pt-4 border-t">Banking Details (For EFT Refund) <span className="text-red-500">*</span></h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Account Name */}
                    <input 
                        type="text" id="accountName" name="accountName" required
                        placeholder="Account Name"
                        className="p-4 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                    
                    {/* Bank */}
                    <input 
                        type="text" id="bank" name="bank" required
                        placeholder="Bank Name"
                        className="p-4 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Account Number */}
                    <input 
                        type="text" id="accountNumber" name="accountNumber" required
                        placeholder="Account Number"
                        className="p-4 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                    
                    {/* BSB - MANDATORY */}
                    <input 
                        type="text" id="bsb" name="bsb" required 
                        placeholder="BSB"
                        className="p-4 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                </div>
                
                {/* 3. Payment/Request Details */}
                <h3 className="text-xl font-semibold text-gray-800 pt-4 border-t">Payment & Refund Details <span className="text-red-500">*</span></h3>
                
                {/* Amount Paid */}
                <div className="relative">
                    <input 
                        type="number" id="amountPaid" name="amountPaid" required
                        placeholder="Original Amount Paid (e.g., $150)"
                        className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                {/* Date of Payment */}
                <div className="relative">
                    <input 
                        type="date" id="paymentDate" name="paymentDate" required
                        placeholder="Date of Original Payment"
                        className="w-full p-4 pl-4 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-gray-900"
                    />
                </div>

                {/* Reason for Refund */}
                <div className="relative">
                    <textarea 
                        id="reason" name="reason" rows="4" required
                        placeholder="Reason for Refund Request (Max 250 characters)"
                        maxLength="250"
                        className="w-full p-4 pt-4 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 resize-none bg-gray-50 text-gray-900"
                    ></textarea>
                    <span className="absolute bottom-3 right-4 text-xs text-gray-400">0/250</span>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition duration-300 shadow-xl shadow-orange-500/50 uppercase tracking-wider mt-8 flex items-center justify-center 
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-orange-700'}`
                    }
                >
                    {loading ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Send className="w-5 h-5 mr-2"/>} 
                    {loading ? 'Submitting...' : 'Submit Refund Request'}
                </button>
            </form>
        </div>
    );
};
// --------------------------------------------------------


const RefundPolicyPage = () => {
    // CSS for the full-page background effect (Inherited from FaqPage)
    const backgroundStyle = {
        backgroundImage: `url('${assets.banner}')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed', // Makes the background image fixed while content scrolls
        backgroundPosition: 'center center',
    };

    return (
        // Outer wrapper for the background image
        <div style={backgroundStyle} className="min-h-screen">

            {/* Semi-transparent overlay to ensure text readability across the entire page (Inherited from FaqPage) */}
            <div className="bg-gray-900/80 min-h-screen flex flex-col">

                {/* Header must be integrated here */}
                <Header />

                <main className="flex-grow">

                    {/* Page Banner / Title Section */}
                    <div className="relative pt-40 text-white flex items-center justify-center border-b border-gray-700/50">
                        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-widest animate-in fade-in duration-1000">
                            REFUND POLICY
                        </h1>
                    </div>

                    {/* Main Content Area: Refund Policy List and Form */}
                    <div className="container mx-auto px-4 py-16 max-w-5xl">

                        {/* Introduction Text Section */}
                        <div className="text-center mb-16 space-y-6 text-white">
                            <h2 className="text-4xl font-bold text-teal-400 flex items-center justify-center">
                                <Shield className="w-8 h-8 mr-3" /> Our Commitment to You
                            </h2>
                            <p className="text-gray-200 leading-relaxed text-lg max-w-3xl mx-auto">
                                At Prime Mentor, we strive to ensure complete satisfaction with our services. Below are the guidelines regarding refunds.
                            </p>
                        </div>


                        {/* Refund Policy List Section */}
                        <div className="space-y-6">
                            {refundPolicyContent.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="bg-white/95 p-6 rounded-xl shadow-2xl border-l-8 border-orange-500 hover:shadow-orange-300/50 transition duration-300 transform hover:scale-[1.01]"
                                >
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-start gap-3">
                                        <span className="text-orange-500 font-extrabold text-2xl flex-shrink-0">{item.id}.</span> 
                                        {item.title}
                                    </h3>
                                    <div className="text-gray-600 pl-8 pt-2 border-l border-gray-300 ml-4 leading-relaxed text-base">
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Refund Request Form Component (Added just below the content) */}
                        <RefundRequestForm />

                    </div>
                </main>

                {/* Footer must be integrated here */}
                <Footer />

            </div>
        </div>
    );
};

export default RefundPolicyPage;