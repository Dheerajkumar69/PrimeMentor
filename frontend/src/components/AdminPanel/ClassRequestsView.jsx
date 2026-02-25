// frontend/src/components/AdminPanel/ClassRequestsView.jsx

import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, Clock, Users } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ClassRequestsView() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('pending');

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                const [pendingRes, acceptedRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/api/admin/pending-requests`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${BACKEND_URL}/api/admin/accepted-requests`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                setPendingRequests(pendingRes.data);
                setAcceptedRequests(acceptedRes.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load class requests.');
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader className="w-6 h-6 text-orange-500 animate-spin mr-2" />
                <span className="text-gray-600">Loading class requests...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-10 text-red-600 font-medium">{error}</div>;
    }

    const requests = activeView === 'pending' ? pendingRequests : acceptedRequests;

    return (
        <div>
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveView('pending')}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition ${activeView === 'pending'
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <Clock className="w-4 h-4 mr-1" />
                    Pending ({pendingRequests.length})
                </button>
                <button
                    onClick={() => setActiveView('accepted')}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition ${activeView === 'accepted'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Accepted ({acceptedRequests.length})
                </button>
            </div>

            {requests.length === 0 ? (
                <div className="text-center p-10 text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    No {activeView} class requests found.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <th className="px-4 py-3 border-b">Student</th>
                                <th className="px-4 py-3 border-b">Course</th>
                                <th className="px-4 py-3 border-b">Subject</th>
                                <th className="px-4 py-3 border-b">Type</th>
                                <th className="px-4 py-3 border-b">Date</th>
                                <th className="px-4 py-3 border-b">Time</th>
                                <th className="px-4 py-3 border-b">Status</th>
                                {activeView === 'accepted' && <th className="px-4 py-3 border-b">Teacher</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req) => (
                                <tr key={req._id} className="hover:bg-gray-50 border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-800">{req.studentName}</td>
                                    <td className="px-4 py-3 text-gray-600">{req.courseTitle}</td>
                                    <td className="px-4 py-3 text-gray-600">{req.subject || 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.purchaseType === 'STARTER_PACK'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {req.purchaseType === 'STARTER_PACK' ? 'Starter Pack' : 'Trial'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{req.preferredDate || 'TBD'}</td>
                                    <td className="px-4 py-3 text-gray-600">{req.scheduleTime || 'TBD'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-green-100 text-green-700'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    {activeView === 'accepted' && (
                                        <td className="px-4 py-3 text-gray-600">
                                            {req.teacherId?.name || 'N/A'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
