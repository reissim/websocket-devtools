// Content script - Bridges page and background script

// Check if extension is enabled
function checkExtensionEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
      resolve(result["websocket-proxy-enabled"] !== false); // Default enabled
    });
  });
}

// Message deduplication mechanism
let messageIdCounter = 0;
function generateMessageId() {
  return `msg_${Date.now()}_${++messageIdCounter}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
}

// Inject using external file to avoid CSP inline script restrictions
function injectWebSocketProxy() {

  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/content/injected.js");
    script.onload = function () {
      this.remove(); // Clean up script tag
    };
    script.onerror = function () {
    };

    // Inject as early as possible
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
  }
}

// Execute injection after checking extension status
checkExtensionEnabled().then((enabled) => {
  if (enabled) {
    if (document.readyState === "loading") {
      injectWebSocketProxy();
    } else {
      injectWebSocketProxy();
    }
  } else {
  }
});

// Listen for messages from injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.source === "websocket-proxy-injected") {

    // Add unique ID to message for deduplication
    const messageId = generateMessageId();
    const messageWithId = {
      type: "websocket-event",
      data: event.data.payload,
      messageId: messageId,
      timestamp: Date.now(),
      source: "content-script",
    };


    // Send directly to DevTools Panel, also send to Background Script for data storage
    chrome.runtime
      .sendMessage(messageWithId)
      .then((response) => {
      })
      .catch((error) => {
      });
  }
});

// Listen for control messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Forward control commands to injected script
  switch (message.type) {
    case "start-monitoring":
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "start-monitoring",
        },
        "*"
      );
      break;

    case "stop-monitoring":
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "stop-monitoring",
        },
        "*"
      );
      break;

    case "block-outgoing":
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "block-outgoing",
          enabled: message.enabled,
        },
        "*"
      );
      break;

    case "block-incoming":
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "block-incoming",
          enabled: message.enabled,
        },
        "*"
      );
      break;

    case "get-proxy-state":
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "get-proxy-state",
        },
        "*"
      );
      break;

    case "simulate-message":
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "simulate-message",
          connectionId: message.connectionId,
          message: message.message,
          direction: message.direction,
        },
        "*"
      );
      break;

    case "simulate-system-event":
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "simulate-system-event",
          connectionId: message.connectionId,
          eventType: message.eventType,
          code: message.code,
          reason: message.reason,
          message: message.message,
          errorType: message.errorType,
        },
        "*"
      );
      break;

    case "show-devtools-hint":
      // Can display a temporary hint on the page
      showDevToolsHint();
      break;

    case "create-manual-websocket":
      // Forward to injected script to create WebSocket connection
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "create-manual-websocket",
          url: message.url,
        },
        "*"
      );
      break;
    // NEW: Reset proxyState to initial value
    case "reset-proxy-state": {
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "reset-proxy-state",
        },
        "*"
      );
      break;
    }
    default:
      break;
  }

  sendResponse({ received: true });
});

// Display DevTools hint
function showDevToolsHint() {
  const hint = document.createElement("div");
  hint.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0f172a;
      color: #f1f5f9;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 320px;
      border: 1px solid #334155;
      backdrop-filter: blur(10px);
      animation: slideIn 0.3s ease-out;
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #3b82f6;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M16 12l-4-4-4 4"/>
        </svg>
        WebSocket DevTool
      </div>
      
      <div style="margin-bottom: 16px; line-height: 1.5;">
        <div style="margin-bottom: 8px;">Press <strong style="color: #10b981;">F12</strong> to open DevTools</div>
        <div style="color: #94a3b8; font-size: 13px;">Find <strong>"WebSocket DevTool"</strong> tab to start monitoring</div>
      </div>
      
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
          Got it
        </button>
      </div>
    </div>
    
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;

  document.body.appendChild(hint);

  // 8秒后自动消失，增加动画效果
  setTimeout(() => {
    if (hint.parentElement) {
      const hintDiv = hint.querySelector('div');
      if (hintDiv) {
        hintDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          hint.remove();
        }, 300);
      } else {
        hint.remove();
      }
    }
  }, 8000);
}
