/**
 * Filter messages based on direction, text content, and invert option
 * @param {Array} messages - Array of message objects
 * @param {Object} filters - Filter configuration
 * @param {string} filters.direction - 'all', 'outgoing', or 'incoming'
 * @param {string} filters.text - Text to filter by
 * @param {boolean} filters.invert - Whether to invert the text filter
 * @returns {Array} Filtered messages
 */
export const filterMessages = (messages, filters) => {
  const { direction = "all", text = "", invert = false } = filters;

  return (
    messages
      .filter((msg) => {
        // Direction filter
        if (direction !== "all" && msg.direction !== direction) {
          return false;
        }

        // Text content filter
        if (text.trim()) {
          const messageContent = msg.data.toLowerCase();
          const filterText = text.toLowerCase();
          const matchesText = messageContent.includes(filterText);

          // Apply invert logic
          if (invert) {
            return !matchesText; // Show messages that DON'T contain the text
          } else {
            return matchesText; // Show messages that DO contain the text
          }
        }

        return true;
      })
      // Remove duplicates using Set for O(n) performance
      .filter((msg, index, arr) => {
        if (index === 0) {
          arr._seenKeys = new Set();
        }
        const key = `${msg.timestamp}|${msg.data}|${msg.direction}`;
        if (arr._seenKeys.has(key)) {
          return false;
        }
        arr._seenKeys.add(key);
        return true;
      })
      // Sort by timestamp (newest first)
      .sort((a, b) => b.timestamp - a.timestamp)
  );
};

/**
 * Filter connections based on URL and invert option
 * @param {Array} connections - Array of connection objects
 * @param {Object} filters - Filter configuration
 * @param {string} filters.text - Text to filter by
 * @param {boolean} filters.invert - Whether to invert the filter
 * @returns {Array} Filtered connections
 */
export const filterConnections = (connections, filters) => {
  const { text = "", invert = false } = filters;

  if (!text.trim()) {
    return connections;
  }

  const filterText = text.toLowerCase();

  return connections.filter((conn) => {
    const urlMatches = conn.url.toLowerCase().includes(filterText);
    const idMatches = conn.id.toLowerCase().includes(filterText);
    const matches = urlMatches || idMatches;

    return invert ? !matches : matches;
  });
};
