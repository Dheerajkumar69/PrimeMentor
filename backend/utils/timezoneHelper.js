// backend/utils/timezoneHelper.js
// Resolves postal code + country → IANA timezone using GeoNames API
// Fallback: country-to-timezone mapping for common countries

import axios from 'axios';

// ======================== FALLBACK COUNTRY → TIMEZONE MAP ========================
const COUNTRY_TIMEZONE_MAP = {
    'AU': 'Australia/Melbourne',
    'IN': 'Asia/Kolkata',
    'GB': 'Europe/London',
    'UK': 'Europe/London',
    'US': 'America/New_York',
    'CA': 'America/Toronto',
    'NZ': 'Pacific/Auckland',
    'SG': 'Asia/Singapore',
    'MY': 'Asia/Kuala_Lumpur',
    'AE': 'Asia/Dubai',
    'SA': 'Asia/Riyadh',
    'PK': 'Asia/Karachi',
    'BD': 'Asia/Dhaka',
    'LK': 'Asia/Colombo',
    'NP': 'Asia/Kathmandu',
    'PH': 'Asia/Manila',
    'HK': 'Asia/Hong_Kong',
    'JP': 'Asia/Tokyo',
    'KR': 'Asia/Seoul',
    'CN': 'Asia/Shanghai',
    'DE': 'Europe/Berlin',
    'FR': 'Europe/Paris',
    'IT': 'Europe/Rome',
    'ES': 'Europe/Madrid',
    'ZA': 'Africa/Johannesburg',
    'KE': 'Africa/Nairobi',
    'NG': 'Africa/Lagos',
    'BR': 'America/Sao_Paulo',
    'MX': 'America/Mexico_City',
    'AR': 'America/Argentina/Buenos_Aires',
    'CL': 'America/Santiago',
    'FJ': 'Pacific/Fiji',
};

// Country name → ISO 2-letter code mapping (common names)
const COUNTRY_NAME_TO_CODE = {
    'australia': 'AU',
    'india': 'IN',
    'united kingdom': 'GB',
    'uk': 'GB',
    'united states': 'US',
    'usa': 'US',
    'united states of america': 'US',
    'canada': 'CA',
    'new zealand': 'NZ',
    'singapore': 'SG',
    'malaysia': 'MY',
    'united arab emirates': 'AE',
    'uae': 'AE',
    'saudi arabia': 'SA',
    'pakistan': 'PK',
    'bangladesh': 'BD',
    'sri lanka': 'LK',
    'nepal': 'NP',
    'philippines': 'PH',
    'hong kong': 'HK',
    'japan': 'JP',
    'south korea': 'KR',
    'china': 'CN',
    'germany': 'DE',
    'france': 'FR',
    'italy': 'IT',
    'spain': 'ES',
    'south africa': 'ZA',
    'kenya': 'KE',
    'nigeria': 'NG',
    'brazil': 'BR',
    'mexico': 'MX',
    'argentina': 'AR',
    'chile': 'CL',
    'fiji': 'FJ',
};

/**
 * Normalize a country input (name or code) → ISO 2-letter code.
 */
export const normalizeCountryCode = (country) => {
    if (!country) return null;
    const trimmed = country.trim();

    // Already a 2-letter code
    if (trimmed.length === 2) return trimmed.toUpperCase();

    // Look up by name
    return COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()] || null;
};

/**
 * Resolve a postal code + country to an IANA timezone string.
 * Uses GeoNames API if GEONAMES_USERNAME env var is set, otherwise falls back to country mapping.
 *
 * @param {string} postalCode - The student's postal/ZIP code
 * @param {string} country - Country name or ISO 2-letter code
 * @returns {string} IANA timezone (e.g., 'America/New_York')
 */
export const resolveTimezone = async (postalCode, country) => {
    const countryCode = normalizeCountryCode(country);
    const geonamesUser = process.env.GEONAMES_USERNAME;

    // Try GeoNames API if configured
    if (geonamesUser && countryCode && postalCode) {
        try {
            // Step 1: Get lat/lng from postal code
            const geoRes = await axios.get('http://api.geonames.org/postalCodeSearchJSON', {
                params: {
                    postalcode: postalCode.trim(),
                    country: countryCode,
                    maxRows: 1,
                    username: geonamesUser,
                },
                timeout: 5000,
            });

            const places = geoRes.data?.postalCodes;
            if (places && places.length > 0) {
                const { lat, lng } = places[0];

                // Step 2: Get timezone from lat/lng
                const tzRes = await axios.get('http://api.geonames.org/timezoneJSON', {
                    params: {
                        lat,
                        lng,
                        username: geonamesUser,
                    },
                    timeout: 5000,
                });

                if (tzRes.data?.timezoneId) {
                    console.log(`🌍 Resolved timezone: ${postalCode}, ${countryCode} → ${tzRes.data.timezoneId}`);
                    return tzRes.data.timezoneId;
                }
            }

            console.warn(`⚠️ GeoNames returned no results for postal code ${postalCode}, ${countryCode}. Using fallback.`);
        } catch (err) {
            console.warn(`⚠️ GeoNames API error: ${err.message}. Falling back to country mapping.`);
        }
    }

    // Fallback: use country → primary timezone mapping
    if (countryCode && COUNTRY_TIMEZONE_MAP[countryCode]) {
        console.log(`🌍 Using fallback timezone for ${countryCode}: ${COUNTRY_TIMEZONE_MAP[countryCode]}`);
        return COUNTRY_TIMEZONE_MAP[countryCode];
    }

    // Ultimate fallback: UTC
    console.warn(`⚠️ Could not resolve timezone for "${country}" / "${postalCode}". Defaulting to UTC.`);
    return 'UTC';
};

/**
 * List of countries for the frontend dropdown.
 */
export const COUNTRY_LIST = [
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'NP', name: 'Nepal' },
    { code: 'PH', name: 'Philippines' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'CN', name: 'China' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KE', name: 'Kenya' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'AR', name: 'Argentina' },
    { code: 'CL', name: 'Chile' },
    { code: 'FJ', name: 'Fiji' },
];
