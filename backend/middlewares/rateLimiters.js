// backend/middlewares/rateLimiters.js
// Centralised rate limiters — imported by individual route files.
// Uses express-rate-limit v7 (keyGenerator defaults to IP).

import { rateLimit } from 'express-rate-limit';

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Standard "too many requests" JSON response used by all limiters.
 */
const jsonHandler = (req, res) => {
    res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down and try again later.',
    });
};

// ─── 1. Strict Auth Limiter ──────────────────────────────────────────────────
// Applied to: POST /api/admin/login, POST /api/teacher/login
// 10 attempts per 15 minutes per IP — after that, lockout.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: jsonHandler,
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    skipSuccessfulRequests: true, // Only count failed (non-2xx) requests against the limit
});

// ─── 2. Password Reset Limiter ───────────────────────────────────────────────
// Applied to: POST /api/teacher/forgot-password, POST /api/teacher/reset-password
// 5 requests per hour — prevents email flooding / token brute-force.
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: jsonHandler,
});

// ─── 3. Contact / Email Limiter ──────────────────────────────────────────────
// Applied to: POST /api/contact, POST /api/assessments/submit
// 5 submissions per hour per IP — prevents email relay abuse.
export const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: jsonHandler,
});

// ─── 4. Chat / AI Limiter ────────────────────────────────────────────────────
// Applied to: POST /api/chat/message
// 30 messages per 10 minutes per IP — prevents Gemini API cost abuse.
export const chatLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: jsonHandler,
});

// ─── 5. General API Limiter ──────────────────────────────────────────────────
// Applied globally in server.js to ALL /api/* routes as a safety net.
// 200 requests per 5 minutes per IP.
export const generalApiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: jsonHandler,
});

// ─── 6. Promo Code Limiter ───────────────────────────────────────────────────
// Applied to: POST /api/user/promo/validate
// 20 attempts per hour per IP/user — prevents enumeration of valid codes.
export const promoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: jsonHandler,
});
