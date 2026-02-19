// backend/utils/zoomIntegration.js
import axios from 'axios';
import Assessment from '../models/AssessmentModel.js';

// ======================== MULTI-HOST CONFIGURATION ========================
// All licensed Zoom users that can host meetings. The first entry is the primary host.
const ZOOM_HOSTS = [
    process.env.ZOOM_HOST_EMAIL,
    process.env.ZOOM_HOST_EMAIL_2,
].filter(Boolean);

if (ZOOM_HOSTS.length === 0) {
    console.error('❌ FATAL: No ZOOM_HOST_EMAIL configured. Zoom meetings will fail.');
}

// ======================== TOKEN CACHE ========================
// Zoom S2S OAuth tokens are valid for 1 hour. We cache them to avoid
// requesting a new token on every single meeting creation.
let cachedToken = null;
let tokenExpiresAt = 0;

// ======================== RETRY CONFIG ========================
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1 second, doubles each retry

// ======================== HELPER: sleep ========================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ======================== 1. GET ACCESS TOKEN (CACHED) ========================

/**
 * Get a Zoom Server-to-Server OAuth access token.
 * Returns a cached token if it's still valid (with a 5-minute safety buffer).
 */
const getZoomAccessToken = async () => {
    // Return cached token if still valid (5-minute buffer before expiry)
    const BUFFER_MS = 5 * 60 * 1000; // 5 minutes
    if (cachedToken && Date.now() < tokenExpiresAt - BUFFER_MS) {
        return cachedToken;
    }

    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const accountId = process.env.ZOOM_ACCOUNT_ID;

    if (!clientId || !clientSecret || !accountId) {
        throw new Error('Zoom OAuth credentials missing. Check ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID in .env');
    }

    const authString = `${clientId}:${clientSecret}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    try {
        const response = await axios.post(
            'https://zoom.us/oauth/token',
            `grant_type=account_credentials&account_id=${accountId}`,
            {
                headers: {
                    'Authorization': `Basic ${base64Auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 10000, // 10 second timeout
            }
        );

        cachedToken = response.data.access_token;
        // Cache with the server-reported expiry (default 3600s = 1 hour)
        tokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;

        console.log('🔑 Zoom OAuth token obtained (cached for ~1 hour).');
        return cachedToken;
    } catch (error) {
        // Reset cache on auth failure
        cachedToken = null;
        tokenExpiresAt = 0;

        const errData = error.response?.data;
        const errMsg = errData?.reason || errData?.message || error.message;
        console.error('❌ Zoom OAuth token request failed:', errMsg);
        throw new Error(`Zoom authentication failed: ${errMsg}`);
    }
};

// ======================== 2. PARSE ZOOM API ERRORS ========================

/**
 * Extract a human-readable error message from a Zoom API error response.
 */
const parseZoomError = (error) => {
    const data = error.response?.data;
    const status = error.response?.status;

    if (!data) {
        return { message: error.message || 'Unknown Zoom API error', retryable: false };
    }

    // Zoom error codes: https://developers.zoom.us/docs/api/rest/reference/zoom-api/methods/#tag/Meetings
    const zoomCode = data.code;
    const zoomMessage = data.message || 'Unknown error';

    // Determine if the error is retryable
    const retryable = status === 429 || (status >= 500 && status < 600);

    const friendlyMessages = {
        1001: 'Zoom user does not exist. Check ZOOM_HOST_EMAIL in .env.',
        1010: 'Zoom user does not belong to this account.',
        3001: 'Meeting does not exist or has expired.',
        3161: 'Zoom meeting capacity exceeded for this host.',
        124: 'Invalid Zoom API access token. Token may have expired.',
        200: 'Zoom host has no permission to create meetings. Check Zoom license.',
    };

    const friendly = friendlyMessages[zoomCode] || `Zoom API error ${zoomCode}: ${zoomMessage}`;

    return { message: friendly, retryable, status, zoomCode };
};

// ======================== 3. GET AVAILABLE HOST ========================

/**
 * Determine which Zoom host is available at the proposed meeting time.
 * Checks existing scheduled assessments for each host to avoid Zoom-level conflicts.
 *
 * @param {Date} proposedStart - Meeting start time (UTC)
 * @param {number} durationMin - Duration in minutes
 * @returns {string} The email of the available host
 */
