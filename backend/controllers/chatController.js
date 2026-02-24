// backend/controllers/chatController.js

import { GoogleGenAI } from '@google/genai';
import { knowledgeBase } from '../utils/chatKnowledge.js'; // See Step 4

// Initialize the Gemini AI client
// It automatically looks for the GEMINI_API_KEY in process.env
const ai = new GoogleGenAI({});

// ⚠️ LIMITATION: Chat sessions are stored in-memory and will be LOST on server
// restart or crash. This is an accepted trade-off for simplicity.
// For persistence, migrate to Redis or MongoDB-backed sessions.
const chatSessions = {};

// A system instruction to define the bot's persona and rules
const systemInstruction = `
  You are PrimeMentor, an expert virtual assistant for an online school tutoring platform.
  Your primary role is to assist students, parents, and teachers with questions related to:
  1. **Tutoring:** How the 1:1 classes work, subjects, grade levels (2-12).
  2. **Account:** Enrollment, pricing, booking, and policy questions.
  3. **Mentors:** How to become a teacher (tutor).

  Always maintain a professional, encouraging, and helpful tone.
  If the question is sensitive (e.g., specific student data) or involves actions you cannot perform (like logging in or processing payment), gently state that you are only an assistant and direct them to the appropriate contact page or user dashboard.
  
  Do not mention that you are a language model or AI.

  Here is important knowledge about PrimeMentor that you should use to answer questions:
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
    if (!chatSessions[userId]) {
      // Start a new chat session with defined configuration
      const chat = ai.chats.create({
        model: "gemini-2.5-flash", // Use a fast model for chat
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      chatSessions[userId] = chat;
    }

    const chat = chatSessions[userId];

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