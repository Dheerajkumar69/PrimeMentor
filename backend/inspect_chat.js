import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'dummy' });
const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: { systemInstruction: "Hello" }
});
console.log(chat);
console.log(Object.keys(chat));
