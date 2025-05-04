// components/ChatMessage.tsx
import { ProductCard } from './ProductCard';
import DOMPurify from 'isomorphic-dompurify';
import { FaSpinner } from 'react-icons/fa'; // Using react-icons for spinner

// Interface defining the structure of a message object
export interface Message {
  id: string; // Unique identifier for React key prop
  role: 'user' | 'bot'; // Sender role
  text?: string; // User query or simple bot text (less common now)
  ai_understanding?: string; // AI's interpretation of the query
  product_card?: { // Optional product card data
    title: string;
    description: string;
    price: string;
    image: string | null;
    landing_page: string;
  };
  advice?: string; // AI-generated advice or response text
  isLoading?: boolean; // Flag for loading state (typing indicator)
  isError?: boolean; // Flag for error state
}

interface ChatMessageProps {
  message: Message; // Prop containing the message object
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Sanitize potentially unsafe HTML from AI advice/text
  // Allows basic formatting tags like bold, italic, lists, etc.
  const sanitizeOptions = { USE_PROFILES: { html: true }, ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'br', 'p', 'ul', 'ol', 'li'] };
  const sanitizedAdvice = message.advice ? DOMPurify.sanitize(message.advice, sanitizeOptions) : '';
  // Sanitize 'text' field as well, in case it contains AI-generated error messages with HTML
  const sanitizedText = message.text ? DOMPurify.sanitize(message.text, sanitizeOptions) : '';

  // --- Loading Indicator ---
  if (message.isLoading) {
    return (
      // Apply base message styles + bot styles + specific loading styles
      <div className="message-base bot-message flex items-center space-x-2 opacity-80">
         <FaSpinner className="animate-spin" size={14}/>
         <span className="text-sm italic">Bella is thinking...</span>
         {/* Alternative dot indicator using keyframes defined in globals.css */}
         {/* <div className="typing-indicator">
            <span className="typing-dot animate-bounce [animation-delay:-0.3s]"></span>
            <span className="typing-dot animate-bounce [animation-delay:-0.15s]"></span>
            <span className="typing-dot animate-bounce"></span>
         </div> */}
      </div>
    );
  }

  // --- Error Message Styling ---
  if (message.isError) {
       return (
         // Apply base message styles + bot styles + specific error styling
         <div className={`message-base bot-message bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300`}>
            <p className={"font-medium"}>Oops!</p>
            {/* Display sanitized error text */}
            {sanitizedText && <div dangerouslySetInnerHTML={{ __html: sanitizedText }} />}
         </div>
       );
  }

  // --- Standard User/Bot Message ---
  return (
    // Apply base message styles and role-specific styles
    <div className={`message-base ${isUser ? 'user-message' : 'bot-message'}`}>
      {/* Render AI Understanding (only for bot messages) */}
      {!isUser && message.ai_understanding && (
        <p className={"ai-understanding-text"}>{message.ai_understanding}</p> // Applied via @layer components
      )}

      {/* Render user's query text directly (no sanitization needed) */}
      {isUser && message.text && (
         <div>{message.text}</div>
      )}

      {/* Render Product Card (only for bot messages) */}
      {!isUser && message.product_card && (
        <div className="mt-3 mb-1"> {/* Add spacing around the card */}
          <ProductCard {...message.product_card} />
        </div>
      )}

      {/* Render Advice (only for bot messages) */}
      {/* Use dangerouslySetInnerHTML because advice might contain sanitized basic HTML */}
      {!isUser && sanitizedAdvice && (
        <div className="advice-text" dangerouslySetInnerHTML={{ __html: sanitizedAdvice }} /> // Applied via @layer components
      )}
    </div>
  );
}