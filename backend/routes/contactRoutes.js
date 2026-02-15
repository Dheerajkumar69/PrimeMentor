import express from 'express';
import { sendContactEmail } from '../controllers/contactController.js';

const router = express.Router();

/**
 * @route POST /api/contact
 * @desc Handle contact form submission and send email via SendGrid
 * @access Public
 */
router.route('/').post(sendContactEmail);

export default router;