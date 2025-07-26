// Background script - Service Worker for Chrome Extension V3

// Store WebSocket connection data
let websocketData = {
  connections: [],
  isMonitoring: true, // Monitoring enabled by default
};

// New: Maintain DevTools port <-> tabId mapping
const devtoolsPorts = new Map(); // port -> tabId

// Check if extension is enabled
async function isExtensionEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
      resolve(result["websocket-proxy-enabled"] !== false); // Enabled by default
    });
  });
}

// Listen for messages from DevTools Panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = message.tabId || sender.tab?.id;

  switch (message.type) {
    case "start-monitoring": {
      if (tabId) {
        notifyAllTabs("start-monitoring", {}, tabId);
      }
      // websocketData.isMonitoring = true;
      sendResponse({ success: true, monitoring: true });
      break;
    }

    case "stop-monitoring": {
      if (tabId) {
        notifyAllTabs("stop-monitoring", {}, tabId);
      }
      // websocketData.isMonitoring = false;
      sendResponse({ success: true, monitoring: false });
      break;
    }

    case "get-existing-data": {
      // Send existing data to DevTools Panel
      sendResponse({
        success: true,
        data: websocketData.connections,
        isMonitoring: websocketData.isMonitoring,
      });
      break;
    }

    case "block-outgoing": {
      if (tabId) {
        notifyAllTabs("block-outgoing", { enabled: message.enabled }, tabId);
      }
      sendResponse({ success: true, blockOutgoing: message.enabled });
      break;
    }

    case "block-incoming": {
      if (tabId) {
        notifyAllTabs("block-incoming", { enabled: message.enabled }, tabId);
      }
      sendResponse({ success: true, blockIncoming: message.enabled });
      break;
    }

    case "websocket-event": {
      // Ensure tabId is present
      if (!sender.tab?.id) {
        sendResponse({ received: false, reason: "missing-tabId" });
        break;
      }

      // Add tabId to event data
      message.data.tabId = sender.tab.id;
      message.tabId = sender.tab.id;

      // Store connection data
      websocketData.connections.push(message.data);

      // Forward to DevTools Panel
      forwardToDevTools(message);
      sendResponse({ received: true });
      break;
    }

    case "proxy-state-change": {
      // Forward state change to DevTools Panel
      forwardToDevTools(message);
      sendResponse({ received: true });
      break;
    }

    case "simulate-message": {
      // If a tabId is specified, notify only that tab; otherwise, notify all tabs
      const targetTabId = message.data.tabId || null;
      notifyAllTabs("simulate-message", message.data, targetTabId);
      sendResponse({ success: true, simulated: true });
      break;
    }

    case "simulate-system-event": {
      // Get current active tab ID (from devtools panel context)
      const systemEventTabId = message.data.tabId || null;
      notifyAllTabs("simulate-system-event", message.data, systemEventTabId);
      sendResponse({ success: true, simulated: true, eventType: message.data.eventType });
      break;
    }

    case "create-manual-websocket": {
      // Notify content script of specific tab to create WebSocket connection
      const tabId = message.data.tabId;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          type: "create-manual-websocket",
          url: message.data.url,
        }).then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      } else {
        sendResponse({ success: false, error: "No tabId specified" });
      }
      break;
    }

    case "toggle-extension": {
      // Save state
      chrome.storage.local.set({
        "websocket-proxy-enabled": message.enabled,
      });

      sendResponse({ success: true, enabled: message.enabled });
      break;
    }

    case "show-devtools-hint": {
      // This message is sent by the popup, no special handling needed
      sendResponse({ success: true });
      break;
    }

    default: {
      sendResponse({ error: "Unknown message type" });
      break;
    }
  }

  return true; // Keep message channel open to support asynchronous response
});

// Notify all tabs or specific tab's content scripts
async function notifyAllTabs(type, data = {}, targetTabId = null) {
  try {
    let tabs;

    if (targetTabId) {
      // Notify specific tab
      tabs = await chrome.tabs.query({ currentWindow: true });
      tabs = tabs.filter((tab) => tab.id === targetTabId);
    } else {
      // Notify all tabs (not just active ones)
      tabs = await chrome.tabs.query({ currentWindow: true });
    }

    const promises = tabs.map((tab) => {
      if (tab.id) {
        return chrome.tabs
          .sendMessage(tab.id, {
            type: type,
            ...data,
          })
          .catch(() => {
          });
      }
    });

    await Promise.all(promises);
  } catch (error) {
  }
}

// Forward message to DevTools Panel
function forwardToDevTools(message) {
  try {
    // Send to all connected DevTools panels through their ports
    for (const [port, tabId] of devtoolsPorts.entries()) {
      try {
        port.postMessage(message);
      } catch (error) {
        // Port may be disconnected, remove it
        devtoolsPorts.delete(port);
      }
    }
    
    // Note: Removed runtime message fallback to avoid sendResponse issues
    // Port communication is more reliable for DevTools messages
  } catch (error) {
  }
}

// Listen for tab updates, detect page refresh/navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // When page starts loading (refresh or navigation), clear connection data for this tab
  if (changeInfo.status === "loading") {
    // Clear connection data for this tab
    const originalCount = websocketData.connections.length;
    websocketData.connections = websocketData.connections.filter(conn => conn.tabId !== tabId);
    
    // Always notify DevTools panel about page refresh, even if no connections to clear
    // This ensures the panel can reset its state properly
    forwardToDevTools({
      type: "page-refresh",
      data: {
        tabId: tabId,
        timestamp: Date.now(),
        removedConnections: originalCount - websocketData.connections.length,
      },
    });
  }
  
  if (changeInfo.status === "complete" && websocketData.isMonitoring) {
    // Can re-inject script or send status update here
  }
});

// When extension starts up
chrome.runtime.onStartup.addListener(() => {
  websocketData = {
    connections: [],
    isMonitoring: true, // Monitoring enabled by default
  };

  // Auto-start monitoring on startup (if enabled)
  chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
    if (result["websocket-proxy-enabled"] !== false) {
      notifyAllTabs("start-monitoring", {}, null); // Notify all tabs
    }
  });
});

// When extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  // Initialize extension state on first install
  if (details.reason === "install") {
    chrome.storage.local.set({
      "websocket-proxy-enabled": true, // Enable by default on install
    });
    notifyAllTabs("start-monitoring", {}, null); // Notify all tabs
  }
});

// Listen for DevTools connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "devtools") {
    
    let tabId = null;

    port.onMessage.addListener((msg) => {
      if (msg.type === "init" && msg.tabId) {
        tabId = msg.tabId;
        devtoolsPorts.set(port, tabId); // Store port -> tabId mapping
        // Send existing data immediately to the newly connected DevTools panel
        port.postMessage({
          type: "existing-data",
          data: websocketData.connections.filter(conn => conn.tabId === tabId),
          isMonitoring: websocketData.isMonitoring,
        });
      }
    });

    port.onDisconnect.addListener(() => {
      if (tabId) {
        // Send a reset message to the content script of the disconnected tab
        // This will revert the WebSocket DevTools for that tab
        chrome.tabs.sendMessage(tabId, {
          type: "reset-proxy-state",
        }).catch(() => {
        });
      }
      devtoolsPorts.delete(port);
    });
  }
});
