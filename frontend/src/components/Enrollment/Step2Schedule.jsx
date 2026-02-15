// frontend/src/components/Enrollment/Step2Schedule.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight, Check, ArrowLeft, Tag, Loader2, XCircle, CheckCircle } from 'lucide-react'; // 🚨 Added Tag, Loader2, XCircle, CheckCircle
import axios from 'axios'; // 🚨 Added axios
import { useAuth } from '@clerk/clerk-react'; // 🚨 Added useAuth

// 🚨 NEW: API Endpoint for Promo Validation 🚨
const PROMO_VALIDATE_API = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/user/promo/validate`;

// MODIFIED: generateTimeSlots function now takes a dayOfWeek parameter (0=Sun, 6=Sat)
const generateTimeSlots = (dayOfWeek) => {
    // Default slots for Mon-Fri (1 - 5, where 1=Mon, 5=Fri)
    const defaultSlots = [
        '4:00pm - 5:00pm',
        '5:00pm - 6:00pm',
        '6:00pm - 7:00pm',
        '7:00pm - 8:00pm',
        '8:00pm - 9:00pm',
    ];

    // Saturday-specific slots (6)
    const saturdaySlots = [
        '1:00pm - 2:00pm',
        '2:00pm - 3:00pm',
        '3:00pm - 4:00pm',
        '4:00pm - 5:00pm',
        '5:00pm - 6:00pm',
    ];

    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Mon-Fri
        return { 'Popular Evening Slots (Mon-Fri)': defaultSlots };
    } else if (dayOfWeek === 6) { // Saturday
        return { 'Saturday Sessions': saturdaySlots };
    }
    return {}; // Sunday or other
};

// MODIFIED: TimePreferencesModal (UNCHANGED LOGIC)
const TimePreferencesModal = ({ isOpen, onClose, selectedDate, onSave, isStarterPack, currentTimes }) => {
    // ... (TimePreferencesModal logic unchanged)
    if (!isOpen) return null;

    const dayOfWeek = selectedDate ? new Date(selectedDate).getDay() : null;

    // Determine which slots to show in the modal
    const allTimeSlots = useMemo(() => {
        if (!isStarterPack) {
             // For Trial, only show slots for the selected single day
             return generateTimeSlots(dayOfWeek);
        } else {
             // For Starter Pack, show both Mon-Fri and Sat slots for preference
             return {
                 ...generateTimeSlots(1), // Mon-Fri slots
                 ...generateTimeSlots(6)  // Saturday slots
             };
        }
    }, [dayOfWeek, isStarterPack]);

    // NEW STATE: Manage selected slots inside the modal
    const [selectedMonFriSlot, setSelectedMonFriSlot] = useState(currentTimes.monFri || null);
    const [selectedSatSlot, setSelectedSatSlot] = useState(currentTimes.saturday || null);

    const dayName = selectedDate ? new Date(selectedDate).toLocaleDateString('en-AU', { weekday: 'long' }) : 'Selected Day';

    const handleSlotSelect = (slot, period) => {
        if (isStarterPack) {
            if (period.includes('Mon-Fri')) {
                setSelectedMonFriSlot(slot);
            } else if (period.includes('Saturday')) {
                setSelectedSatSlot(slot);
            }
        } else {
             // For Trial, only one slot needs to be tracked
             setSelectedMonFriSlot(slot);
        }
    };

    const handleSave = () => {
        if (isStarterPack) {
            // Must select both for Starter Pack 
            if (selectedMonFriSlot && selectedSatSlot) {
                onSave({ monFri: selectedMonFriSlot, saturday: selectedSatSlot });
            }
        } else {
            // Only need one for Trial
            if (selectedMonFriSlot) {
                onSave({ monFri: selectedMonFriSlot, saturday: null });
            }
        }
    };

    const isSaveDisabled = isStarterPack
        ? (!selectedMonFriSlot || !selectedSatSlot)
        : !selectedMonFriSlot;


    const modalTitle = isStarterPack
        ? "Preferred Consistent Time Slots for 6 Sessions"
        : `${dayName} session time preferences`;

    const modalSubtitle = isStarterPack
        ? "Select a consistent time for **Mon-Fri** and a separate time for **Saturday**. Our advisor will confirm."
        : "Select one of our popular time slots for your trial session.";

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900/70 flex items-center justify-center backdrop-blur-sm transition-opacity p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform scale-100 transition-transform duration-300 max-h-[90vh] overflow-hidden">
                <div className="relative p-6 md:p-10">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition text-gray-700">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">{modalTitle}</h2>
                    <p className="text-sm text-gray-500 text-center mb-6 sm:mb-8">
                        {modalSubtitle}
                    </p>

                    <div className="flex flex-col items-center gap-4 max-h-[55vh] overflow-y-auto px-4">
                        {Object.entries(allTimeSlots).map(([period, slots]) => (
                            <div key={period} className="w-full max-w-xs text-center">
                                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">{period}</h3>
                                <div className="flex flex-col gap-3">
                                {slots.map((time, index) => {
                                    const isMonFri = period.includes('Mon-Fri');
                                    const isSelected = (isMonFri && selectedMonFriSlot === time) || (!isMonFri && selectedSatSlot === time);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleSlotSelect(time, period)}
                                            className={`w-full text-center py-3 px-4 rounded-xl transition text-base font-semibold border-2 shadow-md hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 ring-offset-2 ring-blue-300 ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white border-blue-700 shadow-xl'
                                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50'
                                            }`}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                        <button
                            onClick={handleSave}
                            disabled={isSaveDisabled}
                            className={`w-full font-bold py-3 rounded-lg transition text-base sm:text-lg ${
                                !isSaveDisabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 🚨 UPDATED PROPS for Step2Schedule 🚨
const Step2Schedule = ({ 
    quizData, 
    purchaseType, 
    onNext, 
    onBack, 
    studentDetails, 
    guardianDetails, 
    productDetails, 
    enrollmentDataKey,
    promoCodeData, // 🚨 NEW PROP 🚨
    onPromoCodeUpdate, // 🚨 NEW PROP 🚨
    finalPaymentAmount // 🚨 NEW PROP 🚨
}) => {
    // 🚨 PROMO CODE HOOKS 🚨
    const { getToken } = useAuth();
    const [promoInput, setPromoInput] = useState(promoCodeData.code || '');
    const [promoMessage, setPromoMessage] = useState(null);
    const [isPromoLoading, setIsPromoLoading] = useState(false);
    // 🚨 END PROMO CODE HOOKS 🚨
    
    // NEW: Postcode state
    const [postcode, setPostcode] = useState('');
    // NEW: State for errors in this component only
    const [localError, setLocalError] = useState(null);

    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }, []);

    const maxDate = useMemo(() => {
        const d = new Date(tomorrow);
        d.setMonth(d.getMonth() + 1);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    }, [tomorrow]);

    const [currentMonth, setCurrentMonth] = useState(
        new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1)
    );

    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null); // Used for TRIAL start date
    // NEW/MODIFIED: state for Starter Pack date range
    const [starterPackDateRange, setStarterPackDateRange] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Used for TimePreferencesModal
    // MODIFIED: Use an object to store dual times for STARTER_PACK
    const [selectedTimes, setSelectedTimes] = useState({ monFri: null, saturday: null });
    
    const isStarterPack = purchaseType === 'STARTER_PACK';
    
    // 🛑 NEW: Load state from persistent storage on mount (FIXED logic for restoration) 🛑
    useEffect(() => {
        const storedData = localStorage.getItem(enrollmentDataKey);
        if (storedData) {
            try {
                const restored = JSON.parse(storedData);
                // Restore scheduling details if present
                if (restored.scheduleDetails) {
                    const { 
                        preferredDate, 
                        preferredWeekStart, 
                        preferredTime, 
                        preferredTimeMonFri, 
                        preferredTimeSaturday, 
                        postcode: restoredPostcode 
                    } = restored.scheduleDetails;
                    
                    if (restoredPostcode) setPostcode(restoredPostcode);
                    
                    const dateToRestoreString = isStarterPack ? preferredDate : preferredDate; // Use preferredDate as the user-selected start date
                    if (dateToRestoreString) {
                        // Reconstruct the selected day (the start date)
                        const dateParts = dateToRestoreString.split('-').map(Number);
                        const initialDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                        setSelectedDay(initialDate);
                        
                        if (isStarterPack) {
                            // Recalculate date range using the core logic for display consistency
                            const sessionsCount = 6;
                            const sessionDates = [];
                            
                            // CRITICAL FIX: Ensure UTC construction for restoration calculation
                            const year = initialDate.getFullYear();
                            const month = initialDate.getMonth();
                            const date = initialDate.getDate();
                            let currentDate = new Date(Date.UTC(year, month, date));
                            
                            while (sessionDates.length < sessionsCount) {
                                // Check if currentDate is not Sunday (0) using UTC day getter
                                if (currentDate.getUTCDay() !== 0) {
                                    // Create a local date object for formatting
                                    const yyyy = currentDate.getUTCFullYear();
                                    const mm = currentDate.getUTCMonth();
                                    const dd = currentDate.getUTCDate();
                                    sessionDates.push(new Date(yyyy, mm, dd));
                                }
                                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                            }
                            
                            const formatYMDFromUTCDate = (utcDateObj) => {
                                const y = utcDateObj.getUTCFullYear();
                                const m = String(utcDateObj.getUTCMonth() + 1).padStart(2, '0');
                                const d = String(utcDateObj.getUTCDate()).padStart(2, '0');
                                return `${y}-${m}-${d}`;
                            };

                            setStarterPackDateRange({
                                start: formatYMDFromUTCDate(sessionDates[0]),
                                end: formatYMDFromUTCDate(sessionDates[sessionDates.length - 1]),
                                sessions: sessionsCount,
                                sessionDates: sessionDates.map(d => d.toLocaleDateString('en-AU', {day: 'numeric', month: 'long', year: 'numeric'}))
                            });

                            
                            setSelectedTimes({ 
                                monFri: preferredTimeMonFri, 
                                saturday: preferredTimeSaturday 
                            });
                        } else {
                            // Trial
                            setSelectedTimes({ monFri: preferredTime, saturday: null });
                        }
                    }
                }
            } catch (e) {
                console.error("Error restoring Step 2 data:", e);
                // Continue with default state if parsing fails
            }
        }
    }, [enrollmentDataKey, isStarterPack]);
    // 🛑 END Load State 🛑


    const toggleCalendar = () => setShowCalendar(!showCalendar);

    // Calendar logic remains the same for calculating days
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const firstDayOfWeek = startOfMonth.getDay();

    // MODIFIED: handleDaySelect logic 
    const handleDaySelect = (day) => {
        // The initially selected day (e.g., Dec 11)
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

        // --- Sunday Check ---
        if (selectedDate.getDay() === 0) { // Sunday is 0
            return;
        }
        // --- END Sunday Check ---

        if (selectedDate >= tomorrow && selectedDate <= maxDate) {
            setSelectedDay(selectedDate);
            setSelectedTimes({ monFri: null, saturday: null }); // Reset times on new date selection
            setShowCalendar(false);
            console.log('[STEP2 SELECT DEBUG] Selected Date:', selectedDate.toLocaleDateString('en-AU'));


            if (isStarterPack) {
                // Build list of session dates (skip Sundays) until we have 6 sessions.
                const sessionsCount = 6;
                const sessionDates = [];
                
                // CRITICAL FIX: Reconstruct selectedDate as UTC midnight for calculation consistency
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth();
                const date = selectedDate.getDate();

                // Use UTC construction to ensure day counting is accurate regardless of local timezone offset
                let currentDate = new Date(Date.UTC(year, month, date));

                // Keep pushing non-Sunday dates until sessionsCount reached
                while (sessionDates.length < sessionsCount) {
                    // Check if currentDate is not Sunday (0) using UTC day getter
                    if (currentDate.getUTCDay() !== 0) {
                        // Create a local date object for formatting
                        const yyyy = currentDate.getUTCFullYear();
                        const mm = currentDate.getUTCMonth();
                        const dd = currentDate.getUTCDate();
                        sessionDates.push(new Date(yyyy, mm, dd));
                    }
                    // Move to next calendar day using UTC setter
                    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                }
                
                const endDate = sessionDates[sessionDates.length - 1];

                // Helper to format YYYY-MM-DD string from a Date object created with local components matching the UTC date
                const formatYMDFromLocalDate = (localDateObj) => {
                    const y = localDateObj.getFullYear();
                    const m = String(localDateObj.getMonth() + 1).padStart(2, '0');
                    const d = String(localDateObj.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                };

                // Convert to a nice display format for the preview box
                const displayDateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                const formattedSessionDates = sessionDates.map(d => d.toLocaleDateString('en-AU', displayDateOptions));

                setStarterPackDateRange({
                    start: formatYMDFromLocalDate(sessionDates[0]),
                    end: formatYMDFromLocalDate(endDate),
                    sessions: sessionsCount,
                    sessionDates: formattedSessionDates 
                });
            }

            // Open time slot modal for BOTH TRIAL and STARTER_PACK
            setIsModalOpen(true);
        }
    };


    // ✅ CORRECTED: Logic for preventing month change outside the tomorrow-to-maxDate range.
    const handleMonthChange = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);

        // Calculate month boundaries
        const startOfNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
        const earliestAllowedMonthStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
        const latestAllowedMonthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

        // Block navigating backward past the earliest allowed month
        if (direction < 0 && startOfNewMonth.getTime() < earliestAllowedMonthStart.getTime()) {
            return;
        }

        // Block navigating forward past the latest allowed month (the one containing maxDate)
        if (direction > 0 && startOfNewMonth.getTime() > latestAllowedMonthStart.getTime()) {
            return;
        }

        setCurrentMonth(newMonth);
    };

    // MODIFIED: handleTimeSlotSave to accept object payload
    const handleTimeSlotSave = (times) => {
        // Starter Pack handles dual slot in modal. Trial sets saturday to null.
        setSelectedTimes({ monFri: times.monFri, saturday: times.saturday || null });
        setIsModalOpen(false);
    };


    const isStarterPackReady = isStarterPack ? selectedTimes.monFri && selectedTimes.saturday : true;

    // 🚨 PROMO CODE HANDLERS 🚨
    const handleApplyPromoCode = async () => {
        setPromoMessage(null);
        setIsPromoLoading(true);
        setLocalError(null);
        const codeToValidate = promoInput.toUpperCase().trim();
        
        if (!codeToValidate) {
            setPromoMessage({ text: 'Please enter a code.', type: 'error' });
            setIsPromoLoading(false);
            return;
        }
        
        if (codeToValidate === promoCodeData.code) {
             setPromoMessage({ text: 'Code is already applied.', type: 'success' });
             setIsPromoLoading(false);
             return;
        }

        try {
            const token = await getToken();
            const response = await axios.post(
                PROMO_VALIDATE_API,
                { code: codeToValidate },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Success: Apply discount
            const discountPercent = response.data.discountPercentage;
            onPromoCodeUpdate({
                code: codeToValidate,
                discountPercentage: discountPercent,
            });
            setPromoMessage({ text: response.data.message || 'Promo code applied!', type: 'success' });

        } catch (error) {
            // Failure: Reset discount and show error
            onPromoCodeUpdate({ code: null, discountPercentage: 0 });
            setPromoMessage({
                text: error.response?.data?.message || 'Error applying code.',
                type: 'error',
            });
        } finally {
            setIsPromoLoading(false);
        }
    };
    
    const handleRemovePromoCode = () => {
        onPromoCodeUpdate({ code: null, discountPercentage: 0, discountAmount: 0 });
        setPromoInput('');
        setPromoMessage({ text: 'Promo code removed.', type: 'info' });
    }
    // 🚨 END PROMO CODE HANDLERS 🚨
    
    // 🛑 MODIFIED: handleSubmit to go to the next step 🛑
    const handleSubmit = () => {
        
        // Validation check based on purchase type and dual slots
        if (!selectedDay || (isStarterPack && !isStarterPackReady) || (!isStarterPack && !selectedTimes.monFri)) {
            setLocalError(isStarterPack ? 'Please select a start date and both Mon-Fri and Saturday time slots for your Starter Pack.' : 'Please select a date and a time slot for your Trial Session.');
            return;
        }
        
        // Postcode validation
        if (!postcode) {
             setLocalError('Please enter your Postcode to continue.');
             return;
        }

        setLocalError(null);

        // Determine scheduling payload based on purchase type
        let scheduleDetails = {};
        // NEW (Fixed): Use local components to build the YYYY-MM-DD string
        const yyyy = selectedDay.getFullYear();
        const mm = String(selectedDay.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const dd = String(selectedDay.getDate()).padStart(2, '0');
        const selectedDayString = `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD (Local) // YYYY-MM-DD
        
        if (isStarterPack) {
            // Updated payload for Starter Pack
            scheduleDetails = {
                preferredDate: selectedDayString, // Use the selected start date YYYY-MM-DD string
                preferredWeekStart: starterPackDateRange.start, // First date of 6-session run
                preferredWeekEnd: starterPackDateRange.end,
                preferredTime: null, // Only used for Trial. Send null.
                preferredTimeMonFri: selectedTimes.monFri, // Separate time for Mon-Fri
                preferredTimeSaturday: selectedTimes.saturday, // Separate time for Saturday
                purchaseType: 'STARTER_PACK',
                numberOfSessions: 6,
                postcode: postcode,
            };
        } else {
            // Trial session payload
            scheduleDetails = {
                preferredDate: selectedDayString,
                preferredTime: selectedTimes.monFri,
                preferredTimeMonFri: null, 
                preferredTimeSaturday: null,
                purchaseType: 'TRIAL',
                numberOfSessions: 1,
                postcode: postcode,
            };
        }

        const payloadForNextStep = {
            courseDetails: {
                courseId: quizData?.courseId || 'unknown_id', // Handle potential undefined if state was lost
                courseTitle: `${quizData?.subject || 'Default Subject'} - Year ${quizData?.year || 'K'}`,
                classRange: quizData?.initialClassRange,
            },
            scheduleDetails: scheduleDetails,
            studentDetails: studentDetails,
            guardianDetails: guardianDetails,
            // 🚨 CRITICAL: Pass the FINAL discounted amount 🚨
            paymentAmount: finalPaymentAmount, 
            // 🚨 PASS PROMO CODE DATA 🚨
            promoCode: promoCodeData.code,
            appliedDiscountAmount: promoCodeData.discountAmount,
        };
        
        onNext(payloadForNextStep);
    };
    
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const emptyCells = Array(firstDayOfWeek).fill(null);
    const days = [...emptyCells, ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    const dateOnlyOptions = { day: 'numeric', month: 'long', year: 'numeric' };

    const latestAllowedMonthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    const isPrevDisabled = currentMonth.getMonth() === tomorrow.getMonth() && currentMonth.getFullYear() === tomorrow.getFullYear();
    const isNextDisabled =
        currentMonth.getMonth() === latestAllowedMonthStart.getMonth() &&
        currentMonth.getFullYear() === latestAllowedMonthStart.getFullYear();


    const formattedStartDate = selectedDay ? selectedDay.toLocaleDateString('en-AU', dateOnlyOptions) : 'Click to select a start date';

    // NEW: Combined booking ready check
    const isTimeReady = isStarterPack ? isStarterPackReady : selectedTimes.monFri;
    const isBookingReady = selectedDay && isTimeReady && postcode;

    return (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
            <div className='flex justify-between items-center mb-6'>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {isStarterPack ? 'Schedule your First 6 Sessions' : 'Schedule your Trial session'}
                </h2>
                {/* 🛑 NEW: Back button for better UX on retry 🛑 */}
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 hover:text-blue-800 transition text-sm font-medium"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Account
                </button>
            </div>


            {/* Unified Scheduling Content for both Starter Pack and Trial */}
            <div className="bg-orange-50 p-4 rounded-lg text-orange-800 mb-8">
                <div className="flex items-center space-x-3">
                    <Calendar size={20} className='flex-shrink-0' />
                    <p className="font-medium text-sm sm:text-base">
                        {isStarterPack
                            ? 'Select a start date below. Sessions will run daily for 6 days, excluding Sundays, starting from this date.'
                            : 'Classes available Mon-Sat. No classes on Sunday.'}
                    </p>
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4">Lock in your preferred time</h3>
            <p className="text-sm text-gray-600 mb-6">
                To help us find a suitable tutor, please let us know the best **start day** and **consistent time** to schedule your {isStarterPack ? '6 sessions' : 'Trial session'}.
            </p>

            {/* Date Selection (Calendar remains for both) */}
            <div className="relative mb-6">
                <label htmlFor="preferredDate" className="text-sm font-medium text-gray-700 block mb-2">Select preferred start date</label>
                <div
                    onClick={toggleCalendar}
                    className="w-full p-3 border rounded-lg cursor-pointer bg-white flex justify-between items-center text-sm sm:text-base"
                >
                    <span>{formattedStartDate}</span>
                    <Calendar size={20} className="text-gray-500" />
                </div>
                {showCalendar && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-4 rounded-lg shadow-xl z-20 w-72 sm:w-80 border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={() => handleMonthChange(-1)}
                                disabled={isPrevDisabled}
                                className={`p-1 rounded-full transition ${isPrevDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-bold text-sm">
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <button
                                onClick={() => handleMonthChange(1)}
                                disabled={isNextDisabled}
                                className={`p-1 rounded-full transition ${isNextDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {daysOfWeek.map(day => (
                                <span key={day} className="text-xs font-bold text-gray-500 w-full flex items-center justify-center h-8">{day}</span>
                            ))}
                            {days.map((day, index) => {
                                    const dayDate = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                                    const isAvailable = dayDate && dayDate >= tomorrow && dayDate <= maxDate;
                                    // --- Sunday Check for Disabled Dates ---
                                    const isSunday = dayDate && dayDate.getDay() === 0; // Sunday is 0
                                    const isSelectable = isAvailable && !isSunday;
                                    // --- END Sunday Check ---
                                    const isSelected = selectedDay && dayDate && selectedDay.toDateString() === dayDate.toDateString();

                                    return (
                                        <button
                                            key={index}
                                            onClick={isSelectable ? () => handleDaySelect(day) : undefined}
                                            disabled={!isSelectable}
                                            className={`w-full aspect-square flex items-center justify-center rounded-md text-sm transition border border-gray-200
                                                ${day === null || !isAvailable
                                                    ? 'cursor-default text-gray-400 bg-white border-transparent'
                                                    // --- Class for disabled (Sunday or unavailble) ---
                                                    : !isSelectable
                                                        ? 'cursor-not-allowed text-red-400 line-through bg-red-50/50 font-medium border-red-200'
                                                        : isSelected
                                                            ? 'bg-blue-600 text-white font-medium border-blue-600'
                                                            : 'hover:bg-gray-100 font-medium bg-white text-gray-900'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Block and Time Slot Opener (Applies to both) */}
            {selectedDay && (
                <>
                    {/* MODIFIED: Display 6-Session Range Box with correct end date logic */}
                    {isStarterPack && starterPackDateRange && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                            <h4 className="font-bold text-blue-800 mb-1">Your 6-Session Dates:</h4>
                            <p className="text-sm text-blue-700 font-medium">
                                 {starterPackDateRange.sessionDates
                                    ? starterPackDateRange.sessionDates.join(', ')
                                    : `${selectedDay.toLocaleDateString('en-AU', dateOnlyOptions)} to ${new Date(starterPackDateRange.end).toLocaleDateString('en-AU', dateOnlyOptions)}`}
                            </p>
                            <p className='text-xs text-blue-600 mt-1'>
                                 *Your sessions will run daily, skipping any Sundays.
                            </p>
                        </div>
                    )}


                    <h4 className="font-bold text-gray-800 mb-2">Time of day preferences</h4>
                    {/* MODIFIED: Display Time Preference Box to show dual or single time */}
                    <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm sm:text-base">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-700 font-medium">
                                {isStarterPack ? 'Preferred Daily Times' : selectedDay.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <button onClick={() => setIsModalOpen(true)} className="text-blue-600 text-sm hover:underline">Change times</button>
                        </div>
                        <p className="text-xl font-bold text-gray-800 mt-1 mb-2">
                            {isStarterPack ? (
                                <>
                                    <span className='block text-base font-semibold text-gray-700'>Mon-Fri: {selectedTimes.monFri || 'Select Time'}</span>
                                    <span className='block text-base font-semibold text-gray-700'>Saturday: {selectedTimes.saturday || 'Select Time'}</span>
                                </>
                            ) : (
                                selectedTimes.monFri || 'Please select a time slot.'
                            )}
                        </p>
                        <p className="text-xs text-gray-500">
                            In the unlikely event we can't accommodate those time, our admissions team will be in touch to arrange new times.
                        </p>
                    </div>

                    {/* Time Preferences Modal is used for both */}
                    <TimePreferencesModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        selectedDate={selectedDay} // Pass the full date to the modal
                        onSave={handleTimeSlotSave}
                        isStarterPack={isStarterPack} // Pass prop to show different text
                        currentTimes={selectedTimes} // Pass current selections
                    />
                </>
            )}

            {/* Common fields and booking button */}
            <div className="mb-6">
                <label htmlFor="postcode" className="text-sm font-medium text-gray-700 block mb-2">Postcode (To ensure we schedule sessions in your timezone)</label>
                {/* MODIFIED: Added onChange handler to capture postcode into state */}
                <input
                    type="text"
                    id="postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base"
                />
            </div>
            
            {/* 🚨 NEW: PROMO CODE SECTION 🚨 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
                    <Tag size={20} className="mr-2 text-orange-500" />
                    Apply Promo Code
                </h3>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="e.g., PRIMEMENTOR2026"
                        value={promoInput}
                        onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            setPromoMessage(null); // Clear message on change
                        }}
                        className="flex-1 border p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isPromoLoading || promoCodeData.code}
                    />
                    
                    {promoCodeData.code ? (
                        <button
                            type="button"
                            onClick={handleRemovePromoCode}
                            disabled={isPromoLoading}
                            className="flex items-center bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition"
                        >
                            <XCircle size={20} className="mr-1" /> Remove
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleApplyPromoCode}
                            disabled={isPromoLoading || !promoInput.trim()}
                            className="flex items-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
                        >
                            {isPromoLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>Apply</>
                            )}
                        </button>
                    )}
                </div>

                {promoMessage && (
                    <p className={`mt-2 text-sm flex items-center ${promoMessage.type === 'success' ? 'text-green-600' : promoMessage.type === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                        {(promoMessage.type === 'success' || promoMessage.type === 'error') && (promoMessage.type === 'success' ? <CheckCircle size={16} className="mr-1" /> : <XCircle size={16} className="mr-1" />)}
                        {promoMessage.text}
                    </p>
                )}
            </div>
            {/* 🚨 END PROMO CODE SECTION 🚨 */}

            {/* Final Price Display before moving to Payment */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg flex justify-between items-center">
                <span className="font-bold text-lg text-gray-800">Total Amount Due:</span>
                <span className={`font-extrabold text-xl ${promoCodeData.code ? 'text-red-600' : 'text-gray-800'}`}>
                    ${finalPaymentAmount.toFixed(2)} AUD
                </span>
            </div>

            <button
                onClick={handleSubmit} // 🛑 Changed to handleSubmit 🛑
                // Updated disabled condition: requires date, correct time slot(s), AND postcode
                disabled={!isBookingReady}
                className={`w-full mt-4 font-bold py-3 rounded-lg transition text-base sm:text-lg
                    ${!isBookingReady ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
                {'NEXT: Proceed to Payment'}
            </button>
            {localError && <p className="mt-4 text-red-500 text-sm text-center">{localError}</p>}
        </div>
    );
};

export default Step2Schedule;