// frontend/src/components/StudentPanel/FeedbackFormModal.jsx
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext.jsx';
import { X, CheckCircle, MessageSquare, Star, Zap } from 'lucide-react';

const StarRating = ({ value, onChange }) => (
    <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                className={`text-3xl transition-colors ${star <= value ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                onClick={() => onChange(star)}
            >
                {star <= value ? '★' : '☆'}
            </button>
        ))}
    </div>
);

const FeedbackFormModal = ({ course, onClose, onSubmissionSuccess }) => {
    const { studentToken } = useContext(AppContext);

    // Pre-fill form data from the passed course object
    const [formData, setFormData] = useState({
        courseName: course.name,
        teacherName: course.teacher || 'N/A',
        sessionDate: course.preferredDate,
        sessionTime: course.preferredTime,

        // Initial Ratings
        clarityRating: 5,
        engagingRating: 5,
        contentRating: 5,
        overallSatisfaction: 100, // Starts at 100%

        // Text Fields
        likes: '',
        improvements: '',
        additionalComments: '',
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleRatingChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.clarityRating || !formData.engagingRating || !formData.contentRating) {
            return 'Please provide a rating for all star categories.';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const payload = {
                ...formData,
                likes: formData.likes || '',
                improvements: formData.improvements || '',
                additionalComments: formData.additionalComments || '',
            };

            const response = await axios.post(`${BACKEND_URL}/api/user/feedback`, payload, {
                headers: {
                    Authorization: `Bearer ${studentToken}`,
                    'Content-Type': 'application/json'
                }
            });

            setIsSubmitted(true);
            onSubmissionSuccess(course._id, response.data.feedback);

            // Close the modal after a short delay to show success message
            setTimeout(onClose, 3000);

        } catch (err) {
            console.error('Feedback submission error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to submit feedback. Please ensure you are logged in.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderForm = () => (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* Course / Teacher Details (Read-only) */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm shadow-inner">
                <p className="font-bold text-gray-800">Class Details</p>
                <p><strong>Course:</strong> {formData.courseName}</p>
                <p><strong>Teacher:</strong> {formData.teacherName}</p>
                <p><strong>Date:</strong> {new Date(formData.sessionDate).toLocaleDateString()} at {formData.sessionTime}</p>
            </div>

            {/* Rating Section */}
            <h3 className="text-xl font-bold text-gray-800 flex items-center border-b pb-2">
                <Star className="w-5 h-5 mr-2 text-yellow-500" /> Class Experience Rating
            </h3>

            {/* Clarity */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">How was the teacher’s clarity?</label>
                <StarRating
                    value={formData.clarityRating}
                    onChange={(val) => handleRatingChange('clarityRating', val)}
                />
            </div>

            {/* Engagement */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">How engaging was the class?</label>
                <StarRating
                    value={formData.engagingRating}
                    onChange={(val) => handleRatingChange('engagingRating', val)}
                />
            </div>

            {/* Content */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">How was the course content?</label>
                <StarRating
                    value={formData.contentRating}
                    onChange={(val) => handleRatingChange('contentRating', val)}
                />
            </div>

            {/* Overall Satisfaction Slider */}
            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Satisfaction: <span className="font-bold text-indigo-600">{formData.overallSatisfaction}%</span>
                </label>
                <input
                    type="range"
                    name="overallSatisfaction"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.overallSatisfaction}
                    onChange={handleChange}
                    // Tailwind for custom slider track/thumb
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer range-lg transition-colors"
                    style={{ '--range-thumb-color': '#4f46e5' }}
                />
            </div>

            {/* Text Feedback Boxes */}
            <h3 className="text-xl font-bold text-gray-800 flex items-center border-b pb-2 pt-4">
                <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" /> Open Feedback
            </h3>

            {[
                { id: 'likes', label: 'What did you like about the class?' },
                { id: 'improvements', label: 'What can be improved?' },
                { id: 'additionalComments', label: 'Any additional comments?' }
            ].map(({ id, label }) => (
                <div key={id}>
                    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
                    <textarea
                        id={id}
                        name={id}
                        rows="3"
                        maxLength={500}
                        value={formData[id]}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            ))}

            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm font-medium mt-3">{error}</p>}

            {/* Submit Button (Styled to match AssessmentModal interactive look) */}
            <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-base sm:text-lg font-bold text-white bg-green-600 hover:bg-green-700 transition duration-200 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? (
                    'Submitting...'
                ) : (
                    <>
                        <Zap className="w-5 h-5 mr-2" />
                        Submit Feedback
                    </>
                )}
            </button>
        </form>
    );

    const renderSuccess = () => (
        <div className="text-center p-6 sm:p-8">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Feedback Received!</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
                Thank you for sharing your valuable opinion. Your input helps us improve!
            </p>
            <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm sm:text-base shadow-md"
            >
                Close
            </button>
        </div>
    );

    return (
        // Modal Container with blurred background and interactive feel
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm bg-black/30 flex items-start justify-center p-4 md:items-start pt-4 md:pt-32 pb-8 mt-20 md:mt-0">
            <style jsx="true">{`
                .custom-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background-color: #4f46e5; /* Indigo-600 */
                    border-radius: 10px;
                    border: 2px solid white; 
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: #f3f4f6; /* Gray-100 */
                    border-radius: 10px;
                }
                .custom-scroll {
                    scrollbar-width: thin; /* Firefox support */
                    scrollbar-color: #4f46e5 white;
                }
            `}</style>

            {/* Modal Content container - responsive max-height and shadow retained */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg lg:max-w-xl p-4 sm:p-6 relative transform transition-all duration-300 scale-100 opacity-100 max-h-[80vh] sm:max-h-[75vh] overflow-y-auto custom-scroll">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-900 transition p-2 rounded-full hover:bg-gray-100 bg-white shadow-md z-20"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="text-center mb-4 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-600">Your Opinion Matters!</h1>
                    <p className="text-gray-500 mt-2 text-xs sm:text-sm">Help us improve the learning experience.</p>
                </div>
                {isSubmitted ? renderSuccess() : renderForm()}
            </div>
        </div>
    );
};

export default FeedbackFormModal;