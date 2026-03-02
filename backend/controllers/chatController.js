// backend/controllers/chatController.js

import { GoogleGenAI } from '@google/genai';
import { knowledgeBase } from '../utils/chatKnowledge.js'; // See Step 4

// Initialize the Gemini AI client
// It automatically looks for the GEMINI_API_KEY in process.env
const ai = new GoogleGenAI({});

// ── In-memory session store ──────────────────────────────────────────────────
// Sessions are keyed by userId. Each entry holds { chat, lastUsed } so we can
// enforce both a hard cap (MAX_SESSIONS) and an idle TTL (SESSION_TTL_MS).
//
// ⚠️ Sessions are lost on server restart — an accepted trade-off for simplicity.
//    For persistence across restarts, migrate to Redis-backed sessions.

const MAX_SESSIONS = 500;              // Hard cap: prevents RAM exhaustion DoS
const SESSION_TTL_MS = 30 * 60 * 1000;  // 30-minute idle timeout per session

/** Map<userId, { chat, lastUsed: number }> */
const chatSessions = new Map();

// Purge sessions that have been idle longer than SESSION_TTL_MS.
// .unref() ensures this timer doesn't keep the process alive during shutdown.
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of chatSessions) {
    if (now - session.lastUsed > SESSION_TTL_MS) {
      chatSessions.delete(userId);
    }
  }
}, 10 * 60 * 1000).unref(); // runs every 10 minutes

// A system instruction to define the bot's persona and rules
const systemInstruction = `
  You are PrimeMentor, a friendly and knowledgeable virtual assistant for PrimeMentor — an Australian online tutoring platform by Prime Mentor PTY Ltd.

  YOUR ROLE:
  Help students, parents, and prospective tutors with questions about:
  1. **Courses & Subjects:** Mathematics, Science, English for Years 2-12. Explain what's available.
  2. **Pricing:** Session prices by year level, Starter Pack offers, and promo codes. Always quote prices in AUD.
  3. **Enrollment & Booking:** How to sign up, the enrollment questionnaire flow, scheduling sessions.
  4. **Free Assessment:** Encourage new users to book a free assessment for a personalized learning roadmap.
  5. **Tutors:** All tutors are degree-qualified and background-checked. Matched after enrollment.
  6. **Payments & Refunds:** Secure eWAY payment, refund policy (full refund within 7 days if no classes taken).
  7. **Account Help:** Registration, login, password reset, viewing courses.

  RESPONSE GUIDELINES:
  - Be warm, professional, and encouraging. Use short paragraphs and bullet points for clarity.
  - When asked about pricing, provide the SPECIFIC prices from the knowledge base (e.g., "$22/session for Year 2-6").
  - When asked about enrollment, walk them through the steps clearly.
  - For questions you CANNOT answer (specific account data, payment processing, technical issues), politely direct them to the Contact page or support team.
  - Never reveal that you are an AI or language model. You are the PrimeMentor assistant.
  - Keep answers concise but complete. Don't overwhelm with information — answer what was asked.
  - If unsure, suggest they visit the pricing section or contact support rather than guessing.

  KNOWLEDGE BASE — Use this information to answer questions accurately:
  ${knowledgeBase.join('\n  ')}
`;

/**
 * Handles the conversation flow: sending a message to Gemini and getting a response.
 * @param {string} userId - Unique identifier for the user session (e.g., Clerk user ID or a temp session ID)
 * @param {string} message - The user's message
 */
export const sendMessage = async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing userId or message.' });
  }

  try {
    // 1. Get or Create Chat Session
    if (!chatSessions.has(userId)) {
      // Evict the oldest (first-inserted) session when we hit the cap.
      // Map insertion order is guaranteed in JS, so .keys().next() is the LRU entry.
      if (chatSessions.size >= MAX_SESSIONS) {
        const oldestKey = chatSessions.keys().next().value;
        chatSessions.delete(oldestKey);
      }

      // Start a new chat session with defined configuration
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      chatSessions.set(userId, { chat, lastUsed: Date.now() });
    }

    const session = chatSessions.get(userId);
    session.lastUsed = Date.now(); // Refresh idle TTL on every message
    const chat = session.chat;

    // 2. Send Message and Stream Response
    const response = await chat.sendMessage({ message });

    // 3. Return the AI's response text
    res.json({
      response: response.text,
      // We can optionally return the full history, but for simplicity, we return only the text
    });

  } catch (error) {
    console.error("Gemini API Error:", error.message);
    res.status(500).json({
      error: "Sorry, the AI service is currently unavailable. Please try again later.",
      details: error.message
    });
  }
};