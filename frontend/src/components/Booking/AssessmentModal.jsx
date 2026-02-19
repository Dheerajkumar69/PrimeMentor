// frontend/src/components/Booking/AssessmentModal.jsx
import React, { useState } from 'react';
import { X, CheckCircle, Send, Users, Mail, Phone, BookOpen, Globe } from 'lucide-react';
import axios from 'axios';

// Configuration
const WEB3FORMS_ACCESS_KEY = typeof import.meta.env.VITE_WEB3FORMS_ACCESS_KEY !== 'undefined'
    ? import.meta.env.VITE_WEB3FORMS_ACCESS_KEY
    : 'YOUR_WEB3FORMS_ACCESS_KEY_HERE'; // Fallback for safety

// --- MODIFICATION: Updated API Base URL ---
// The POST route in assessmentRoutes.js is /api/assessments/submit.
const API_BASE_URL = typeof import.meta.env.VITE_BACKEND_URL !== 'undefined'
    ? import.meta.env.VITE_BACKEND_URL
    : 'http://localhost:5000'; // Default fallback

const subjects = ['All subjects', 'English', 'Mathematics', 'Science'];
const classes = Array.from({ length: 11 }, (_, i) => i + 2); // 2 to 12

// Countries list for the dropdown
const countries = [
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'NP', name: 'Nepal' },
    { code: 'PH', name: 'Philippines' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KE', name: 'Kenya' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CL', name: 'Chile' },
    { code: 'FJ', name: 'Fiji' },
];

/**
 * Modal form for users to book a free assessment enquiry.
 * Submits to Web3Forms for email notification and to the local backend for Admin Dashboard update.
 * @param {object} props
 * @param {boolean} props.isOpen - Controls the modal visibility.
 * @param {function} props.onClose - Function to close the modal.
 * @param {function} props.onSubmissionComplete - Function to handle successful submission flow in App.jsx.
 */
