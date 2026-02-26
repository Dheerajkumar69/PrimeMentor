// frontend/src/components/StudentPanel/RepeatClassModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { X, Repeat, Calendar, Clock, Hash, Loader2, CheckCircle2, DollarSign, CreditCard } from 'lucide-react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext.jsx';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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

// Extract year level from course name like "All - Year 3" or "Maths (Year 10)"
function extractYearLevel(courseName) {
    const match = (courseName || '').match(/Year\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
}

// Get session price for a given year level from pricing ranges
function getSessionPriceForYear(classRanges, yearLevel) {
    if (!yearLevel || !classRanges) return null;
    for (const [range, prices] of Object.entries(classRanges)) {
        const [low, high] = range.split('-').map(Number);
        if (yearLevel >= low && yearLevel <= high) {
            return prices.sessionPrice;
        }
    }
    return null;
}

const RepeatClassModal = ({ course, isOpen, onClose, onSuccess }) => {
    const { studentToken } = useContext(AppContext);

    // Pre-fill day from the past session's date
    const getInitialDay = () => {
        if (!course?.preferredDate) return 1;
        const parts = course.preferredDate.split('-').map(Number);
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const day = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        return day === 0 ? 1 : day;
    };

    // Pre-fill time from the past session
    const getInitialTime = () => {
        if (!course?.preferredTime) return TIME_SLOTS[0];
        const match = TIME_SLOTS.find(slot => slot.startsWith(course.preferredTime.split(' - ')[0]));
        return match || course.preferredTime || TIME_SLOTS[0];
    };

    const [dayOfWeek, setDayOfWeek] = useState(getInitialDay());
    const [timeSlot, setTimeSlot] = useState(getInitialTime());
    const [repeatWeeks, setRepeatWeeks] = useState(4);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pricing state
    const [sessionPrice, setSessionPrice] = useState(null);
    const [pricingError, setPricingError] = useState(null);
    const [pricingLoading, setPricingLoading] = useState(true);

    // Fetch pricing on mount
    useEffect(() => {
        if (!isOpen) return;

        const fetchPricing = async () => {
            setPricingLoading(true);
            setPricingError(null);
            try {
                const res = await axios.get(`${BACKEND_URL}/api/user/pricing`);
                const classRanges = res.data?.classRanges;
                const yearLevel = extractYearLevel(course?.name);

                if (!yearLevel) {
                    setPricingError('Could not determine year level for pricing.');
                    return;
                }

                const price = getSessionPriceForYear(classRanges, yearLevel);
                if (!price || price <= 0) {
                    setPricingError(`No pricing found for Year ${yearLevel}.`);
                    return;
                }

                setSessionPrice(price);
            } catch (err) {
                console.error('Failed to fetch pricing:', err);
                setPricingError('Could not load pricing. Please try again.');
            } finally {
                setPricingLoading(false);
            }
        };

        fetchPricing();
    }, [isOpen, course?.name]);

    const totalAmount = sessionPrice ? sessionPrice * repeatWeeks : 0;

    const handleSubmit = async () => {
        if (!sessionPrice || totalAmount <= 0) {
            toast.error('Unable to calculate pricing. Please try again.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post(
                `${BACKEND_URL}/api/user/initiate-repeat-payment`,
                { courseId: course._id, dayOfWeek, timeSlot, repeatWeeks },
                { headers: { Authorization: `Bearer ${studentToken}` } }
            );

            if (res.data.success && res.data.redirectUrl) {
                toast.success('Redirecting to payment...');
                // Redirect to eWAY payment page
                window.location.href = res.data.redirectUrl;
            } else {
                toast.error(res.data.message || 'Failed to initiate payment.');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to initiate payment. Please try again.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const courseName = course?.name?.split('(')[0]?.trim() || 'Class';
    const yearLevel = extractYearLevel(course?.name);

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
                                {repeatWeeks} {repeatWeeks === 1 ? 'class' : 'classes'} will be scheduled, one per week on{' '}
                                {DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'your chosen day'}.
                            </p>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign size={18} className="text-green-600" />
                                <span className="text-sm font-bold text-green-800">Payment Summary</span>
                            </div>
                            {pricingLoading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 size={14} className="animate-spin" />
                                    Loading pricing...
                                </div>
                            ) : pricingError ? (
                                <p className="text-sm text-red-500">{pricingError}</p>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Session price {yearLevel ? `(Year ${yearLevel})` : ''}</span>
                                        <span>${sessionPrice?.toFixed(2)} AUD</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Number of sessions</span>
                                        <span>× {repeatWeeks}</span>
                                    </div>
                                    <hr className="border-green-200 my-2" />
                                    <div className="flex justify-between text-base font-bold text-green-800">
                                        <span>Total</span>
                                        <span>${totalAmount.toFixed(2)} AUD</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || pricingLoading || !!pricingError || totalAmount <= 0}
                            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Redirecting to payment...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={18} />
                                    Pay ${totalAmount > 0 ? totalAmount.toFixed(2) : '...'} & Set {repeatWeeks} Repeat {repeatWeeks === 1 ? 'Class' : 'Classes'}
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-400">
                            You'll be redirected to our secure payment gateway (eWAY) to complete payment.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RepeatClassModal;
