import { useState, useEffect } from 'react';

// Utility function to calculate time difference
const calculateTimeLeft = (targetDateString, targetTimeString) => {
    // Combine date (YYYY-MM-DD) and time (HH:MM) for a full JavaScript Date object
    // Assuming targetTimeString is in 'HH:MM' format (e.g., '14:30')
    const targetDateTime = new Date(`${targetDateString}T${targetTimeString}:00`);
    const now = new Date();
    
    // Calculate the difference in milliseconds
    const difference = targetDateTime.getTime() - now.getTime();
    
    let timeLeft = {};

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            isExpired: false
        };
    } else {
        timeLeft = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true
        };
    }
    
    return timeLeft;
};

// Custom Hook
const useCountdown = (targetDate, targetTime) => {
    // Initialize state with the initial calculated time left
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate, targetTime));

    useEffect(() => {
        // Only run the timer if we have valid target data
        if (!targetDate || !targetTime) return;

        // Set up the interval to update the countdown every 1 second (1000ms)
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft(targetDate, targetTime);
            setTimeLeft(newTimeLeft);
            
            // Clear interval if the countdown has expired
            if (newTimeLeft.isExpired) {
                clearInterval(timer);
            }
        }, 1000);

        // Cleanup function to clear the interval
        return () => clearInterval(timer);
    }, [targetDate, targetTime]); 

    return timeLeft;
};

export default useCountdown;