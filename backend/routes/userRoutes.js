// backend/routes/userRoutes.js

import express from 'express';
// REMOVE: import { protect } from '../middlewares/authMiddleware.js';
import { getUserCourses, createBooking, processPaymentAndBooking } from '../controllers/userController.js'; 

const userRouter = express.Router();

// 🛑 MODIFIED/NEW: New route for payment and booking 🛑
userRouter.post('/process-payment', processPaymentAndBooking);

// The old booking endpoint is now deprecated or routed to the new flow
userRouter.post('/book', createBooking); 

userRouter.get('/courses', getUserCourses); 

export default userRouter;