// components/ChatInterface.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { ThemeToggle } from './ThemeToggle';
import { ChatMessage, Message } from './ChatMessage';
import { v4 as uuidv4 } from 'uuid';

const suggestedQuestions = [
    "What’s the best moisturizer for dry skin?",
    "Can you recommend a sulfate-free shampoo?",
    "What products help with oily skin?",
    "Show me vegan lipsticks under $20.",
    "How do I choose a foundation shade?"
];

const welcomeMessageText = process.env.NEXT_PUBLIC_WELCOME_MESSAGE || "Welcome! How can I help you today?";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        role: 'bot',
        ai_understanding: "Initial greeting.",
        advice: welcomeMessageText,
      },
    ]);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (chatAreaRef.current) {
        const element = chatAreaRef.current;
        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = useCallback(async (messageText: string) => {
    const trimmedText = messageText.trim();
    if (!trimmedText || isLoading) return;

    const userMessageId = uuidv4();
    const userMessage: Message = { id: userMessageId, role: 'user', text: trimmedText };
    const loadingMessageId = uuidv4();

    setMessages((prev) => [
        ...prev,
        userMessage,
        { id: loadingMessageId, role: 'bot', isLoading: true }
    ]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history: Remove client-specific state props before sending
      const historyToSend = messages
          .filter(m => !m.isLoading && !m.isError)
          .slice(-6)
          // Use object destructuring to omit client-side state properties
          .map(({ id: msgId, isLoading: loadingState, isError: errorState, ...rest }) => rest);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedText, history: historyToSend }),
      });

      let data: Message | { error: string };

      if (!response.ok) {
         try { data = await response.json(); }
         catch { data = { error: `API error: ${response.status} ${response.statusText}` }; }
         throw new Error((data as { error: string }).error || 'API request failed');
      }

      data = await response.json();

      setMessages((prev) => [
          ...prev.filter(msg => msg.id !== loadingMessageId),
          { ...(data as Message), id: uuidv4(), role: 'bot' }
      ]);

    } catch (error) {
      console.error('Failed to send/process message:', error);
       setMessages((prev) => [
           ...prev.filter(msg => msg.id !== loadingMessageId),
           {
               id: uuidv4(),
               role: 'bot',
               isError: true,
               text: `Sorry, something went wrong. Please try again. ${error instanceof Error ? `(${error.message.substring(0, 100)})` : ''}`
            }
       ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, messages]);

  const handleSendClick = () => { sendMessage(input); };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !isLoading) { sendMessage(input); } };
  const handleExampleClick = (question: string) => { setInput(question); setTimeout(() => sendMessage(question), 0); };

  return (
    <div className="chat-container">
      <div className="chat-header">Planet Beauty AI Assistant ✨</div>
      <div ref={chatAreaRef} className="chat-area">
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
      </div>
      {messages.length <= 1 && !isLoading && (
            <div className="examples-container border-t border-border-light dark:border-border-dark">
                {suggestedQuestions.map((q, i) => ( <button key={i} onClick={() => handleExampleClick(q)} className="example-chip">{q}</button> ))}
            </div>
        )}
      <div className="input-area">
        <input ref={inputRef} className="chat-input" type="text" placeholder="Ask about products or beauty tips..." value={input} onChange={handleInputChange} onKeyPress={handleKeyPress} disabled={isLoading} autoComplete="off" aria-label="Type your beauty question or search products" />
        <button id="send-btn" className="icon-button send-btn" onClick={handleSendClick} disabled={isLoading || !input.trim()} aria-label="Send message"><FaPaperPlane size={16}/></button>
        <ThemeToggle />
      </div>
    </div>
  );
}