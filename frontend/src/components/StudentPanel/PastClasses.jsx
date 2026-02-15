// frontend/src/components/StudentPanel/PastClasses.jsx
import React, { useState } from 'react';
import { Archive, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import FeedbackFormModal from './FeedbackFormModal.jsx'; // 🛑 NEW IMPORT
import { formatDate } from '../../utils/dateUtils.js';

const PastClasses = ({ courses, onFeedbackSubmit }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const handleOpenModal = (course) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCourse(null);
    };

    if (courses.length === 0) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center text-gray-500">
                <Archive size={30} className="mx-auto mb-3" />
                <p className="font-semibold">No past classes recorded yet.</p>
                <p className="text-sm">Keep up the great work on your upcoming sessions!</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {courses.map((course, index) => {
                    // Check temporary local state from MyCourses.jsx
                    const feedbackGiven = course.feedbackSubmitted; 

                    return (
                        <div 
                            key={course._id || index} 
                            className="flex p-4 bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition duration-200"
                        >
                            <div className="flex-shrink-0 mr-4">
                                <CheckCircle size={24} className="text-green-500" />
                            </div>
                            <div className="flex-grow">
                                <h4 className="text-lg font-bold text-gray-800">{course.name}</h4>
                                <p className="text-sm text-gray-600 mt-1 flex items-center">
                                    <Clock size={14} className="mr-1 text-gray-400" />
                                    Completed on: <span className="font-semibold ml-1">{formatDate(course.preferredDate)} at {course.preferredTime}</span>
                                </p>
                                <div className="text-xs mt-2 text-gray-500">
                                    Teacher: <span className="font-medium text-gray-700">{course.teacher || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="flex-shrink-0 text-right self-center">
                                {feedbackGiven ? (
                                    <button
                                        disabled
                                        className="flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-green-100 text-green-700 cursor-not-allowed"
                                    >
                                        <CheckCircle size={16} className="mr-1" /> Submitted
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleOpenModal(course)}
                                        className="flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md"
                                    >
                                        <MessageSquare size={16} className="mr-1" /> Give Feedback
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Feedback Modal */}
            {isModalOpen && selectedCourse && (
                <FeedbackFormModal
                    course={selectedCourse}
                    onClose={handleCloseModal}
                    onSubmissionSuccess={onFeedbackSubmit} // Pass handler up to MyCourses.jsx
                />
            )}
        </>
    );
};

export default PastClasses;