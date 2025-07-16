import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to track new messages for each WebSocket connection
 * @param {Array} websocketEvents - Array of all WebSocket events
 * @param {Map} connectionsMap - Map of connection information
 * @param {number} flashDuration - Duration of flash animation in ms (default: 1000)
 * @returns {Object} Object containing functions to check if connection has new messages
 */
export const useConnectionNewMessage = (websocketEvents, connectionsMap, flashDuration = 300) => {
  const [newMessageConnections, setNewMessageConnections] = useState(new Map()); // Change to Map to store timestamps
  const previousMessageCountsRef = useRef(new Map());
  const flashTimeoutsRef = useRef(new Map());

  // Effect to detect new messages for each connection
  useEffect(() => {
    if (!websocketEvents || !connectionsMap) return;

    const currentMessageCounts = new Map();
    
    // Calculate current message count for each connection
    connectionsMap.forEach((connInfo, connectionId) => {
      const messageCount = websocketEvents
        .filter(event => event.id === connectionId && event.type === "message")
        .length;
      currentMessageCounts.set(connectionId, messageCount);
    });

    // Check for new messages by comparing with previous counts
    const newConnections = new Map(newMessageConnections);
    let hasNewMessages = false;

    currentMessageCounts.forEach((currentCount, connectionId) => {
      const previousCount = previousMessageCountsRef.current.get(connectionId) || 0;
      
      if (currentCount > previousCount) {
        // New message detected for this connection
        const timestamp = Date.now();
        newConnections.set(connectionId, timestamp);
        hasNewMessages = true;

        // Clear any existing timeout for this connection
        if (flashTimeoutsRef.current.has(connectionId)) {
          clearTimeout(flashTimeoutsRef.current.get(connectionId));
        }

        // Set timeout to remove flash after duration
        const timeoutId = setTimeout(() => {
          setNewMessageConnections(prev => {
            const updated = new Map(prev);
            updated.delete(connectionId);
            return updated;
          });
          flashTimeoutsRef.current.delete(connectionId);
        }, flashDuration);

        flashTimeoutsRef.current.set(connectionId, timeoutId);
      }
    });

    // Update state if there are new messages
    if (hasNewMessages) {
      setNewMessageConnections(newConnections);
    }

    // Update previous counts
    previousMessageCountsRef.current = new Map(currentMessageCounts);

    // Cleanup timeouts for removed connections
    flashTimeoutsRef.current.forEach((timeoutId, connectionId) => {
      if (!connectionsMap.has(connectionId)) {
        clearTimeout(timeoutId);
        flashTimeoutsRef.current.delete(connectionId);
      }
    });

  }, [websocketEvents, connectionsMap, flashDuration]); // Remove newMessageConnections dependency

  // Function to check if a connection has new messages
  const hasNewMessages = (connectionId) => {
    return newMessageConnections.has(connectionId);
  };

  // Get the timestamp when the new message was detected (for forcing re-render)
  const getNewMessageTimestamp = (connectionId) => {
    return newMessageConnections.get(connectionId) || 0;
  };

  // Clear all new message indicators
  const clearAllNewMessages = () => {
    // Clear all timeouts
    flashTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    flashTimeoutsRef.current.clear();
    setNewMessageConnections(new Map());
  };

  // Clear new message indicator for specific connection
  const clearNewMessage = (connectionId) => {
    if (flashTimeoutsRef.current.has(connectionId)) {
      clearTimeout(flashTimeoutsRef.current.get(connectionId));
      flashTimeoutsRef.current.delete(connectionId);
    }
    setNewMessageConnections(prev => {
      const updated = new Map(prev);
      updated.delete(connectionId);
      return updated;
    });
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      flashTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      flashTimeoutsRef.current.clear();
    };
  }, []);

  return {
    hasNewMessages,
    getNewMessageTimestamp,
    clearAllNewMessages,
    clearNewMessage,
    newMessageConnectionsCount: newMessageConnections.size
  };
};

export default useConnectionNewMessage; 