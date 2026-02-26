// backend/routes/chatRoutes.js

import express from 'express';
import { sendMessage } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { chatLimiter } from '../middlewares/rateLimiters.js';

const router = express.Router();

// POST /api/chat/message
// - protect: requires valid JWT session (blocks anonymous users)
// - chatLimiter: max 30 messages per IP per 10 min (caps Gemini API cost)
router.post('/message', protect, chatLimiter, sendMessage);

export default router;