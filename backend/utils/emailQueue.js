// backend/utils/emailQueue.js
// Sequential, reliable email queue with retry and dead-letter persistence.
//
// Usage:
//   import { enqueueEmail } from './emailQueue.js';
//   enqueueEmail('courseConfirmation', sendCourseConfirmationEmail, [arg1, arg2, ...], { transactionId, studentId });
//
// Emails are processed ONE AT A TIME with a configurable delay between sends.
// If all retries are exhausted the job is saved to the EmailFailure collection.

import EmailFailure from '../models/EmailFailure.js';

// ── Configuration ──
const QUEUE_DELAY_MS = 800;       // ms between consecutive email sends
const RETRY_MAX = 5;              // max retry attempts per email
const RETRY_BASE_MS = 1500;       // base delay for exponential backoff (1.5s → 3s → 6s → 12s → 24s)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Internal queue state ──
const _queue = [];                // array of { emailType, sendFn, args, meta, resolve }
let _processing = false;

/**
 * Add an email to the sequential queue.
 * Returns a Promise that resolves when the email is sent (or fails permanently).
 *
 * @param {string}   emailType  - Label for logging/dead-letter (e.g. 'courseConfirmation')
 * @param {Function} sendFn     - The actual async email-sending function (e.g. sendCourseConfirmationEmail)
 * @param {Array}    args       - Arguments to spread into sendFn
 * @param {object}   [meta={}]  - Optional metadata for dead-letter record (transactionId, studentId, etc.)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export function enqueueEmail(emailType, sendFn, args = [], meta = {}) {
    return new Promise((resolve) => {
        _queue.push({ emailType, sendFn, args, meta, resolve });
        console.log(`[EmailQueue] ✉️  Enqueued "${emailType}" → ${_queue.length} job(s) in queue`);
        _processNext(); // kick off processing if idle
    });
}

/**
 * Process the queue sequentially — one email at a time.
 */
async function _processNext() {
    if (_processing) return; // another loop is already running
    _processing = true;

    while (_queue.length > 0) {
        const job = _queue.shift();
        const { emailType, sendFn, args, meta, resolve } = job;
        const recipient = _extractRecipient(args);

        let lastError = null;
        let success = false;

        for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
            try {
                await sendFn(...args);
                console.log(`[EmailQueue] ✅ "${emailType}" to ${recipient} sent (attempt ${attempt})`);
                success = true;
                break;
            } catch (err) {
                lastError = err;
                const status = err?.statusCode || err?.status || err?.response?.status;
                const isRetryable = status === 429 || (status >= 500 && status < 600) || !status;

                if (isRetryable && attempt < RETRY_MAX) {
                    const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
                    console.warn(`[EmailQueue] ⚠️ "${emailType}" to ${recipient} failed (attempt ${attempt}/${RETRY_MAX}), retrying in ${delay}ms: ${err.message}`);
                    await sleep(delay);
                } else {
                    console.error(`[EmailQueue] ❌ "${emailType}" to ${recipient} failed permanently after ${attempt} attempt(s): ${err.message}`);
                    break;
                }
            }
        }

        if (!success) {
            // Save to dead-letter collection
            try {
                await EmailFailure.create({
                    emailType,
                    recipient: recipient || 'unknown',
                    payload: _safeSerialize(args),
                    error: lastError?.message || 'Unknown error',
                    attempts: RETRY_MAX,
                    retryable: true,
                    meta,
                });
                console.log(`[EmailQueue] 💀 Dead-lettered "${emailType}" to ${recipient}`);
            } catch (dbErr) {
                console.error(`[EmailQueue] 🔥 Failed to save dead-letter for "${emailType}":`, dbErr.message);
            }
        }

        resolve({ success, error: success ? undefined : lastError?.message });

        // Rate-limit buffer between sends
        if (_queue.length > 0) {
            await sleep(QUEUE_DELAY_MS);
        }
    }

    _processing = false;
}

/**
 * Try to extract the recipient email from the first string argument.
 */
function _extractRecipient(args) {
    for (const arg of args) {
        if (typeof arg === 'string' && arg.includes('@')) return arg;
    }
    return 'unknown';
}

/**
 * Safely serialize args for MongoDB storage (strip functions, circular refs).
 */
function _safeSerialize(args) {
    try {
        return JSON.parse(JSON.stringify(args));
    } catch {
        return String(args);
    }
}

/**
 * Get current queue depth (for monitoring/health checks).
 */
export function getQueueDepth() {
    return _queue.length;
}
