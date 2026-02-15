// backend/routes/chatRoutes.js

import express from 'express';
import { sendMessage } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat/message - Send a message to the AI
router.post('/message', sendMessage);

export default router;