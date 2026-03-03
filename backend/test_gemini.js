import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function main() {
    const ai = new GoogleGenAI({});
    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction: "Hello" }
    });
    console.log("Sending message...");
    const response = await chat.sendMessage({ message: "Hi" });
    console.log("Response Type:", typeof response.text);
    console.log("Response Getter:", typeof response.text === 'function' ? response.text() : response.text);
    console.log("Response JSON:", JSON.stringify(response, null, 2));
}

main().catch(console.error);
