// backend/routes/userRoutes.js

import express from 'express';
import { getUserCourses, createBooking, initiatePaymentAndBooking, finishEwayPaymentAndBooking } from '../controllers/userController.js'; 

const userRouter = express.Router();

// 🛑 MODIFIED/NEW: Route to start the eWAY payment 🛑
userRouter.post('/initiate-payment', initiatePaymentAndBooking);

// 🛑 NEW: Route called by the frontend after eWAY redirect (to query the result) 🛑
userRouter.post('/finish-eway-payment', finishEwayPaymentAndBooking);

// The old booking endpoint is now deprecated or routed to the new flow
userRouter.post('/book', createBooking); 

userRouter.get('/courses', getUserCourses); 

export default userRouter;