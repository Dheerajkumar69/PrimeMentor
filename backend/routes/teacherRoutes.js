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
    submitPastClass // 🛑 NEW IMPORT
} from '../controllers/teacherController.js';
import { protectTeacher } from '../middlewares/authTeacherMiddleware.js';

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
router.post('/login', loginTeacher);
router.post('/forgot-password', forgotPasswordTeacher);
router.post('/reset-password', resetPasswordTeacher);

// Protected teacher routes
router.get('/class-requests', protectTeacher, getClassRequests);
router.put('/class-requests/:id/accept', protectTeacher, acceptClassRequest);
router.get('/managed-classes', protectTeacher, getManagedClasses);

// 🛑 NEW ROUTE: Submit Past Class Form 🛑
router.post('/past-class/submit', protectTeacher, submitPastClass);


export default router;