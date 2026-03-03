// backend/controllers/chatController.js

import { GoogleGenAI } from '@google/genai';
import { knowledgeBase } from '../utils/chatKnowledge.js'; // See Step 4
import PricingModel from '../models/PricingModel.js';

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

// A system instruction template to define the bot's persona and rules
const generateSystemInstruction = (pricingContext) => `
  You are PrimeMentor, a friendly and knowledgeable virtual assistant for PrimeMentor — an Australian online tutoring platform by Prime Mentor PTY Ltd.

  YOUR ROLE:
  Help students, parents, and prospective tutors with questions about:
  1. Courses & Subjects: Mathematics, Science, English for Years 2-12. Explain what's available.
  2. Pricing: Session prices by year level, Starter Pack offers, and promo codes. Always quote prices in AUD.
  3. Enrollment & Booking: How to sign up, the enrollment questionnaire flow, scheduling sessions.
  4. Free Assessment: Encourage new users to book a free assessment for a personalized learning roadmap.
  5. Tutors: All tutors are degree-qualified and background-checked. Matched after enrollment.
  6. Payments & Refunds: Secure eWAY payment, refund policy (full refund within 7 days if no classes taken).
  7. Account Help: Registration, login, password reset, viewing courses.

  RESPONSE GUIDELINES:
  - Be warm, professional, and encouraging. Use short paragraphs and bullet points for clarity.
  - DO NOT use any Markdown formatting like **, *, or #. Just use plain text with line breaks and simple dashes for bullet points.
  - When asked about pricing, use the specific prices from the CURRENT PRICING CONTEXT below.
  - When asked about enrollment, walk them through the steps clearly.
  - For questions you CANNOT answer (specific account data, payment processing, technical issues), politely direct them to the Contact page or support team.
  - Never reveal that you are an AI or language model. You are the PrimeMentor assistant.
  - Keep answers concise but complete. Don't overwhelm with information — answer what was asked.
  - If unsure, suggest they visit the pricing section or contact support rather than guessing.

  CURRENT PRICING CONTEXT (AUD):
  ${pricingContext}

  KNOWLEDGE BASE — Use this information to answer general questions accurately:
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
    console.log(`[Chat] Received request for userId: ${userId}`);
    // 1. Fetch current pricing dynamically on every request
    const pricingData = await PricingModel.findOne({ _singletonKey: 'global_pricing' });
    console.log(`[Chat] Fetched pricingData`, pricingData);
    let pricingContextStr = "Prices are dynamically managed. Please check the website for the latest rates.";

    if (pricingData) {
      const ranges = [];
      for (const [range, details] of pricingData.classRanges.entries()) {
        ranges.push(`- Year ${range}: $${details.sessionPrice} per session (original price $${details.originalPrice} per session)`);
      }

      let minPrice = Infinity;
      for (const details of pricingData.classRanges.values()) {
        if (details.sessionPrice < minPrice) minPrice = details.sessionPrice;
      }

      const sp = pricingData.starterPack;
      pricingContextStr = `Prices start from $${minPrice}/session onwards. All prices shown are per 60-minute session.
Pricing completely dynamically managed by admins, so refer strictly to the list below:
${ranges.join('\n')}

Starter Pack Details:
We offer a Starter Pack consisting of ${sp.numberOfSessions} x 60-minute 1-on-1 sessions.
It gives a $${sp.fixedDiscount} fixed discount off the total price of ${sp.numberOfSessions} sessions. Calculate the final price of the starter pack using these numbers when explicitly asked for the cost of a starter pack based on a specific year level.`;
    }

    const currentSystemInstruction = generateSystemInstruction(pricingContextStr);


    // 2. Get or Create Chat Session
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
          systemInstruction: currentSystemInstruction,
          temperature: 0.7,
        }
      });
      chatSessions.set(userId, { chat, lastUsed: Date.now() });
    }

    const session = chatSessions.get(userId);
    session.lastUsed = Date.now(); // Refresh idle TTL on every message
    const chat = session.chat;

    // VERY IMPORTANT: Ensure the system instruction is ALWAYS injected with up-to-date prices
    // The history is maintained in the memory of the GoogleGenAI instance.
    // Changing the config here makes sure this incoming message is processed with current pricing.
    chat.config = chat.config || {};
    chat.config.systemInstruction = currentSystemInstruction;

    // 3. Send Message and Stream Response
    console.log(`[Chat] Sending message to Gemini for userId: ${userId}`);
    const response = await chat.sendMessage({ message });
    console.log(`[Chat] Received response from Gemini`);

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