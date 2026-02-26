// backend/routes/userRoutes.js (MODIFIED)

import express from 'express';
import {
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

// Promo code validation — auth + rate-limit (20 attempts/hour) prevents enumeration
userRouter.post('/promo/validate', protect, promoLimiter, validatePromoCode);

// eWAY payment routes — require authenticated user
userRouter.post('/initiate-payment', protect, initiatePaymentAndBooking);
userRouter.post('/finish-eway-payment', protect, finishEwayPaymentAndBooking);

// The old booking endpoint is deprecated — keep auth to prevent anonymous abuse
userRouter.post('/book', protect, createBooking);

// Requires auth: only let signed-in students see their own courses
userRouter.get('/courses', protect, getUserCourses);

// 🟢 NEW ROUTE FOR STUDENT FEEDBACK 🟢
userRouter.post('/feedback', protect, submitFeedback);

// 🔁 Repeat/Recurring Classes
userRouter.post('/repeat-classes', protect, requestRepeatClasses);

// 💳 Repeat Classes Payment
userRouter.post('/initiate-repeat-payment', protect, initiateRepeatPayment);

// 💰 Public pricing endpoint (no auth needed)
userRouter.get('/pricing', getPricing);

export default userRouter;