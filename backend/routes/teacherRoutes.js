// backend/routes/teacherRoutes.js
import express from 'express';
import upload from '../config/multer.js';
import {
  registerTeacher,
  loginTeacher,
  getClassRequests,
  getManagedClasses,
  acceptClassRequest,
  forgotPasswordTeacher
} from '../controllers/teacherController.js';
import { protectTeacher } from '../middlewares/authTeacherMiddleware.js';

const router = express.Router();

router.get('/test', (req, res) => res.send('✅ Teacher route is working'));

// Auth routes
router.post(
    '/register', 
    upload.fields([
        { name: 'image', maxCount: 1 },    // For the profile picture
        { name: 'cvFile', maxCount: 1 }    // For the CV document
    ]), 
    registerTeacher
);
router.post('/login', loginTeacher);
router.post('/forgot-password', forgotPasswordTeacher); // NEW ROUTE**

// Protected teacher routes
router.get('/class-requests', protectTeacher, getClassRequests);
router.put('/class-requests/:id/accept', protectTeacher, acceptClassRequest);
router.get('/managed-classes', protectTeacher, getManagedClasses);

// Public student route
// router.post('/create-request', createClassRequest);

export default router;