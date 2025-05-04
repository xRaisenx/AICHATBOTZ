// components/ChatInterface.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPaperPlane } from 'react-icons/fa'; // Using react-icons
import { ThemeToggle } from './ThemeToggle';
import { ChatMessage, Message } from './ChatMessage';
import { v4 as uuidv4 } from 'uuid'; // For generating unique keys

// Example suggested questions (can be fetched from backend later)
const suggestedQuestions = [
    "What’s the best moisturizer for dry skin?",
    "Can you recommend a sulfate-free shampoo?",
    "What products help with oily skin?",
    "Show me vegan lipsticks under $20.",
    "How do I choose a foundation shade?"
];

// Get welcome message from environment variable (defined in .env.local)
const welcomeMessageText = process.env.NEXT_PUBLIC_WELCOME_MESSAGE || "Welcome! How can I help you today?";

export function ChatInterface() {
  // State for messages, input field, and loading status
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for scrolling and input focus
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Effect to set the initial welcome message on component mount
  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        role: 'bot',
        // Use the standard message structure for the welcome message
        ai_understanding: "Initial greeting.", // Optional context
        advice: welcomeMessageText,
      },
    ]);
    // Focus the input field when the chat loads
    inputRef.current?.focus();
  }, []); // Empty dependency array ensures this runs only once

  // Effect to automatically scroll to the bottom when new messages are added
  useEffect(() => {
    if (chatAreaRef.current) {
        const element = chatAreaRef.current;
        // Use smooth scrolling for a better user experience
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth',
        });
    }
  }, [messages]); // Run this effect whenever the messages array changes

  // Handler for input field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // --- Send Message Function (using useCallback for optimization) ---
  const sendMessage = useCallback(async (messageText: string) => {
    const trimmedText = messageText.trim();
    // Prevent sending empty messages or sending while already loading
    if (!trimmedText || isLoading) return;

    const userMessageId = uuidv4();
    const userMessage: Message = { id: userMessageId, role: 'user', text: trimmedText };

    // Add user message and loading indicator optimistically
    const loadingMessageId = uuidv4();
    setMessages((prev) => [
        ...prev,
        userMessage,
        { id: loadingMessageId, role: 'bot', isLoading: true }
    ]);
    setInput(''); // Clear input field
    setIsLoading(true); // Set loading state

    try {
      // Prepare history: Send last N messages (e.g., 6 = 3 turns)
      // Filter out loading/error states before sending to backend
      const historyToSend = messages
          .filter(m => !m.isLoading && !m.isError)
          .slice(-6) // Adjust history length as needed
          .map(({ id, isLoading, isError, ...rest }) => rest); // Remove client-only props

      // --- Call Backend API Route ---
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedText, history: historyToSend }),
      });
      // ---

      let data: Message | { error: string }; // Define type for response or error

      if (!response.ok) {
         // Attempt to parse error JSON from backend
         try { data = await response.json(); }
         catch { data = { error: `API error: ${response.status} ${response.statusText}` }; }
         // Throw error to be caught by the catch block
         throw new Error((data as { error: string }).error || 'API request failed');
      }

      // Parse successful response
      data = await response.json(); // Expecting ChatApiResponse structure

      // Replace typing indicator with the actual bot response
      setMessages((prev) => [
          ...prev.filter(msg => msg.id !== loadingMessageId), // Remove loading message by ID
          // Add the new bot message, ensuring it has an ID and role
          { ...(data as Message), id: uuidv4(), role: 'bot' }
      ]);

    } catch (error) {
      console.error('Failed to send/process message:', error);
       // Replace typing indicator with a user-friendly error message
       setMessages((prev) => [
           ...prev.filter(msg => msg.id !== loadingMessageId), // Remove loading message by ID
           {
               id: uuidv4(),
               role: 'bot',
               isError: true, // Mark message as an error
               // Provide a helpful error text, potentially including part of the error message
               text: `Sorry, something went wrong. Please try again. ${error instanceof Error ? `(${error.message.substring(0, 100)})` : ''}` // Limit error length
            }
       ]);
    } finally {
      setIsLoading(false); // Reset loading state
      // Refocus the input field for the next message
      inputRef.current?.focus();
    }
  }, [isLoading, messages]); // Dependencies for useCallback

  // Handler for send button click
  const handleSendClick = () => { sendMessage(input); };

  // Handler for pressing Enter key in input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage(input);
    }
  };

   // Handler for clicking suggested question chips
   const handleExampleClick = (question: string) => {
        setInput(question);
        // Use setTimeout to allow state update before sending message
        setTimeout(() => sendMessage(question), 0);
    };

  // --- Render JSX ---
  return (
    // Apply base chat container styles
    <div className="chat-container">
      {/* Apply chat header styles */}
      <div className="chat-header">
        Planet Beauty AI Assistant ✨
      </div>

      {/* Chat Area for displaying messages */}
      <div ref={chatAreaRef} className="chat-area">
        {/* Map over messages array and render ChatMessage component for each */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      {/* Suggested Questions Area (conditional rendering) */}
      {/* Show only if it's just the initial welcome message and not loading */}
      {messages.length <= 1 && !isLoading && (
            <div className="examples-container border-t border-border-light dark:border-border-dark"> {/* Use class */}
                {suggestedQuestions.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => handleExampleClick(q)}
                        className="example-chip" // Use class
                    >
                        {q}
                    </button>
                ))}
            </div>
        )}

      {/* Input Area */}
      <div className="input-area"> {/* Use class */}
        <input
          ref={inputRef} // Assign ref
          className="chat-input" // Use class
          type="text"
          placeholder="Ask about products or beauty tips..."
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isLoading} // Disable input while loading
          autoComplete="off"
          aria-label="Type your beauty question or search products"
        />
        {/* Send Button */}
        <button
          id="send-btn"
          className="icon-button send-btn" // Use class
          onClick={handleSendClick}
          disabled={isLoading || !input.trim()} // Disable if loading or input is empty
          aria-label="Send message"
        >
          <FaPaperPlane size={16}/> {/* Use react-icon */}
        </button>
        {/* Theme Toggle Button */}
        <ThemeToggle />
      </div>
    </div>
  );
}