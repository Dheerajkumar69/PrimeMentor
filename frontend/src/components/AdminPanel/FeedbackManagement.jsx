// frontend/src/components/AdminPanel/FeedbackManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Star, Smile, TrendingUp, BookOpen } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const FeedbackManagement = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFeedback = async () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('Admin token missing. Please log in.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${BACKEND_URL}/api/admin/feedback`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setFeedbackList(response.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch feedback:', err.response?.data || err.message);
                setError(err.response?.data?.message || 'Failed to fetch feedback data.');
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'bg-green-100 text-green-700';
        if (rating >= 3) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    if (loading) return <div className="p-6 text-center text-indigo-600">Loading Student Feedback...</div>;
    if (error) return <div className="p-6 text-center text-red-600 font-medium">{error}</div>;

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" /> All Student Feedback ({feedbackList.length})
            </h2>

            <div className="space-y-6">
                {feedbackList.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500 font-semibold">No feedback submissions found yet.</p>
                    </div>
                ) : (
                    feedbackList.map((feedback) => (
                        <div key={feedback._id} className="border border-gray-300 rounded-xl p-5 shadow-lg bg-white">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3 border-b pb-3">
                                <div>
                                    <p className="text-lg font-bold text-indigo-700">{feedback.courseName}</p>
                                    <p className="text-sm text-gray-600">
                                        Teacher: <span className="font-semibold">{feedback.teacherName}</span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Class: {new Date(feedback.sessionDate).toLocaleDateString()} at {feedback.sessionTime}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-500">
                                        Submitted: {new Date(feedback.submittedAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Student: {feedback.studentName} ({feedback.studentEmail})
                                    </p>
                                </div>
                            </div>

                            {/* Ratings Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {[
                                    { label: 'Clarity', rating: feedback.clarityRating, icon: <Star size={16} /> },
                                    { label: 'Engagement', rating: feedback.engagingRating, icon: <Smile size={16} /> },
                                    { label: 'Content', rating: feedback.contentRating, icon: <BookOpen size={16} /> },
                                ].map((item, i) => (
                                    <div key={i} className={`p-3 rounded-lg ${getRatingColor(item.rating)}`}>
                                        <div className="text-xs font-semibold uppercase">{item.label}</div>
                                        <div className="flex items-center text-lg font-bold mt-1">
                                            {item.rating} / 5
                                        </div>
                                    </div>
                                ))}
                                <div className={`p-3 rounded-lg bg-purple-100 text-purple-700`}>
                                    <div className="text-xs font-semibold uppercase">Overall Sat.</div>
                                    <div className="flex items-center text-lg font-bold mt-1">
                                        {feedback.overallSatisfaction}%
                                    </div>
                                </div>
                            </div>

                            {/* Text Comments */}
                            <div className="space-y-3 pt-3 border-t border-gray-100">
                                <TextSection title="👍 What was Liked?" content={feedback.likes} />
                                <TextSection title="🛠️ What Can Be Improved?" content={feedback.improvements} />
                                <TextSection title="💬 Additional Comments" content={feedback.additionalComments} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Helper component for displaying text sections
const TextSection = ({ title, content }) => (
    <div>
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <p className="text-sm text-gray-600 italic mt-1 border-l-2 border-gray-200 pl-2">
            {content || 'No specific comment provided.'}
        </p>
    </div>
);

export default FeedbackManagement;