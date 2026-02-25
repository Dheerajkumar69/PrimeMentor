import express from 'express';
import { sendContactEmail } from '../controllers/contactController.js';
import { contactLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

/**
 * @route POST /api/contact
 * @desc Handle contact form submission and send email
 * @access Public (rate-limited: 5 submissions per IP per hour)
 */
router.route('/').post(contactLimiter, sendContactEmail);

export default router;