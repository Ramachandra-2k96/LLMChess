import React, { useEffect, useState } from 'react';
import styles from '../styles/GameInfo.module.css';

interface AIReasoningDisplayProps {
  reasoning: string | undefined;
}

const AIReasoningDisplay: React.FC<AIReasoningDisplayProps> = ({ reasoning }) => {
  const [isNew, setIsNew] = useState(false);
  
  // Animation effect when reasoning changes
  useEffect(() => {
    if (reasoning) {
      setIsNew(true);
      const timer = setTimeout(() => setIsNew(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [reasoning]);

  if (!reasoning) {
    return null; // Don't render the component if there's no reasoning
  }
  
  // Split the reasoning by line breaks for better formatting
  const reasoningLines = reasoning.split('\n');
  
  return (
    <div className={`${styles.aiReasoning} ${isNew ? styles.highlight : ''}`}>
      <h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
        </svg>
        Chess Engine's Move
      </h3>
      <div className={styles.reasoningContent}>
        {reasoningLines.map((line, index) => {
          // Apply special styling for 'Move:' and 'Captured:' lines
          if (line.startsWith('Move:')) {
            return <p key={index} className={styles.moveHighlight}>{line}</p>;
          } else if (line.startsWith('Captured')) {
            return <p key={index} className={styles.captureHighlight}>{line}</p>;
          } else if (line.startsWith('Reasoning:')) {
            // Add special styling to the reasoning header
            return (
              <p key={index}>
                <span className={styles.reasoningHeader}>Reasoning:</span>
                {line.substring(10)}
              </p>
            );
          }
          return <p key={index}>{line}</p>;
        })}
      </div>
    </div>
  );
};

export default AIReasoningDisplay; 