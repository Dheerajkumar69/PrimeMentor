// backend/routes/userRoutes.js (MODIFIED)

import express from 'express';
import {
    getUserCourses,
    createBooking,
    initiatePaymentAndBooking,
    finishEwayPaymentAndBooking,
    // 🚨 NEW IMPORTS 🚨
    validatePromoCode,
    submitFeedback // 🛑 NEW IMPORT: submitFeedback
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js'; // Assuming this middleware exists

const userRouter = express.Router();

// Promo code validation — requires auth to prevent brute-force
userRouter.post('/promo/validate', protect, validatePromoCode);

// eWAY payment routes — require authenticated user
userRouter.post('/initiate-payment', protect, initiatePaymentAndBooking);
userRouter.post('/finish-eway-payment', protect, finishEwayPaymentAndBooking);

// The old booking endpoint is now deprecated or routed to the new flow
userRouter.post('/book', createBooking);

userRouter.get('/courses', getUserCourses);

// 🟢 NEW ROUTE FOR STUDENT FEEDBACK 🟢
userRouter.post('/feedback', protect, submitFeedback); // Needs 'protect' middleware

export default userRouter;