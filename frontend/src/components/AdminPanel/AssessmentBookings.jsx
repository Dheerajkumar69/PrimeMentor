// frontend/src/components/AdminPanel/AssessmentBookings.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ClipboardList, Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock, ChevronDown, UserPlus } from 'lucide-react';
import AssessmentDetailModal from '../Booking/AssessmentDetailModal.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AssessmentBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [approvalMode, setApprovalMode] = useState(false);

    const fetchBookings = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            setError('Authentication token missing. Cannot fetch data.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${BACKEND_URL}/api/assessments`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setBookings(response.data);
        } catch (err) {
            console.error('Failed to fetch assessment bookings:', err.response?.data || err.message);
            setError('Failed to load bookings. Your session may have expired.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const openDetailModal = (booking, isApproval = false) => {
        setSelectedBooking(booking);
        setApprovalMode(isApproval);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedBooking(null);
        setApprovalMode(false);
    };

    const handleApproved = () => {
        closeDetailModal();
        fetchBookings();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'New':
                return 'bg-red-100 text-red-800';
            case 'Contacted':
                return 'bg-blue-100 text-blue-800';
            case 'Scheduled':
                return 'bg-yellow-100 text-yellow-800';
            case 'Completed':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="text-center p-10">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                <p className="mt-2 text-gray-600">Loading assessment enquiries...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-10 bg-red-50 border-l-4 border-red-500 text-red-700">
                <AlertTriangle className="w-6 h-6 inline mr-2" />
                <span className="font-semibold">Error:</span> {error}
                <button onClick={fetchBookings} className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center mt-2">
                    <RefreshCw className="w-4 h-4 mr-1" /> Try Refreshing
                </button>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="text-center p-10 bg-green-50 border-l-4 border-green-500 text-green-700">
                <CheckCircle className="w-6 h-6 inline mr-2" />
                <span className="font-semibold">No New Enquiries!</span> The assessment bookings list is currently empty.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AssessmentDetailModal
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
                booking={selectedBooking}
                approvalMode={approvalMode}
                onApproved={handleApproved}
            />

            <h2 className="text-2xl font-bold text-gray-700 flex items-center">
                <ClipboardList className='inline w-6 h-6 mr-2 text-orange-500' /> All Free Assessment Enquiries ({bookings.length})
            </h2>
            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student/Year/Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent/Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                            <tr
                                key={booking._id}
                                className="hover:bg-orange-50/50 transition-colors duration-150"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <Clock className="w-4 h-4 inline mr-1 text-gray-400" />
                                    {formatDate(booking.createdAt)}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => openDetailModal(booking)}
                                        className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors duration-100 cursor-pointer text-left"
                                    >
                                        <span className='font-bold'>{booking.studentFirstName} {booking.studentLastName}</span>
                                    </button>
                                    <div className="text-sm text-gray-500">
                                        Year {booking.class} / {booking.subject}
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{booking.parentFirstName} {booking.parentLastName}</div>
                                    <div className="text-xs text-blue-500 truncate">{booking.parentEmail}</div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                    {Array.isArray(booking.meetings) && booking.meetings.length > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                                            {booking.meetings.length} mtg{booking.meetings.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="flex items-center px-3 py-1 bg-indigo-500 text-white rounded-md shadow-sm hover:bg-indigo-600 transition"
                                            onClick={() => openDetailModal(booking)}
                                        >
                                            <ChevronDown className='w-4 h-4 mr-1' /> View All
                                        </button>
                                        {(booking.status === 'New' || booking.status === 'Contacted') && (
                                            <button
                                                className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition"
                                                onClick={() => openDetailModal(booking, true)}
                                            >
                                                <UserPlus className='w-4 h-4 mr-1' /> Approve
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssessmentBookings;