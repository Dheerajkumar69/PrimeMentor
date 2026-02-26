// frontend/src/components/Booking/AssessmentDetailModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    X, User, Phone, Clock, Tag, Zap, BookOpen, Mail,
    UserPlus, Calendar, Loader2, CheckCircle, Video, ExternalLink, Search, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AssessmentDetailModal = ({ isOpen, onClose, booking, approvalMode = false, onApproved }) => {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [approving, setApproving] = useState(false);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [editingTeachers, setEditingTeachers] = useState(false);
    const [updatingTeachers, setUpdatingTeachers] = useState(false);
    const [addingNewMeeting, setAddingNewMeeting] = useState(false);

    // Fetch teachers when modal opens in approval mode OR when editing teachers
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

    useEffect(() => {
        if (isOpen && approvalMode) {
            fetchTeachers();
        }

        // Reset form when modal closes
        if (!isOpen) {
            setSelectedTeacherIds([]);
            setScheduledDate('');
            setScheduledTime('');
            setApproving(false);
            setTeacherSearch('');
            setEditingTeachers(false);
            setUpdatingTeachers(false);
            setAddingNewMeeting(false);
        }
    }, [isOpen, approvalMode]);

    if (!isOpen || !booking || !booking._id) return null;

    const toggleTeacher = (teacherId) => {
        setSelectedTeacherIds(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    const selectAllTeachers = () => {
        if (!teachers || teachers.length === 0) return;
        if (selectedTeacherIds.length === teachers.length) {
            setSelectedTeacherIds([]);
        } else {
            setSelectedTeacherIds(teachers.map(t => t._id));
        }
    };

    const filteredTeachers = teachers.filter(t => {
        const query = teacherSearch.toLowerCase();
        return (
            t.name?.toLowerCase().includes(query) ||
            t.email?.toLowerCase().includes(query) ||
            t.subject?.toLowerCase().includes(query)
        );
    });

    const handleStartEditTeachers = () => {
        if (editingTeachers || updatingTeachers) return; // Prevent double-click
        setAddingNewMeeting(false); // Mutually exclusive — close add-meeting form
        setEditingTeachers(true);
        // Pre-select currently assigned teachers (safe access)
        const currentIds = Array.isArray(booking.teacherIds) && booking.teacherIds.length > 0
            ? booking.teacherIds
            : (booking.teacherId ? [booking.teacherId] : []);
        setSelectedTeacherIds(currentIds);
        setTeacherSearch('');
        fetchTeachers();
    };

    const handleCancelEditTeachers = () => {
        setEditingTeachers(false);
        setSelectedTeacherIds([]);
        setTeacherSearch('');
    };

    const handleUpdateTeachers = async () => {
        if (updatingTeachers) return; // Prevent double-click
        if (selectedTeacherIds.length === 0) {
            toast.error('Please select at least one teacher.');
            return;
        }

        setUpdatingTeachers(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${BACKEND_URL}/api/admin/assessment/${booking._id}/update-teachers`,
                { teacherIds: selectedTeacherIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Teachers updated! Emails sent to ${selectedTeacherIds.length} teacher(s). 🎉`, {
                duration: 5000,
            });

            setEditingTeachers(false);
            if (onApproved) onApproved(); // Refresh the list
        } catch (err) {
            console.error('Update teachers failed:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || 'Failed to update teachers.';
            toast.error(errorMsg, { duration: 6000 });
        } finally {
            setUpdatingTeachers(false);
        }
    };

    const handleApprove = async (isFollowUp = false) => {
        if (approving) return; // Prevent double-click
        if (selectedTeacherIds.length === 0) {
            toast.error('Please select at least one teacher.');
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

            // ⛔ PRE-CHECK: Verify teacher availability before approving
            try {
                const availRes = await axios.post(
                    `${BACKEND_URL}/api/admin/check-teacher-availability`,
                    {
                        teacherIds: selectedTeacherIds,
                        scheduledDate,
                        scheduledTime,
                        durationMinutes: 30,
                        excludeAssessmentId: booking._id,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!availRes.data.allAvailable) {
                    const busy = availRes.data.teachers
                        .filter(t => !t.available)
                        .map(t => `${t.teacherName} (${t.conflicts.map(c => c.title + ' at ' + c.time).join(', ')})`)
                        .join('; ');
                    toast.error(`⚠️ Scheduling conflict: ${busy}. Choose a different time.`, { duration: 8000 });
                    setApproving(false);
                    return;
                }
            } catch (checkErr) {
                console.warn('Availability pre-check failed, proceeding with approval:', checkErr.message);
            }

            const endpoint = isFollowUp
                ? `${BACKEND_URL}/api/admin/assessment/${booking._id}/add-meeting`
                : `${BACKEND_URL}/api/admin/assessment/${booking._id}/approve`;

            await axios.put(
                endpoint,
                {
                    teacherIds: selectedTeacherIds,
                    scheduledDate,
                    scheduledTime,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success(
                isFollowUp
                    ? `New meeting added! Zoom created & emails sent. 🎉`
                    : `Assessment approved! Zoom meeting created & emails sent to ${selectedTeacherIds.length} teacher(s). 🎉`,
                { duration: 5000 }
            );

            setAddingNewMeeting(false);
            setSelectedTeacherIds([]);
            setScheduledDate('');
            setScheduledTime('');
            if (onApproved) onApproved();
        } catch (err) {
            console.error('Approval failed:', err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || 'Failed to approve assessment. Check server logs.';
            toast.error(errorMsg, { duration: 6000 });
        } finally {
            setApproving(false);
        }
    };

    const handleStartAddMeeting = () => {
        if (approving) return; // Don't open while approving
        setEditingTeachers(false); // Mutually exclusive — close edit-teachers form
        setAddingNewMeeting(true);
        setSelectedTeacherIds([]);
        setScheduledDate('');
        setScheduledTime('');
        setTeacherSearch('');
        fetchTeachers();
    };

    const handleCancelAddMeeting = () => {
        setAddingNewMeeting(false);
        setSelectedTeacherIds([]);
        setScheduledDate('');
        setScheduledTime('');
        setTeacherSearch('');
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

    // Reusable teacher multi-select checkbox list component
    const TeacherCheckboxList = () => (
        <div className="border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden">
            {/* Search + Select All Bar */}
            <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center flex-1 gap-2 px-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        className="w-full text-sm py-1 bg-transparent outline-none placeholder-gray-400"
                    />
                </div>
                <button
                    type="button"
                    onClick={selectAllTeachers}
                    className="text-xs px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 font-medium transition whitespace-nowrap"
                >
                    {selectedTeacherIds.length === teachers.length ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            {/* Teacher Checkbox List */}
            <div className="max-h-48 overflow-y-auto">
                {filteredTeachers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No teachers found.</p>
                ) : (
                    filteredTeachers.map((t) => {
                        const isSelected = selectedTeacherIds.includes(t._id);
                        return (
                            <label
                                key={t._id}
                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 ${isSelected ? 'bg-green-50' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleTeacher(t._id)}
                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {t.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {t.email} {t.subject ? `• ${t.subject}` : ''}
                                    </p>
                                </div>
                                {isSelected && (
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                )}
                            </label>
                        );
                    })
                )}
            </div>
        </div>
    );

    const isAlreadyScheduled = booking.status === 'Scheduled' || booking.status === 'Completed';

    // Build a unified meetings list — use meetings[] if present, fallback to flat fields for legacy data
    const resolvedMeetings = (() => {
        if (Array.isArray(booking.meetings) && booking.meetings.length > 0) {
            return booking.meetings;
        }
        // Legacy: single meeting from flat fields
        if (booking.zoomMeetingLink) {
            return [{
                teacherNames: Array.isArray(booking.teacherNames) && booking.teacherNames.length > 0
                    ? booking.teacherNames : (booking.teacherName ? [booking.teacherName] : []),
                scheduledDate: booking.scheduledDate,
                scheduledTime: booking.scheduledTime,
                zoomMeetingLink: booking.zoomMeetingLink,
                zoomStartLink: booking.zoomStartLink,
                createdAt: booking.updatedAt,
            }];
        }
        return [];
    })();

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
                                {resolvedMeetings.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                                        {resolvedMeetings.length} meeting{resolvedMeetings.length > 1 ? 's' : ''}
                                    </span>
                                )}
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
                            {booking.studentPhone && (
                                <ContactItem icon={Phone} title="Student Phone" value={booking.studentPhone} type="tel" />
                            )}
                            {booking.country && (
                                <ContactItem icon={User} title="Country" value={booking.country} />
                            )}
                            {booking.state && (
                                <ContactItem icon={User} title="State / Province" value={booking.state} />
                            )}
                            {booking.postalCode && (
                                <ContactItem icon={User} title="Postal Code" value={booking.postalCode} />
                            )}
                            {booking.studentTimezone && booking.studentTimezone !== 'UTC' && (
                                <div className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 text-indigo-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-500">Student Timezone</p>
                                        <p className="font-semibold text-gray-800 text-sm">{booking.studentTimezone}</p>
                                    </div>
                                </div>
                            )}
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

                {/* ===================== ALL MEETINGS (when already approved) ===================== */}
                {isAlreadyScheduled && resolvedMeetings.length > 0 && (
                    <div className="mt-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <h3 className="font-bold text-base text-blue-800 flex items-center mb-4 pb-2 border-b border-blue-200">
                            <Video className="w-5 h-5 mr-2" /> Scheduled Meetings ({resolvedMeetings.length})
                        </h3>

                        <div className="space-y-4">
                            {resolvedMeetings.map((meeting, idx) => (
                                <div key={meeting._id || idx} className="p-4 bg-white border border-blue-200 rounded-xl shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                            Meeting #{idx + 1}
                                        </span>
                                        {meeting.createdAt && (
                                            <span className="text-xs text-gray-400">
                                                Created: {new Date(meeting.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium text-gray-700">Teacher(s):</span>
                                            <span className="font-semibold text-gray-900">
                                                {Array.isArray(meeting.teacherNames) && meeting.teacherNames.length > 0
                                                    ? meeting.teacherNames.join(', ')
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium text-gray-700">Date & Time:</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatDate(meeting.scheduledDate)} at {meeting.scheduledTime} (IST)
                                            </span>
                                        </div>
                                        {meeting.zoomMeetingLink && (
                                            <div className="flex items-center gap-2">
                                                <Video className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium text-gray-700">Zoom:</span>
                                                <a
                                                    href={meeting.zoomMeetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    Join Meeting <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons row */}
                        {booking.status === 'Scheduled' && !editingTeachers && !addingNewMeeting && (
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleStartAddMeeting}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition font-medium text-sm"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Add Another Meeting
                                </button>
                                <button
                                    onClick={handleStartEditTeachers}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition font-medium text-sm"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Change Teacher(s)
                                </button>
                            </div>
                        )}

                        {/* ====== ADD ANOTHER MEETING FORM ====== */}
                        {addingNewMeeting && (
                            <div className="mt-4 p-4 bg-white border-2 border-green-300 rounded-xl">
                                <h4 className="font-bold text-sm text-green-700 flex items-center mb-3">
                                    <Calendar className="w-4 h-4 mr-2" /> Schedule New Meeting
                                    {selectedTeacherIds.length > 0 && (
                                        <span className="ml-2 text-green-600 font-bold">
                                            ({selectedTeacherIds.length} teacher{selectedTeacherIds.length > 1 ? 's' : ''} selected)
                                        </span>
                                    )}
                                </h4>

                                <div className="space-y-4">
                                    {/* Teacher Select */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher(s) *</label>
                                        {loadingTeachers ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Loading teachers...
                                            </div>
                                        ) : (
                                            <TeacherCheckboxList />
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label htmlFor="new-meeting-date" className="block text-sm font-medium text-gray-700 mb-1">
                                            Meeting Date (IST) *
                                        </label>
                                        <input
                                            id="new-meeting-date"
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-gray-800"
                                        />
                                    </div>

                                    {/* Time */}
                                    <div>
                                        <label htmlFor="new-meeting-time" className="block text-sm font-medium text-gray-700 mb-1">
                                            Meeting Time (IST) *
                                        </label>
                                        <input
                                            id="new-meeting-time"
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm text-gray-800"
                                        />
                                    </div>

                                    {/* Submit / Cancel */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(true)}
                                            disabled={approving || selectedTeacherIds.length === 0 || !scheduledDate || !scheduledTime}
                                            className="flex-1 flex justify-center items-center py-2.5 px-4 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {approving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Creating Zoom Meeting...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Create Meeting & Send Emails
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleCancelAddMeeting}
                                            disabled={approving}
                                            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ====== EDIT TEACHERS FORM (inline, shown when editing) ====== */}
                        {editingTeachers && (
                            <div className="mt-4 p-4 bg-white border-2 border-orange-300 rounded-xl">
                                <h4 className="font-bold text-sm text-orange-700 flex items-center mb-3">
                                    <Edit3 className="w-4 h-4 mr-2" /> Update Assigned Teacher(s)
                                    {selectedTeacherIds.length > 0 && (
                                        <span className="ml-2 text-green-600 font-bold">
                                            ({selectedTeacherIds.length} selected)
                                        </span>
                                    )}
                                </h4>

                                {loadingTeachers ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading teachers...
                                    </div>
                                ) : (
                                    <TeacherCheckboxList />
                                )}

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleUpdateTeachers}
                                        disabled={updatingTeachers || selectedTeacherIds.length === 0}
                                        className="flex-1 flex justify-center items-center py-2.5 px-4 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {updatingTeachers ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Save & Send Emails
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCancelEditTeachers}
                                        disabled={updatingTeachers}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===================== APPROVAL FORM ===================== */}
                {approvalMode && !isAlreadyScheduled && (
                    <div className="mt-6 p-5 bg-green-50 border-2 border-green-200 rounded-xl">
                        <h3 className="font-bold text-lg text-green-800 flex items-center mb-4 pb-2 border-b border-green-300">
                            <UserPlus className="w-5 h-5 mr-2" /> Assign Teacher(s) & Schedule
                        </h3>

                        <div className="space-y-4">
                            {/* Teacher Multi-Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Teacher(s) *
                                    {selectedTeacherIds.length > 0 && (
                                        <span className="ml-2 text-green-600 font-bold">
                                            ({selectedTeacherIds.length} selected)
                                        </span>
                                    )}
                                </label>
                                {loadingTeachers ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading teachers...
                                    </div>
                                ) : (
                                    <TeacherCheckboxList />
                                )}
                            </div>

                            {/* Date Picker */}
                            <div>
                                <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Assessment Date (IST) *
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
                                    Assessment Time (IST — Indian Standard Time) *
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
                                onClick={() => handleApprove(false)}
                                disabled={approving || selectedTeacherIds.length === 0 || !scheduledDate || !scheduledTime}
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
                                        {selectedTeacherIds.length > 0 && (
                                            <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {selectedTeacherIds.length} teacher{selectedTeacherIds.length > 1 ? 's' : ''}
                                            </span>
                                        )}
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