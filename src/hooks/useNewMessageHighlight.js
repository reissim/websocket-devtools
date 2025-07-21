import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook to manage new message highlighting animation
 * @param {Object} connection - Connection object containing messages
 * @param {number} highlightDuration - Duration of highlight animation in ms (default: 500)
 * @returns {Object} Object containing isNewMessage function and cleanup
 */
export const useNewMessageHighlight = (connection, highlightDuration = 500) => {
  const [newMessageKeys, setNewMessageKeys] = useState(new Set());
  const previousMessageCountRef = useRef(0);
  const messageTimestampsRef = useRef(new Set());
  const previousConnectionIdRef = useRef(null);

  // Effect to detect new messages and trigger highlight animation
  useEffect(() => {
    if (!connection || !connection.messages) return;
    
    // Reset everything if connection changed
    if (previousConnectionIdRef.current !== connection.id) {
      setNewMessageKeys(new Set());
      previousMessageCountRef.current = 0;
      messageTimestampsRef.current = new Set();
      previousConnectionIdRef.current = connection.id;
    }
    
    const currentMessages = connection.messages;
    const currentMessageCount = currentMessages.length;
    
    // Check if we have new messages (count increased)
    if (currentMessageCount > previousMessageCountRef.current) {
      // Find new messages by comparing message count
      const newMessages = currentMessages.slice(previousMessageCountRef.current);
      
      // Add new message keys to highlight set
      const newKeys = new Set(newMessageKeys);
      newMessages.forEach((msg) => {
        const messageKey = msg.messageId;
        newKeys.add(messageKey);
        messageTimestampsRef.current.add(msg.timestamp);
        
        // Remove highlight after specified duration
        setTimeout(() => {
          setNewMessageKeys(prev => {
            const updated = new Set(prev);
            updated.delete(messageKey);
            return updated;
          });
        }, highlightDuration);
      });
      
      if (newKeys.size > newMessageKeys.size) {
        setNewMessageKeys(newKeys);
      }
    }
    
    // Update refs
    previousMessageCountRef.current = currentMessageCount;
    
    // Update timestamp tracking set
    currentMessages.forEach(msg => {
      messageTimestampsRef.current.add(msg.timestamp);
    });
  }, [connection?.messages, connection?.id, highlightDuration]);

  // Function to check if a message is new
  const isNewMessage = (messageKey) => {
    return newMessageKeys.has(messageKey);
  };

  // Clear all highlights (useful for cleanup)
  const clearHighlights = useCallback(() => {
    setNewMessageKeys(new Set());
  }, []);

  return {
    isNewMessage,
    clearHighlights,
    newMessageCount: newMessageKeys.size
  };
};

export default useNewMessageHighlight; 