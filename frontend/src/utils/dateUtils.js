// frontend/src/utils/dateUtils.js

/**
 * Helper function to format a date string into a readable format.
 * Fixes timezone issues by parsing YYYY-MM-DD components and formatting
 * them without causing a date shift.
 * * @param {string | Date | null} dateInput - The date input (e.g., '2025-11-12' or '2025-11-12T00:00:00.000Z').
 * @returns {string} The formatted date string (e.g., "November 12, 2025").
 */
export const formatDate = (dateInput) => {
    if (!dateInput) return 'Not Scheduled';
    
    let dateString;
    
    // 1. Get the YYYY-MM-DD portion, whether it's a string or a Date object
    if (dateInput instanceof Date) {
        // Use the ISO string and take only the date part
        dateString = dateInput.toISOString().substring(0, 10);
    } else if (typeof dateInput === 'string') {
        // If it contains a time, strip it to only the date part
        dateString = dateInput.substring(0, 10);
    } else {
        return 'Invalid Date';
    }

    const parts = dateString.split('-');
    if (parts.length !== 3) return 'Invalid Date Format';
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Months are 0-indexed
    const day = parseInt(parts[2]);
    
    // 2. CRITICAL FIX: Create the date object using local components.
    // This correctly interprets the components (Year, Month, Day) in the 
    // user's current local timezone, neutralizing the UTC effect.
    const localDate = new Date(year, month, day);
    
    // Check for validity
    if (isNaN(localDate.getTime())) return 'Invalid Date';

    // 3. Format the date for display
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    // OPTIONAL BUT RECOMMENDED: Use UTC to format the output if you want to be 
    // absolutely certain the date displayed is the date chosen, regardless of the local timezone offset.
    // However, since we used local components in step 2, standard formatting is usually fine.
    // Let's stick to the local formatting since the object was created locally.
    
    return localDate.toLocaleDateString('en-US', options);
};


/**
 * Helper function to calculate the Date object for a scheduled meeting in the local timezone.
 * @param {string | null} preferredDate - The preferred date string (e.g., 'YYYY-MM-DD').
 * @param {string | null} preferredTime - The preferred time string (e.g., '9:00 AM - 10:00 AM').
 * @returns {Date | null} The Date object for the start of the meeting.
 */
export const getMeetingTime = (preferredDate, preferredTime) => {
    if (!preferredDate || !preferredTime) return null;

    // 1. Date Parsing: Ensure we only use YYYY, M, D components
    const dateParts = preferredDate.substring(0, 10).split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; 
    const day = parseInt(dateParts[2]);
    
    // Create the date object using local time components (midnight of the chosen day)
    const date = new Date(year, month, day); 
    
    // 2. Time Parsing
    // Assuming preferredTime is "HH:MM AM/PM - HH:MM AM/PM"
    const [startTimeStr] = preferredTime.split(' ');
    
    // Extract time and period (AM/PM)
    let timePart = startTimeStr.replace(/[^0-9:]/g, ''); // Get "HH:MM"
    let period = startTimeStr.slice(-2).toLowerCase(); // Get "am" or "pm"

    let [hour, minute] = timePart.split(':').map(Number);
    
    // Adjust hour for 24-hour format
    if (period === 'pm' && hour !== 12) {
        hour += 12;
    }
    if (period === 'am' && hour === 12) {
        hour = 0;
    }
    
    // Set the time using local setters on the local date object
    date.setHours(hour, minute, 0, 0);
    
    // Ensure the resulting date is valid
    if (isNaN(date.getTime())) return null;
    
    return date;
};

/**
 * Extracts and converts the 12-hour preferred time string to a 24-hour HH:MM string.
 * @param {string | null} preferredTime - The preferred time string (e.g., '9:00 AM - 10:00 AM').
 * @returns {string | null} The time string in 24-hour format (e.g., '09:00').
 */
export const get24HourTime = (preferredTime) => {
    if (!preferredTime) return null;

    // Assuming preferredTime is "HH:MM AM/PM - HH:MM AM/PM"
    const [startTimeStr] = preferredTime.split(' ');
    
    // Extract time and period (AM/PM)
    let timePart = startTimeStr.replace(/[^0-9:]/g, ''); // Get "HH:MM"
    let period = startTimeStr.slice(-2).toLowerCase(); // Get "am" or "pm"

    let [hour, minute] = timePart.split(':').map(Number);
    
    // Adjust hour for 24-hour format
    if (period === 'pm' && hour !== 12) {
        hour += 12;
    }
    if (period === 'am' && hour === 12) {
        hour = 0;
    }
    
    // Format hour and minute back into a standardized 'HH:MM' string
    const hour24 = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');

    return `${hour24}:${minuteStr}`;
};

// getNextSession remains unchanged (it relies on the logic in formatDate and getMeetingTime)
export const getNextSession = (course) => {
    // ... (rest of the getNextSession logic from your previous submission)
    if (course.sessionsRemaining <= 0 || (!course.preferredTimeMonFri && !course.preferredTimeSaturday)) {
        return {
            date: course.preferredDate,
            time: course.preferredTime,
            isWeekly: false,
        };
    }

    const now = new Date();
    const todayDay = now.getDay(); 
    
    const dayIndices = [];
    
    if (course.preferredTimeMonFri) {
        for (let i = 1; i <= 5; i++) {
            dayIndices.push({ day: i, time: course.preferredTimeMonFri });
        }
    }
    if (course.preferredTimeSaturday) {
        dayIndices.push({ day: 6, time: course.preferredTimeSaturday });
    }
    
    if (course.preferredTimeSunday) {
         dayIndices.push({ day: 0, time: course.preferredTimeSunday });
    }
    
    let nextSession = null;
    let shortestTimeDiff = Infinity;

    for (const session of dayIndices) {
        const preferredDay = session.day;
        const preferredTimeStr = session.time;
        
        const [startTimeStr] = preferredTimeStr.split(' ');
        let [hour, minute] = startTimeStr.slice(0, -2).split(':').map(Number);
        const period = startTimeStr.slice(-2).toLowerCase();

        if (period === 'pm' && hour !== 12) {
            hour += 12;
        }
        if (period === 'am' && hour === 12) {
            hour = 0;
        }

        let daysToAdd = preferredDay - todayDay;
        
        if (daysToAdd < 0) {
            daysToAdd += 7; 
        }

        let sessionDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
        sessionDate.setHours(hour, minute, 0, 0);

        if (daysToAdd === 0 && sessionDate < now) {
            sessionDate.setDate(sessionDate.getDate() + 7);
        }

        const timeDiff = sessionDate.getTime() - now.getTime();

        if (timeDiff > 0 && timeDiff < shortestTimeDiff) {
                shortestTimeDiff = timeDiff;
                // Use local date components to avoid UTC shift from toISOString()
                const yyyy = sessionDate.getFullYear();
                const mm = String(sessionDate.getMonth() + 1).padStart(2, '0');
                const dd = String(sessionDate.getDate()).padStart(2, '0');
                nextSession = {
                    date: `${yyyy}-${mm}-${dd}`,
                    time: preferredTimeStr,
                    isWeekly: true
                };
        }
    }
    
    return nextSession || {
        date: course.preferredDate,
        time: course.preferredTime,
        isWeekly: false
    };
};