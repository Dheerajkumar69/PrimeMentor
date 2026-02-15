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

// 🚨 NEW ROUTE 🚨
userRouter.post('/promo/validate', validatePromoCode);

// 🛑 MODIFIED/NEW: Route to start the eWAY payment 🛑
userRouter.post('/initiate-payment', initiatePaymentAndBooking);

// 🛑 NEW: Route called by the frontend after eWAY redirect (to query the result) 🛑
userRouter.post('/finish-eway-payment', finishEwayPaymentAndBooking);

// The old booking endpoint is now deprecated or routed to the new flow
userRouter.post('/book', createBooking); 

userRouter.get('/courses', getUserCourses); 

// 🟢 NEW ROUTE FOR STUDENT FEEDBACK 🟢
userRouter.post('/feedback', protect, submitFeedback); // Needs 'protect' middleware

export default userRouter;