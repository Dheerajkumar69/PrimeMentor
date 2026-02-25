// backend/routes/assessmentRoutes.js
import express from 'express';
import { submitAssessmentRequest, getAllAssessments } from '../controllers/assessmentController.js';
import { adminOnlyMiddleware } from '../middlewares/adminMiddleware.js';
import { contactLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

// @route POST /api/assessments/submit
// @desc Save new assessment request data to the database
// @access Public (rate-limited: 5 submissions per IP per hour to stop fake spam)
router.post('/submit', contactLimiter, submitAssessmentRequest);

// @route GET /api/assessments
// @desc Get all *free* assessment requests (Admin dashboard)
// @access Private (Admin Only)
router.get('/', adminOnlyMiddleware, getAllAssessments); // Protected by middleware

export default router;