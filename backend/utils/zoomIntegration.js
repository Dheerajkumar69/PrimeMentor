// backend/utils/zoomIntegration.js
import axios from 'axios';

// 1. Function to get the Server-to-Server OAuth Access Token
const getZoomAccessToken = async () => {
    const authString = `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    try {
        const response = await axios.post(
            'https://zoom.us/oauth/token',
            `grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
            {
                headers: {
                    'Authorization': `Basic ${base64Auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        // The token is valid for 1 hour (3600 seconds)
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching Zoom Access Token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Zoom');
    }
};

// 2. Function to create the Zoom Meeting
/**
 * Creates a scheduled Zoom meeting and returns the join/start URLs.
 * @param {string} topic - The meeting topic (e.g., "Math Class - Algebra I").
 * @param {Date} startTime - The meeting start time.
 * @param {number} duration - The duration in minutes.
 * @returns {object} { meetingId, joinUrl, startUrl }
 */
export const createZoomMeeting = async (topic, startTime, duration) => {
    const accessToken = await getZoomAccessToken();

    // Use 'me' to default to the OAuth app owner, or a specific email if configured
    const hostEmail = process.env.ZOOM_HOST_EMAIL || 'me';
    console.log(`📹 Creating Zoom meeting with host: ${hostEmail}`);

    // Zoom time must be in ISO 8601 format
    const start_time_iso = startTime.toISOString().slice(0, 19) + 'Z';

    const meetingDetails = {
        topic: topic,
        type: 2, // Scheduled meeting
        start_time: start_time_iso,
        duration: duration, // in minutes
        timezone: 'Australia/Sydney', // Australian timezone for PrimeMentor
        password: Math.random().toString(36).substring(2, 8).toUpperCase(), // Random 6-char password
        settings: {
            host_video: true,
            participant_video: true,
            jbh_time: 5, // Join before host time in minutes
            enforce_login: false,
            waiting_room: true,
        },
    };

    try {
        const response = await axios.post(
            `https://api.zoom.us/v2/users/${hostEmail}/meetings`,
            meetingDetails,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { id, join_url, start_url } = response.data;

        return {
            meetingId: id,
            joinUrl: join_url,
            startUrl: start_url,
        };
    } catch (error) {
        console.error('Error creating Zoom meeting:', error.response?.data || error.message);
        throw new Error('Failed to create Zoom meeting.');
    }
};
