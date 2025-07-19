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
    <div class="ws-devtools-hint" style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg,rgb(20, 28, 40) 0%,rgb(37, 48, 62) 50%,rgb(49, 59, 73) 100%);
      color: #f1f5f9;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 360px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      backdrop-filter: blur(20px);
      animation: slideInBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-origin: right center;
    ">
      <!-- Header with icon -->
      <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      ">
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(16, 185, 129, 0.15);
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div>
          <div style="
            font-weight: 700;
            font-size: 16px;
            color: #f1f5f9;
            margin-bottom: 2px;
          ">WebSocket DevTools</div>
          <div style="
            font-size: 12px;
            color: rgba(241, 245, 249, 0.7);
          ">Ready to monitor</div>
        </div>
      </div>
      
      <!-- Instructions -->
      <div style="
        margin-bottom: 20px;
        line-height: 1.5;
        background: rgba(71, 85, 105, 0.3);
        padding: 16px;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.2);
      ">
        <div style="
          margin-bottom: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #f1f5f9;
        ">
          Press <span style="
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
          ">F12</span> to open DevTools
        </div>
        <div style="
          color: rgba(203, 213, 225, 0.8);
          font-size: 13px;
          line-height: 1.4;
        ">
          Look for the <strong style="color: #10b981;">WebSocket DevTools</strong> tab to start monitoring connections
        </div>
      </div>
      
      <!-- Action buttons -->
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button class="ws-hint-button">
          Got it!
        </button>
      </div>
    </div>
    
    <style>
      @keyframes slideInBounce {
        0% {
          transform: translateX(120%) scale(0.8);
          opacity: 0;
        }
        60% {
          transform: translateX(-10px) scale(1.05);
          opacity: 1;
        }
        100% {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
      }
      
      @keyframes slideOutBounce {
        0% {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
        40% {
          transform: translateX(-10px) scale(1.02);
          opacity: 0.8;
        }
        100% {
          transform: translateX(120%) scale(0.9);
          opacity: 0;
        }
      }
      
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-2px);
        }
      }
      
      .ws-devtools-hint {
        position: relative;
      }
      
      .ws-devtools-hint::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(35deg, #50ae8e, #000604, #9a7413, #000000));
        border-radius: 18px;
        z-index: -1;
        opacity: 0.3;
        animation: float 3s ease-in-out infinite;
      }
      
      .ws-hint-closing {
        animation: slideOutBounce 0.4s ease-in-out forwards !important;
      }
      
      .ws-hint-button {
        background: #047857;
        color: #e5e7eb;
        border: 1px solid #065f46;
        padding: 12px 24px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 2px 6px rgba(4, 120, 87, 0.2);
        backdrop-filter: blur(10px);
        font-family: inherit;
        outline: none !important;
      }
      
      .ws-hint-button:hover {
        background: #059669 !important;
        box-shadow: 0 3px 8px rgba(5, 150, 105, 0.25) !important;
        border-color: #047857 !important;
      }
      
      .ws-hint-button:active {
        box-shadow: 0 1px 4px rgba(4, 120, 87, 0.3) !important;
      }
      
      .ws-hint-button:focus {
        outline: none !important;
        box-shadow: 0 2px 6px rgba(4, 120, 87, 0.2), 0 0 0 2px rgba(16, 185, 129, 0.15) !important;
      }
      
      .ws-devtools-hint * {
        outline: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      .ws-devtools-hint *:focus {
        outline: none !important;
      }
    </style>
  `;

  document.body.appendChild(hint);

  // Enhanced close functionality
  const closeHint = () => {
    if (hint.parentElement) {
      hint.remove();
    }
  };

  // Update button click handler to use the new close function
  const button = hint.querySelector('button');
  if (button) {
    button.onclick = closeHint;
  }

  // Auto hide after 8 seconds
  setTimeout(closeHint, 8000);
}
