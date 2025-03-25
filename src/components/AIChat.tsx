import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/AIChat.module.css';

interface AIChatProps {
  reasoning: string | undefined;
  isAIThinking: boolean;
}

interface ChatMessage {
  id: number;
  content: string;
  timestamp: Date;
}

const AIChat: React.FC<AIChatProps> = ({ reasoning, isAIThinking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousReasoningRef = useRef<string | undefined>(undefined);
  const messageIdRef = useRef(0);
  
  // Process reasoning immediately when it arrives
  useEffect(() => {
    if (!reasoning) {
      return;
    }
    
    // Skip if this is the same reasoning we just processed
    if (reasoning === previousReasoningRef.current) {
      return;
    }
    
    console.log("AIChat received reasoning:", reasoning);
    previousReasoningRef.current = reasoning;
    
    try {
      let formattedContent = '';
      
      // First try direct JSON parsing
      try {
        const jsonStart = reasoning.indexOf('{');
        const jsonEnd = reasoning.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = reasoning.substring(jsonStart, jsonEnd);
          const data = JSON.parse(jsonStr);
          
          if (data && data.move && data.reasoning) {
            // Format move from e7e5 to e7 → e5 if it's in that format
            const move = data.move;
            const formattedMove = move.length === 4 
              ? `${move.substring(0, 2)} → ${move.substring(2, 4)}`
              : move;
            
            formattedContent = `Move: ${formattedMove}\nReasoning: ${data.reasoning}`;
            console.log("Successfully parsed JSON reasoning:", formattedContent);
          }
        }
      } catch (jsonError) {
        console.log("JSON parsing attempt failed:", jsonError);
      }
      
      // If JSON parsing failed, try regex patterns
      if (!formattedContent) {
        const moveMatch = reasoning.match(/"move"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        const reasoningMatch = reasoning.match(/"reasoning"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        
        if (moveMatch && reasoningMatch) {
          console.log("Standard regex found a match");
          const move = moveMatch[1];
          const reasoningText = reasoningMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');
          
          const formattedMove = move.length === 4 
            ? `${move.substring(0, 2)} → ${move.substring(2, 4)}`
            : move;
          
          formattedContent = `Move: ${formattedMove}\nReasoning: ${reasoningText}`;
          console.log("Successfully extracted reasoning with regex:", formattedContent);
        }
      }
      
      // If still no content, use cleaned raw text
      if (!formattedContent) {
        formattedContent = reasoning
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .trim();
        
        console.log("Using cleaned raw text as fallback:", formattedContent);
      }
      
      // Add new message to history
      const newMessage: ChatMessage = {
        id: messageIdRef.current++,
        content: formattedContent,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
    } catch (error) {
      console.error("Error processing reasoning:", error);
      // If all parsing attempts fail, use the raw text
      const newMessage: ChatMessage = {
        id: messageIdRef.current++,
        content: reasoning,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
    }
  }, [reasoning]);
  
  // Handle notification and auto-open when new reasoning arrives
  useEffect(() => {
    if (reasoning && reasoning !== previousReasoningRef.current) {
      setHasNewMessage(true);
      setIsOpen(true);
      
      // Auto-hide the notification after 10 seconds
      const timer = setTimeout(() => {
        setHasNewMessage(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [reasoning]);
  
  const toggleChat = () => {
    console.log("Toggle chat clicked. Current state:", isOpen);
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  // Add flash highlight effect when new content arrives
  useEffect(() => {
    if (messages.length > 0 && contentRef.current) {
      contentRef.current.classList.add(styles.flashHighlight);
      const timer = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.classList.remove(styles.flashHighlight);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [messages]);
  
  return (
    <div className={styles.chatContainer}>
      {isOpen && (
        <div className={styles.chatBox}>
          <div className={styles.chatHeader}>
            <h3>Chess Engine&#39;s Thoughts</h3>
            <button className={styles.closeButton} onClick={toggleChat}>×</button>
          </div>
          <div className={styles.chatContent} ref={contentRef}>
            {isAIThinking ? (
              <div className={styles.thinkingIndicator}>
                <div className={styles.dots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Chess engine is thinking...
              </div>
            ) : messages.length > 0 ? (
              <div className={styles.messageList}>
                {[...messages].reverse().map((message) => (
                  <div key={message.id} className={styles.message}>
                    {message.content.split('\n').map((line, index) => {
                      if (line.startsWith('Move:')) {
                        return <p key={index} className={styles.moveHighlight}>{line}</p>;
                      } else if (line.startsWith('Reasoning:')) {
                        return (
                          <p key={index}>
                            <span className={styles.reasoningHeader}>Reasoning:</span>
                            {line.substring(10)}
                          </p>
                        );
                      } else if (line.startsWith('Captured')) {
                        return <p key={index} className={styles.captureHighlight}>{line}</p>;
                      } else {
                        return <p key={index}>{line}</p>;
                      }
                    })}
                    <span className={styles.timestamp}>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>
                The chess engine will share its thoughts here when it makes a move.
              </p>
            )}
          </div>
        </div>
      )}
      
      <button 
        className={`${styles.chatButton} ${hasNewMessage ? styles.hasNewMessage : ''} ${isAIThinking ? styles.thinking : ''}`}
        onClick={toggleChat}
        data-testid="ai-chat-button"
      >
        {isAIThinking ? (
          <span className={styles.buttonContent}>
            <svg className={styles.thinkingIcon} viewBox="0 0 24 24" width="24" height="24">
              <circle cx="4" cy="12" r="3"/>
              <circle cx="12" cy="12" r="3"/>
              <circle cx="20" cy="12" r="3"/>
            </svg>
            Thinking...
          </span>
        ) : hasNewMessage ? (
          <span className={styles.buttonContent}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            New AI Insight
          </span>
        ) : (
          <span className={styles.buttonContent}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </span>
        )}
      </button>
    </div>
  );
};

export default AIChat; 