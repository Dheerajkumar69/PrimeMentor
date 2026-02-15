// frontend/src/components/Booking/AssessmentDetailModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    X, User, Phone, Clock, Tag, Zap, BookOpen, Mail,
    UserPlus, Calendar, Loader2, CheckCircle, Video, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AssessmentDetailModal = ({ isOpen, onClose, booking, approvalMode = false, onApproved }) => {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [approving, setApproving] = useState(false);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    // Fetch teachers when modal opens in approval mode
    useEffect(() => {
        if (isOpen && approvalMode) {
            const fetchTeachers = async () => {
                setLoadingTeachers(true);
                try {
                    const token = localStorage.getItem('adminToken');
                    const response = await axios.get(`${BACKEND_URL}/api/admin/teachers`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setTeachers(response.data || []);
                } catch (err) {
                    console.error('Failed to fetch teachers:', err);
                    toast.error('Failed to load teachers list.');
                } finally {
                    setLoadingTeachers(false);
                }
            };
            fetchTeachers();
        }

        // Reset form when modal closes
        if (!isOpen) {
            setSelectedTeacherId('');
            setScheduledDate('');
            setScheduledTime('');
            setApproving(false);
        }
    }, [isOpen, approvalMode]);

    if (!isOpen || !booking) return null;

    const handleApprove = async () => {
        if (!selectedTeacherId) {
            toast.error('Please select a teacher.');
            return;
        }
        if (!scheduledDate) {
            toast.error('Please select a date.');
            return;
        }
        if (!scheduledTime) {
            toast.error('Please select a time.');
            return;
        }

        setApproving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.put(
                `${BACKEND_URL}/api/admin/assessment/${booking._id}/approve`,
                {
                    teacherId: selectedTeacherId,
                    scheduledDate,
                    scheduledTime,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success('Assessment approved! Zoom meeting created & emails sent. 🎉', {
                duration: 5000,
            });

            if (onApproved) onApproved();
        } catch (err) {
            console.error('Approval failed:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || 'Failed to approve assessment. Check server logs.';
            toast.error(errorMsg, { duration: 6000 });
        } finally {
            setApproving(false);
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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'New':
                return 'bg-red-600 text-white ring-2 ring-red-400';
            case 'Scheduled':
                return 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-600';
            case 'Contacted':
                return 'bg-blue-600 text-white ring-2 ring-blue-400';
            case 'Completed':
                return 'bg-green-600 text-white ring-2 ring-green-400';
            default:
                return 'bg-gray-600 text-white ring-2 ring-gray-400';
        }
    };

    const PrimaryInfoItem = ({ icon: Icon, title, value }) => (
        <div className="flex flex-col space-y-1 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm min-h-[90px] justify-center">
            <h4 className="flex items-center text-xs font-medium text-gray-500">
                <Icon className="w-4 h-4 mr-1 text-orange-500" /> {title}
            </h4>
            <p className="text-sm font-semibold text-gray-900 break-words leading-tight">
                {value}
            </p>
        </div>
    );

    const ContactItem = ({ icon: Icon, title, value, type }) => {
        const isActionable = type === 'email' || type === 'tel';
        return (
            <div className="flex flex-col space-y-1 p-3 border border-gray-200 rounded-xl bg-white shadow-sm transition-shadow duration-200">
                <h4 className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                    <Icon className="w-4 h-4 mr-2 text-indigo-500" /> {title}
                </h4>
                <div className='pl-6 text-sm'>
                    <p className="text-gray-900 font-medium">{value}</p>
                    {value && isActionable && (
                        <a
                            href={type === 'email' ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(value)}` : `tel:${value}`}
                            target={type === 'email' ? '_blank' : undefined}
                            rel={type === 'email' ? 'noopener noreferrer' : undefined}
                            className="text-xs text-blue-500 hover:underline hover:text-blue-700 transition-colors"
                        >
                            {type === 'email' ? 'Send Email' : 'Call Now'}
                        </a>
                    )}
                </div>
            </div>
        );
    };

    const isAlreadyScheduled = booking.status === 'Scheduled' || booking.status === 'Completed';

    return (
        <div className="fixed inset-0 z-50 h-full w-full backdrop-blur-md bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 relative transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] overflow-y-auto border-t-4 border-orange-600">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition p-2 rounded-full hover:bg-gray-100 bg-white shadow-lg z-20 ring-1 ring-gray-300"
                    aria-label="Close details"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <header className="text-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center justify-center">
                        <Zap className='w-7 h-7 mr-3 text-orange-600' />
                        {approvalMode ? 'Approve Assessment' : 'Assessment Request Overview'}
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Details for <span className='font-bold text-indigo-700'>{booking.studentFirstName} {booking.studentLastName}</span>
                    </p>
                </header>

                {/* Primary Data Section */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className='p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm'>
                            <span className="text-xs font-medium text-gray-500">Status</span>
                            <div className='mt-1'>
                                <span className={`px-3 py-1 text-sm font-extrabold rounded-full ${getStatusStyle(booking.status)} shadow-md`}>
                                    {booking.status}
                                </span>
                            </div>
                        </div>
                        <PrimaryInfoItem icon={BookOpen} title="Subject Interest" value={booking.subject} />
                    </div>
                    <div className="space-y-4">
                        <div className='p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-sm'>
                            <span className="text-xs font-medium text-gray-500">Submitted</span>
                            <p className="flex items-center text-sm font-semibold text-gray-900 mt-1">
                                <Clock className="w-4 h-4 mr-1 text-orange-500" />
                                {formatDate(booking.createdAt)}
                            </p>
                        </div>
                        <PrimaryInfoItem icon={User} title="Student Year Level" value={`Year ${booking.class}`} />
                    </div>
                </div>

                {/* Contact Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm border-t ">
                    <div className="p-4 bg-indigo-50/10 rounded-xl">
                        <h3 className="font-bold text-base text-indigo-800 flex items-center mb-4 pb-2 border-b border-indigo-200">
                            <User className="w-5 h-5 mr-2" /> Student Contact
                        </h3>
                        <div className='space-y-4'>
                            <ContactItem icon={User} title="Student Name" value={`${booking.studentFirstName} ${booking.studentLastName}`} />
                            <ContactItem icon={Mail} title="Student Email" value={booking.studentEmail} type="email" />
                        </div>
                    </div>
                    <div className="p-4 bg-orange-50/10 rounded-xl">
                        <h3 className="font-bold text-base text-orange-800 flex items-center mb-4 pb-2 border-b border-orange-200">
                            <Phone className="w-5 h-5 mr-2" /> Parent Contact
                        </h3>
                        <div className='space-y-4'>
                            <ContactItem icon={User} title="Parent Name" value={`${booking.parentFirstName} ${booking.parentLastName}`} />
                            <ContactItem icon={Mail} title="Parent Email" value={booking.parentEmail} type="email" />
                            <ContactItem icon={Phone} title="Contact Number" value={booking.contactNumber} type="tel" />
                        </div>
                    </div>
                </div>

                {/* ===================== SCHEDULED INFO (when already approved) ===================== */}
                {isAlreadyScheduled && booking.zoomMeetingLink && (
                    <div className="mt-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <h3 className="font-bold text-base text-blue-800 flex items-center mb-4 pb-2 border-b border-blue-200">
                            <Video className="w-5 h-5 mr-2" /> Scheduled Session Details
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-gray-700">Assigned Teacher:</span>
                                <span className="font-semibold text-gray-900">{booking.teacherName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-gray-700">Date & Time:</span>
                                <span className="font-semibold text-gray-900">
                                    {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-gray-700">Zoom Link:</span>
                                <a
                                    href={booking.zoomMeetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
                                >
                                    Join Meeting <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== APPROVAL FORM ===================== */}
                {approvalMode && !isAlreadyScheduled && (
                    <div className="mt-6 p-5 bg-green-50 border-2 border-green-200 rounded-xl">
                        <h3 className="font-bold text-lg text-green-800 flex items-center mb-4 pb-2 border-b border-green-300">
                            <UserPlus className="w-5 h-5 mr-2" /> Assign Teacher & Schedule
                        </h3>

                        <div className="space-y-4">
                            {/* Teacher Dropdown */}
                            <div>
                                <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Teacher *
                                </label>
                                {loadingTeachers ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading teachers...
                                    </div>
                                ) : (
                                    <select
                                        id="teacher-select"
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-gray-800"
                                    >
                                        <option value="">— Choose a teacher —</option>
                                        {teachers.map((t) => (
                                            <option key={t._id} value={t._id}>
                                                {t.name} ({t.email}) {t.subject ? `— ${t.subject}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Date Picker */}
                            <div>
                                <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Assessment Date *
                                </label>
                                <input
                                    id="schedule-date"
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-gray-800"
                                />
                            </div>

                            {/* Time Picker */}
                            <div>
                                <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-1">
                                    Assessment Time (Sydney/NSW) *
                                </label>
                                <input
                                    id="schedule-time"
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-gray-800"
                                />
                            </div>

                            {/* Approve Button */}
                            <button
                                onClick={handleApprove}
                                disabled={approving || !selectedTeacherId || !scheduledDate || !scheduledTime}
                                className="w-full flex justify-center items-center py-3 px-6 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed font-bold text-lg"
                            >
                                {approving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Creating Zoom Meeting & Sending Emails...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Approve & Create Zoom Meeting
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer className="pt-4 mt-4 border-t text-center">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-gray-800 text-white rounded-xl shadow-lg hover:bg-gray-900 transition transform hover:scale-[1.02] font-semibold text-lg"
                    >
                        Close Details
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AssessmentDetailModal;