// backend/routes/chatRoutes.js

import express from 'express';
import { sendMessage } from '../controllers/chatController.js';
import { chatLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

// POST /api/chat/message
// - PUBLIC: accessible to all visitors (no JWT required)
// - chatLimiter: max 30 messages per IP per 10 min (caps Gemini API cost)
router.post('/message', chatLimiter, sendMessage);

export default router;
