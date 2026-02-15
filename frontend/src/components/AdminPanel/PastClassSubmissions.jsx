// frontend/src/components/AdminPanel/PastClassSubmissions.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BookOpenText, Clock, Calendar, CheckCircle, AlertTriangle, History } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const PastClassSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubmissions = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            setError('Admin not authenticated. Please log in.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(`${BACKEND_URL}/api/admin/past-classes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            setSubmissions(response.data);
        } catch (err) {
            console.error('Error fetching past class submissions:', err);
            setError(err.response?.data?.message || 'Failed to fetch class submissions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    
    const PastClassCard = ({ submission }) => (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:shadow-md transition duration-150">
            <div className="flex justify-between items-start border-b pb-2 mb-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <BookOpenText className="w-5 h-5 mr-2 text-blue-500" />
                    {submission.topic}
                </h3>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    NEW SUBMISSION
                </span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Teacher:</strong> <span className='font-medium text-gray-800'>{submission.teacherName}</span></p>
                <p><strong>Student:</strong> <span className='font-medium text-gray-800'>{submission.studentName}</span></p>
                
                <div className='flex items-center pt-1'>
                    <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                    <p><strong>Date:</strong> {formatDate(submission.sessionDate)}</p>
                </div>
                
                <div className='flex items-center'>
                    <Clock className="w-4 h-4 mr-2 text-green-500" />
                    <p><strong>Time/Duration:</strong> {submission.sessionTime} ({submission.duration})</p>
                </div>
                
                <p className="pt-2 text-xs text-gray-500">
                    <span className="font-semibold">Sub-Topic:</span> {submission.subTopic || 'Not provided'}
                </p>
                
                <p className="text-xs text-right text-gray-400 pt-2 border-t mt-2">
                    Submitted: {formatDate(submission.submissionDate)}
                </p>
            </div>
        </div>
    );

    if (loading) {
        return <div className="text-center py-10 text-gray-500">Loading past class submissions...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-10 bg-red-50 border border-red-300 rounded-lg mx-auto max-w-lg">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p className="text-red-700 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <History className="w-6 h-6 mr-3 text-red-500" />
                Teacher Past Class Submissions
            </h2>
            
            <div className="mb-4 text-gray-600 font-medium">
                Total Submissions: <span className="text-xl font-bold text-blue-600">{submissions.length}</span>
            </div>

            {submissions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                    <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-3" />
                    <p className="text-lg text-gray-600 font-medium">No past class submissions found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {submissions.map((submission) => (
                        <PastClassCard key={submission._id} submission={submission} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PastClassSubmissions;