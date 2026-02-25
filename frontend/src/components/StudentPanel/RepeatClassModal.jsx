// frontend/src/components/StudentPanel/RepeatClassModal.jsx
import React, { useState } from 'react';
import { X, Repeat, Calendar, Clock, Hash, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS_OF_WEEK = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const TIME_SLOTS = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM',
    '7:00 PM - 8:00 PM',
];

const RepeatClassModal = ({ course, isOpen, onClose, onSuccess }) => {
    const { getToken } = useAuth();

    // Pre-fill day from the past session's date
    const getInitialDay = () => {
        if (!course?.preferredDate) return 1;
        const parts = course.preferredDate.split('-').map(Number);
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const day = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        return day === 0 ? 1 : day; // Default to Monday if Sunday
    };

    // Pre-fill time from the past session
    const getInitialTime = () => {
        if (!course?.preferredTime) return TIME_SLOTS[0];
        // Find a matching time slot from our list
        const match = TIME_SLOTS.find(slot => slot.startsWith(course.preferredTime.split(' - ')[0]));
        return match || course.preferredTime || TIME_SLOTS[0];
    };

    const [dayOfWeek, setDayOfWeek] = useState(getInitialDay());
    const [timeSlot, setTimeSlot] = useState(getInitialTime());
    const [repeatWeeks, setRepeatWeeks] = useState(4);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [resultDates, setResultDates] = useState([]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

            const res = await axios.post(
                `${backendUrl}/api/user/repeat-classes`,
                {
                    courseId: course._id,
                    dayOfWeek,
                    timeSlot,
                    repeatWeeks,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setIsSuccess(true);
                setResultDates(res.data.dates || []);
                toast.success(res.data.message);
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create repeat classes. Please try again.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const courseName = course?.name?.split('(')[0]?.trim() || 'Class';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-5 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/80 hover:text-white transition"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Repeat size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Set Repeat Schedule</h2>
                                <p className="text-sm text-indigo-200">{courseName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-5">
                        {isSuccess ? (
                            /* Success State */
                            <div className="text-center py-4">
                                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Repeat Classes Created!</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {resultDates.length} class request(s) submitted. Your admin will assign a teacher and you'll receive Zoom links via email.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-3 text-left max-h-40 overflow-y-auto">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">Scheduled Dates:</p>
                                    {resultDates.map((date, i) => (
                                        <p key={i} className="text-sm text-gray-700 flex items-center gap-2 py-0.5">
                                            <Calendar size={12} className="text-indigo-400" />
                                            {new Date(date + 'T00:00:00').toLocaleDateString('en-AU', {
                                                weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </p>
                                    ))}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="mt-5 w-full py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            /* Form State */
                            <>
                                {/* Day of Week */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar size={16} className="text-indigo-500" />
                                        Day of Week
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {DAYS_OF_WEEK.map(d => (
                                            <button
                                                key={d.value}
                                                onClick={() => setDayOfWeek(d.value)}
                                                className={`py-2 px-3 rounded-lg text-sm font-medium transition border ${dayOfWeek === d.value
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                                    }`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Slot */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Clock size={16} className="text-indigo-500" />
                                        Time Slot
                                    </label>
                                    <select
                                        value={timeSlot}
                                        onChange={(e) => setTimeSlot(e.target.value)}
                                        className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    >
                                        {TIME_SLOTS.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Number of Weeks */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Hash size={16} className="text-indigo-500" />
                                        Number of Weeks
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min={1}
                                            max={12}
                                            value={repeatWeeks}
                                            onChange={(e) => setRepeatWeeks(parseInt(e.target.value, 10))}
                                            className="flex-1 accent-indigo-600"
                                        />
                                        <span className="text-lg font-bold text-indigo-600 w-10 text-center">
                                            {repeatWeeks}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {repeatWeeks} {repeatWeeks === 1 ? 'class' : 'classes'} will be requested, one per week on{' '}
                                        {DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'your chosen day'}.
                                    </p>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Repeat size={18} />
                                            Set {repeatWeeks} Repeat {repeatWeeks === 1 ? 'Class' : 'Classes'}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RepeatClassModal;
