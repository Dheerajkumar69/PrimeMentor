// frontend/src/components/Chatbot/ChatbotWidget.jsx

import React, { useState, useRef, useEffect } from 'react';
// Note: We remove the local 'knowledgeBase' as the logic is now on the server.

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: Date.now(), 
      text: "Hi there! I'm PrimeMentor, your virtual assistant. Ask me anything about classes, teachers, or payments!", 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false); // New state for typing indicator
  const messagesEndRef = useRef(null);
  
  // Use a stable, unique ID for the session. 
  // For a basic bot, a local storage key works. For a logged-in user, use their Clerk ID.
  const CHAT_USER_ID = localStorage.getItem('chatUserId') || `guest-${Date.now()}`;
  useEffect(() => {
    localStorage.setItem('chatUserId', CHAT_USER_ID);
  }, [CHAT_USER_ID]);

  // Scroll to the bottom of the chat window on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // --- NEW: Asynchronous API call to the backend ---
  const sendToAI = async (userMessage) => {
    setIsBotTyping(true); // Show typing indicator
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: CHAT_USER_ID, // Use the unique ID for session continuity
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || "Error: Received no response from the AI.";

    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      return "I apologize, but I am having trouble connecting to the AI brain right now. Please check your network or try again later.";
    } finally {
      setIsBotTyping(false); // Hide typing indicator
    }
  };


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isBotTyping) return;

    const userMessage = input.trim();
    
    // 1. Add user message
    setMessages(prev => [...prev, { id: Date.now() + 1, text: userMessage, sender: 'user' }]);
    setInput('');

    // 2. Get AI response via API
    const botResponseText = await sendToAI(userMessage);

    // 3. Add bot response
    setMessages(prev => [...prev, { id: Date.now() + 2, text: botResponseText, sender: 'bot' }]);
  };

  return (
    <>
      {/* --- Chat Bubble Button (Fixed Position: bottom-20, remains same) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-7 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
        aria-label={isOpen ? "Close Chatbot" : "Open Chatbot"}
      >
        <span className="text-2xl">💬</span> 
      </button>

      {/* --- Chat Window (Fixed Position: bottom-32, remains same) --- */}
      {isOpen && (
        <div className="fixed bottom-42 right-6 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col z-50">
          
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white rounded-t-lg flex justify-between items-center">
            <h3 className="text-lg font-semibold">PrimeMentor AI</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-200" aria-label="Close Chat">
                <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-sm shadow-md ${
                    message.sender === 'user' 
                      ? 'bg-indigo-500 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            
            {/* New: Typing Indicator */}
            {isBotTyping && (
                <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-xl rounded-tl-none px-3 py-2 text-sm max-w-[75%] shadow-md">
                        <div className="flex space-x-1">
                            <span className="animate-bounce-dot text-lg">.</span>
                            <span className="animate-bounce-dot text-lg animation-delay-200">.</span>
                            <span className="animate-bounce-dot text-lg animation-delay-400">.</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} /> {/* For auto-scrolling */}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isBotTyping ? "Bot is typing..." : "Type your message..."}
                disabled={isBotTyping}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-gray-50"
              />
              <button
                type="submit"
                disabled={isBotTyping}
                className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;