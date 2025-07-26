// WebSocket History service for managing WebSocket connection history
class WSHistoryService {
  constructor() {
    this.storageKey = "websocket-connection-history";
    this.listeners = new Set();
    this.maxRecords = 3; // Maximum 3 records as per requirement
  }

  // Get all history records
  getHistory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to get WebSocket history:', error);
      return [];
    }
  }

  // Get history count
  getHistoryCount() {
    return this.getHistory().length;
  }

  // Save history records to localStorage
  saveHistory(history) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      this.notifyListeners(history);
      return true;
    } catch (error) {
      console.warn('Failed to save WebSocket history:', error);
      return false;
    }
  }

  // Add new connection to history
  addConnection(url, connectionName = null) {
    if (!url || !url.trim()) {
      return null;
    }

    const currentHistory = this.getHistory();
    const normalizedUrl = url.trim();
    
    // Generate connection name if not provided
    const name = connectionName || this.generateConnectionName(normalizedUrl);
    
    // Check if connection already exists
    const existingIndex = currentHistory.findIndex(record => record.url === normalizedUrl);
    
    const connectionRecord = {
      id: Date.now().toString(),
      url: normalizedUrl,
      name: name.trim(),
      lastUsed: new Date().toISOString(),
      usageCount: 1,
      createdAt: new Date().toISOString()
    };

    let newHistory;
    
    if (existingIndex !== -1) {
      // Update existing record - move to front and update usage
      const existingRecord = currentHistory[existingIndex];
      connectionRecord.id = existingRecord.id;
      connectionRecord.createdAt = existingRecord.createdAt;
      connectionRecord.usageCount = existingRecord.usageCount + 1;
      
      // Remove existing record and add updated one to front
      newHistory = [connectionRecord, ...currentHistory.filter((_, index) => index !== existingIndex)];
    } else {
      // Add new record to front
      newHistory = [connectionRecord, ...currentHistory];
    }

    // Keep only maxRecords (delete oldest if exceeding limit)
    if (newHistory.length > this.maxRecords) {
      newHistory = newHistory.slice(0, this.maxRecords);
    }

    if (this.saveHistory(newHistory)) {
      this.notifyListeners(newHistory, {
        type: existingIndex !== -1 ? "update" : "add",
        record: connectionRecord
      });
      return connectionRecord;
    }

    return null;
  }

  // Delete connection from history
  deleteConnection(id) {
    const history = this.getHistory();
    const recordToDelete = history.find(record => record.id === id);

    if (!recordToDelete) {
      return false;
    }

    const newHistory = history.filter(record => record.id !== id);

    if (this.saveHistory(newHistory)) {
      this.notifyListeners(newHistory, {
        type: "delete",
        record: recordToDelete
      });
      return true;
    }

    return false;
  }

  // Clear all history
  clearHistory() {
    if (this.saveHistory([])) {
      this.notifyListeners([], { type: "clear" });
      return true;
    }
    return false;
  }

  // Generate connection name from URL
  generateConnectionName(url) {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      const port = parsedUrl.port;
      const pathname = parsedUrl.pathname;
      
      // Create a readable name
      let name = hostname;
      
      if (port && port !== '80' && port !== '443') {
        name += `:${port}`;
      }
      
      if (pathname && pathname !== '/') {
        // Get the last part of path or first part if it's too long
        const pathParts = pathname.split('/').filter(part => part);
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart.length <= 15) {
            name += `/${lastPart}`;
          } else {
            name += `/...${lastPart.slice(-10)}`;
          }
        }
      }
      
      // Limit total name length
      if (name.length > 30) {
        name = name.substring(0, 27) + '...';
      }
      
      return name;
    } catch (error) {
      // Fallback for invalid URLs
      const shortUrl = url.length > 30 ? url.substring(0, 27) + '...' : url;
      return shortUrl;
    }
  }

  // Format last used time for display
  formatLastUsed(isoString) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  // Add listener for history changes
  addListener(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notifyListeners(history, eventData = {}) {
    if (this.listeners.size === 0) return;

    this.listeners.forEach((listener) => {
      try {
        listener(history, eventData);
      } catch (error) {
        console.warn('History listener error:', error);
      }
    });
  }

  // Clean up resources
  cleanup() {
    this.listeners.clear();
  }
}

const wsHistoryService = new WSHistoryService();
export default wsHistoryService;