export default function AssessmentModal({ isOpen, onClose, onSubmissionComplete }) {
    const [formData, setFormData] = useState({
        studentFirstName: '',
        studentLastName: '',
        studentEmail: '',
        studentPhone: '',
        parentFirstName: '',
        parentLastName: '',
        parentEmail: '',
        contactNumber: '',
        subject: subjects[0],
        class: classes[0],
        country: '',
        postalCode: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'class' ? parseInt(value) : value // Ensure class is a number for DB
        }));
        if (validationError) setValidationError('');
    };

    const validateForm = () => {
        const requiredFields = [
            'studentFirstName', 'studentLastName', 'studentEmail',
            'parentFirstName', 'parentLastName', 'parentEmail',
            'contactNumber', 'subject', 'country', 'postalCode'
        ];

        for (const field of requiredFields) {
            if (!formData[field] || !formData[field].trim()) {
                return `Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
            }
        }

        if (!/\S+@\S+\.\S+/.test(formData.studentEmail.trim())) {
            return 'Please enter a valid student email address.';
        }
        if (!/\S+@\S+\.\S+/.test(formData.parentEmail.trim())) {
            return 'Please enter a valid parent email address.';
        }

        // Validate phone numbers — only allow digits, +, spaces, hyphens, parentheses
        const phoneRegex = /^[\d+\s()-]+$/;
        if (!phoneRegex.test(formData.contactNumber.trim())) {
            return 'Contact number can only contain digits, +, spaces, hyphens, and parentheses.';
        }
        if (formData.studentPhone && formData.studentPhone.trim() && !phoneRegex.test(formData.studentPhone.trim())) {
            return 'Student phone number can only contain digits, +, spaces, hyphens, and parentheses.';
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validateForm();

        if (error) {
            setValidationError(error);
            return;
        }

        if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY_HERE') {
            setValidationError('Email service error: Please set VITE_WEB3FORMS_ACCESS_KEY in your frontend .env file.');
            return;
        }

        setIsSubmitting(true);
        let dbSuccess = false;

        // Trim data before submission
        const submissionData = {
            ...Object.fromEntries(
                Object.entries(formData).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
            ),
            // Send null instead of empty string for optional studentPhone
            studentPhone: formData.studentPhone?.trim() || null,
            timestamp: new Date().toISOString(),
            // Web3Forms specific fields for routing the email
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: `NEW ASSESSMENT REQUEST: ${formData.studentFirstName.trim()} (${formData.subject.trim()})`,
            from_name: `Prime Mentor Assessment - ${formData.parentFirstName.trim()} ${formData.parentLastName.trim()}`,
        };

        try {
            // 1. Send data to the local backend API for storage
            // --- MODIFICATION: Corrected API endpoint for submission ---
            const dbResponse = await axios.post(`${API_BASE_URL}/api/assessments/submit`, submissionData);

            // Call the parent submission handler with the full data from the DB
            onSubmissionComplete(dbResponse.data.data);
            dbSuccess = true;

            // 2. Submit to Web3Forms for the email notification
            const emailResponse = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(submissionData)
            });

            const emailResult = await emailResponse.json();

            if (!emailResult.success) {
                console.error("Web3Forms Email failed:", emailResult.message);
                setValidationError(`Request submitted to DB, but email notification failed: ${emailResult.message}`);
            } else {
                console.log("Email sent successfully via Web3Forms.");
            }

            setIsSubmitted(true);

        } catch (err) {
            console.error("Submission failed:", err.response ? err.response.data : err.message);
            if (dbSuccess) { // Show success if DB save worked, but email failed
                setValidationError('DB update succeeded, but email notification failed to send.');
            } else {
                setValidationError('A network error occurred during submission.');
            }
            setIsSubmitted(dbSuccess);

        } finally {
            setIsSubmitting(false);

            if (isSubmitted || dbSuccess) {
                setTimeout(() => {
                    setFormData({
                        studentFirstName: '', studentLastName: '', studentEmail: '', studentPhone: '',
                        parentFirstName: '', parentLastName: '', parentEmail: '',
                        contactNumber: '', subject: subjects[0], class: classes[0],
                        country: '', postalCode: '',
                    });
                    setIsSubmitted(false);
                    onClose();
                }, 3000);
            }
        }
    };

    const renderForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center mb-3 border-b pb-2">
                <Users className="w-5 h-5 mr-2 text-orange-500" /> Student Details
            </h3>
            {/* Form layout changes to single column on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="studentFirstName" placeholder="Student First Name (Required)" value={formData.studentFirstName} onChange={handleChange} maxLength={100} className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required />
                <input type="text" name="studentLastName" placeholder="Student Last Name (Required)" value={formData.studentLastName} onChange={handleChange} maxLength={100} className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required />
                <input type="email" name="studentEmail" placeholder="Student Email Address (Required)" value={formData.studentEmail} onChange={handleChange} maxLength={254} className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required />
                <input type="tel" name="studentPhone" placeholder="Student Phone Number (Optional)" value={formData.studentPhone} onChange={handleChange} maxLength={20} className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center mb-3 border-b pb-2 pt-2 sm:pt-4">
                <Mail className="w-5 h-5 mr-2 text-orange-500" /> Parent/Guardian Details
            </h3>
            {/* Form layout changes to single column on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="parentFirstName" placeholder="Parent First Name (Required)" value={formData.parentFirstName} onChange={handleChange} maxLength={100} className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required />
                <input type="text" name="parentLastName" placeholder="Parent Last Name (Required)" value={formData.parentLastName} onChange={handleChange} maxLength={100} className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required />
                <input type="email" name="parentEmail" placeholder="Parent Email Address (Required)" value={formData.parentEmail} onChange={handleChange} maxLength={254} className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required />
                <input type="tel" name="contactNumber" placeholder="Contact Number (Required)" value={formData.contactNumber} onChange={handleChange} maxLength={20} className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center mb-3 border-b pb-2 pt-2 sm:pt-4">
                <BookOpen className="w-5 h-5 mr-2 text-orange-500" /> Assessment Focus
            </h3>
            {/* Form layout changes to single column on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class/Year Level</label>
                    <select name="class" value={formData.class} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required>
                        {classes.map(c => <option key={c} value={c}>Year {c}</option>)}
                    </select>
                </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center mb-3 border-b pb-2 pt-2 sm:pt-4">
                <Globe className="w-5 h-5 mr-2 text-orange-500" /> Your Location
            </h3>
            <p className="text-xs text-gray-500 -mt-2 mb-3">We use this to show meeting times in your local timezone.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country (Required)</label>
                    <select name="country" value={formData.country} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required>
                        <option value="">Select your country...</option>
                        {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal / ZIP Code (Required)</label>
                    <input type="text" name="postalCode" placeholder="e.g. 3000, 10001, 110001" value={formData.postalCode} onChange={handleChange} maxLength={10} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-sm" required />
                </div>
            </div>

            {validationError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm font-medium">
                    {validationError}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-base sm:text-lg font-bold text-white bg-orange-600 hover:bg-orange-700 transition duration-200 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    'Submitting...'
                ) : (
                    <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Free Assessment Request
                    </>
                )}
            </button>
        </form>
    );

    // ... (rest of the component remains the same)
    const renderSuccess = () => (
        <div className="text-center p-6 sm:p-8">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Success!</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
                Thank you for booking a free assessment. The admin team has been notified and will contact you shortly to confirm the details.
            </p>
            <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
            >
                Close
            </button>
        </div>
    );

    return (
        // Applied the TeacherLogin properties: backdrop-blur-sm and bg-black/70 (instead of /30 for stronger dimming)
        // Retained responsive vertical spacing: mt-20 on mobile, md:mt-0 on desktop.
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm bg-black/30 flex items-start justify-center p-4 md:items-start pt-4 md:pt-32 pb-8 mt-20 md:mt-0">
            <style jsx="true">{`
                .custom-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background-color: #f97316; /* Orange-500 */
                    border-radius: 10px;
                    border: 2px solid white; 
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: #f3f4f6; /* Gray-100 */
                    border-radius: 10px;
                }
                .custom-scroll {
                    scrollbar-width: thin; /* Firefox support */
                    scrollbar-color: #f97316 white;
                }
            `}</style>

            {/* Modal Content container - responsive max-height retained */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg lg:max-w-xl p-4 sm:p-6 relative transform transition-all duration-300 scale-100 opacity-100 max-h-[80vh] sm:max-h-[75vh] overflow-y-auto custom-scroll">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-900 transition p-2 rounded-full hover:bg-gray-100 bg-white shadow-md z-20"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="text-center mb-4 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-orange-600">Book Your Free Assessment</h1>
                    <p className="text-gray-500 mt-2 text-xs sm:text-sm">Personalised learning starts here. Fill in your details below.</p>
                </div>
                {isSubmitted ? renderSuccess() : renderForm()}
            </div>
        </div>
    );
}