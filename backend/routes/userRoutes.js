// backend/routes/userRoutes.js

import express from 'express';
import {
    registerStudent,
    loginStudent,
    forgotStudentPassword,
    resetStudentPassword,
    getStudentProfile,
    getUserCourses,
    createBooking,
    initiatePaymentAndBooking,
    finishEwayPaymentAndBooking,
    validatePromoCode,
    submitFeedback,
    requestRepeatClasses,
    initiateRepeatPayment,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { promoLimiter } from '../middlewares/rateLimiters.js';
import { getPricing } from '../controllers/pricingController.js';

const userRouter = express.Router();

// ── Public Auth Routes ──
userRouter.post('/register', registerStudent);
userRouter.post('/login', loginStudent);
userRouter.post('/forgot-password', forgotStudentPassword);
userRouter.post('/reset-password', resetStudentPassword);

// ── Authenticated Student Profile ──
userRouter.get('/me', protect, getStudentProfile);

// ── Promo code validation ──
userRouter.post('/promo/validate', protect, promoLimiter, validatePromoCode);

// ── eWAY payment routes ──
userRouter.post('/initiate-payment', protect, initiatePaymentAndBooking);
userRouter.post('/finish-eway-payment', protect, finishEwayPaymentAndBooking);

// ── Booking ──
userRouter.post('/book', protect, createBooking);

// ── Student courses ──
userRouter.get('/courses', protect, getUserCourses);

// ── Feedback ──
userRouter.post('/feedback', protect, submitFeedback);

// ── Repeat Classes ──
userRouter.post('/repeat-classes', protect, requestRepeatClasses);
userRouter.post('/initiate-repeat-payment', protect, initiateRepeatPayment);

// ── Public pricing endpoint ──
userRouter.get('/pricing', getPricing);

export default userRouter;