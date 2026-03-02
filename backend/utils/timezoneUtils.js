// backend/utils/timezoneUtils.js
// Utility for converting Melbourne (Australia) time to IST (India Standard Time)

const MELBOURNE_TZ = 'Australia/Melbourne';
const INDIA_TZ = 'Asia/Kolkata';

/**
 * Parses a 12-hour time string like "1:00 PM" into { hour24, minute }.
 * @param {string} timeStr - e.g. "1:00 PM", "11:30 AM"
 * @returns {{ hour24: number, minute: number } | null}
 */
function parse12hTime(timeStr) {
    if (!timeStr) return null;
    const cleaned = timeStr.trim();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return { hour24: hour, minute };
}

/**
 * Formats hour and minute into a 12-hour string like "7:30 AM".
 * @param {number} hour24
 * @param {number} minute
 * @returns {string}
 */
function format12hTime(hour24, minute) {
    const period = hour24 >= 12 ? 'PM' : 'AM';
    let displayHour = hour24 % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Converts a Melbourne date+time to IST using Intl.DateTimeFormat.
 * This correctly handles AEDT/AEST daylight saving transitions.
 *
 * @param {string} dateString - YYYY-MM-DD (Melbourne date)
 * @param {number} hour24 - Hour in 24h format (Melbourne)
 * @param {number} minute - Minute (Melbourne)
 * @returns {{ hour: number, minute: number, dateString: string }} IST components
 */
function melbourneToISTComponents(dateString, hour24, minute) {
    // Build a temporary Date object where we set local components to match Melbourne time.
    // Then use Intl to figure out the correct Melbourne UTC offset for that date,
    // and compute the IST equivalent.

    const [year, month, day] = dateString.split('-').map(Number);

    // Step 1: Get the Melbourne UTC offset for this specific date/time
    // We create an anchoring date and use Intl to extract the offset
    const melbFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: MELBOURNE_TZ,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false,
    });

    const istFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: INDIA_TZ,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false,
    });

    // Step 2: Use a brute-force approach — create UTC timestamps and find the one
    // that matches the Melbourne local time we want.
    // Melbourne is UTC+10 (AEST) or UTC+11 (AEDT), so the UTC time is
    // roughly melbTime - 10 or 11 hours.

    // Try offset -11 (AEDT) first, then -10 (AEST)
    for (const offsetHours of [11, 10]) {
        const utcMs = Date.UTC(year, month - 1, day, hour24 - offsetHours, minute, 0);
        const probe = new Date(utcMs);

        // Verify this UTC timestamp corresponds to the Melbourne time we want
        const parts = melbFormatter.formatToParts(probe);
        const getPart = (type) => {
            const p = parts.find(p => p.type === type);
            return p ? parseInt(p.value, 10) : 0;
        };

        const melbHour = getPart('hour');
        const melbMinute = getPart('minute');
        const melbDay = getPart('day');
        const melbMonth = getPart('month');
        const melbYear = getPart('year');

        // Normalize hour 24 → 0 for comparison
        const normalizedHour = hour24 === 24 ? 0 : hour24;
        const normalizedMelbHour = melbHour === 24 ? 0 : melbHour;

        if (normalizedMelbHour === normalizedHour && melbMinute === minute &&
            melbDay === day && melbMonth === month && melbYear === year) {
            // Found the correct UTC timestamp — now convert to IST
            const istParts = istFormatter.formatToParts(probe);
            const getIstPart = (type) => {
                const p = istParts.find(p => p.type === type);
                return p ? parseInt(p.value, 10) : 0;
            };

            const istHour = getIstPart('hour') === 24 ? 0 : getIstPart('hour');
            const istMinute = getIstPart('minute');
            const istDay = getIstPart('day');
            const istMonth = getIstPart('month');
            const istYear = getIstPart('year');

            return {
                hour: istHour,
                minute: istMinute,
                dateString: `${istYear}-${String(istMonth).padStart(2, '0')}-${String(istDay).padStart(2, '0')}`,
            };
        }
    }

    // Fallback: approximate with -10.5 hour offset (middle ground)
    // Melbourne is ~UTC+10.5 average, IST is UTC+5.5, difference is ~5 hours
    const fallbackHour = hour24 - 5;
    const fallbackMinute = minute + 30;
    const adjustedHour = fallbackMinute >= 60 ? fallbackHour + 1 : fallbackHour;
    const adjustedMinute = fallbackMinute >= 60 ? fallbackMinute - 60 : fallbackMinute;
    return {
        hour: ((adjustedHour % 24) + 24) % 24,
        minute: adjustedMinute,
        dateString: dateString, // approximate — same date
    };
}

/**
 * Converts a Melbourne time slot string to IST.
 *
 * @param {string} dateString - YYYY-MM-DD (Melbourne date)
 * @param {string} timeSlot - e.g. "1:00 PM - 2:00 PM" (Melbourne time)
 * @returns {string} IST equivalent, e.g. "7:30 AM - 8:30 AM IST"
 */
export function convertMelbourneToIST(dateString, timeSlot) {
    if (!dateString || !timeSlot) return 'N/A';

    const parts = timeSlot.split(/\s*-\s*/);
    if (parts.length < 2) return 'N/A';

    const startParsed = parse12hTime(parts[0]);
    const endParsed = parse12hTime(parts[1]);

    if (!startParsed || !endParsed) return 'N/A';

    const startIST = melbourneToISTComponents(dateString, startParsed.hour24, startParsed.minute);
    const endIST = melbourneToISTComponents(dateString, endParsed.hour24, endParsed.minute);

    const startStr = format12hTime(startIST.hour, startIST.minute);
    const endStr = format12hTime(endIST.hour, endIST.minute);

    return `${startStr} - ${endStr} IST`;
}

/**
 * Converts a Melbourne time slot to IST and returns both formatted strings.
 * Useful for email templates that need to show both.
 *
 * @param {string} dateString - YYYY-MM-DD
 * @param {string} timeSlot - Melbourne time slot string
 * @returns {{ melbourne: string, ist: string }}
 */
export function getDualTimezoneDisplay(dateString, timeSlot) {
    return {
        melbourne: timeSlot ? `${timeSlot} (Melbourne)` : 'N/A',
        ist: convertMelbourneToIST(dateString, timeSlot),
    };
}