export const getAvailableHost = async (proposedStart, durationMin = 30) => {
    if (ZOOM_HOSTS.length <= 1) {
        // Only one host configured, return it
        return ZOOM_HOSTS[0] || 'me';
    }

    const proposedEnd = new Date(proposedStart.getTime() + durationMin * 60 * 1000);

    // Find all scheduled assessments that overlap with the proposed time slot
    const overlappingAssessments = await Assessment.find({
        status: 'Scheduled',
        scheduledDate: { $ne: null },
        zoomHostEmail: { $ne: null },
    }).lean();

    // Track which hosts have overlapping meetings
    const busyHosts = new Set();

    for (const assessment of overlappingAssessments) {
        const aStart = new Date(assessment.scheduledDate);
        if (isNaN(aStart.getTime())) continue;

        // Assessments are 30 minutes by default
        const aEnd = new Date(aStart.getTime() + 30 * 60 * 1000);

        // Check overlap: two intervals overlap if start1 < end2 AND start2 < end1
        if (proposedStart < aEnd && aStart < proposedEnd) {
            if (assessment.zoomHostEmail) {
                busyHosts.add(assessment.zoomHostEmail.toLowerCase());
            }
        }
    }

    // Return the first available host
    for (const host of ZOOM_HOSTS) {
        if (!busyHosts.has(host.toLowerCase())) {
            console.log(`✅ Available Zoom host: ${host}`);
            return host;
        }
    }

    // All hosts are busy — fall back to primary host (Zoom will still schedule it,
    // but the admin should be warned that there's a host-level conflict)
    console.warn(`⚠️ All Zoom hosts are busy at this time! Falling back to primary host: ${ZOOM_HOSTS[0]}`);
    return ZOOM_HOSTS[0];
};

// ======================== 4. CREATE ZOOM MEETING (WITH RETRY) ========================

/**
 * Creates a scheduled Zoom meeting and returns the join/start URLs.
 * Includes retry logic with exponential backoff for transient failures.
 *
 * @param {string} topic - The meeting topic (e.g., "Math Class - Algebra I").
 * @param {Date} startTime - The meeting start time (UTC Date object).
 * @param {number} duration - The duration in minutes.
 * @param {string} [timezone='Asia/Kolkata'] - IANA timezone for display.
 * @param {string} [hostEmail] - Specific host email to use. If not provided, auto-selects.
 * @returns {object} { meetingId, joinUrl, startUrl, hostEmail }
 */
export const createZoomMeeting = async (topic, startTime, duration, timezone = 'Asia/Kolkata', hostEmail = null) => {
    // Auto-select host if not specified
    const selectedHost = hostEmail || await getAvailableHost(startTime, duration);
    console.log(`📹 Creating Zoom meeting | Host: ${selectedHost} | Topic: ${topic} | Timezone: ${timezone}`);

    // Send start_time as UTC ISO string — Zoom will display it in the specified timezone
    const start_time_utc = startTime.toISOString();

    const meetingDetails = {
        topic: topic,
        type: 2, // Scheduled meeting
        start_time: start_time_utc,
        duration: duration, // in minutes
        timezone: timezone,
        password: generateMeetingPassword(),
        settings: {
            host_video: true,
            participant_video: true,
            jbh_time: 5, // Join 5 min before host
            join_before_host: true,
            enforce_login: false,
            waiting_room: true,
            mute_upon_entry: true,
            auto_recording: 'none',
        },
    };

    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const accessToken = await getZoomAccessToken();

            const response = await axios.post(
                `https://api.zoom.us/v2/users/${selectedHost}/meetings`,
                meetingDetails,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000, // 15 second timeout
                }
            );

            const { id, join_url, start_url } = response.data;

            console.log(`✅ Zoom meeting created (attempt ${attempt}): ID ${id} | Host: ${selectedHost}`);

            return {
                meetingId: id,
                joinUrl: join_url,
                startUrl: start_url,
                hostEmail: selectedHost,
            };
        } catch (error) {
            const parsed = parseZoomError(error);
            lastError = parsed;

            console.error(`❌ Zoom meeting creation failed (attempt ${attempt}/${MAX_RETRIES}): ${parsed.message}`);

            // If the error is not retryable (e.g., bad credentials, user not found), fail immediately
            if (!parsed.retryable) {
                throw new Error(`Zoom meeting creation failed: ${parsed.message}`);
            }

            // If the token was invalid (401), invalidate cache and retry
            if (parsed.status === 401) {
                cachedToken = null;
                tokenExpiresAt = 0;
                console.log('🔄 Invalidated token cache, will re-authenticate on next attempt.');
            }

            // Wait with exponential backoff before retrying
            if (attempt < MAX_RETRIES) {
                const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
                console.log(`⏳ Retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }

    // All retries exhausted
    throw new Error(`Zoom meeting creation failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`);
};

// ======================== 5. HELPER: Generate Meeting Password ========================

/**
 * Generate a secure 6-character alphanumeric meeting password.
 */
const generateMeetingPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters (0, O, I, 1)
    let password = '';
    for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// ======================== 6. VALIDATE ZOOM CONFIG ========================

/**
 * Validate that all required Zoom environment variables are present.
 * Call this at server startup.
 * @throws {Error} If any required variable is missing.
 */
export const validateZoomConfig = () => {
    const required = ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET', 'ZOOM_HOST_EMAIL'];
    const missing = required.filter(v => !process.env[v]);

    if (missing.length > 0) {
        const msg = `❌ FATAL: Missing required Zoom env variables: ${missing.join(', ')}`;
        console.error(msg);
        throw new Error(msg);
    }

    console.log(`✅ Zoom config validated. ${ZOOM_HOSTS.length} host(s) configured: ${ZOOM_HOSTS.join(', ')}`);

    if (ZOOM_HOSTS.length === 1) {
        console.warn('⚠️ Only 1 Zoom host configured. Simultaneous meetings will NOT be possible. Set ZOOM_HOST_EMAIL_2 for multi-host support.');
    }
};
