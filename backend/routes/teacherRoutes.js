// backend/routes/teacherRoutes.js
import express from 'express';
import upload from '../config/multer.js';
import {
    registerTeacher,
    loginTeacher,
    getClassRequests,
    getManagedClasses,
    acceptClassRequest,
    forgotPasswordTeacher,
    resetPasswordTeacher,
    submitPastClass,
    getTeacherProfile,
} from '../controllers/teacherController.js';
import { protectTeacher } from '../middlewares/authTeacherMiddleware.js';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

router.get('/test', (req, res) => res.send('✅ Teacher route is working'));

// Auth routes
router.post(
    '/register',
    upload.fields([
        { name: 'image', maxCount: 1 },    // For the profile picture
        { name: 'cvFile', maxCount: 1 }    // For the CV document
    ]),
    registerTeacher
);
// authLimiter: max 10 failed attempts per IP per 15 min
router.post('/login', authLimiter, loginTeacher);
// passwordResetLimiter: max 5 requests per IP per hour
router.post('/forgot-password', passwordResetLimiter, forgotPasswordTeacher);
router.post('/reset-password', passwordResetLimiter, resetPasswordTeacher);

// Protected teacher routes
router.get('/class-requests', protectTeacher, getClassRequests);
router.put('/class-requests/:id/accept', protectTeacher, acceptClassRequest);
router.get('/managed-classes', protectTeacher, getManagedClasses);

// Submit Past Class Form
router.post('/past-class/submit', protectTeacher, submitPastClass);

// Get logged-in teacher profile (for page-refresh session re-hydration)
router.get('/me', protectTeacher, getTeacherProfile);

export default router;